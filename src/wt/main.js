import { Worker } from "worker_threads";
import path from "node:path";
import url from "node:url";
import fs from "node:fs/promises";
import os from "os";

const main = async () => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const dataPath = path.resolve(__dirname, "../../data.json");
  let dataContent;

  try {
    const dataContentParse = await fs.readFile(dataPath, "utf8");
    if (!dataContentParse) {
      console.log([]);
      process.exit(0);
    }
    dataContent = JSON.parse(dataContentParse);

    await workerStart(__dirname, dataContent);
  } catch (err) {
    console.error("\x1b[31mSorry,but file data.json not found\x1b[0m");
    process.exit(1);
  }
};

await main();

async function workerStart(dirname, data) {
  if (data.length === 0) {
    console.log([]);
    return;
  }
  const numberCpus = os.availableParallelism();
  const numWorkers = Math.min(numberCpus, data.length);

  const chunks = chunkArray(data, numWorkers);

  const workerPromises = chunks.map((chunk) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(dirname, "worker.js"));

      worker.on("message", (msg) => {
        resolve(msg);
        worker.terminate();
      });

      worker.on("error", (err) => {
        reject(err);
      });
      worker.postMessage(chunk);
    });
  });

  const finishChunks = await Promise.all(workerPromises);
  console.log(mergeSortedArrays(finishChunks));
}

function chunkArray(array, numChunks) {
  const chunksArr = [];
  const chunkSize = Math.ceil(array.length / numChunks);
  for (let i = 0; i < array.length; i += chunkSize) {
    chunksArr.push(array.slice(i, i + chunkSize));
  }
  return chunksArr;
}

function mergeSortedArrays(arrays) {
  const finalResult = [];
  const indices = new Array(arrays.length).fill(0);

  while (true) {
    let minValue = Infinity;
    let minIndex = -1;

    for (let i = 0; i < arrays.length; i++) {
      if (indices[i] < arrays[i].length && arrays[i][indices[i]] < minValue) {
        minValue = arrays[i][indices[i]];
        minIndex = i;
      }
    }

    if (minIndex === -1) break;

    finalResult.push(minValue);
    indices[minIndex]++;
  }

  return finalResult;
}
