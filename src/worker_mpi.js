//take instructions from hpc_master.py and run the worker code in parallel using MPI
import { agent } from '../agent.js';
import fs from 'fs';

// Get start and end index from command line arguments
const startIdx = parseInt(process.argv[2]);
const endIdx = parseInt(process.argv[3]);
const rank = process.argv[4];

async function runWorker() {
    const filePath = 'credentials.json';
    const credentials = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Slice the workload for this specific worker
    const myBatch = credentials.slice(startIdx, endIdx);
    
    console.log(`Worker ${rank}: Verifying ${myBatch.length} credentials...`);

    // --- TASK PARALLELISM START ---
    // Ek saath 50 credentials verify karo (Batching)
    const BATCH_SIZE = 50; 
    for (let i = 0; i < myBatch.length; i += BATCH_SIZE) {
        const batch = myBatch.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(vc => 
            agent.verifyCredential({ credential: vc }).catch(e => {})
        ));
    }
    // --- TASK PARALLELISM END ---

    process.exit(0);
}

runWorker();