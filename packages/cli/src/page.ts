import CDP from "chrome-remote-interface";
import { join } from "node:path";
import { CDP_PORT, getActiveTarget, withActivePage, withNavigation } from "./cdp";
import { BROWSER_DIR } from "./config";
export { navigate } from "./cdp";

export type MatchType = "css" | "exact" | "partial" | "label";

const LABEL_STATE_FILE = join(BROWSER_DIR, "labels.json");
const LABEL_PATTERN = /^[a-z]\d+$/;

async function readLabelMap(): Promise<Map<string, number>> {
    try {
        const data = await Bun.file(LABEL_STATE_FILE).json();
        return new Map(Object.entries(data));
    } catch {
        return new Map();
    }
}

async function writeLabelMap(map: Map<string, number>): Promise<void> {
    await Bun.write(LABEL_STATE_FILE, JSON.stringify(Object.fromEntries(map)));
}

async function resolveLabel(selector: string): Promise<number | undefined> {
    if (!LABEL_PATTERN.test(selector)) return undefined;
    const labelMap = await readLabelMap();
    return labelMap.get(selector);
}

function describeElement(el: { tag: string; id?: string; classes?: string; text?: string; label?: string }): string {
    let desc = el.tag;
    if (el.id) desc += "#" + el.id;
    else if (el.classes) desc += "." + el.classes;
    if (el.text) desc += ` "${el.text}"`;
    return el.label ? `[${el.label}] ${desc}` : desc;
}

function formatElementList(elements: { tag: string; id?: string; classes?: string; text?: string; label?: string }[], limit = 5): string {
    const lines = elements.slice(0, limit).map((el, i) => `  ${i + 1}. ${describeElement(el)}`);
    if (elements.length > limit) lines.push(`  ... and ${elements.length - limit} more`);
    return lines.join("\n");
}

async function resolveElement(
    client: CDP.Client,
    selector: string,
): Promise<{ objectId: string; matchType: MatchType }> {
    const backendNodeId = await resolveLabel(selector);
    if (backendNodeId) {
        await client.DOM.enable();
        const { object } = await client.DOM.resolveNode({ backendNodeId });
        return { objectId: object.objectId!, matchType: "label" };
    }

    await client.Runtime.enable();
    const { result, exceptionDetails } = await client.Runtime.evaluate({
        expression: `(() => {
      ${RESOLVE_SELECTOR}
      const { matchType, elements } = resolve(${JSON.stringify(selector)});
      if (elements.length === 0) return { error: "not_found" };
      if (elements.length > 1) return { error: "multiple", count: elements.length, elements: elements.slice(0, 5).map(el => {
        const text = (el.innerText || el.textContent || '').trim().slice(0, 30);
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          classes: el.className && typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0, 2).join('.') || undefined : undefined,
          text: text ? text + (text.length >= 30 ? '...' : '') : undefined
        };
      }), total: elements.length };
      return { matchType };
    })()`,
        returnByValue: true,
    });
    if (exceptionDetails) throw new Error(`Element not found: ${selector}`);

    const data = result.value as
        | { error: "not_found" }
        | { error: "multiple"; count: number; elements: { tag: string; id?: string; classes?: string; text?: string }[]; total: number }
        | { matchType: MatchType };

    if ("error" in data) {
        if (data.error === "not_found") throw new Error(`Element not found: ${selector}`);
        const labelMap = await readLabelMap();
        const nodeIdToLabel = new Map<number, string>();
        for (const [label, nodeId] of labelMap) nodeIdToLabel.set(nodeId, label);

        await client.DOM.enable();
        const elementsWithLabels = await Promise.all(
            data.elements.map(async (el) => {
                const { result: elResult } = await client.Runtime.evaluate({
                    expression: `(() => {
              ${RESOLVE_SELECTOR}
              return resolve(${JSON.stringify(selector)}).elements[${data.elements.indexOf(el)}];
            })()`,
                });
                if (!elResult.objectId) return el;
                const { node } = await client.DOM.describeNode({ objectId: elResult.objectId });
                const label = nodeIdToLabel.get(node.backendNodeId);
                return { ...el, label };
            }),
        );
        throw new Error(`Found ${data.count} elements for: ${selector}\n${formatElementList(elementsWithLabels, 5)}`);
    }

    const { result: elResult } = await client.Runtime.evaluate({
        expression: `(() => {
      ${RESOLVE_SELECTOR}
      return resolve(${JSON.stringify(selector)}).elements[0];
    })()`,
    });
    return { objectId: elResult.objectId!, matchType: data.matchType };
}

