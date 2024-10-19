<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Package,
  Square,
  Triangle,
  Circle,
  User,
  CreditCard,
  Settings,
  LayoutDashboard,
  ShoppingCart,
  Users,
  BarChart,
  Plus,
  Minus,
} from 'lucide-vue-next'

const products = ref([])
const searchQuery = ref('')
const menuSearchQuery = ref('')
const selectedProduct = ref(null)
const newStock = ref(0)
const isUpdating = ref(false)
const errorMessage = ref('')
const isDrawerOpen = ref(false)

const menuItems = [
  { icon: User, label: 'Profile' },
  { icon: CreditCard, label: 'Billing' },
  { icon: Settings, label: 'Settings' },
  { icon: LayoutDashboard, label: 'Dashboard', link: '/' },
  { icon: ShoppingCart, label: 'Orders', link: '/orders' },
  { icon: Package, label: 'Products', link: '/products' },
  { icon: Users, label: 'Customers', link: '/customers' },
  { icon: BarChart, label: 'Analytics', link: '/analytics' },
]

const filteredMenuItems = computed(() => {
  return menuItems.filter(item => 
    item.label.toLowerCase().includes(menuSearchQuery.value.toLowerCase())
  )
})

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  const query = searchQuery.value.toLowerCase()
  return products.value.filter(product => 
    product.sku.toLowerCase().includes(query) || 
    product.qty.toString().includes(query)
  )
})

onMounted(async () => {
  try {
    const response = await fetch('/api/products')
    const data = await response.json()
    products.value = data.data.items
  } catch (error) {
    console.error('Error fetching products:', error)
  }
})

const openUpdateStockDrawer = (product) => {
  selectedProduct.value = product
  newStock.value = product.qty
  isDrawerOpen.value = true
}

const updateStock = async () => {
  if (!selectedProduct.value) return

  isUpdating.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('/api/updateStock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sku: selectedProduct.value.sku,
        newStock: Number(newStock.value),
      }),
    })

    const result = await response.json()

    if (result.success) {
      selectedProduct.value.qty = newStock.value
      // Update the product in the products array
      const index = products.value.findIndex(p => p.sku === selectedProduct.value.sku)
      if (index !== -1) {
        products.value[index] = { ...selectedProduct.value }
      }
      // Close the drawer after successful update
      isDrawerOpen.value = false
    } else {
      console.error('Failed to update stock:', result.message)
      errorMessage.value = result.message || 'Failed to update stock'
      if (result.error) {
        console.error('Error details:', result.error)
      }
    }
  } catch (error: any) {
    console.error('Error updating stock:', error)
    errorMessage.value = error.message || 'An unexpected error occurred'
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen w-full">
    <header class="sticky top-0 flex h-16 items-center border-b bg-white px-2 md:px-6 z-10">
      <div class="flex w-full items-center">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="secondary" size="icon" class="rounded-full">
              <Square class="h-5 w-5" />
              <span class="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-screen md:w-56">
            <div class="p-2">
              <div class="relative w-full items-center">
                <Input 
                  v-model="menuSearchQuery"
                  type="text" 
                  placeholder="Search menu..." 
                  class="text-xl"
                />
              </div>
            </div>
            <DropdownMenuGroup>
              <template v-for="item in filteredMenuItems" :key="item.label">
                <DropdownMenuItem class="text-xl py-2">
                  <component :is="item.icon" class="mr-2 h-5 w-5" />
                  <span v-if="item.link">
                    <NuxtLink :to="item.link" class="flex items-center">
                      {{ item.label }}
                    </NuxtLink>
                  </span>
                  <span v-else>{{ item.label }}</span>
                </DropdownMenuItem>
              </template>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <form class="flex-1 mx-2" @submit.prevent>
          <div class="relative w-full">
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Search products..."
              class="w-full"
            />
          </div>
        </form>
        <div class="flex items-center">
          <Button variant="ghost" size="icon" class="rounded-full">
            <Triangle class="h-5 w-5" />
            <span class="sr-only">Triangle</span>
          </Button>
          <Button variant="ghost" size="icon" class="rounded-full">
            <Circle class="h-5 w-5" />
            <span class="sr-only">Circle</span>
          </Button>
        </div>
      </div>
    </header>

    <div class="h-full flex-1 flex-col space-y-8 p-8">
      <div class="flex justify-end items-center">
        <Button class="bg-white text-black border border-gray-300 hover:bg-gray-100">
          <Plus class="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="product in filteredProducts" :key="product.id">
            <TableCell>{{ product.sku }}</TableCell>
            <TableCell>{{ product.qty }}</TableCell>
            <TableCell>
              <Drawer v-model:open="isDrawerOpen">
                <DrawerTrigger as-child>
                  <Button variant="outline" size="sm" @click="openUpdateStockDrawer(product)">
                    Update Stock
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div class="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                      <DrawerTitle>Update Stock</DrawerTitle>
                      <DrawerDescription>Adjust the stock quantity for {{ selectedProduct?.sku }}</DrawerDescription>
                    </DrawerHeader>
                    <div class="p-4 pb-0">
                      <div class="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-8 w-8 shrink-0 rounded-full"
                          @click="newStock--"
                        >
                          <Minus class="h-4 w-4" />
                          <span class="sr-only">Decrease</span>
                        </Button>
                        <div class="flex-1 text-center">
                          <div class="text-7xl font-bold tracking-tighter">
                            {{ newStock }}
                          </div>
                          <div class="text-[0.70rem] uppercase text-muted-foreground">
                            Current Stock
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          class="h-8 w-8 shrink-0 rounded-full"
                          @click="newStock++"
                        >
                          <Plus class="h-4 w-4" />
                          <span class="sr-only">Increase</span>
                        </Button>
                      </div>
                    </div>
                    <DrawerFooter>
                      <Button @click="updateStock" :disabled="isUpdating">
                        {{ isUpdating ? 'Updating...' : 'Update Stock' }}
                      </Button>
                      <DrawerClose as-child>
                        <Button variant="outline">
                          Cancel
                        </Button>
                      </DrawerClose>
                      <p v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</p>
                    </DrawerFooter>
                  </div>
                </DrawerContent>
              </Drawer>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
