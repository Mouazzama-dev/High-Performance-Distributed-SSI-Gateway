// run_task_parallelism.js
import fs from 'fs';
import { agent } from '../../agent.js';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xf58599b4f5d5b15d7158226f7dc3e611ffdd8ff608def33bab39f1add282eff1";
const CONTRACT_ADDRESS = "0x5b23fFb4956E20dC719b4d09c48829871aD244C3";
const ABI = ["function logBatch(string,string,uint8[])"];

const ACTION_MAP = { MOVE_UP:0, MOVE_DOWN:1, SWITCH_ON:2, SWITCH_OFF:3, ROTATE:4, CUT:5 };
const BATCH_SIZE = 50;
const buffers = new Map();

// ✅ Nonce manager — ek waqt mein ek TX, lekin worker 0 parallel chalta rahe
let nonceLock = Promise.resolve();
let currentNonce = null;

async function getNextNonce(wallet) {
  if (currentNonce === null) {
    currentNonce = await wallet.getNonce('pending');
  } else {
    currentNonce++;
  }
  return currentNonce;
}

export async function sendBatchToBlockchain(opDid, devDid, batch) {
  // Queue mein daalo — ek ke baad ek TX bhejega, conflict nahi hoga
  nonceLock = nonceLock.then(async () => {
    const MAX_RETRIES = 5;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        const provider = new ethers.JsonRpcProvider(RPC);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

        const nonce = await getNextNonce(wallet);
        const feeData = await provider.getFeeData();

        console.log(`📦 Sending batch (${batch.length}) nonce=${nonce} | Attempt ${attempt + 1}`);

        const tx = await contract.logBatch(opDid, devDid, batch, {
          nonce,
          maxFeePerGas: feeData.maxFeePerGas * 12n / 10n,         // 20% buffer
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 12n / 10n,
        });

        console.log(`⏳ Pending Tx: ${tx.hash}`);
        await tx.wait();
        console.log(`✅ Confirmed (batch: ${batch.length}, nonce: ${nonce})`);
        return;

      } catch (e) {
        attempt++;
        console.error(`❌ TX Failed (${attempt}): ${e.message}`);
        if (e.code === 'NONCE_EXPIRED' || e.code === 'REPLACEMENT_UNDERPRICED') {
          // Nonce reset karo
          currentNonce = null;
        }
        await new Promise(res => setTimeout(res, 2000 * attempt));
      }
    }
    console.error(`💀 FAILED AFTER ${MAX_RETRIES} ATTEMPTS`);
  });

  return nonceLock;
}

export async function runOperation(opAlias, devAlias, action, queueFile) {
  const operator = await agent.didManagerGetByAlias({ alias: opAlias });
  const device   = await agent.didManagerGetByAlias({ alias: devAlias });
  const admin    = await agent.didManagerGetByAlias({ alias: 'factory-admin' });

  const vcs = await agent.dataStoreORMGetVerifiableCredentials({
    where: [{ column: 'subject', value: [operator.did] }]
  });

  const validPermit = vcs.find(vc =>
    vc.verifiableCredential.issuer.id === admin.did &&
    vc.verifiableCredential.credentialSubject.authorizedDeviceId === device.did
  );
  if (!validPermit) return;

  const allowedActions = validPermit.verifiableCredential.credentialSubject.allowedActions || [];
  if (!allowedActions.includes(action)) return;

  fs.appendFileSync('factory_audit.log',
    `[${new Date().toISOString()}] OP: ${opAlias} | DEV: ${devAlias} | ACT: ${action}\n`);

  const key = `${operator.did}|||${device.did}`;
  if (!buffers.has(key)) buffers.set(key, []);
  const buffer = buffers.get(key);
  buffer.push(ACTION_MAP[action]);

  console.log(`📊 Buffer ${buffer.length}/${BATCH_SIZE} → ${opAlias}`);

  if (buffer.length >= BATCH_SIZE) {
    const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    queue.push({ ready: true, opDid: operator.did, devDid: device.did, batch: [...buffer] });
    fs.writeFileSync(queueFile, JSON.stringify(queue));
    buffers.set(key, []);
  }
}

// ✅ Yeh export karo — saari pending TX complete hone ka wait karta hai
export async function flushAllTx() {
  await nonceLock;
  console.log(`✅ All TX flushed and confirmed.`);
}