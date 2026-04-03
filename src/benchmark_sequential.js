import { agent } from '../agent.js'; // Note the '../' to reach agent.js outside src
import fs from 'fs';

async function runSequential() {
    // Check path WITHOUT 'src/' because you are running from inside 'src'
    const filePath = 'credentials.json'; 

    if (!fs.existsSync(filePath)) {
        console.error(`❌ ${filePath} nahi mili!`);
        return;
    }

    const credentials = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📊 Starting Sequential Verification of ${credentials.length} 'did:key' credentials...`);

    const start = Date.now();

    for (let i = 0; i < credentials.length; i++) {
        try {
            await agent.verifyCredential({ credential: credentials[i] });
            if ((i + 1) % 20 === 0) console.log(`✅ Verified ${i + 1}/${credentials.length}`);
        } catch (error) {
            console.error(`❌ Error at index ${i}:`, error.message);
        }
    }

    const end = Date.now();
    const totalTime = (end - start) / 1000;
    
    console.log('\n--- PERFORMANCE REPORT (Sequential) ---');
    console.log(`Total Time: ${totalTime} seconds`);
    console.log(`Avg Time/VC: ${totalTime / credentials.length}s`);
    console.log('---------------------------------------');
}

runSequential();