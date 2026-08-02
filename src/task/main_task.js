// main_task.js
//
// Task Parallelism: two different tasks running concurrently on two
// processors, wired together as a 2-stage pipeline:
//   Stage 1 (worker_operation.js) — validates VCs, builds batch queue
//   Stage 2 (worker_tx.js)        — drains ready batches, sends blockchain TX
//
// This process acts only as the IPC relay between the two stages (Node
// child processes can't message each other directly, so the parent
// forwards "batch"/"done" messages from Stage 1 to Stage 2). See
// main_hybrid_pipeline.js for the combined Data + Task Parallelism variant
// (multiple Stage-1 workers feeding one shared Stage-2 worker).
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workloadFilePath = path.join(__dirname, 'workload.json');

console.log(`Loading workload from: ${workloadFilePath}`);
if (!fs.existsSync(workloadFilePath)) {
  throw new Error(`Workload file not found: ${workloadFilePath}`);
}

const startTime = Date.now();

const workerOp = spawn('node', ['worker_operation.js', workloadFilePath], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
const workerTx = spawn('node', ['worker_tx.js'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });

workerOp.stdout.on('data', d => console.log(`Worker 0 [Operations]: ${d}`));
workerOp.stderr.on('data', d => console.error(`Worker 0 Error: ${d}`));
workerTx.stdout.on('data', d => console.log(`Worker 1 [Blockchain TX]: ${d}`));
workerTx.stderr.on('data', d => console.error(`Worker 1 Error: ${d}`));

// Relay Stage 1's messages straight through to Stage 2.
workerOp.on('message', (msg) => workerTx.send(msg));

[workerOp, workerTx].forEach((w, i) => {
  w.on('close', code => console.log(`Worker ${i} finished (exit ${code})`));
});

Promise.all([workerOp, workerTx].map(w =>
  new Promise((res, rej) => { w.on('close', res); w.on('error', rej); })
)).then(() => {
  const duration = (Date.now() - startTime) / 1000;
  console.log('\n✅ All tasks done (Task Parallelism / Pipeline)');
  console.log(`⏱️  Total Duration: ${duration.toFixed(2)} seconds`);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
