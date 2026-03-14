import path from "node:path";
import url from "node:url";
import fs from "node:fs/promises";

const findByExt = async () => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const args = process.argv.slice(2);
  let extension = ".txt";
  const workspacePath = path.resolve(__dirname, "../../workspace");
  const listDirectory = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ext" && i + 1 < args.length) {
      extension = args[i + 1].trim().toLowerCase();
      if (!extension.startsWith(".")) {
        extension = "." + extension;
      }
    }
  }

  try {
    const stats = await fs.stat(workspacePath);
    if (!stats.isDirectory()) {
      throw new Error("\x1b[31mFS operation failed\x1b[0m");
    }

    await collectFiles(workspacePath, workspacePath, extension, listDirectory);
    listDirectory.sort();
    for (let i = 0; i < listDirectory.length; i++) {
      console.log(listDirectory[i])
    }
  } catch (err) {
    throw new Error("\x1b[31mFS operation failed\x1b[0m");
  }
};

await findByExt();

async function collectFiles(pathUrl, mainPath, ext, listDirectory) {
  try {
    const itemsDirectory = await fs.readdir(pathUrl, { withFileTypes: true });
    for (let i = 0; i < itemsDirectory.length; i++) {
      const elementDirectory = itemsDirectory[i];
      const elementDirectoryPath = path.join(
        elementDirectory.parentPath,
        elementDirectory.name,
      );
      const infoElementDirectory = await fs.stat(elementDirectoryPath);
   
      if (infoElementDirectory.isDirectory()) {
        await collectFiles(elementDirectoryPath, mainPath, ext, listDirectory);
      } else if (
        infoElementDirectory.isFile() &&
        itemsDirectory[i].name.endsWith(`${ext}`)
      ) {
        listDirectory.push(
          path.relative(mainPath, elementDirectoryPath).replace(/\\/g, "/"),
        );
      }
    }
  } catch (err) {
    throw new Error("\x1b[31mFS operation failed\x1b[0m");
  }
}
