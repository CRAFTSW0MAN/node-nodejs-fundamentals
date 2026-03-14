import path from "node:path";
import url from "node:url";
import fs from "node:fs/promises";

const merge = async () => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const args = process.argv.slice(2);
  const partsPath = path.resolve(__dirname, "../../workspace/parts");
  const listFiles = [];
  const defaultListFiles = [];
  const allListsFiles = [];

  try {
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--files") {
        if (i + 1 < args.length) {
          const strFiles = args[i + 1].trim().toLowerCase();
          const arrList = strFiles.split(",");
          listFiles.push(...arrList);
        } else {
          throw new Error("FS operation failed");
        }
      }
    }

    await defaultBehavior(partsPath, defaultListFiles,allListsFiles);

    if (listFiles.length === 0) {
      defaultListFiles.sort();
      await createNewFiles(partsPath, defaultListFiles);
    } else {
      const allPresent = listFiles.every((item) =>
        allListsFiles.includes(item),
      );
      if (!allPresent) {
        throw new Error("\x1b[31mFS operation failed\x1b[0m");
      }
      await createNewFiles(partsPath, listFiles);
    }
  } catch (error) {
    throw new Error("\x1b[31mFS operation failed\x1b[0m");
  }
};

await merge();

async function defaultBehavior(path, arr, allArr) {
  try {
    const itemsDirectory = await fs.readdir(path, { withFileTypes: true });
    if (itemsDirectory.length === 0) {
      throw new Error("\x1b[31mFS operation failed\x1b[0m");
    }
    for (let i = 0; i < itemsDirectory.length; i++) {
      if (itemsDirectory[i].isFile()) {
        allArr.push(itemsDirectory[i].name);
        if (itemsDirectory[i].name.endsWith(".txt")) {
          arr.push(itemsDirectory[i].name);
        }
      }
    }
    if (arr.length === 0) {
      throw new Error("FS operation failed");
    }
  } catch (error) {
    throw new Error("\x1b[31mFS operation failed\x1b[0m");
  }
}

async function createNewFiles(parentPath, arrFiles) {
  let content = "";
  for (const element of arrFiles) {
    const elementPath = path.join(parentPath, element);
    const contentFiles = await fs.readFile(elementPath, "utf8");
    content += contentFiles;
  }
  const dirnameParentParh = path.dirname(parentPath);
  const pathFileMerged = path.join(dirnameParentParh, "merged.txt");
  await fs.writeFile(pathFileMerged, content, "utf8");
}