const RESOLVE_SELECTOR = `
  const CLICKABLE = 'a, button, input[type="submit"], input[type="button"], [role="button"], [onclick], [tabindex="0"]';
  
  function findByText(selector, exact) {
    const lower = selector.toLowerCase();
    const matches = [];
    for (const el of document.querySelectorAll(CLICKABLE)) {
      const text = (el.innerText || el.textContent || '').trim().toLowerCase();
      if (exact ? text === lower : text.includes(lower)) matches.push(el);
    }
    return matches;
  }
  
  function resolve(selector) {
    try {
      const css = document.querySelectorAll(selector);
      if (css.length > 0) return { matchType: 'css', elements: Array.from(css) };
    } catch {}
    const exact = findByText(selector, true);
    if (exact.length > 0) return { matchType: 'exact', elements: exact };
    return { matchType: 'partial', elements: findByText(selector, false) };
  }
`;

export type FindResult = { count: number; matchType: MatchType };

export async function findAll(selector: string): Promise<FindResult> {
    const backendNodeId = await resolveLabel(selector);
    if (backendNodeId !== undefined) {
        return { count: 1, matchType: "label" };
    }

    return withActivePage(async (client) => {
        await client.Runtime.enable();
        const { result } = await client.Runtime.evaluate({
            expression: `(() => {
        ${RESOLVE_SELECTOR}
        const { matchType, elements } = resolve(${JSON.stringify(selector)});
        return { matchType, count: elements.length };
      })()`,
            returnByValue: true,
        });
        return result.value as FindResult;
    });
}

export type ClickResult = { matchType: MatchType };

export async function click(selector: string): Promise<ClickResult> {
    return withActivePage(async (client) => {
        const { objectId, matchType } = await resolveElement(client, selector);
        await withNavigation(client, async () => {
            await client.Runtime.callFunctionOn({
                objectId,
                functionDeclaration: "function() { this.click(); }",
            });
        });
        return { matchType };
    });
}

const SPECIAL_KEYS: Record<string, { key: string; code: string; keyCode: number }> = {
    escape: { key: "Escape", code: "Escape", keyCode: 27 },
    enter: { key: "Enter", code: "Enter", keyCode: 13 },
    tab: { key: "Tab", code: "Tab", keyCode: 9 },
    backspace: { key: "Backspace", code: "Backspace", keyCode: 8 },
    delete: { key: "Delete", code: "Delete", keyCode: 46 },
    arrowup: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
    arrowdown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
    arrowleft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
    arrowright: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
    home: { key: "Home", code: "Home", keyCode: 36 },
    end: { key: "End", code: "End", keyCode: 35 },
    pageup: { key: "PageUp", code: "PageUp", keyCode: 33 },
    pagedown: { key: "PageDown", code: "PageDown", keyCode: 34 },
    space: { key: " ", code: "Space", keyCode: 32 },
};

function parseKeyCombo(combo: string) {
    const parts = combo.toLowerCase().split("+");
    const keyPart = parts.pop()!;
    let modifiers = 0;
    for (const mod of parts) {
        if (mod === "ctrl" || mod === "control") modifiers |= 2;
        else if (mod === "alt" || mod === "opt" || mod === "option") modifiers |= 1;
        else if (mod === "shift") modifiers |= 8;
        else if (mod === "meta" || mod === "cmd" || mod === "command") modifiers |= 4;
    }

    const special = SPECIAL_KEYS[keyPart];
    if (special) return { modifiers, ...special };

    return {
        modifiers,
        key: keyPart,
        code: keyPart.length === 1 ? `Key${keyPart.toUpperCase()}` : keyPart,
        keyCode: keyPart.length === 1 ? keyPart.toUpperCase().charCodeAt(0) : 0,
    };
}

