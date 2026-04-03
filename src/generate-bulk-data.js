import { agent } from '../agent.js'   // your updated did:key agent
import fs from 'fs'

const TOTAL_CREDENTIALS = 10000

async function generateWorkload() {
  console.log('🚀 Generating workload...\n')

  // 1️⃣ Create Issuer DID
  const issuer = await agent.didManagerCreate()
  console.log('Issuer:', issuer.did)

  const credentials = []

  // 2️⃣ Generate credentials
  for (let i = 0; i < TOTAL_CREDENTIALS; i++) {

    // create subject DID
    const subject = await agent.didManagerCreate()

    const vc = await agent.createVerifiableCredential({
      credential: {
        issuer: { id: issuer.did },
        credentialSubject: {
          id: subject.did,
          name: `User-${i}`,
          score: Math.floor(Math.random() * 100),
        },
      },
      proofFormat: 'jwt',
    })

    credentials.push(vc)

    if (i % 10 === 0) {
      console.log(`✅ Generated ${i} credentials`)
    }
  }

  // 3️⃣ Save to file
  fs.writeFileSync(
    'credentials.json',
    JSON.stringify(credentials, null, 2)
  )

  console.log('\n🎉 Done! 10000 credentials generated.')
}

generateWorkload()