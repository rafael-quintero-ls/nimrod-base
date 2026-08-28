<script setup lang="ts">
import AgentsListTable from '@/views/agents/list/AgentsListTable.vue'

definePageMeta({
  action: 'read',
  subject: 'Agent',
})

const searchQuery = ref('')
const itemsPerPage = ref(10)
const page = ref(1)

const { data: agentsData } = await useApi<any>(createUrl('/agents', {
  query: {
    q: searchQuery,
    itemsPerPage,
    page,
  },
}))

const agents = computed(() => agentsData.value?.agents ?? [])
const totalAgents = computed(() => agentsData.value?.totalAgents ?? 0)
</script>

<template>
  <VCard title="Agents">
    <VCardText>
      <VTextField
        v-model="searchQuery"
        placeholder="Search agents"
        density="compact"
        prepend-inner-icon="tabler-search"
        style="max-inline-size: 20rem;"
      />
    </VCardText>

    <VDivider />

    <AgentsListTable
      :agents="agents"
      :total-agents="totalAgents"
      :page="page"
      :items-per-page="itemsPerPage"
      @update:page="page = $event"
      @update:items-per-page="itemsPerPage = $event"
    />
  </VCard>
</template>
