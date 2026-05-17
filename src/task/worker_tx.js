// worker_tx.js
import fs from 'fs';
import { sendBatchToBlockchain, flushAllTx } from './run_task_parallelism.js';

const queueFile = process.argv[2];
const startTime = Date.now();
const POLL_INTERVAL = 500;

console.log(`🚀 TX Worker STARTED — polling ${queueFile}`);

async function drainQueue() {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      let queue;
      try {
        queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
      } catch { return; }

      const pending = [];
      const remaining = [];
      let sentinelFound = false;

      for (const item of queue) {
        if (item.done) {
          sentinelFound = true;
        } else if (item.ready) {
          pending.push(item);
        } else {
          remaining.push(item);
        }
      }

      // Write back only unprocessed items
      fs.writeFileSync(queueFile, JSON.stringify(remaining));

      // Queue new batches into nonceLock chain (no await — chain handle karta hai)
      for (const p of pending) {
        sendBatchToBlockchain(p.opDid, p.devDid, p.batch);
      }

      if (sentinelFound) {
        clearInterval(interval);

        // ✅ Ab saari TX complete hone ka wait karo
        console.log(`🔒 Sentinel received — waiting for all TX to confirm...`);
        await flushAllTx();

        resolve();
      }
    }, POLL_INTERVAL);
  });
}

drainQueue().then(() => {
  const duration = (Date.now() - startTime) / 1000;
  console.log(`🏁 TX Worker DONE — ${duration.toFixed(2)}s`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});