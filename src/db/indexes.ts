import { COLLECTIONS, getDb } from './client'

export async function ensureIndexes(): Promise<void> {
  const database = await getDb()

  await Promise.all([
    database.collection(COLLECTIONS.expenses).createIndex({ id: 1 }, { unique: true }),
    database.collection(COLLECTIONS.expenses).createIndex({ date: 1 }),
    database.collection(COLLECTIONS.payments).createIndex({ id: 1 }, { unique: true }),
    database.collection(COLLECTIONS.payments).createIndex({ date: 1 }),
  ])
}
