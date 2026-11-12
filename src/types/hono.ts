import type { Db } from 'mongodb'

export type AppBindings = {
  Variables: {
    db: Db
  }
}
