<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft } from 'lucide-vue-next'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const goBack = () => {
  navigateTo('/products')
}

const productData = ref({
  name: '',
  category: '',
  medias: '',
  instance: '',
  options: '1',
})

const attributes = ref(Array(5).fill({ type: '', value: '' }))

const categories = ref([])
const instanceOptions = ['Item', 'Variants', 'Service']
const attributeTypes = ref([])

onMounted(async () => {
  const [categoryResponse, attributeResponse] = await Promise.all([
    fetch('/category.json'),
    fetch('/attribute.json')
  ])
  categories.value = await categoryResponse.json()
  const attributeData = await attributeResponse.json()
  attributeTypes.value = attributeData.attributes
})

const updateField = (field: keyof typeof productData.value, value: string) => {
  productData.value[field] = value
}

const updateAttribute = (index: number, key: 'type' | 'value', value: string) => {
  attributes.value[index][key] = value
  if (key === 'type') {
    attributes.value[index].value = ''
  }
}

const changeOptions = (increment: boolean) => {
  const currentValue = parseInt(productData.value.options)
  if (increment && currentValue < 5) {
    productData.value.options = (currentValue + 1).toString()
  } else if (!increment && currentValue > 1) {
    productData.value.options = (currentValue - 1).toString()
  }
}

const getAttributeValues = (type: string) => {
  const attribute = attributeTypes.value.find(attr => attr.Type === type)
  return attribute ? attribute.values : []
}

const visibleAttributes = computed(() => {
  return attributes.value.slice(0, parseInt(productData.value.options))
})
</script>

<template>
  <div class="flex flex-col min-h-screen w-full">
    <header class="sticky top-0 flex h-16 items-center justify-between border-b bg-white px-2 md:px-6 z-10">
      <div class="flex items-center">
        <Button variant="ghost" size="icon" class="mr-2" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
          <span class="sr-only">Go back</span>
        </Button>
        <h1 class="text-sm font-semibold">Add Product</h1>
      </div>
      <div class="flex items-center space-x-2">
        <Button @click="goBack" variant="outline">Cancel</Button>
        <Button>Save Product</Button>
      </div>
    </header>

    <main class="flex-1 p-6">
      <div class="max-w-3xl mx-auto">
        <Table class="notion-table">
          <TableHeader>
            <TableRow>
              <TableHead class="w-1/5 border-r">Property</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(value, key) in productData" :key="key" class="h-8">
              <TableCell class="font-medium border-r">{{ key.charAt(0).toUpperCase() + key.slice(1) }}</TableCell>
              <TableCell class="p-0">
                <template v-if="key === 'category' || key === 'instance'">
                  <Select @update:modelValue="updateField(key, $event)">
                    <SelectTrigger class="w-full h-[32px] border-0 focus:ring-0">
                      <SelectValue :placeholder="`Select ${key}`" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem 
                          v-for="option in (key === 'category' ? categories : instanceOptions)" 
                          :key="key === 'category' ? option.value : option" 
                          :value="key === 'category' ? option.value : option"
                        >
                          {{ key === 'category' ? option.label : option }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </template>
                <template v-else-if="key === 'options'">
                  <div
                    class="w-full h-full px-3 py-1 cursor-pointer notion-cell flex justify-between items-center"
                  >
                    <span @click="changeOptions(false)" class="w-1/3 text-center">-</span>
                    <span class="w-1/3 text-center">{{ value }}</span>
                    <span @click="changeOptions(true)" class="w-1/3 text-center">+</span>
                  </div>
                </template>
                <div
                  v-else
                  contenteditable="true"
                  class="w-full h-full px-3 py-1 focus:outline-none notion-cell"
                  :placeholder="`Enter ${key}`"
                  @input="updateField(key, ($event.target as HTMLDivElement).textContent || '')"
                ></div>
              </TableCell>
            </TableRow>
            <TableRow v-for="(attribute, index) in visibleAttributes" :key="`attribute-${index}`" class="h-8">
              <TableCell class="font-medium border-r p-0">
                <Select @update:modelValue="updateAttribute(index, 'type', $event)">
                  <SelectTrigger class="w-full h-[32px] border-0 focus:ring-0">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem v-for="attr in attributeTypes" :key="attr.Type" :value="attr.Type">
                        {{ attr.Type }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell class="p-0">
                <Select @update:modelValue="updateAttribute(index, 'value', $event)" :disabled="!attribute.type">
                  <SelectTrigger class="w-full h-[32px] border-0 focus:ring-0">
                    <SelectValue placeholder="Select Value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem v-for="attrValue in getAttributeValues(attribute.type)" :key="attrValue" :value="attrValue">
                        {{ attrValue }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </main>
  </div>
</template>

<style scoped>
.notion-table {
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.notion-table th,
.notion-table td {
  border-bottom: 1px solid #e5e7eb;
  height: 32px;
}

.notion-table th:first-child,
.notion-table td:first-child {
  border-right: 1px solid #e5e7eb;
}

.notion-cell {
  min-height: 32px;
  line-height: 32px;
  cursor: text;
}

.notion-cell:focus {
  background-color: #e8f0fe;
}

[contenteditable]:empty:before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}

.notion-table td {
  padding: 0;
}

/* Ensure Select component fits within the 32px height */
:deep(.select-trigger) {
  height: 32px;
  min-height: 32px;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
