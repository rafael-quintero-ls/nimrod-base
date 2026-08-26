<script setup lang="ts">
import ModuleComingSoon from '@/views/shared/ModuleComingSoon.vue'

definePageMeta({
  action: 'read',
  subject: 'Tool',
})
</script>

<template>
  <ModuleComingSoon
    title="Tools"
    description="Catalog of tools available to agents, with per-agent access scopes."
  />
</template>
