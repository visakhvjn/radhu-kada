import { Hono } from 'hono'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { AppBindings } from '../types/hono'
import { createRadhuMcpServer } from '../mcp/createServer'

export const mcpRoutes = new Hono<AppBindings>()

mcpRoutes.all('/', async (c) => {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  const server = createRadhuMcpServer()
  await server.connect(transport)

  try {
    return await transport.handleRequest(c.req.raw)
  } finally {
    await transport.close()
    await server.close()
  }
})
