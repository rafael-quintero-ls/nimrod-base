<script setup lang="ts">
import type { AgentRuntimeContract } from '@/server/agents/agent-runtime-adapter'

defineProps<{
  agent: AgentRuntimeContract
}>()

const resolveAgentStatusVariant = (status: string) => {
  if (status === 'active')
    return 'success'
  if (status === 'inactive')
    return 'secondary'
  if (status === 'error')
    return 'error'

  return 'primary'
}
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle class="d-flex align-center gap-3">
        {{ agent.name }}
        <VChip
          :color="resolveAgentStatusVariant(agent.status)"
          size="small"
          label
          class="text-capitalize"
        >
          {{ agent.status }}
        </VChip>
      </VCardTitle>
    </VCardItem>

    <VCardText>
      <p class="text-body-1 mb-6">
        {{ agent.description }}
      </p>

      <h6 class="text-h6 mb-3">
        Configuration
      </h6>
      <VList density="compact">
        <VListItem
          v-for="(value, key) in agent.configSummary"
          :key="key"
        >
          <VListItemTitle class="text-capitalize">
            {{ key }}
          </VListItemTitle>
          <template #append>
            <span class="text-body-2">{{ value }}</span>
          </template>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>
