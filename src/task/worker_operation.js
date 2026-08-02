// worker_operation.js — Pipeline Stage 1 (Task Parallelism): validates
// operations and builds TX batches. Ready batches are pushed to the parent
// process over the Node IPC channel (process.send) instead of a shared
// polled file — the parent relays them on to worker_tx.js (Stage 2).
import fs from 'fs';
import { runOperation } from './run_task_parallelism.js';

const workloadFile = process.argv[2];

const workload = JSON.parse(fs.readFileSync(workloadFile, 'utf8'));
const startTime = Date.now();

console.log(`🚀 Operation Worker STARTED — ${workload.length} items`);

async function run() {
  for (const op of workload) {
    await runOperation(op.opAlias, op.devAlias, op.action);
  }

  // Signal Stage 2 that this producer is finished.
  process.send({ type: 'done' });

  const duration = (Date.now() - startTime) / 1000;
  console.log(`🏁 Operation Worker DONE — ${duration.toFixed(2)}s`);
}

run().catch(err => { console.error(err); process.exit(1); });
