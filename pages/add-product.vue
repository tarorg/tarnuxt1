<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Upload, Video, X, Save } from 'lucide-vue-next'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const goBack = () => {
  navigateTo('/products')
}

// Rename this to reflect the "core" concept
const coreProductData = ref({
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

const updateCoreField = (field: keyof typeof coreProductData.value, value: string) => {
  coreProductData.value[field] = value
}

const selectedValues = ref<{ [key: number]: string[] }>({})

const toggleValue = (index: number, value: string) => {
  if (!selectedValues.value[index]) {
    selectedValues.value[index] = []
  }
  const valueIndex = selectedValues.value[index].indexOf(value)
  if (valueIndex === -1) {
    selectedValues.value[index].push(value)
  } else {
    selectedValues.value[index].splice(valueIndex, 1)
  }
  updateAttribute(index, 'value', selectedValues.value[index].join(', '))
}

const updateAttribute = (index: number, key: 'type' | 'value', value: string | string[]) => {
  console.log(`Updating attribute ${index}, ${key}: ${value}`)
  if (key === 'type') {
    attributes.value[index] = { ...attributes.value[index], type: value as string, value: '' }
    selectedValues.value[index] = []
  } else {
    attributes.value[index] = { ...attributes.value[index], value: Array.isArray(value) ? value.join(', ') : value }
  }
  attributes.value = [...attributes.value] // Trigger a re-render
  console.log('Updated attributes:', JSON.stringify(attributes.value))
}

const changeOptions = (increment: boolean) => {
  const currentValue = parseInt(coreProductData.value.options)
  if (increment && currentValue < 5) {
    coreProductData.value.options = (currentValue + 1).toString()
  } else if (!increment && currentValue > 1) {
    coreProductData.value.options = (currentValue - 1).toString()
  }
}

const getAttributeValues = (type: string) => {
  const attribute = attributeTypes.value.find(attr => attr.Type === type)
  return attribute ? attribute.values : []
}

const visibleAttributes = computed(() => {
  return attributes.value.slice(0, parseInt(coreProductData.value.options))
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

const isVariantInstance = computed(() => coreProductData.value.instance === 'Variants')
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
        <Button @click="goBack" variant="ghost" size="icon">
          <X class="h-5 w-5" />
          <span class="sr-only">Cancel</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Save class="h-5 w-5" />
          <span class="sr-only">Save Product</span>
        </Button>
      </div>
    </header>

    <main class="flex-1 p-6">
      <div class="max-w-3xl mx-auto">
        <Table class="core-table">
          <TableBody>
            <TableRow v-for="(value, key) in coreProductData" :key="key" class="h-[32px]">
              <TableCell class="font-medium border-r w-1/4">{{ key.charAt(0).toUpperCase() + key.slice(1) }}</TableCell>
              <TableCell class="p-0 w-3/4">
                <template v-if="key === 'category' || key === 'instance'">
                  <Select @update:modelValue="updateCoreField(key, $event)">
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
                  class="w-full h-full px-3 focus:outline-none core-cell flex items-center"
                  :placeholder="`Enter ${key}`"
                  @input="updateCoreField(key, ($event.target as HTMLDivElement).textContent || '')"
                ></div>
              </TableCell>
            </TableRow>
            <TableRow v-for="(attribute, index) in visibleAttributes" :key="`attribute-${index}`" class="h-[32px]">
              <TableCell class="font-medium border-r p-0 w-1/4">
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
              <TableCell class="p-0 w-3/4">
                <Select 
                  v-if="!isVariantInstance" 
                  :model-value="attribute.value" 
                  @update:model-value="(value) => updateAttribute(index, 'value', value)" 
                  :disabled="!attribute.type"
                >
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
                <div v-else class="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        :class="{'border-primary': selectedValues[index]?.length > 0}"
                        class="w-full justify-start h-[32px] border-0 focus:ring-0 bg-transparent"
                      >
                        {{ selectedValues[index]?.length ? selectedValues[index].join(', ') : 'Select Values' }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-[200px] p-4">
                      <div class="max-h-[200px] overflow-y-auto">
                        <div v-for="attrValue in getAttributeValues(attribute.type)" :key="attrValue" class="flex items-center space-x-2 mb-2">
                          <Checkbox
                            :id="`${index}-${attrValue}`"
                            :checked="selectedValues[index]?.includes(attrValue)"
                            @update:checked="() => toggleValue(index, attrValue)"
                          />
                          <label :for="`${index}-${attrValue}`" class="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {{ attrValue }}
                          </label>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </main>
  </div>
</template>

<style scoped>
.core-table {
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  table-layout: fixed;  /* Add this line to ensure fixed column widths */
  width: 100%;  /* Ensure the table takes full width */
}

.core-table td {
  border-bottom: 1px solid #e5e7eb;
}

.core-table td:first-child {
  border-right: 1px solid #e5e7eb;
  width: 25%;  /* Set the width of the first column (property) to 25% */
}

.core-table td:last-child {
  width: 75%;  /* Set the width of the second column (value) to 75% */
}

.core-cell {
  min-height: 32px;
  line-height: 32px;
}

.core-cell:focus {
  background-color: #e8f0fe;
}

/* ... (keep other existing styles) */

/* Remove borders and background from select triggers */
:deep(.select-trigger) {
  border: none !important;
  background-color: transparent !important;
  box-shadow: none !important;
}

/* Remove focus ring from select triggers */
:deep(.select-trigger:focus) {
  outline: none !important;
  box-shadow: none !important;
}

/* Ensure text color consistency */
:deep(.select-trigger .select-value) {
  color: inherit;
}

/* Adjust padding for select triggers */
:deep(.select-trigger) {
  padding-left: 12px;
  padding-right: 12px;
  height: 32px;
}

/* Hide all chevron icons */
:deep(.select-trigger .lucide-chevron-down),
:deep(.popover-trigger .lucide-chevron-down) {
  display: none;
}

/* ... (keep other existing styles) ... */
</style>
