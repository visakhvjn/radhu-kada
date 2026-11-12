import { MongoClient, type Db } from 'mongodb'

let client: MongoClient | undefined
let db: Db | undefined

export const COLLECTIONS = {
  expenses: 'expenses',
  payments: 'payments',
  balance: 'balance',
} as const

export async function getClient(): Promise<MongoClient> {
  if (client) return client

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  const next = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    maxIdleTimeMS: 60000,
  })

  try {
    await next.connect()
    client = next
    return client
  } catch (error) {
    await next.close().catch(() => undefined)
    throw error
  }
}

export async function getDb(): Promise<Db> {
  if (db) return db

  const connected = await getClient()
  db = connected.db(process.env.MONGODB_DB_NAME ?? 'radhu')
  return db
}
