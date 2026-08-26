<script setup lang="ts">
import ModuleComingSoon from '@/views/shared/ModuleComingSoon.vue'

definePageMeta({
  action: 'read',
  subject: 'Workflow',
})
</script>

<template>
  <ModuleComingSoon
    title="Workflows"
    description="Composition of agents, tools, and policies into executable units of work."
  />
</template>
