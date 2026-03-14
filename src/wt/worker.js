import { parentPort } from 'worker_threads';

parentPort.on('message', (data) => {
 const sortedArr = data.sort((a, b) => a - b);
 parentPort.postMessage(sortedArr);
});