export async function type(text: string, selector?: string): Promise<void> {
    return withActivePage(async (client) => {
        if (selector) {
            const { objectId } = await resolveElement(client, selector);
            const { exceptionDetails } = await client.Runtime.callFunctionOn({
                objectId,
                functionDeclaration: `function() {
                    this.focus();
                    this.click();
                    if ('value' in this) this.value = '';
                }`,
            });
            if (exceptionDetails) {
                throw new Error(exceptionDetails.exception?.description ?? `Element not found: ${selector}`);
            }
            for (const char of text) {
                await client.Input.dispatchKeyEvent({ type: "keyDown", text: char });
                await client.Input.dispatchKeyEvent({ type: "keyUp", text: char });
            }
        } else {
            const { modifiers, key, code, keyCode } = parseKeyCombo(text);
            await client.Input.dispatchKeyEvent({
                type: "keyDown",
                modifiers,
                key,
                code,
                windowsVirtualKeyCode: keyCode,
                nativeVirtualKeyCode: keyCode,
            });
            await client.Input.dispatchKeyEvent({
                type: "keyUp",
                modifiers,
                key,
                code,
                windowsVirtualKeyCode: keyCode,
                nativeVirtualKeyCode: keyCode,
            });
        }
    });
}

export async function wait(selector: string, timeout = 15000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const { count } = await findAll(selector);
        if (count > 0) return;
        await Bun.sleep(100);
    }
    throw new Error(`Timed out waiting for: ${selector}`);
}

export async function evaluate(js: string): Promise<unknown> {
    return withActivePage(async (client) => {
        await client.Runtime.enable();
        const { result, exceptionDetails } = await client.Runtime.evaluate({
            expression: js,
            awaitPromise: true,
            returnByValue: true,
        });
        if (exceptionDetails) {
            const msg = exceptionDetails.exception?.description ?? exceptionDetails.text;
            throw new Error(msg);
        }
        return result.value;
    });
}

const DEFAULT_LIMIT = 2000;

export interface ContentResult {
    content: string;
    truncated: boolean;
    originalLength: number;
}

function truncate(content: string, limit: number): ContentResult {
    return {
        content: content.slice(0, limit),
        truncated: content.length > limit,
        originalLength: content.length,
    };
}

export async function html(selector = "body", limit = DEFAULT_LIMIT): Promise<ContentResult> {
    const content = await withActivePage(async (client) => {
        const { objectId } = await resolveElement(client, selector);
        const { result } = await client.Runtime.callFunctionOn({
            objectId,
            functionDeclaration: `function() { return this.outerHTML; }`,
            returnByValue: true,
        });
        return result.value as string;
    });
    return truncate(content, limit);
}

export async function text(selector = "body", limit = DEFAULT_LIMIT, visibleOnly = true): Promise<ContentResult> {
    const content = await withActivePage(async (client) => {
        const { objectId } = await resolveElement(client, selector);
        const fn = visibleOnly
            ? `function() {
                const root = this;
                const cache = new Map();
                function isVisible(el) {
                    if (!el || el === document.documentElement) return true;
                    if (cache.has(el)) return cache.get(el);
                    const style = getComputedStyle(el);
                    const visible = style.display !== 'none'
                        && style.visibility !== 'hidden' && style.visibility !== 'collapse'
                        && parseFloat(style.opacity) !== 0
                        && isVisible(el.parentElement);
                    cache.set(el, visible);
                    return visible;
                }
                function isBlock(el) {
                    const display = getComputedStyle(el).display;
                    return display === 'block' || display === 'flex' || display === 'grid' ||
                           display === 'list-item' || display === 'table' || display === 'table-row';
                }
                let result = '';
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
                while (walker.nextNode()) {
                    const node = walker.currentNode;
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (isBlock(node) && result.length > 0 && !result.endsWith('\\n')) {
                            result += '\\n';
                        }
                    } else if (isVisible(node.parentElement)) {
                        const t = node.textContent.trim();
                        if (t) result += t;
                    }
                }
                return result;
            }`
            : `function() { return this.innerText; }`;
        const { result } = await client.Runtime.callFunctionOn({
            objectId,
            functionDeclaration: fn,
            returnByValue: true,
        });
        return result.value as string;
    });
    return truncate(content, limit);
}

