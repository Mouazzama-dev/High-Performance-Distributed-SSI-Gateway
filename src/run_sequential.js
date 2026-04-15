import fs from 'fs';
import { agent } from '../agent.js';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xf58599b4f5d5b15d7158226f7dc3e611ffdd8ff608def33bab39f1add282eff1";
const CONTRACT_ADDRESS = "0x5b23fFb4956E20dC719b4d09c48829871aD244C3";
const ABI = ["function logBatch(string,string,uint8[])"];

// 🔹 Action Mapping
const ACTION_MAP = {
  MOVE_UP: 0,
  MOVE_DOWN: 1,
  SWITCH_ON: 2,
  SWITCH_OFF: 3,
  ROTATE: 4,
  CUT: 5
};

// 🔥 Batch size (recommended)
const BATCH_SIZE = 50;

// 🔥 Multi-buffer (per operator-device)
const buffers = new Map();

// 🔹 Blockchain Sender
async function sendBatchToBlockchain(opDid, devDid, batch) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    console.log(`📦 Sending batch (${batch.length}) → ${opDid}`);

    const tx = await contract.logBatch(opDid, devDid, batch);
    console.log(`⏳ Pending Tx: ${tx.hash}`);

    await tx.wait();

    console.log(`✅ Confirmed Tx (Batch size: ${batch.length})`);
  } catch (e) {
    console.error('❌ BC Fail:', e.message);
  }
}

// 🔹 Unique key
function getKey(opDid, devDid) {
  return `${opDid}|||${devDid}`;
}

// 🔥 Add to batch (CORRECT LOGIC)
async function addToBatch(opDid, devDid, action) {
  const key = getKey(opDid, devDid);

  if (!buffers.has(key)) {
    buffers.set(key, []);
  }

  const buffer = buffers.get(key);
  buffer.push(ACTION_MAP[action]);

  // DEBUG
  console.log(`📊 Buffer ${buffer.length}/${BATCH_SIZE} → ${opDid}`);

  if (buffer.length >= BATCH_SIZE) {
    await sendBatchToBlockchain(opDid, devDid, buffer);
    buffers.set(key, []);
  }
}

// 🔹 Main Operation
async function runOperation(opAlias, devAlias, action) {
  const operator = await agent.didManagerGetByAlias({ alias: opAlias });
  const device = await agent.didManagerGetByAlias({ alias: devAlias });
  const admin = await agent.didManagerGetByAlias({ alias: 'factory-admin' });

  const vcs = await agent.dataStoreORMGetVerifiableCredentials({
    where: [{ column: 'subject', value: [operator.did] }]
  });

  const validPermit = vcs.find(vc =>
    vc.verifiableCredential.issuer.id === admin.did &&
    vc.verifiableCredential.credentialSubject.authorizedDeviceId === device.did
  );

  if (!validPermit) {
    fs.appendFileSync(
      'security_violations.log',
      `[${new Date().toISOString()}] DENIED: ${opAlias} unauthorized for ${devAlias}\n`
    );
    return;
  }

  const allowedActions =
    validPermit.verifiableCredential.credentialSubject.allowedActions || [];

  if (!allowedActions.includes(action)) {
    fs.appendFileSync(
      'security_violations.log',
      `[${new Date().toISOString()}] INVALID_ACTION: ${opAlias} tried ${action} on ${devAlias}\n`
    );
    return;
  }

  // 🔹 Local log
  fs.appendFileSync(
    'factory_audit.log',
    `[${new Date().toISOString()}] OP: ${opAlias} | DEV: ${devAlias} | ACT: ${action}\n`
  );

  // 🔥 Correct batching
  await addToBatch(operator.did, device.did, action);
}

// 🔹 Main Runner
async function runSequentialFull() {
  const workload = JSON.parse(fs.readFileSync('workload.json', 'utf8'));

  console.log(`🚀 Starting sequential pipeline for ${workload.length} operations...\n`);

  const start = Date.now();

  for (let i = 0; i < workload.length; i++) {
    const { opAlias, devAlias, action } = workload[i];
    await runOperation(opAlias, devAlias, action);

    if ((i + 1) % 100 === 0) {
      console.log(`Processed ${i + 1}/${workload.length}`);
    }
  }

  // 🔥 FINAL FLUSH (VERY IMPORTANT)
  console.log("\n🧹 Flushing remaining buffers...\n");

  for (const [key, buffer] of buffers.entries()) {
    if (buffer.length > 0) {
      const [opDid, devDid] = key.split("|||");

      console.log(`🧹 Flushing ${buffer.length} → ${opDid}`);

      await sendBatchToBlockchain(opDid, devDid, buffer);
    }
  }

  const end = Date.now();

  console.log('\n========================================');
  console.log(`Total Time: ${(end - start) / 1000} seconds`);
  console.log('========================================\n');
}

runSequentialFull();