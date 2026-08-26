<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardText class="text-center py-16">
          <VIcon
            icon="tabler-hammer"
            size="48"
            class="mb-4"
            color="primary"
          />
          <h4 class="text-h4 mb-2">
            {{ title }}
          </h4>
          <p
            class="text-body-1 mb-0 mx-auto"
            style="max-inline-size: 40rem;"
          >
            {{ description }}
          </p>
          <VChip
            class="mt-6"
            color="warning"
            variant="tonal"
          >
            In development
          </VChip>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
