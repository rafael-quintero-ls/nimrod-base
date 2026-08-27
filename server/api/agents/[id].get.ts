import { agentRuntimeAdapter } from '@/server/agents/agent-runtime-adapter'

export default defineEventHandler(async event => {
  await requireUserSession(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Agent id is required',
    })
  }

  const config = useRuntimeConfig()
  const adapter = agentRuntimeAdapter({ agentRuntimeUrl: config.agentRuntimeUrl })

  const agent = await adapter.findAgentById(id)

  if (!agent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Agent not found',
    })
  }

  setResponseStatus(event, 200)

  return agent
})