export async function back(): Promise<boolean> {
    return withActivePage(async (client) => {
        const { currentIndex, entries } = await client.Page.getNavigationHistory();
        if (currentIndex <= 0) return false;
        await withNavigation(client, async () => {
            await client.Page.navigateToHistoryEntry({ entryId: entries[currentIndex - 1]!.id });
        });
        return true;
    });
}

export async function forward(): Promise<boolean> {
    return withActivePage(async (client) => {
        const { currentIndex, entries } = await client.Page.getNavigationHistory();
        if (currentIndex >= entries.length - 1) return false;
        await withNavigation(client, async () => {
            await client.Page.navigateToHistoryEntry({ entryId: entries[currentIndex + 1]!.id });
        });
        return true;
    });
}

export async function refresh(): Promise<void> {
    return withActivePage(async (client) => {
        await withNavigation(client, async () => {
            await client.Page.reload({});
        });
    });
}

interface ElementCenter {
    x: number;
    y: number;
    matchType: MatchType;
}

async function getElementCenter(
    client: CDP.Client,
    selector: string,
    options: { scrollIntoView?: boolean } = {},
): Promise<ElementCenter> {
    const { objectId, matchType } = await resolveElement(client, selector);
    const { result, exceptionDetails } = await client.Runtime.callFunctionOn({
        objectId,
        functionDeclaration: `function(scroll) {
            if (scroll) {
                this.scrollIntoView({ block: "center", inline: "center" });
            }
            const rect = this.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }`,
        arguments: [{ value: options.scrollIntoView ?? true }],
        returnByValue: true,
    });
    if (exceptionDetails) {
        const desc = exceptionDetails.exception?.description ?? "";
        const message = desc.split("\n")[0]?.replace(/^Error:\s*/, "") || `Element not found: ${selector}`;
        throw new Error(message);
    }
    const { x, y } = result.value as { x: number; y: number };
    return { x, y, matchType };
}

export async function hover(selector: string): Promise<void> {
    return withActivePage(async (client) => {
        const { x, y } = await getElementCenter(client, selector);
        await client.Input.dispatchMouseEvent({ type: "mouseMoved", x, y });
    });
}

export async function drag(source: string, target: string): Promise<ClickResult> {
    return withActivePage(async (client) => {
        const { x: startX, y: startY, matchType } = await getElementCenter(client, source);
        const { x: endX, y: endY } = await getElementCenter(client, target, { scrollIntoView: false });

        await client.Input.dispatchMouseEvent({ type: "mouseMoved", x: startX, y: startY });
        await client.Input.dispatchMouseEvent({ type: "mousePressed", x: startX, y: startY, button: "left", clickCount: 1 });
        await client.Input.dispatchMouseEvent({ type: "mouseMoved", x: endX, y: endY, button: "left" });
        await client.Input.dispatchMouseEvent({ type: "mouseReleased", x: endX, y: endY, button: "left", clickCount: 1 });

        return { matchType };
    });
}

const OUTLINE_HELPERS = `
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'BR', 'HR', 'META', 'LINK']);

  function truncate(text, maxLen) {
    text = text.trim().replace(/\\s+/g, ' ');
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
  }

  function getAttributes(el, getText) {
    const attrs = [];
    const tag = el.tagName;
    const text = getText(el);
    if (text) attrs.push('"' + text + '"');
    if (tag === 'A') {
      const href = el.getAttribute('href');
      if (href) attrs.push('[href=' + href.slice(0, 50) + ']');
    }
    if (tag === 'IMG') {
      const alt = el.getAttribute('alt');
      attrs.push(alt ? '[alt="' + alt.slice(0, 30) + '"]' : '[img]');
    }
    if (tag === 'INPUT') {
      attrs.push('[type=' + (el.getAttribute('type') || 'text') + ']');
      const placeholder = el.getAttribute('placeholder');
      if (placeholder) attrs.push('[placeholder="' + placeholder + '"]');
    }
    if (tag === 'TEXTAREA') {
      const placeholder = el.getAttribute('placeholder');
      if (placeholder) attrs.push('[placeholder="' + placeholder + '"]');
    }
    if (tag === 'SELECT') attrs.push('(' + el.options.length + ' options)');
    const role = el.getAttribute('role');
    if (role) attrs.push('[role=' + role + ']');
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) attrs.push('[aria-label="' + ariaLabel.slice(0, 30) + '"]');
    const name = el.getAttribute('name');
    if (name) attrs.push('[name=' + name + ']');
    return attrs.join(' ');
  }

  function formatLine(el, getId, getText, indent) {
    const attrs = getAttributes(el, getText);
    return indent + getId(el) + (attrs ? ' ' + attrs : '');
  }
`;

