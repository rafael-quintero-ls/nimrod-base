/**
 * Provider-agnostic Agent Runtime Contract and adapter, following the same isolation pattern as
 * `server/auth/identity-backend-adapter.ts`: one file owns the concrete backend shape, nothing
 * outside it may reference that backend directly (see AGENTS.md's "identity backend is not
 * exposed through the public interface" rule, applied here to the agent data source).
 *
 * Named `AgentRuntimeContract` to align with the HADES primitive mapping recorded in
 * `openspec/specs/hades-vocabulary-mapping/spec.md` (Agents module -> Actor / Agent Runtime).
 *
 * Until `NUXT_AGENT_RUNTIME_URL` is set, this adapter serves a small in-memory fixture,
 * explicitly non-production placeholder data (never presented in the UI as live data — see
 * `openspec/changes/agents-catalog/design.md`). When the env var is set, every call proxies to
 * that URL instead.
 */

export type AgentStatus = 'active' | 'inactive' | 'error'

export interface AgentRuntimeContract {
  id: string
  name: string
  status: AgentStatus
  description: string
  configSummary: Record<string, string>
}

interface AgentRuntimeAdapterConfig {
  agentRuntimeUrl?: string
}

export interface ListAgentsParams {
  q?: string
  page: number
  itemsPerPage: number
}

export interface ListAgentsResult {
  agents: AgentRuntimeContract[]
  totalAgents: number
}

// ℹ️ In-memory fixture, non-production placeholder data — mirrors
// `identity-backend-adapter.ts`'s demo-mode pattern. Not persisted across server restarts.
const FIXTURE_AGENTS: AgentRuntimeContract[] = [
  {
    id: 'agent-triage',
    name: 'Triage Agent',
    status: 'active',
    description: 'Classifies and routes incoming support tickets to the correct queue.',
    configSummary: {
      model: 'gpt-4o-mini',
      maxConcurrency: '5',
    },
  },
  {
    id: 'agent-summarizer',
    name: 'Summarizer Agent',
    status: 'inactive',
    description: 'Generates end-of-day summaries from ticket activity. Currently disabled.',
    configSummary: {
      model: 'claude-haiku',
      schedule: 'disabled',
    },
  },
  {
    id: 'agent-escalation',
    name: 'Escalation Agent',
    status: 'error',
    description: 'Detects tickets needing human escalation and notifies the on-call channel.',
    configSummary: {
      model: 'gpt-4o-mini',
      lastError: 'notification webhook unreachable',
    },
  },
]

export const agentRuntimeAdapter = (config: AgentRuntimeAdapterConfig = {}) => {
  const agentRuntimeUrl = config.agentRuntimeUrl

  // ℹ️ Closes over `agentRuntimeUrl` rather than taking it as a parameter — mirrors
  // `identity-backend-adapter.ts`'s `proxyToIdentityBackend` closure shape, avoiding an
  // arity mismatch between this function's signature and its call sites.
  async function proxyToAgentRuntime<T>(operation: string, payload: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${agentRuntimeUrl}/adapter/agents/${operation}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok)
      throw new Error(`Agent runtime request failed: ${operation}`)

    return response.json() as Promise<T>
  }

  return {
    async listAgents({ q, page, itemsPerPage }: ListAgentsParams): Promise<ListAgentsResult> {
      if (agentRuntimeUrl)
        return proxyToAgentRuntime('listAgents', { q, page, itemsPerPage })

      const query = (q ?? '').toLowerCase()
      const filtered = FIXTURE_AGENTS.filter(agent => agent.name.toLowerCase().includes(query))
      const start = (page - 1) * itemsPerPage

      return {
        agents: filtered.slice(start, start + itemsPerPage),
        totalAgents: filtered.length,
      }
    },
    async findAgentById(id: string): Promise<AgentRuntimeContract | null> {
      if (agentRuntimeUrl)
        return proxyToAgentRuntime('findAgentById', { id })

      return FIXTURE_AGENTS.find(agent => agent.id === id) ?? null
    },
  }
}
