import path from "node:path";
import url from "node:url";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";

const split = async () => {
  let remainderChunk = "";
  let numberFiles = 1;
  let buffer = [];

  const defaultValue = 10;
  const args = process.argv.slice(2);
  const linesIndex = args.indexOf("--lines");

  let lines = linesIndex !== -1 ? args[linesIndex + 1] : null;
  if (!lines || isNaN(parseFloat(lines)) || Number(lines) <= 0) {
    console.log(
      `Sorry, \x1b[31mInvalid\x1b[0m value for --lines. Using \x1b[32mdefault ${defaultValue}\x1b[0m`,
    );
    lines = defaultValue;
  } else {
    lines = Number(lines);
  }

  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sourcePath = path.resolve(__dirname, "../../source.txt");

  try {
    await fsPromises.access(sourcePath, fsPromises.constants.F_OK);
  } catch {
    console.error("\x1b[31mFS operation failed\x1b[0m");
    process.exit(1);
  }

  const readStream = fs.createReadStream(sourcePath, { encoding: "utf8" });

  readStream.on("error", (err) => {
    console.error("\x1b[31mFS operation failed\x1b[0m");
  });

  const splitTransform = new Transform({
    transform(chunk, encoding, callback) {
      const textChunk = remainderChunk + chunk.toString();
      const arrChunk = textChunk.split(/\r?\n/);
      remainderChunk = arrChunk.pop() || "";
      for (const lineStr of arrChunk) {
        this.push(lineStr);
      }
      callback();
    },

    flush(callback) {
      if (remainderChunk) {
        this.push(remainderChunk);
      }
      callback();
    },
  });

  const oldChunks = await fsPromises
    .readdir(__dirname + "/../..")
    .then((files) =>
      files.filter(
        (oldFiles) =>
          oldFiles.startsWith("chunk_") && oldFiles.endsWith(".txt"),
      ),
    );
  await Promise.all(
    oldChunks.map((oldFiles) =>
      fsPromises.rm(path.join(__dirname, "../..", oldFiles), { force: true }),
    ),
  );

  const splitWritable = new Writable({
    write(chunk, encoding, callback) {
      const lineWritable = chunk.toString();
      buffer.push(lineWritable);

      if (buffer.length >= lines) {
        const nameChunk = path.resolve(
          __dirname,
          `../../chunk_${numberFiles}.txt`,
        );
        const fileStream = fs.createWriteStream(nameChunk);
        for (const l of buffer) {
          fileStream.write(l + "\n");
        }
        fileStream.end();

        fileStream.on("finish", () => {
          buffer = [];
          numberFiles++;
          callback();
        });

        fileStream.on("error", callback);
      } else {
        callback();
      }
    },

    final(callback) {
      console.log(`\x1b[32mFinish ,create ${numberFiles} files\x1b[0m`);
      if (buffer.length > 0) {
        const nameChunk = path.resolve(
          __dirname,
          `../../chunk_${numberFiles}.txt`,
        );
        const fileStream = fs.createWriteStream(nameChunk);
        for (const i of buffer) {
          fileStream.write(i + "\n");
        }
        fileStream.end();

        fileStream.on("finish", () => {
          callback();
        });

        fileStream.on("error", callback);
      } else {
        callback();
      }
    },
  });
  try {
    await pipeline(readStream, splitTransform, splitWritable);
  } catch (err) {
    console.error("\x1b[31mError:\x1b[0");
  }
};

await split();