export async function outline(selector = "body", maxDepth = 6): Promise<string> {
    const result = await withActivePage(async (client) => {
        const { objectId } = await resolveElement(client, selector);
        const { result } = await client.Runtime.callFunctionOn({
            objectId,
            functionDeclaration: `function() {
                const root = this;
                ${OUTLINE_HELPERS}

                function getId(el) {
                    let id = el.tagName.toLowerCase();
                    if (el.id) id += '#' + el.id;
                    else if (el.className && typeof el.className === 'string') {
                        const cls = el.className.trim().split(/\\s+/).slice(0, 2).join('.');
                        if (cls) id += '.' + cls;
                    }
                    return id;
                }

                function getText(el) {
                    let text = '';
                    for (const child of el.childNodes) {
                        if (child.nodeType === Node.TEXT_NODE) text += child.textContent;
                    }
                    return truncate(text, 50);
                }

                function getSignature(el) {
                    return getId(el) + ' ' + getText(el);
                }

                function findRepeatedGroups(children) {
                    const groups = [];
                    let i = 0;
                    while (i < children.length) {
                        const sig = getSignature(children[i]);
                        let count = 1;
                        while (i + count < children.length && getSignature(children[i + count]) === sig) count++;
                        groups.push({ start: i, count });
                        i += count;
                    }
                    return groups;
                }

                function walk(el, depth) {
                    if (SKIP_TAGS.has(el.tagName)) return '';
                    const indent = '  '.repeat(depth);
                    let line = formatLine(el, getId, getText, indent);
                    const children = Array.from(el.children).filter(c => !SKIP_TAGS.has(c.tagName));
                    if (depth >= ${maxDepth} && children.length > 0) line += ' ... (' + children.length + ')';
                    line += '\\n';
                    if (depth >= ${maxDepth} || children.length === 0) return line;

                    for (const { start, count } of findRepeatedGroups(children)) {
                        if (count > 2) {
                            const childOutput = walk(children[start], depth + 1);
                            const firstLine = childOutput.split('\\n')[0];
                            line += firstLine + ' (×' + count + ')\\n';
                            const rest = childOutput.split('\\n').slice(1).join('\\n');
                            if (rest.trim()) line += rest;
                        } else {
                            for (let j = 0; j < count; j++) line += walk(children[start + j], depth + 1);
                        }
                    }
                    return line;
                }

                return walk(root, 0);
            }`,
            returnByValue: true,
        });
        return result.value as string;
    });
    return result.trimEnd();
}

export async function scroll(target: string): Promise<void> {
    return withActivePage(async (client) => {
        if (target === "top" || target === "bottom") {
            await client.Runtime.enable();
            await client.Runtime.evaluate({
                expression:
                    target === "top"
                        ? `window.scrollTo({ top: 0, behavior: 'instant' })`
                        : `window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`,
            });
            return;
        }
        const { objectId } = await resolveElement(client, target);
        await client.Runtime.callFunctionOn({
            objectId,
            functionDeclaration: `function() { this.scrollIntoView({ block: "center", behavior: "instant" }); }`,
        });
    });
}

export async function select(selector: string, value: string): Promise<string[]> {
    return withActivePage(async (client) => {
        const { objectId } = await resolveElement(client, selector);
        const { result, exceptionDetails } = await client.Runtime.callFunctionOn({
            objectId,
            functionDeclaration: `function(value) {
                if (this.tagName !== 'SELECT') throw new Error("Element is not a <select>");
                const selected = [];
                for (const option of this.options) {
                    if (option.value === value || option.label === value || option.textContent.trim() === value) {
                        option.selected = true;
                        selected.push(option.value);
                        if (!this.multiple) break;
                    }
                }
                if (selected.length === 0) throw new Error("No option matching: " + value);
                this.dispatchEvent(new Event('input', { bubbles: true }));
                this.dispatchEvent(new Event('change', { bubbles: true }));
                return selected;
            }`,
            arguments: [{ value }],
            returnByValue: true,
        });
        if (exceptionDetails) {
            const desc = exceptionDetails.exception?.description ?? "";
            const message = desc.split("\n")[0]?.replace(/^Error:\s*/, "") || `Select failed: ${selector}`;
            throw new Error(message);
        }
        return result.value as string[];
    });
}

