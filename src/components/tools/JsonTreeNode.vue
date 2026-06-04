<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { ChevronRight, ChevronDown } from 'lucide-vue-next'

interface TreeNode {
  key: string
  path: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  value: any
  children?: { key: string; node: TreeNode }[]
  length?: number
}

export default defineComponent({
  name: 'JsonTreeNode',
  components: { ChevronRight, ChevronDown },
  props: {
    node: { type: Object as PropType<TreeNode>, required: true },
    collapsedPaths: { type: Object as PropType<Set<string>>, required: true },
    depth: { type: Number, required: true },
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    function toggle() {
      emit('toggle', props.node.path)
    }

    function isCollapsed() {
      return props.collapsedPaths.has(props.node.path)
    }

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

    return { toggle, isCollapsed, valueColor, displayValue }
  },
  template: `
    <div>
      <div
        class="flex items-start gap-1 py-0.5 hover:bg-gray-700/30 rounded px-1 cursor-pointer"
        :style="{ paddingLeft: depth * 16 + 4 + 'px' }"
        @click="node.type === 'object' || node.type === 'array' ? toggle() : undefined"
      >
        <span v-if="node.type === 'object' || node.type === 'array'" class="shrink-0 mt-0.5">
          <ChevronDown v-if="!isCollapsed()" :size="12" class="text-gray-400" />
          <ChevronRight v-else :size="12" class="text-gray-400" />
        </span>
        <span v-else class="w-3 shrink-0"></span>

        <span v-if="node.key !== 'root'" class="text-emerald-400 shrink-0">{{ node.key }}</span>
        <span v-if="node.key !== 'root'" class="text-gray-500 shrink-0">: </span>

        <span v-if="node.type === 'object'" class="text-gray-400">
          <span v-if="isCollapsed()">{ {{ node.length }} 项 }</span>
          <span v-else>{</span>
        </span>
        <span v-else-if="node.type === 'array'" class="text-gray-400">
          <span v-if="isCollapsed()">[ {{ node.length }} 项 ]</span>
          <span v-else>[</span>
        </span>
        <span v-else :class="valueColor(node.type)">{{ displayValue(node) }}</span>
      </div>

      <div v-if="(node.type === 'object' || node.type === 'array') && !isCollapsed()">
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
        v-if="(node.type === 'object' || node.type === 'array') && !isCollapsed()"
        :style="{ paddingLeft: depth * 16 + 4 + 'px' }"
        class="text-gray-400 py-0.5 px-1"
      >
        <span class="w-3 inline-block"></span>
        {{ node.type === 'object' ? '}' : ']' }}
      </div>
    </div>
  `,
})
</script>
