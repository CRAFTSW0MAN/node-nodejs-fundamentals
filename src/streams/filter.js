import { Transform } from "stream";

//Please  if you are on Windows. use this script  "streams:lineNumberer": "(echo hello & echo world) | node src/streams/filter.js --pattern hello"
//Please  if you are on Windows use this in powershell "hello`nworld" | node src/streams/filter.js --pattern hello
const filter = () => {
  let remainderChunk = "";
  const args = process.argv.slice(2);
  const patternIndex = args.indexOf("--pattern");
  const pattern = patternIndex !== -1 ? args[patternIndex + 1] : null;
  if (!pattern) {
    process.exit(1);
  }

  const filterTransform = new Transform({
    transform(chunk, encoding, callback) {
      const textChunk = remainderChunk + chunk.toString();
      const arrChunk = textChunk.split(/\r?\n/);
      remainderChunk = arrChunk.pop();

      const finalarrChunk = arrChunk.filter((line) => line.includes(pattern));
      if (finalarrChunk.length > 0) {
        callback(null, finalarrChunk.join("\n") + "\n");
      } else {
        callback();
      }
    },

    _flush(callback) {
      if (remainderChunk && remainderChunk.includes(pattern)) {
        callback(null, remainderChunk + "\n");
      } else {
        callback();
      }
    },
  });

  process.stdin.pipe(filterTransform).pipe(process.stdout);
};

filter();