interface AXNode {
    nodeId: string;
    ignored: boolean;
    role?: { value: string };
    name?: { value: string };
    properties?: Array<{ name: string; value: { value: unknown } }>;
    parentId?: string;
    childIds?: string[];
    backendDOMNodeId?: number;
}

const INTERACTIVE_ROLES = new Set([
    "link",
    "button",
    "textbox",
    "searchbox",
    "combobox",
    "listbox",
    "option",
    "checkbox",
    "radio",
    "switch",
    "slider",
    "spinbutton",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "tab",
]);

const LANDMARK_ROLES = new Set([
    "banner",
    "navigation",
    "main",
    "contentinfo",
    "complementary",
    "region",
    "form",
    "search",
]);

const ROLE_PREFIXES: Record<string, string> = {
    link: "l",
    button: "b",
    textbox: "i",
    searchbox: "i",
    combobox: "s",
    listbox: "s",
    checkbox: "c",
    radio: "r",
    switch: "c",
    tab: "t",
};

const LIST_CONTAINER_ROLES = new Set(["list", "listitem", "group", "section", "region", "tabpanel", "tablist"]);
const HEADING_ROLES = new Set(["heading"]);
const MAX_GROUP_ITEMS = 3;
const MAX_OUTLINE_DEPTH = 6;

const STABLE_MS = 50;
const STABLE_TIMEOUT_MS = 1000;

interface StableTreeResult {
    nodes: AXNode[];
    timedOut: boolean;
}

async function getStableAccessibilityTree(client: CDP.Client): Promise<StableTreeResult> {
    await client.Network.enable();
    await client.Accessibility.enable();

    let pending = 0;
    client.Network.requestWillBeSent(() => pending++);
    client.Network.loadingFinished(() => (pending = Math.max(0, pending - 1)));
    client.Network.loadingFailed(() => (pending = Math.max(0, pending - 1)));

    const start = Date.now();
    let lastCount = -1;
    let quietSince = 0;

    while (Date.now() - start < STABLE_TIMEOUT_MS) {
        const { nodes } = (await client.Accessibility.getFullAXTree({})) as { nodes: AXNode[] };
        const isQuiet = pending === 0;
        const isStable = nodes.length === lastCount;

        if (isQuiet && isStable) {
            if (quietSince === 0) quietSince = Date.now();
            if (Date.now() - quietSince >= STABLE_MS) return { nodes, timedOut: false };
        } else {
            quietSince = 0;
        }

        lastCount = nodes.length;
        await Bun.sleep(STABLE_MS);
    }

    const { nodes } = (await client.Accessibility.getFullAXTree({})) as { nodes: AXNode[] };
    return { nodes, timedOut: true };
}

export interface OutlineResult {
    outline: string;
    timedOut: boolean;
}

