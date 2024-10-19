<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Upload, Video, X } from 'lucide-vue-next'
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

const attributes = ref(Array(5).fill(null).map(() => ({ type: '', value: '' })))

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
  console.log(`Updating attribute ${index}, ${key}: ${value}`)
  if (key === 'type') {
    attributes.value[index] = { ...attributes.value[index], type: value, value: '' }
  } else {
    attributes.value[index] = { ...attributes.value[index], value }
  }
  attributes.value = [...attributes.value] // Trigger a re-render
  console.log('Updated attributes:', JSON.stringify(attributes.value))
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

const uploadedFiles = ref<{ url: string; type: string }[]>([])

const uploadFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/uploadMedia', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      // Ensure the URL is correct
      const fileUrl = new URL(result.fileUrl).toString()
      uploadedFiles.value.push({
        url: fileUrl,
        type: file.type.startsWith('image/') ? 'image' : 'video',
      })
    } else {
      console.error('Failed to upload file:', result.message, 'Error details:', result.error)
      // You might want to show an error message to the user here
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    // You might want to show an error message to the user here
  }
}

const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1)
}

const availableAttributeTypes = computed(() => {
  const selectedTypes = attributes.value.map(attr => attr.type).filter(Boolean)
  console.log('Selected types:', selectedTypes)
  const available = attributeTypes.value.filter(attr => !selectedTypes.includes(attr.Type) || attr.Type === '')
  console.log('Available types:', available)
  return available
})

// Add a watcher for debugging
watch(attributes, (newValue) => {
  console.log('Attributes changed:', JSON.stringify(newValue))
}, { deep: true })
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
            <TableRow v-for="(value, key) in productData" :key="key" class="h-[32px]">
              <TableCell class="font-medium border-r">{{ key.charAt(0).toUpperCase() + key.slice(1) }}</TableCell>
              <TableCell class="p-0">
                <template v-if="key === 'category' || key === 'instance'">
                  <Select @update:modelValue="updateField(key, $event)">
                    <SelectTrigger class="w-full h-[32px] border-0 focus:ring-0 bg-transparent">
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
                  <div class="w-full h-full px-3 flex justify-between items-center">
                    <span @click="changeOptions(false)" class="w-1/3 text-center cursor-pointer">-</span>
                    <span class="w-1/3 text-center">{{ value }}</span>
                    <span @click="changeOptions(true)" class="w-1/3 text-center cursor-pointer">+</span>
                  </div>
                </template>
                <template v-else-if="key === 'medias'">
                  <div class="flex items-center h-full px-3">
                    <label class="cursor-pointer">
                      <input type="file" class="hidden" @change="uploadFile" accept="image/*,video/*" />
                      <Upload class="h-5 w-5" />
                    </label>
                    <div class="flex-1 flex overflow-x-auto ml-2">
                      <div v-for="(file, index) in uploadedFiles" :key="index" class="relative mr-2">
                        <img v-if="file.type === 'image'" :src="file.url" class="h-6 w-6 object-cover" />
                        <Video v-else class="h-6 w-6" />
                        <button @click="removeFile(index)" class="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5">
                          <X class="h-2 w-2 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
                <div
                  v-else
                  contenteditable="true"
                  class="w-full h-full px-3 focus:outline-none notion-cell flex items-center"
                  :placeholder="`Enter ${key}`"
                  @input="updateField(key, ($event.target as HTMLDivElement).textContent || '')"
                ></div>
              </TableCell>
            </TableRow>
            <TableRow v-for="(attribute, index) in visibleAttributes" :key="`attribute-${index}`" class="h-[32px]">
              <TableCell class="font-medium border-r p-0">
                <Select :model-value="attribute.type" @update:model-value="(value) => updateAttribute(index, 'type', value)">
                  <SelectTrigger class="w-full h-[32px] border-0 focus:ring-0 bg-transparent">
                    <SelectValue>
                      {{ attribute.type || 'Select Type' }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem v-for="attr in availableAttributeTypes" :key="attr.Type" :value="attr.Type">
                        {{ attr.Type }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell class="p-0">
                <Select :model-value="attribute.value" @update:model-value="(value) => updateAttribute(index, 'value', value)" :disabled="!attribute.type">
                  <SelectTrigger class="w-full h-[32px] border-0 focus:ring-0 bg-transparent">
                    <SelectValue :placeholder="attribute.value || 'Select Value'" />
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
}

.notion-table th:first-child,
.notion-table td:first-child {
  border-right: 1px solid #e5e7eb;
}

.notion-cell {
  min-height: 32px;
  line-height: 32px;
}

.notion-cell:focus {
  background-color: #e8f0fe;
}

[contenteditable]:empty:before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}

/* Keep select arrow white for all rows */
:deep(.select-trigger .lucide-chevron-down) {
  display: none;
}

/* Ensure consistent height for all rows */
.notion-table tr {
  height: 32px;
}

/* Adjust padding for select triggers */
:deep(.select-trigger) {
  padding-left: 12px;
  padding-right: 12px;
}

/* Remove default select styling */
:deep(.select-trigger) {
  background-color: transparent;
  border: none;
  box-shadow: none;
}

/* Style placeholder text */
:deep(.select-value[data-placeholder]) {
  color: #9ca3af;
}
</style>
