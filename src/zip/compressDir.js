import path from "node:path";
import url from "node:url";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import zlib from "node:zlib";
import { Buffer } from "node:buffer";
import { PassThrough } from "node:stream";
import { pipeline } from "node:stream/promises";

const compressDir = async () => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const entriesData = [];

  const workspacePath = path.resolve(__dirname, "../../workspace/toCompress");

  try {
    const stats = await fsPromises.stat(workspacePath);
    if (!stats.isDirectory()) {
      throw new Error("\x1b[31mFS operation failed\x1b[0m");
    }
    await checkDirectory(workspacePath, workspacePath, entriesData);

    const compressedDir = path.resolve(__dirname, "../../workspace/compressed");
    await fsPromises.mkdir(compressedDir, { recursive: true });

    const archivePath = path.join(compressedDir, "archive.br");

    const passThrough = new PassThrough();
    const brotli = zlib.createBrotliCompress({
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      },
    });
    const writeStream = fs.createWriteStream(archivePath);

    const pipelinePromise = pipeline(passThrough, brotli, writeStream);
    for (let i = 0; i < entriesData.length; i++) {
      const element = createHeader(entriesData[i]);
      const canContinue = passThrough.write(element);

      if (!canContinue) {
        await new Promise((resolve) => passThrough.once("drain", resolve));
      }

      if (entriesData[i].type === "file") {
        const fullPath = path.join(workspacePath, entriesData[i].path);
        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(passThrough, { end: false });
        await new Promise((resolve, reject) => {
          fileStream.on("end", resolve);
          fileStream.on("error", reject);
        });
      }
    }
    passThrough.end(() => console.log("\x1b[32mCompression complete"));

    await pipelinePromise;
  } catch (error) {
    throw new Error("\x1b[31mFS operation failed\x1b[0m");
  }
};

await compressDir();

async function checkDirectory(pathUrl, mainPath, data) {
  try {
    const itemsDirectory = await fsPromises.readdir(pathUrl, {
      withFileTypes: true,
    });
    for (let i = 0; i < itemsDirectory.length; i++) {
      const elementDirectory = itemsDirectory[i];
      const elementDirectoryPath = path.join(
        elementDirectory.parentPath,
        elementDirectory.name,
      );
      const infoElementDirectory = await fsPromises.stat(elementDirectoryPath);
      if (infoElementDirectory.isDirectory()) {
        data.push({
          path: path
            .relative(mainPath, elementDirectoryPath)
            .replace(/\\/g, "/"),
          type: "directory",
        });
        await checkDirectory(elementDirectoryPath, mainPath, data);
      } else if (infoElementDirectory.isFile()) {
        data.push({
          path: path
            .relative(mainPath, elementDirectoryPath)
            .replace(/\\/g, "/"),
          type: "file",
          size: infoElementDirectory.size,
        });
      }
    }
  } catch (err) {
    throw new Error("\x1b[31mFS operation failed\x1b[0m");
  }
}

function createHeader(item) {
  const nameBuf = Buffer.from(item.path, "utf8");
  const nameLen = nameBuf.length;
  const headerSize = 1 + 2 + nameLen + (item.type === "file" ? 8 : 0);
  const header = Buffer.alloc(headerSize);
  let offset = 0;

  header.writeUInt8(item.type === "file" ? 0 : 1, offset);
  offset += 1;

  header.writeUInt16BE(nameLen, offset);
  offset += 2;

  nameBuf.copy(header, offset);
  offset += nameLen;

  if (item.type === "file") {
    header.writeBigUInt64BE(BigInt(item.size), offset);
  }

  return header;
}
