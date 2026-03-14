import path from "node:path";
import url from "node:url";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import zlib from "node:zlib";
import { Buffer } from "node:buffer";
import { pipeline } from "node:stream/promises";
const decompressDir = async () => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const compressedDir = path.resolve(__dirname, "../../workspace/compressed");
  const archivePath = path.join(compressedDir, "archive.br");

  try {
    const stats = await fsPromises.stat(compressedDir);
    const statsArhive = await fsPromises.stat(archivePath);
    if (!stats.isDirectory()) {
      throw new Error("\x1b[31mFS operation failed\x1b[0m");
    }
    if (!statsArhive.isFile()) {
      throw new Error("\x1b[31mFS operation failed\x1b[0m");
    }
  } catch (error) {
    throw new Error("\x1b[31mFS operation failed\x1b[0m");
  }
  try {
    const deCompressedDir = path.resolve(
      __dirname,
      "../../workspace/decompressed",
    );
    await fsPromises.mkdir(deCompressedDir, { recursive: true });
    const decompress = zlib.createBrotliDecompress();
    const readStream = fs.createReadStream(archivePath);

    let buffer = Buffer.alloc(0);

    decompress.on("data", async (chunk) => {
      try {
        buffer = Buffer.concat([buffer, chunk]);
        while (buffer.length >= 3) {
          const type = buffer.readUInt8(0);
          const nameLength = buffer.readUInt16BE(1);

          if (buffer.length < 3 + nameLength) {
            break;
          }
          const name = buffer.toString("utf8", 3, 3 + nameLength);

          let consumed = 3 + nameLength;

          if (type === 0) {
            if (buffer.length < consumed + 8) {
              break;
            }
            const size = Number(buffer.readBigUInt64BE(consumed));
            consumed += 8;
            if (buffer.length < consumed + size) {
              break;
            }
            const fileData = buffer.subarray(consumed, consumed + size);
            consumed += size;

            const finishPath = path.join(deCompressedDir, name);
            const finishParentPath = path.dirname(finishPath);
            await fsPromises.mkdir(finishParentPath, { recursive: true });
            await fsPromises.writeFile(finishPath, fileData);
          } else {
            const finishPath = path.join(deCompressedDir, name);
            await fsPromises.mkdir(finishPath, { recursive: true });
          }
          buffer = buffer.subarray(consumed);
        }
      } catch (error) {
         decompress.destroy(err);
      }
    });
    decompress.on("end", () => {
      console.log("\x1b[32mDecompression complete");
    });

    await pipeline(readStream, decompress);
  } catch (error) {
    throw new Error("\x1b[31mFS operation failed\x1b[0m");
  }
};

await decompressDir();

