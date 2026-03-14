import path from "node:path";
import url from "node:url";
import fs from "node:fs/promises";

const restore = async () => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const workspacePath = path.resolve(__dirname, "../../workspace_restored");
  const snapShotPath = path.resolve(__dirname, "../../snapshot.json");

  try {
    await fs.mkdir(workspacePath, { recursive: false });
    const snapshotContent = await fs.readFile(snapShotPath, "utf8");
    const snapshotData = JSON.parse(snapshotContent);
    await creatingDirectory(workspacePath, snapshotData);
  } catch (err) {
    throw new Error("\x1b[31mFS operation failed\x1b[0m");
  }
};

await restore();

async function creatingDirectory(pathParent, data) {
  const entriesArr = data.entries;
  for (let i = 0; i < entriesArr.length; i++) {
    const elementEntries = entriesArr[i];
    const finalPathFilename = path.join(pathParent, elementEntries.path);
    const finalPathDirname = path.dirname(finalPathFilename);
    if (elementEntries.type === "file") {
      await fs.mkdir(finalPathDirname, { recursive: true });
      await fs.writeFile(
        finalPathFilename,
        Buffer.from(elementEntries.content, "base64"),
      );
    } else if (elementEntries.type === "directory") {
      await fs.mkdir(finalPathDirname, { recursive: true });
    }
  }
}
