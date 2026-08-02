// worker_tx.js — Pipeline Stage 2 (Task Parallelism): consumes ready
// batches pushed over the Node IPC channel and sends them to the
// blockchain. Replaces the old file-polling design (no more reading/
// rewriting a shared tx_queue.json on a 500ms timer).
import { sendBatchToBlockchain, flushAllTx } from './run_task_parallelism.js';

const startTime = Date.now();
console.log('🚀 TX Worker STARTED — waiting for batches over IPC');

// Track how many upstream Stage-1 producers we still need a "done" from.
// main_task.js has exactly one; main_hybrid_pipeline.js may have several
// and only sends "done" once every producer has finished (see that file).
process.on('message', async (msg) => {
  if (msg.type === 'batch') {
    sendBatchToBlockchain(msg.opDid, msg.devDid, msg.batch); // queued internally by the nonce lock
  } else if (msg.type === 'done') {
    console.log('🔒 Done signal received — waiting for all TX to confirm...');
    await flushAllTx();
    const duration = (Date.now() - startTime) / 1000;
    console.log(`🏁 TX Worker DONE — ${duration.toFixed(2)}s`);
    process.exit(0);
  }
});
