import path from "node:path";
import url from "node:url";
import fs from "node:fs/promises";

const snapshot = async () => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const entriesData = [];

  const workspacePath = path.resolve(__dirname, "../../workspace");

  try {
    const stats = await fs.stat(workspacePath);
    if (!stats.isDirectory()) {
      throw new Error("\x1b[31mFS operation failed\x1b[0m");
    }
      await checkDirectory(workspacePath, workspacePath, entriesData);
      const snapshotData = {
        rootPath: workspacePath.replace(/\\/g, '/'),
        entries: entriesData,
      };
      const jsonString = JSON.stringify(snapshotData, null, 2);
      const snapShotJsonPath = path.join(__dirname, "../../snapshot.json");
      await fs.writeFile(snapShotJsonPath, jsonString, "utf8");
    
  } catch (err) {
    throw new Error("\x1b[31mFS operation failed\x1b[0m");
  }
};

await snapshot();

async function checkDirectory(pathUrl, mainPath, data) {
  try {
    const itemsDirectory = await fs.readdir(pathUrl, { withFileTypes: true });
    for (let i = 0; i < itemsDirectory.length; i++) {
      const elementDirectory = itemsDirectory[i];
      const elementDirectoryPath = path.join(
        elementDirectory.parentPath,
        elementDirectory.name,
      );
      // console.log(elementDirectoryPath);
      const infoElementDirectory = await fs.stat(elementDirectoryPath);
      if (infoElementDirectory.isDirectory()) {
        data.push({
          path: path.relative(mainPath, elementDirectoryPath).replace(/\\/g, '/'),
          type: "directory",
        });
        await checkDirectory(elementDirectoryPath, mainPath, data);
      } else if (infoElementDirectory.isFile()) {
        data.push({
          path: path.relative(mainPath, elementDirectoryPath).replace(/\\/g, '/'),
          type: "file",
          size: infoElementDirectory.size,
          content: (await fs.readFile(elementDirectoryPath)).toString("base64"),
        });
      }
    }
  } catch (err) {
    throw new Error("\x1b[31mFS operation failed\x1b[0m");
  }
}
