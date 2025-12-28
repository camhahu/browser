import CDP from "chrome-remote-interface";
import { CDP_PORT, getActiveTarget, withActivePage, withNavigation } from "./cdp";
export { navigate } from "./cdp";

export async function find(selector: string): Promise<number> {
  return withActivePage(async (client) => {
    await client.DOM.enable();
    const { root } = await client.DOM.getDocument();
    const { nodeIds } = await client.DOM.querySelectorAll({ nodeId: root.nodeId, selector });
    return nodeIds.length;
  });
}

export async function click(selector: string): Promise<void> {
  return withActivePage(async (client) => {
    await client.Runtime.enable();
    await withNavigation(client, async () => {
      const { result } = await client.Runtime.evaluate({
        expression: `(() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) throw new Error("Element not found");
          el.click();
        })()`,
        awaitPromise: true,
      });
      if (result.subtype === "error") throw new Error(`Element not found: ${selector}`);
    });
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
      await client.Runtime.enable();
      const escapedSelector = JSON.stringify(selector);
      const { exceptionDetails } = await client.Runtime.evaluate({
        expression: `(() => {
          const el = document.querySelector(${escapedSelector});
          if (!el) throw new Error("Element not found: " + ${escapedSelector});
          el.focus();
          el.click();
          el.value = '';
        })()`,
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
    const count = await find(selector);
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

export async function console(callback: (type: string, args: string[]) => void): Promise<() => Promise<void>> {
  const target = await getActiveTarget();
  if (!target) throw new Error("No active tab");

  const client = await CDP({ port: CDP_PORT, target: target.id });
  await client.Runtime.enable();

  client.Runtime.consoleAPICalled(async (params) => {
    const args: string[] = [];
    for (const arg of params.args) {
      if (arg.value !== undefined) {
        args.push(typeof arg.value === "object" ? JSON.stringify(arg.value) : String(arg.value));
      } else if (arg.objectId) {
        try {
          const { result } = await client.Runtime.callFunctionOn({
            objectId: arg.objectId,
            functionDeclaration: "function() { return JSON.stringify(this); }",
            returnByValue: true,
          });
          args.push(result.value ?? arg.description ?? arg.type);
        } catch {
          args.push(arg.description ?? arg.type);
        }
      } else {
        args.push(arg.description ?? arg.type);
      }
    }
    callback(params.type, args);
  });

  return async () => {
    await client.close();
  };
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
  const escapedSelector = JSON.stringify(selector);
  const content = await evaluate(`document.querySelector(${escapedSelector})?.outerHTML ?? (() => { throw new Error("Element not found: " + ${escapedSelector}) })()`);
  return truncate(content as string, limit);
}

export async function text(selector = "body", limit = DEFAULT_LIMIT, visibleOnly = true): Promise<ContentResult> {
  const escapedSelector = JSON.stringify(selector);
  const expression = visibleOnly ? `(() => {
    const root = document.querySelector(${escapedSelector});
    if (!root) throw new Error("Element not found: " + ${escapedSelector});

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

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (isVisible(node.parentElement)) {
        const t = node.textContent;
        if (t && t.trim()) texts.push(t);
      }
    }
    return texts.join('');
  })()` : `document.querySelector(${escapedSelector})?.innerText ?? (() => { throw new Error("Element not found: " + ${escapedSelector}) })()`;
  const content = await evaluate(expression);
  return truncate(content as string, limit);
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

export async function hover(selector: string): Promise<void> {
  return withActivePage(async (client) => {
    await client.Runtime.enable();
    const escapedSelector = JSON.stringify(selector);
    const { result, exceptionDetails } = await client.Runtime.evaluate({
      expression: `(() => {
        const el = document.querySelector(${escapedSelector});
        if (!el) throw new Error("Element not found: " + ${escapedSelector});
        el.scrollIntoView({ block: "center", inline: "center" });
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description ?? `Element not found: ${selector}`);
    }
    const { x, y } = result.value as { x: number; y: number };
    await client.Input.dispatchMouseEvent({ type: "mouseMoved", x, y });
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
  const escapedSelector = JSON.stringify(selector);
  const result = await evaluate(`(() => {
    const root = document.querySelector(${escapedSelector});
    if (!root) throw new Error("Element not found: " + ${escapedSelector});
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
  })()`);
  return (result as string).trimEnd();
}

export async function interactiveOutline(selector = "body"): Promise<string> {
  const escapedSelector = JSON.stringify(selector);
  const result = await evaluate(`(() => {
    const root = document.querySelector(${escapedSelector});
    if (!root) throw new Error("Element not found: " + ${escapedSelector});
    ${OUTLINE_HELPERS}

    const INTERACTIVE = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
    const LANDMARKS = new Set(['HEADER', 'NAV', 'MAIN', 'FOOTER', 'ASIDE', 'SECTION', 'FORM', 'DIALOG']);
    const LANDMARK_ROLES = new Set(['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'region', 'form', 'search', 'dialog']);

    function isInteractive(el) {
      return INTERACTIVE.has(el.tagName) ||
        el.getAttribute('role') === 'button' ||
        el.getAttribute('onclick') ||
        el.getAttribute('tabindex') === '0';
    }

    function isLandmark(el) {
      return LANDMARKS.has(el.tagName) || LANDMARK_ROLES.has(el.getAttribute('role'));
    }

    function getId(el) {
      let id = el.tagName.toLowerCase();
      if (el.id) id += '#' + el.id;
      return id;
    }

    function getText(el) {
      return truncate(el.innerText || '', 50);
    }

    function buildTree(el) {
      if (SKIP_TAGS.has(el.tagName)) return null;
      if (isInteractive(el)) return { el, children: [] };

      const childTrees = [];
      for (const child of el.children) {
        const tree = buildTree(child);
        if (tree) childTrees.push(tree);
      }

      if (isLandmark(el) && childTrees.length > 0) return { el, children: childTrees };
      if (childTrees.length === 1) return childTrees[0];
      if (childTrees.length > 1) return { el: null, children: childTrees };
      return null;
    }

    function render(node, depth = 0) {
      if (!node) return '';
      const indent = '  '.repeat(depth);
      if (node.el) {
        let output = formatLine(node.el, getId, getText, indent) + '\\n';
        for (const child of node.children) output += render(child, depth + 1);
        return output;
      }
      let output = '';
      for (const child of node.children) output += render(child, depth);
      return output;
    }

    const tree = buildTree(root);
    return tree ? render(tree) : '';
  })()`);
  return (result as string).trimEnd();
}
