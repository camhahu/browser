import CDP from "chrome-remote-interface";
import { CDP_PORT, getActiveTarget, withActivePage } from "./cdp";
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
}

export async function type(text: string, selector: string): Promise<void> {
  return withActivePage(async (client) => {
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
    await client.Page.navigateToHistoryEntry({ entryId: entries[currentIndex - 1]!.id });
    return true;
  });
}

export async function forward(): Promise<boolean> {
  return withActivePage(async (client) => {
    const { currentIndex, entries } = await client.Page.getNavigationHistory();
    if (currentIndex >= entries.length - 1) return false;
    await client.Page.navigateToHistoryEntry({ entryId: entries[currentIndex + 1]!.id });
    return true;
  });
}

export async function refresh(): Promise<void> {
  return withActivePage(async (client) => {
    await client.Page.reload({});
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

export async function outline(selector = "body", maxDepth = 6): Promise<string> {
  const escapedSelector = JSON.stringify(selector);
  const result = await evaluate(`(() => {
    const root = document.querySelector(${escapedSelector});
    if (!root) throw new Error("Element not found: " + ${escapedSelector});

    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'BR', 'HR', 'META', 'LINK']);

    function getIdentifier(el) {
      let id = el.tagName.toLowerCase();
      if (el.id) id += '#' + el.id;
      else if (el.className && typeof el.className === 'string') {
        const cls = el.className.trim().split(/\\s+/).slice(0, 2).join('.');
        if (cls) id += '.' + cls;
      }
      return id;
    }

    function getTextPreview(el, maxLen = 50) {
      let text = '';
      for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) text += child.textContent;
      }
      text = text.trim().replace(/\\s+/g, ' ');
      if (text.length > maxLen) return '"' + text.slice(0, maxLen) + '..."';
      if (text.length > 0) return '"' + text + '"';
      return '';
    }

    function getElementInfo(el) {
      const tag = el.tagName;
      if (tag === 'A') return el.getAttribute('href') ? '[href]' : '';
      if (tag === 'IMG') {
        const alt = el.getAttribute('alt');
        return alt ? '"' + alt.slice(0, 30) + '"' : '[img]';
      }
      if (tag === 'INPUT') {
        const type = el.getAttribute('type') || 'text';
        const placeholder = el.getAttribute('placeholder');
        return '[' + type + ']' + (placeholder ? ' "' + placeholder + '"' : '');
      }
      if (tag === 'BUTTON') return getTextPreview(el, 30);
      if (tag === 'SELECT') return '(' + el.options.length + ' options)';
      return '';
    }

    function findRepeatedGroups(children) {
      const groups = [];
      let i = 0;
      while (i < children.length) {
        const sig = getIdentifier(children[i]);
        let count = 1;
        while (i + count < children.length && getIdentifier(children[i + count]) === sig) count++;
        groups.push({ start: i, count });
        i += count;
      }
      return groups;
    }

    function walk(el, depth) {
      if (depth > ${maxDepth}) return '  '.repeat(depth) + '...\\n';
      if (SKIP_TAGS.has(el.tagName)) return '';

      const indent = '  '.repeat(depth);
      const info = getElementInfo(el);
      let line = indent + getIdentifier(el);
      if (info) line += ' ' + info;
      else {
        const preview = getTextPreview(el);
        if (preview) line += ' ' + preview;
      }
      line += '\\n';

      const children = Array.from(el.children).filter(c => !SKIP_TAGS.has(c.tagName));
      if (children.length === 0) return line;

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
