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
} from 'lucide-vue-next'

const products = ref([])
const searchQuery = ref('')
const menuSearchQuery = ref('')

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
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="product in filteredProducts" :key="product.id">
            <TableCell>{{ product.sku }}</TableCell>
            <TableCell>{{ product.qty }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
