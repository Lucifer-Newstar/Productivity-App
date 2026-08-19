/** Stream large local artifacts into SHA-256 without Node's readFile 2 GiB buffer ceiling. */
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

export function sha256File(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256"), stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.once("error", reject);
    stream.once("end", () => resolve(hash.digest("hex")));
  });
}
