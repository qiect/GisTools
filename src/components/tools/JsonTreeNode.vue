<script setup lang="ts">
import { ChevronRight, ChevronDown } from 'lucide-vue-next'

interface TreeNode {
  key: string
  path: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  value: any
  children?: { key: string; node: TreeNode }[]
  length?: number
}

defineProps<{
  node: TreeNode
  collapsedPaths: Set<string>
  depth: number
}>()

defineEmits<{
  toggle: [path: string]
}>()

function valueColor(type: string) {
  if (type === 'string') return 'text-amber-300'
  if (type === 'number') return 'text-sky-300'
  if (type === 'boolean') return 'text-purple-300'
  if (type === 'null') return 'text-gray-500'
  return 'text-gray-300'
}

function displayValue(node: TreeNode): string {
  if (node.type === 'string') return `"${node.value}"`
  if (node.type === 'null') return 'null'
  if (node.type === 'boolean') return String(node.value)
  if (node.type === 'number') return String(node.value)
  return ''
}
</script>

<template>
  <div>
    <div
      class="flex items-start gap-1 py-0.5 hover:bg-gray-700/30 rounded px-1 cursor-pointer select-none"
      :style="{ paddingLeft: depth * 16 + 4 + 'px' }"
      @click="node.type === 'object' || node.type === 'array' ? $emit('toggle', node.path) : undefined"
    >
      <span v-if="node.type === 'object' || node.type === 'array'" class="shrink-0 mt-0.5">
        <ChevronDown v-if="!collapsedPaths.has(node.path)" :size="12" class="text-gray-400" />
        <ChevronRight v-else :size="12" class="text-gray-400" />
      </span>
      <span v-else class="w-3 shrink-0"></span>

      <span v-if="node.key !== 'root'" class="text-emerald-400 shrink-0">{{ node.key }}</span>
      <span v-if="node.key !== 'root'" class="text-gray-500 shrink-0">: </span>

      <span v-if="node.type === 'object'" class="text-gray-400">
        <span v-if="collapsedPaths.has(node.path)">{ {{ node.length }} 项 }</span>
        <span v-else>{</span>
      </span>
      <span v-else-if="node.type === 'array'" class="text-gray-400">
        <span v-if="collapsedPaths.has(node.path)">[ {{ node.length }} 项 ]</span>
        <span v-else>[</span>
      </span>
      <span v-else :class="valueColor(node.type)">{{ displayValue(node) }}</span>
    </div>

    <div v-if="(node.type === 'object' || node.type === 'array') && !collapsedPaths.has(node.path)">
      <JsonTreeNode
        v-for="child in node.children"
        :key="child.key"
        :node="child.node"
        :collapsed-paths="collapsedPaths"
        :depth="depth + 1"
        @toggle="$emit('toggle', $event)"
      />
    </div>

    <div
      v-if="(node.type === 'object' || node.type === 'array') && !collapsedPaths.has(node.path)"
      :style="{ paddingLeft: depth * 16 + 4 + 'px' }"
      class="text-gray-400 py-0.5 px-1"
    >
      <span class="w-3 inline-block"></span>
      {{ node.type === 'object' ? '}' : ']' }}
    </div>
  </div>
</template>
