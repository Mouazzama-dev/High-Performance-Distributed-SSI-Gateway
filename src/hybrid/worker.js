// worker.js
//
// Entry point for one MPI rank (spawned by hpc_master.py via subprocess).
// This is the inter-process level of the hybrid model — hpc_master.py
// assigns each rank a contiguous slice of the workload.
//
// Within this single OS process, the rank's slice is further divided across
// THREADS_PER_RANK worker_threads (thread_worker.js) — the intra-process
// level, analogous to OpenMP threads inside an MPI rank.
import fs from 'fs';
import { Worker } from 'worker_threads';

const start = parseInt(process.argv[2]);
const end = parseInt(process.argv[3]);
const rank = process.argv[4];
const threadsPerRank = parseInt(process.argv[5] || process.env.THREADS_PER_RANK || '1', 10);

const workload = JSON.parse(fs.readFileSync('workload.json'));
const chunk = workload.slice(start, end);

function splitEvenly(arr, n) {
  const size = Math.ceil(arr.length / n) || 1;
  const parts = [];
  for (let i = 0; i < n; i++) {
    parts.push(arr.slice(i * size, Math.min((i + 1) * size, arr.length)));
  }
  return parts.filter(p => p.length > 0);
}

function runThread(subChunk, threadId) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./thread_worker.js', import.meta.url), {
      workerData: { chunk: subChunk, rank, threadId },
    });
    worker.on('message', (msg) => {
      if (msg.done) resolve(msg);
      else reject(new Error(msg.error));
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Rank ${rank} thread ${threadId} exited with code ${code}`));
    });
  });
}

async function run() {
  const subChunks = splitEvenly(chunk, threadsPerRank);
  console.log(`🚀 Rank ${rank} STARTED — ${chunk.length} items across ${subChunks.length} thread(s)`);

  const results = await Promise.all(subChunks.map((sub, i) => runThread(sub, i)));

  console.log(`🏁 Rank ${rank} DONE — ${results.reduce((s, r) => s + r.count, 0)} items processed`);
}

run().catch(err => {
  console.error(`Rank ${rank} failed:`, err);
  process.exit(1);
});
