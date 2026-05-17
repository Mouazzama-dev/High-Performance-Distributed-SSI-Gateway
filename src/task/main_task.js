// main_task.js
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const __dirname = decodeURIComponent(path.dirname(new URL(import.meta.url).pathname));
const workloadFilePath = path.join(__dirname, 'workload.json');

console.log(`Loading workload from: ${workloadFilePath}`);
const workload = JSON.parse(fs.readFileSync(workloadFilePath, 'utf8'));

const startTime = Date.now();

// Task Parallelism: 2 processors, 2 different tasks
// Worker 0 (Processor 0): Validate VCs + build batch queue → writes to a shared queue file
// Worker 1 (Processor 1): Reads from that queue → sends blockchain TX

// We pass the full workload to worker_operation (it does validation/batching)
// worker_tx runs concurrently and drains the TX queue

const queueFile = path.join(__dirname, 'tx_queue.json');
fs.writeFileSync(queueFile, JSON.stringify([])); // Initialize empty queue

const workerOp = spawn('node', ['worker_operation.js', workloadFilePath, queueFile]);
const workerTx = spawn('node', ['worker_tx.js', queueFile]);

[workerOp, workerTx].forEach((w, i) => {
  w.stdout.on('data', d => console.log(`Worker ${i} [${i===0?'Operations':'Blockchain TX'}]: ${d}`));
  w.stderr.on('data', d => console.error(`Worker ${i} Error: ${d}`));
  w.on('close', code => console.log(`Worker ${i} finished (exit ${code})`));
});

Promise.all([workerOp, workerTx].map(w =>
  new Promise((res, rej) => { w.on('close', res); w.on('error', rej); })
)).then(() => {
  const duration = (Date.now() - startTime) / 1000;
  console.log('\n✅ All tasks done (Task Parallelism)');
  console.log(`⏱️  Total Duration: ${duration.toFixed(2)} seconds`);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});