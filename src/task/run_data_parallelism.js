import fs from 'fs';
import { agent } from '../../agent.js';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xf58599b4f5d5b15d7158226f7dc3e611ffdd8ff608def33bab39f1add282eff1";
const CONTRACT_ADDRESS = "0x5b23fFb4956E20dC719b4d09c48829871aD244C3";
const ABI = ["function logBatch(string,string,uint8[])"];

const ACTION_MAP = {
  MOVE_UP: 0,
  MOVE_DOWN: 1,
  SWITCH_ON: 2,
  SWITCH_OFF: 3,
  ROTATE: 4,
  CUT: 5
};

const BATCH_SIZE = 50;
const buffers = new Map();
const txPromises = [];

// Send batch to blockchain with retries
async function sendBatchToBlockchain(opDid, devDid, batch) {
  const MAX_RETRIES = 5;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      console.log(`📦 Sending batch (${batch.length}) → ${opDid} | Attempt ${attempt + 1}`);
      const provider = new ethers.JsonRpcProvider(RPC);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

      const tx = await contract.logBatch(opDid, devDid, batch);
      console.log(`⏳ Pending Tx: ${tx.hash}`);
      await tx.wait();

      console.log(`✅ Confirmed Tx (Batch size: ${batch.length})`);
      return;
    } catch (e) {
      attempt++;
      console.error(`❌ TX Failed (${attempt}): ${e.message}`);
      await new Promise(res => setTimeout(res, 2000 * attempt));
    }
  }

  console.error(`💀 FAILED AFTER ${MAX_RETRIES} ATTEMPTS`);
}

function getKey(opDid, devDid) {
  return `${opDid}|||${devDid}`;
}


// Add to batch and track transactions
async function addToBatch(opDid, devDid, action) {
  const key = getKey(opDid, devDid);

  if (!buffers.has(key)) buffers.set(key, []);
  const buffer = buffers.get(key);
  buffer.push(ACTION_MAP[action]);

  console.log(`📊 Buffer ${buffer.length}/${BATCH_SIZE} → ${opDid}`);

  if (buffer.length >= BATCH_SIZE) {
    const txPromise = sendBatchToBlockchain(opDid, devDid, buffer);
    txPromises.push(txPromise); // Track TX
    buffers.set(key, []); // Reset buffer
  }
}

// Main operation logic
export async function runOperation(opAlias, devAlias, action) {
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

  if (!validPermit) return;

  const allowedActions = validPermit.verifiableCredential.credentialSubject.allowedActions || [];
  if (!allowedActions.includes(action)) return;

  fs.appendFileSync(
    'factory_audit.log',
    `[${new Date().toISOString()}] OP: ${opAlias} | DEV: ${devAlias} | ACT: ${action}\n`
  );

  await addToBatch(operator.did, device.did, action);
}

// Wait for all transactions to complete
export async function waitForAllTx() {
  console.log(`⏳ Waiting for ${txPromises.length} TX...`);
  await Promise.all(txPromises);
}