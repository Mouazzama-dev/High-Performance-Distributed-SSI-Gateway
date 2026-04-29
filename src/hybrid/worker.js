import fs from 'fs';
import { runOperation, waitForAllTx } from './run_sequential.js';

const start = parseInt(process.argv[2]);
const end = parseInt(process.argv[3]);
const rank = process.argv[4];

const workload = JSON.parse(fs.readFileSync('workload.json'));
const chunk = workload.slice(start, end);

async function run() {
  console.log(`🚀 Worker ${rank} STARTED`);

  for (let op of chunk) {
    await runOperation(op.opAlias, op.devAlias, op.action);
  }

  console.log(`⏳ Worker ${rank} waiting for TX...`);

  await waitForAllTx();

  console.log(`🏁 Worker ${rank} DONE`);
}

run();