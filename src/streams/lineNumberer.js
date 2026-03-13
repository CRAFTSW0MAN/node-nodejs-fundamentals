import { Transform } from "stream";
//Please  if you are on Windows. use this script  "streams:lineNumberer": "(echo hello & echo world) | node src/streams/lineNumberer.js"
//Please  if you are on Windows use this in powershell "hello`nworld" | node src/streams/LineNumberer.js

const lineNumberer = () => {
  let remainderChunk = "";
  let lineNumber = 1; 

  const lineNumbererTransform = new Transform({
    transform(chunk, encoding, callback) {
      const textChunk = remainderChunk + chunk.toString();
      const arrChunk = textChunk.split(/\r?\n/);

      remainderChunk = arrChunk.pop();

      const finalarrChunk = [];
      arrChunk.forEach((element) => {
        const strChunk = `${lineNumber++} | ${element}`;
        finalarrChunk.push(strChunk);
      });

      if (finalarrChunk.length > 0) {
        callback(null, finalarrChunk.join('\n') + '\n');
      } else {
        callback();
      }
    },

    flush(callback) {
      if (remainderChunk.length > 0) {
        callback(null, `${lineNumber++} | ${remainderChunk}\n`);
      } else {
        callback();
      }
    }
  });

  process.stdin.pipe(lineNumbererTransform).pipe(process.stdout);
};

lineNumberer();