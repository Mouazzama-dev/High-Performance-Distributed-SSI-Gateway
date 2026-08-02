// thread_worker.js
//
// Intra-process parallelism level of the hybrid model.
// One OS process (an MPI rank, launched by hpc_master.py) spawns several of
// these worker_threads to further split its chunk of the workload across
// CPU cores — this is the Node.js analogue of OpenMP threads under an MPI
// rank. MPI (hpc_master.py) = inter-process/inter-node parallelism.
// worker_threads (this file) = intra-process parallelism.
import { parentPort, workerData } from 'worker_threads';
import { runOperation, waitForAllTx } from './run_sequential.js';

const { chunk, rank, threadId } = workerData;

async function run() {
  for (const op of chunk) {
    await runOperation(op.opAlias, op.devAlias, op.action);
  }
  await waitForAllTx();
  parentPort.postMessage({ rank, threadId, done: true, count: chunk.length });
}

run().catch(err => {
  parentPort.postMessage({ rank, threadId, done: false, error: err.message });
  process.exit(1);
});
