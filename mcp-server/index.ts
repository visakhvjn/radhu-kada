import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createRadhuMcpServer } from '../src/mcp/createServer'
import { getDb } from '../src/db/client'
import { ensureIndexes } from '../src/db/indexes'
import { loadEnvFromRepoRoot } from './env'

loadEnvFromRepoRoot()

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error(
      'Missing MONGODB_URI. Set it in the MCP env, or in .env / .env.local at the repo root.',
    )
    process.exit(1)
  }

  await getDb()
  await ensureIndexes()

  const server = createRadhuMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error('MCP stdio server failed:', error)
  process.exit(1)
})