export async function interactiveOutline(selector = "body"): Promise<OutlineResult> {
    return withActivePage(async (client) => {
        const { nodes, timedOut } = await getStableAccessibilityTree(client);

        const nodeMap = new Map<string, AXNode>();
        for (const node of nodes) {
            nodeMap.set(node.nodeId, node);
        }

        type TreeNodeKind = "landmark" | "heading" | "group" | "interactive" | "text";

        interface TreeNode {
            axNode: AXNode;
            children: TreeNode[];
            kind: TreeNodeKind;
            label?: string;
            summary?: { total: number; shown: number };
        }

        const counters: Record<string, number> = {};
        const newLabelMap = new Map<string, number>();

        function nextLabel(prefix: string): string {
            counters[prefix] = (counters[prefix] ?? 0) + 1;
            return `${prefix}${counters[prefix]}`;
        }

        function getInteractiveLabel(node: AXNode): string | undefined {
            const role = node.role?.value;
            if (!role) return undefined;
            const prefix = ROLE_PREFIXES[role];
            if (!prefix) return undefined;
            return nextLabel(prefix);
        }

        function getGroupLabel(): string {
            return nextLabel("e");
        }

        function getRole(node: AXNode): string {
            return node.role?.value ?? "unknown";
        }

        function getName(node: AXNode): string {
            return node.name?.value ?? "";
        }

        function isInteractive(node: AXNode): boolean {
            if (node.ignored) return false;
            const role = node.role?.value;
            if (!role) return false;
            return INTERACTIVE_ROLES.has(role);
        }

        function isLandmark(node: AXNode): boolean {
            if (node.ignored) return false;
            const role = node.role?.value;
            return role ? LANDMARK_ROLES.has(role) : false;
        }

        function isHeading(node: AXNode): boolean {
            if (node.ignored) return false;
            const role = node.role?.value;
            return role ? HEADING_ROLES.has(role) : false;
        }

        function isListContainer(node: AXNode): boolean {
            if (node.ignored) return false;
            const role = node.role?.value;
            return role ? LIST_CONTAINER_ROLES.has(role) : false;
        }

        function isTextNode(node: AXNode): boolean {
            if (node.ignored) return false;
            const role = node.role?.value;
            return role === "text" || role === "statictext";
        }

        function getSignature(node: AXNode): string {
            return `${getRole(node)}|${getName(node)}`;
        }

        function findRepeatedGroups(children: TreeNode[]): Array<{ start: number; count: number }> {
            const groups: Array<{ start: number; count: number }> = [];
            let i = 0;
            while (i < children.length) {
                const current = children[i];
                if (!current) break;
                const sig = getSignature(current.axNode);
                let count = 1;
                while (i + count < children.length) {
                    const next = children[i + count];
                    if (!next) break;
                    if (getSignature(next.axNode) !== sig) break;
                    count++;
                }
                groups.push({ start: i, count });
                i += count;
            }
            return groups;
        }

        function shouldPreserveNode(node: AXNode, children: TreeNode[]): boolean {
            if (isLandmark(node) || isHeading(node) || isListContainer(node)) return true;
            if (isInteractive(node)) return true;
            if (children.length > 1) return true;
            return false;
        }

        function shouldLabelGroup(node: AXNode, kind: TreeNodeKind, children: TreeNode[]): boolean {
            if (!node.backendDOMNodeId) return false;
            if (kind === "landmark" || kind === "heading") return true;
            if (kind === "group") return children.length > 0;
            return false;
        }

        function buildTree(axNode: AXNode, depth: number): TreeNode | null {
            if (axNode.ignored && !axNode.childIds?.length) return null;

            const childTrees: TreeNode[] = [];
            for (const childId of axNode.childIds ?? []) {
                const child = nodeMap.get(childId);
                if (child) {
                    const tree = buildTree(child, depth + 1);
                    if (tree) childTrees.push(tree);
                }
            }

            if (isInteractive(axNode)) {
                const label = getInteractiveLabel(axNode);
                if (!label) return null;
                return { axNode, children: [], label, kind: "interactive" };
            }

            if (isTextNode(axNode)) {
                return { axNode, children: [], kind: "text" };
            }

            const preserved = shouldPreserveNode(axNode, childTrees);
            if (!preserved) {
                if (childTrees.length === 1) return childTrees[0]!;
                if (childTrees.length > 1) return { axNode: { nodeId: "", ignored: true }, children: childTrees, kind: "group" };
                return null;
            }

            const role = getRole(axNode);
            let kind: TreeNodeKind = "group";
            if (isLandmark(axNode)) kind = "landmark";
            else if (isHeading(axNode)) kind = "heading";
            else if (isListContainer(axNode)) kind = "group";

            let label: string | undefined;
            if (shouldLabelGroup(axNode, kind, childTrees)) {
                label = getGroupLabel();
            }

            return { axNode, children: childTrees, kind, label };
        }

        function formatNode(node: AXNode, label?: string, summary?: { total: number; shown: number }): string {
            const role = getRole(node);
            const name = getName(node);
            const parts: string[] = [];

            if (label) parts.push(`[${label}]`);
            parts.push(role);
            if (name) parts.push(`"${name.slice(0, 50)}${name.length > 50 ? "..." : ""}"`);
            if (summary && summary.total > 0) parts.push(`(${summary.total} items)`);

            return parts.join(" ");
        }

        function render(node: TreeNode, depth = 0): string {
            const indent = "  ".repeat(depth);
            let output = "";

            if (!node.axNode.ignored || node.label) {
                output = indent + formatNode(node.axNode, node.label, node.summary) + "\n";
                const nextDepth = node.axNode.ignored ? depth : depth + 1;
                for (const child of node.children) {
                    output += render(child, nextDepth);
                }
                if (node.summary && node.summary.shown < node.summary.total && node.label) {
                    const hidden = node.summary.total - node.summary.shown;
                    output += `${"  ".repeat(nextDepth)}... (${hidden} more; outline ${node.label} to view all)\n`;
                }
            } else {
                for (const child of node.children) {
                    output += render(child, depth);
                }
            }

            return output;
        }

        function pruneTree(node: TreeNode, maxDepth: number, depth = 0, truncateGroups = true): TreeNode {
            if (depth >= maxDepth) {
                const summary = node.kind === "group" && node.children.length > 0
                    ? { total: node.children.length, shown: 0 }
                    : node.summary;
                return { ...node, children: [], summary };
            }

            const children = node.children.map((child) => pruneTree(child, maxDepth, depth + 1, truncateGroups));
            if (!truncateGroups) {
                const summary = node.kind === "group" && children.length > 0
                    ? { total: children.length, shown: children.length }
                    : node.summary;
                return { ...node, children, summary };
            }

            const groups = findRepeatedGroups(children);
            let prunedChildren: TreeNode[] = [];

            for (const group of groups) {
                const count = group.count;
                const start = group.start;
                if (count > MAX_GROUP_ITEMS) {
                    prunedChildren = prunedChildren.concat(children.slice(start, start + MAX_GROUP_ITEMS));
                } else {
                    prunedChildren = prunedChildren.concat(children.slice(start, start + count));
                }
            }

            const summary = node.kind === "group" && children.length > 0
                ? { total: children.length, shown: prunedChildren.length }
                : node.summary;

            return { ...node, children: prunedChildren, summary };
        }

        function flattenIgnoredGroups(node: TreeNode): TreeNode {
            const children = node.children.flatMap((child) => {
                const next = flattenIgnoredGroups(child);
                if (next.axNode.ignored && !next.label) return next.children;
                return [next];
            });
            return { ...node, children };
        }

        function mapBackendNodeIds(node: TreeNode): void {
            if (node.label && node.axNode.backendDOMNodeId !== undefined) {
                newLabelMap.set(node.label, node.axNode.backendDOMNodeId);
            }
            for (const child of node.children) mapBackendNodeIds(child);
        }

        function ensureGroupLabels(node: TreeNode): void {
            if ((node.kind === "group" || node.kind === "heading" || node.kind === "landmark") && node.children.length > 0 && !node.label) {
                node.label = getGroupLabel();
            }
            for (const child of node.children) ensureGroupLabels(child);
        }

        function findNodeByLabel(node: TreeNode, label: string): TreeNode | null {
            if (node.label === label) return node;
            for (const child of node.children) {
                const match = findNodeByLabel(child, label);
                if (match) return match;
            }
            return null;
        }

        const rootNode = nodes.find((n) => !n.parentId);
        if (!rootNode) return { outline: "", timedOut };

        let tree = buildTree(rootNode, 0);
        if (!tree) return { outline: "", timedOut };
        tree = flattenIgnoredGroups(tree);
        ensureGroupLabels(tree);
        mapBackendNodeIds(tree);

        const targetLabel = selector !== "body" ? selector : undefined;
        const scopedNode = targetLabel ? findNodeByLabel(tree, targetLabel) : null;

        const outlineRoot = scopedNode ?? tree;
        const truncateGroups = scopedNode ? false : true;
        const pruned = pruneTree(outlineRoot, MAX_OUTLINE_DEPTH, 0, truncateGroups);
        await writeLabelMap(newLabelMap);

        const outline = render(pruned).trimEnd();
        return { outline, timedOut };
    });
}
