// main_hybrid_pipeline.js
//
// Combined Data + Task Parallelism ("fan-in pipeline"):
//   Data parallelism : the workload is split into NUM_OP_WORKERS chunks,
//                       each validated concurrently by its own
//                       worker_operation.js process (Stage 1, replicated
//                       N times — same task, different data).
//   Task parallelism : all Stage-1 workers feed a single shared
//                       worker_tx.js process (Stage 2, a different task)
//                       that serializes blockchain TX submission.
//
// N producers -> 1 consumer, wired over Node IPC by this parent process
// (which relays "batch" messages from every Stage-1 worker to the shared
// Stage-2 worker, and only forwards "done" once ALL producers have
// finished). Compare with main_task.js, which runs a single Stage-1/Stage-2
// pair (task parallelism only, no data split).
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workloadFilePath = path.join(__dirname, 'workload.json');
const NUM_OP_WORKERS = parseInt(process.env.NUM_OP_WORKERS || '2', 10);

const workload = JSON.parse(fs.readFileSync(workloadFilePath, 'utf8'));
const chunkSize = Math.ceil(workload.length / NUM_OP_WORKERS);

const startTime = Date.now();

const workerTx = spawn('node', ['worker_tx.js'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
workerTx.stdout.on('data', d => console.log(`[Blockchain TX]: ${d}`));
workerTx.stderr.on('data', d => console.error(`[Blockchain TX] Error: ${d}`));

const chunkFiles = [];
const opWorkers = [];
let doneCount = 0;

for (let i = 0; i < NUM_OP_WORKERS; i++) {
  const start = i * chunkSize;
  const end = Math.min(start + chunkSize, workload.length);
  const chunkFile = path.join(__dirname, `.chunk_${i}.json`);
  fs.writeFileSync(chunkFile, JSON.stringify(workload.slice(start, end)));
  chunkFiles.push(chunkFile);

  const worker = spawn('node', ['worker_operation.js', chunkFile], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
  worker.stdout.on('data', d => console.log(`[Operations #${i}]: ${d}`));
  worker.stderr.on('data', d => console.error(`[Operations #${i}] Error: ${d}`));

  worker.on('message', (msg) => {
    if (msg.type === 'batch') {
      workerTx.send(msg);
    } else if (msg.type === 'done') {
      doneCount++;
      if (doneCount === NUM_OP_WORKERS) workerTx.send({ type: 'done' });
    }
  });

  opWorkers.push(worker);
}

[...opWorkers, workerTx].forEach((w, i) => {
  w.on('close', code => console.log(`Worker ${i} finished (exit ${code})`));
});

Promise.all([...opWorkers, workerTx].map(w =>
  new Promise((res, rej) => { w.on('close', res); w.on('error', rej); })
)).then(() => {
  for (const f of chunkFiles) fs.rmSync(f, { force: true });

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n✅ All tasks done (Data + Task Parallelism, ${NUM_OP_WORKERS} op-worker(s) -> 1 tx-worker)`);
  console.log(`⏱️  Total Duration: ${duration.toFixed(2)} seconds`);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
