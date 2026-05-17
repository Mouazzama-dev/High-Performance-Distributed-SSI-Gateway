// worker_operation.js — Task: Validate operations + build TX batches
import fs from 'fs';
import { runOperation } from './run_task_parallelism.js';


const workloadFile = process.argv[2];
const queueFile = process.argv[3];

const workload = JSON.parse(fs.readFileSync(workloadFile, 'utf8'));
const startTime = Date.now();

console.log(`🚀 Operation Worker STARTED — ${workload.length} items`);

async function run() {
  for (const op of workload) {
    await runOperation(op.opAlias, op.devAlias, op.action, queueFile);
  }

  // Signal TX worker that we're done by writing a sentinel
  const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
  queue.push({ done: true }); // sentinel
  fs.writeFileSync(queueFile, JSON.stringify(queue));

  const duration = (Date.now() - startTime) / 1000;
  console.log(`🏁 Operation Worker DONE — ${duration.toFixed(2)}s`);
}

run().catch(err => { console.error(err); process.exit(1); });