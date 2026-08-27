<script setup lang="ts">
import type { AgentRuntimeContract } from '@/server/agents/agent-runtime-adapter'

defineProps<{
  agents: AgentRuntimeContract[]
  totalAgents: number
  page: number
  itemsPerPage: number
}>()

const emit = defineEmits<{
  'update:page': [value: number]
  'update:itemsPerPage': [value: number]
}>()

const headers = [
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

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
  <VDataTableServer
    :items="agents"
    item-value="id"
    :items-length="totalAgents"
    :headers="headers"
    :page="page"
    :items-per-page="itemsPerPage"
    class="text-no-wrap"
    @update:page="emit('update:page', $event)"
    @update:items-per-page="emit('update:itemsPerPage', $event)"
  >
    <template #item.status="{ item }">
      <VChip
        :color="resolveAgentStatusVariant(item.status)"
        size="small"
        label
        class="text-capitalize"
      >
        {{ item.status }}
      </VChip>
    </template>

    <template #item.actions="{ item }">
      <IconBtn :to="{ name: 'agents-id', params: { id: item.id } }">
        <VIcon icon="tabler-eye" />
      </IconBtn>
    </template>

    <template #no-data>
      <div class="text-center py-8">
        <VIcon
          icon="tabler-robot-off"
          size="40"
          class="mb-2"
        />
        <p class="text-body-1 mb-0">
          No agents registered yet.
        </p>
      </div>
    </template>

    <template #bottom>
      <TablePagination
        :page="page"
        :items-per-page="itemsPerPage"
        :total-items="totalAgents"
        @update:page="emit('update:page', $event)"
      />
    </template>
  </VDataTableServer>
</template>
