<template>
  <VRow>
    <!-- 👉 textfield  -->

    <!-- 👉 textfield variants  -->
    <VCol cols="12">
      <VCard title="variants">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <AppTextField label="City" />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 textfield density  -->
    <VCol cols="12">
      <VCard title="density">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <AppTextField
                label="City"
                density="default"
                class="my-5"
              />
              <AppTextField
                label="City"
                class="my-5"
                density="comfortable"
              />
              <AppTextField
                label="City"
                density="compact"
                class="my-5"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 textfield placeholder  -->
    <VCol cols="12">
      <VCard title="placeholder">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <p>last example has persistent-placeholder prop</p>
              <AppTextField
                label="City"
                density="default"
                class="my-5"
                placeholder="Enter city"
              />
              <AppTextField
                label="City"
                class="my-5"
                placeholder="Enter city"
                density="comfortable"
              />
              <AppTextField
                label="City"
                density="compact"
                placeholder="Enter city"
                class="my-5"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 textfield clearable  -->
    <VCol cols="12">
      <VCard title="clearable">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <p>last example has persistent-placeholder and persistent-clear prop</p>
              <AppTextField
                label="City"
                density="default"
                class="my-5"
                placeholder="Enter city"
                clearable
              />
              <AppTextField
                label="City"
                class="my-5"
                placeholder="Enter city"
                clearable
                density="comfortable"
              />
              <AppTextField
                label="City"
                density="compact"
                clearable
                placeholder="Enter city"
                class="my-5"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 textfield prepend inner icon -->
    <VCol cols="12">
      <VCard title="prepend inner">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <AppTextField
                label="City"
                density="default"
                class="my-5"
                placeholder="Enter city"
                prepend-inner-icon="tabler-building"
                clearable
              />
              <AppTextField
                label="City"
                class="my-5"
                placeholder="Enter city"
                prepend-inner-icon="tabler-building"
                clearable
                density="comfortable"
              />
              <AppTextField
                label="City"
                density="compact"
                clearable
                prepend-inner-icon="tabler-building"
                placeholder="Enter city"
                class="my-5"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 textfield appned inner icon -->
    <VCol cols="12">
      <VCard title="append inner">
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                label="City"
                density="default"
                class="my-5"
                placeholder="Enter city"
                append-inner-icon="tabler-building"
                clearable
              />
              <AppTextField
                label="City"
                class="my-5"
                placeholder="Enter city"
                append-inner-icon="tabler-building"
                clearable
                density="comfortable"
              />
              <AppTextField
                label="City"
                density="compact"
                clearable
                append-inner-icon="tabler-building"
                placeholder="Enter city"
                class="my-5"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 textfield loading  -->
    <VCol cols="12">
      <VCard title="loading">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <AppTextField
                label="City"
                density="default"
                class="my-5"
                loading
                placeholder="Enter city"
              />
              <AppTextField
                label="City"
                class="my-5"
                loading
                placeholder="Enter city"
                density="comfortable"
              />
              <AppTextField
                label="City"
                density="compact"
                loading
                placeholder="Enter city"
                class="my-5"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 textfield density  -->
    <VCol cols="12">
      <VCard title="prefix">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <AppTextField
                label="amount"
                prefix="$"
                density="default"
                class="my-5"
              />
              <AppTextField
                label="amount"
                prefix="$"
                class="my-5"
                density="comfortable"
              />
              <AppTextField
                label="amount"
                prefix="$"
                density="compact"
                class="my-5"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
