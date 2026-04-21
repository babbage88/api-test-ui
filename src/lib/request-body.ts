export function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return window.btoa(binary);
}

export function formatFieldLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function setValueAtPath(
  root: Record<string, unknown>,
  path: string[],
  value: unknown,
) {
  let cursor: Record<string, unknown> = root;
  for (const segment of path.slice(0, -1)) {
    const next = cursor[segment];
    if (!isRecord(next)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = value;
}

export function replacePrivateKeyDefaults(
  value: unknown,
  privateKeyBase64: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      replacePrivateKeyDefaults(item, privateKeyBase64),
    );
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === "private_key_base64"
        ? privateKeyBase64
        : replacePrivateKeyDefaults(item, privateKeyBase64),
    ]),
  );
}
