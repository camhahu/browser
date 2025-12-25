import { withActivePage, getUrl } from "./cdp";

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: "Strict" | "Lax" | "None";
}

export async function getCookies(): Promise<Cookie[]> {
  const url = await getUrl();
  if (!url) throw new Error("No active tab");

  return withActivePage(async (client) => {
    await client.Network.enable({});
    const { cookies } = await client.Network.getCookies({ urls: [url] });
    return cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: (c.sameSite ?? "Lax") as Cookie["sameSite"],
    }));
  });
}

export async function getCookie(name: string): Promise<Cookie | null> {
  const cookies = await getCookies();
  return cookies.find((c) => c.name === name) ?? null;
}

export async function setCookie(name: string, value: string, domain?: string): Promise<void> {
  const url = await getUrl();
  if (!url) throw new Error("No active tab");

  const parsedUrl = new URL(url);
  const cookieDomain = domain ?? parsedUrl.hostname;

  return withActivePage(async (client) => {
    await client.Network.enable({});
    const { success } = await client.Network.setCookie({
      name,
      value,
      domain: cookieDomain,
      path: "/",
    });
    if (!success) throw new Error(`Failed to set cookie: ${name}`);
  });
}

export async function deleteCookie(name: string): Promise<void> {
  const url = await getUrl();
  if (!url) throw new Error("No active tab");

  return withActivePage(async (client) => {
    await client.Network.enable({});
    await client.Network.deleteCookies({
      name,
      domain: new URL(url).hostname,
    });
  });
}

export async function clearCookies(): Promise<void> {
  const cookies = await getCookies();
  for (const cookie of cookies) {
    await withActivePage(async (client) => {
      await client.Network.enable({});
      await client.Network.deleteCookies({
        name: cookie.name,
        domain: cookie.domain,
      });
    });
  }
}

export type StorageType = "local" | "session";

function storageObject(type: StorageType): string {
  return type === "session" ? "sessionStorage" : "localStorage";
}

export async function getStorageEntries(type: StorageType = "local"): Promise<{ key: string; value: string }[]> {
  return withActivePage(async (client) => {
    await client.Runtime.enable();
    const { result, exceptionDetails } = await client.Runtime.evaluate({
      expression: `JSON.stringify(Object.entries(${storageObject(type)}).map(([key, value]) => ({ key, value })))`,
      returnByValue: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return JSON.parse(result.value as string);
  });
}

export async function getStorageValue(key: string, type: StorageType = "local"): Promise<string | null> {
  return withActivePage(async (client) => {
    await client.Runtime.enable();
    const { result, exceptionDetails } = await client.Runtime.evaluate({
      expression: `${storageObject(type)}.getItem(${JSON.stringify(key)})`,
      returnByValue: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value ?? null;
  });
}

export async function setStorageValue(key: string, value: string, type: StorageType = "local"): Promise<void> {
  return withActivePage(async (client) => {
    await client.Runtime.enable();
    const { exceptionDetails } = await client.Runtime.evaluate({
      expression: `${storageObject(type)}.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)})`,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  });
}

export async function deleteStorageValue(key: string, type: StorageType = "local"): Promise<void> {
  return withActivePage(async (client) => {
    await client.Runtime.enable();
    const { exceptionDetails } = await client.Runtime.evaluate({
      expression: `${storageObject(type)}.removeItem(${JSON.stringify(key)})`,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  });
}

export async function clearStorage(type: StorageType = "local"): Promise<void> {
  return withActivePage(async (client) => {
    await client.Runtime.enable();
    const { exceptionDetails } = await client.Runtime.evaluate({
      expression: `${storageObject(type)}.clear()`,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  });
}
