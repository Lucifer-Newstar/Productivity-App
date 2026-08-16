/** Security helpers for user-controlled URLs, imports, images and CSV exports. */

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const SAFE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/** Only allow normal web links. Blocks javascript:, data:, file:, vbscript:, etc. */
export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Neutralise spreadsheet formulas while preserving RFC-4180 quoting. */
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Read only bounded JPEG/PNG/WebP uploads. SVG is deliberately rejected. */
export function readSafeImageAsDataUrl(file: File): Promise<string> {
  if (!SAFE_IMAGE_TYPES.has(file.type)) {
    return Promise.reject(new Error("Only JPEG, PNG and WebP images are allowed."));
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return Promise.reject(new Error("Image must be smaller than 2 MB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.onload = () => {
      const result = reader.result;
      const expected = `data:${file.type};base64,`;
      if (typeof result !== "string" || !result.startsWith(expected)) {
        reject(new Error("Invalid image data."));
      } else {
        resolve(result);
      }
    };
    reader.readAsDataURL(file);
  });
}

function sanitizeJsonValue(value: unknown, depth = 0): unknown {
  if (depth > 30) throw new Error("Import is nested too deeply.");
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Import contains a non-finite number.");
    return value;
  }
  if (typeof value === "string") {
    if (value.length > 250_000) throw new Error("Import contains an oversized string.");
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > 10_000) throw new Error("Import contains too many records.");
    return value.map((item) => sanitizeJsonValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = Object.create(null);
    for (const [key, item] of Object.entries(input)) {
      if (UNSAFE_KEYS.has(key)) continue;
      output[key] = sanitizeJsonValue(item, depth + 1);
    }
    return output;
  }
  throw new Error("Import contains an unsupported value.");
}

/** Parse a bounded JSON backup and remove prototype-pollution keys recursively. */
export function parseSafeJsonFile(file: File, text: string): unknown {
  if (file.size <= 0 || file.size > MAX_IMPORT_BYTES) {
    throw new Error("Backup must be smaller than 5 MB.");
  }
  return sanitizeJsonValue(JSON.parse(text));
}

export function assertImportFileSize(file: File, maxBytes = MAX_IMPORT_BYTES): void {
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error(`Import must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }
}
