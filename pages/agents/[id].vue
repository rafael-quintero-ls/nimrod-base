<script setup lang="ts">
import AgentDetailCard from '@/views/agents/view/AgentDetailCard.vue'

definePageMeta({
  action: 'read',
  subject: 'Agent',
})

const route = useRoute('agents-id')

const { data: agent, error } = await useApi<any>(`/agents/${route.params.id}`)
</script>

<template>
  <AgentDetailCard
    v-if="agent"
    :agent="agent"
  />
  <VAlert
    v-else-if="error"
    type="error"
    variant="tonal"
  >
    Agent with ID {{ route.params.id }} not found.
  </VAlert>
</template>
