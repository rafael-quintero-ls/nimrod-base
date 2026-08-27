import is from '@sindresorhus/is'
import { destr } from 'destr'
import { agentRuntimeAdapter } from '@/server/agents/agent-runtime-adapter'

export default defineEventHandler(async event => {
  await requireUserSession(event)

  const { q = '', itemsPerPage = 10, page = 1 } = getQuery(event)

  const searchQuery = is.string(q) ? q : undefined

  const parsedItemsPerPage = destr(itemsPerPage)
  const parsedPage = destr(page)

  const itemsPerPageLocal = is.number(parsedItemsPerPage) ? parsedItemsPerPage : 10
  const pageLocal = is.number(parsedPage) ? parsedPage : 1

  const config = useRuntimeConfig()
  const adapter = agentRuntimeAdapter({ agentRuntimeUrl: config.agentRuntimeUrl })

  const { agents, totalAgents } = await adapter.listAgents({
    q: searchQuery,
    page: pageLocal,
    itemsPerPage: itemsPerPageLocal,
  })

  setResponseStatus(event, 200)

  return { agents, totalAgents, page: pageLocal }
})
