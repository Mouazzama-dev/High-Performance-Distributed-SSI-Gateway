import 'reflect-metadata'

import { createAgent } from '@veramo/core'
import { DIDManager } from '@veramo/did-manager'
import { KeyDIDProvider } from '@veramo/did-provider-key'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { CredentialProviderJWT } from '@veramo/credential-jwt'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getResolver as keyDidResolver } from 'key-did-resolver'

import {
  Entities,
  KeyStore,
  DIDStore,
  PrivateKeyStore,
  migrations,
} from '@veramo/data-store'

import { DataSource } from 'typeorm'
import { DataStore, DataStoreORM } from '@veramo/data-store'

/***************************************
 * CONFIGURATION
 ***************************************/
const DATABASE_FILE = 'database.sqlite'

const KMS_SECRET_KEY =
  'de1e045d46d2a99bff4fd8a7c3f11ca4e3c65e57603e15c499a26c5b1ea5929b'

/***************************************
 * DATABASE INITIALIZATION
 ***************************************/
const dbConnection = await new DataSource({
  type: 'sqlite',
  database: DATABASE_FILE,
  synchronize: false,
  migrations,
  migrationsRun: true,
  logging: false,
  entities: Entities,
}).initialize()

/***************************************
 * VERAMO AGENT
 ***************************************/
export const agent = createAgent({
  plugins: [
    new KeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        local: new KeyManagementSystem(
          new PrivateKeyStore(
            dbConnection,
            new SecretBox(KMS_SECRET_KEY)
          )
        ),
      },
    }),

    // ✅ DID:key instead of did:ethr
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: 'did:key',
      providers: {
        'did:key': new KeyDIDProvider({
          defaultKms: 'local',
        }),
      },
    }),

    new DataStore(dbConnection),
    new DataStoreORM(dbConnection),

    // ✅ Resolver for did:key
    new DIDResolverPlugin({
      ...keyDidResolver(),
    }),

    new CredentialPlugin({
      credentialProviders: [new CredentialProviderJWT()],
    }),
  ],
})