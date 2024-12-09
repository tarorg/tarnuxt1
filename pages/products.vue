<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-vue-next'

interface Product {
  id: number;
  name: string;
  category: string;
}

const products = ref<Product[]>([])
const menuSearchQuery = ref('')
const error = ref<string | null>(null)
const search = ref("")
const currentPage = ref(1)
const itemsPerPage = 10

const menuItems = [
  { icon: User, label: 'Profile' },
  { icon: CreditCard, label: 'Billing' },
  { icon: Settings, label: 'Settings' },
  { icon: LayoutDashboard, label: 'Dashboard', link: '/' },
  { icon: ShoppingCart, label: 'Orders', link: '/orders' },
  { icon: Package, label: 'Products', link: '/products' },
  { icon: Layers, label: 'Instances', link: '/instances' },
  { icon: Users, label: 'Customers', link: '/customers' },
  { icon: BarChart, label: 'Analytics', link: '/analytics' },
]

const filteredMenuItems = computed(() => {
  return menuItems.filter(item => 
    item.label.toLowerCase().includes(menuSearchQuery.value.toLowerCase())
  )
})

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "category", header: "Category" },
];

const filteredData = computed(() => {
  if (!search.value) return products.value
  return products.value.filter(item => 
    Object.values(item).some(val => 
      val.toString().toLowerCase().includes(search.value.toLowerCase())
    )
  )
})

const paginatedData = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage
  return filteredData.value.slice(startIndex, startIndex + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / itemsPerPage))

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const fetchProducts = async () => {
  const url = "https://commerce-tarframework.turso.io/v2/pipeline";
  const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Mjk2NzQwNjQsImlkIjoiN2ZiNTFhMTgtYjU1My00Y2M2LTkwZWItZDE0ZTcxNDI5ODlhIn0.zxIjODPlBzNcAgQQ70xZj2sI7j7RSAHpYPQUtvyoAHDb4nLGzHAPiVvnJ6qeK7-00F8A6Lz__CSPjdITPZ31BQ";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql: "SELECT id, name, category FROM core" } },
          { type: "close" },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.results && data.results[0] && data.results[0].response && data.results[0].response.result && data.results[0].response.result.rows) {
      products.value = data.results[0].response.result.rows.map((row: any[]) => ({
        id: parseInt(row[0].value) || 0,
        name: row[1].value || 'Unknown',
        category: row[2].value || 'Unknown',
      }));
    } else {
      throw new Error('Unexpected API response structure');
    }
  } catch (e) {
    console.error('Error fetching products:', e);
    error.value = e instanceof Error ? e.message : 'An unknown error occurred';
  }
}

onMounted(fetchProducts);

const navigateToAddProduct = () => {
  navigateTo('/add-product')
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
        <div class="flex-1"></div>
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
      <div class="flex justify-between items-center">
        <input 
          type="search" 
          v-model="search" 
          placeholder="Search" 
          class="w-full md:w-96 p-2 border rounded bg-white"
        />
        <Button 
          variant="ghost"
          size="icon"
          class="ml-2"
          @click="navigateToAddProduct"
        >
          <Plus class="h-5 w-5" />
          <span class="sr-only">Add Product</span>
        </Button>
      </div>

      <table class="w-full mt-5 rounded-md border">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.accessorKey" class="p-2 text-left bg-white font-semibold">
              {{ column.header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedData" :key="item.id" class="border-t">
            <td v-for="column in columns" :key="column.accessorKey" class="p-2">
              {{ item[column.accessorKey as keyof Product] }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Minimal Pagination -->
      <div class="flex justify-center items-center mt-4 space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          @click="prevPage" 
          :disabled="currentPage === 1"
        >
          Previous
        </Button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <Button 
          variant="outline" 
          size="sm" 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any additional styles here if needed */
</style>
