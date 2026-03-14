import path from "node:path";
import url from "node:url";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
const verify = async () => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const checkSumsPath = path.resolve(__dirname, "../../checksums.json");

  try {
    await fsPromises.access(checkSumsPath, fsPromises.constants.F_OK);
    const content = await fsPromises.readFile(checkSumsPath, "utf8");
    const checkSumsContent = JSON.parse(content);
    for (const [filename, expectedHash] of Object.entries(checkSumsContent)) {
      try {
        const filePath = path.resolve(__dirname, `../../${filename}`);
        const fileStream = fs.createReadStream(filePath);
        const hash = createHash("sha256");

        await pipeline(fileStream, hash);
        const actualHash = hash.digest("hex");
        const result = actualHash === expectedHash ? "OK" : "FAIL";
        console.log(`${filename} — ${result}`);
      } catch {
        console.log(`${filename} — FAIL`);
      }
    }
  } catch {
    console.error("\x1b[31mFS operation failed\x1b[0m");
    process.exit(1);
  }
};

await verify();
