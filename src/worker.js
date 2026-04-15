import fs from 'fs';
import { runOperation } from './run_sequential.js';

const start = parseInt(process.argv[2]);
const end = parseInt(process.argv[3]);
const rank = process.argv[4];

const workload = JSON.parse(fs.readFileSync('workload.json'));
const chunk = workload.slice(start, end);

async function run() {
  for (let op of chunk) {
    await runOperation(op.opAlias, op.devAlias, op.action);
  }
  console.log(`Worker ${rank} done`);
}

run();