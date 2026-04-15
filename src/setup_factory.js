import { agent } from '../agent.js';

const PERMISSIONS = [
  {
    operatorAlias: 'operator-marco',
    deviceAlias: 'welding-robot-09',
    allowedActions: ['SWITCH_ON', 'SWITCH_OFF', 'MOVE_UP', 'MOVE_DOWN']
  },
  {
    operatorAlias: 'operator-elena',
    deviceAlias: 'cnc-lathe-01',
    allowedActions: ['SWITCH_ON', 'SWITCH_OFF', 'ROTATE', 'CUT']
  }
];

async function getOrCreateAlias(alias) {
  try {
    return await agent.didManagerGetByAlias({ alias });
  } catch {
    return await agent.didManagerCreate({
      provider: 'did:key',
      alias
    });
  }
}

async function setupFactory() {
  const admin = await getOrCreateAlias('factory-admin');
  console.log('Admin:', admin.did);

  for (const p of PERMISSIONS) {
    const operator = await getOrCreateAlias(p.operatorAlias);
    const device = await getOrCreateAlias(p.deviceAlias);

    console.log(`Operator: ${p.operatorAlias} -> ${operator.did}`);
    console.log(`Device: ${p.deviceAlias} -> ${device.did}`);

    const vc = await agent.createVerifiableCredential({
      credential: {
        issuer: { id: admin.did },
        type: ['VerifiableCredential', 'FactoryPermit'],
        credentialSubject: {
          id: operator.did,
          authorizedDeviceId: device.did,
          allowedActions: p.allowedActions
        }
      },
      proofFormat: 'jwt'
    });

    await agent.dataStoreSaveVerifiableCredential({ verifiableCredential: vc });
    console.log(`Permit issued: ${p.operatorAlias} -> ${p.deviceAlias}`);
  }

  console.log('Factory setup complete.');
}

setupFactory();