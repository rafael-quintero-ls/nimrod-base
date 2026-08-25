<script setup lang="ts">
import type { AddNewKanbanItem, EditKanbanItem, KanbanState, RenameKanbanBoard } from '@db/apps/kanban/types'
import KanbanBoardComp from '@/views/apps/kanban/KanbanBoard.vue'

// 👉 initial kanban data fetch
const { data: kanban, execute: refetchKanban } = await useApi<any>('/apps/kanban')

// 👉 adding new board and refetch the data
const addNewBoard = async (newBoardName: string) => {
  await $api('/apps/kanban/board/add', {
    method: 'POST',
    body: { title: newBoardName },
  })

  refetchKanban()
}

// 👉 delete board and refetch data
const deleteBoard = async (boardId: number) => {
  await $api(`/apps/kanban/board/${boardId}`, { method: 'DELETE' })
  refetchKanban()
}

// 👉 rename board and refetch data
const renameTheBoard = async (kanbanBoard: RenameKanbanBoard) => {
  await $api('/apps/kanban/board/rename', {
    method: 'PUT',
    body: kanbanBoard,
  })

  refetchKanban()
}

// 👉 add new item and refetch data
const addNewItem = async (newItem: AddNewKanbanItem) => {
  await $api('/apps/kanban/item/add', {
    method: 'POST',
    body: newItem,
  })

  refetchKanban()
}

const editItemFn = async (editItem: EditKanbanItem) => {
  await $api('/apps/kanban/item/update', {
    method: 'PUT',
    body: editItem,
  })

  refetchKanban()
}

// 👉 delete item and refetch data
const deleteItemFn = async (deleteItem: EditKanbanItem) => {
  if (deleteItem.item && deleteItem.item.id) {
    await $api(`/apps/kanban/item/${deleteItem.item.id}`, {
      method: 'DELETE',
      body: deleteItem,
    })

    refetchKanban()
  }
}

// 👉 update item state
const updateItemState = async (kanbanState: KanbanState) => {
  await $api('/apps/kanban/item/state-update', {
    method: 'PUT',
    body: kanbanState,
  })
}

// 👉 update board state
const updateBoardState = async (kanbanBoardIds: number[]) => {
  await $api('/apps/kanban/board/state-update', {
    method: 'PUT',
    body: kanbanBoardIds,
  })
}
</script>

<template>
  <KanbanBoardComp
    v-if="kanban"
    :kanban-data="kanban"
    @add-new-board="addNewBoard"
    @delete-board="deleteBoard"
    @rename-board="renameTheBoard"
    @add-new-item="addNewItem"
    @edit-item="editItemFn"
    @delete-item="deleteItemFn"
    @update-items-state="updateItemState"
    @update-board-state="updateBoardState"
  />
</template>
