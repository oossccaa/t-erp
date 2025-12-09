<template>
  <div class="customers-view">
    <van-nav-bar :title="t('customer.customers')" />

    <van-search
      v-model="searchValue"
      :placeholder="t('customer.searchPlaceholder')"
      @search="onSearch"
    />

    <div class="customers-content">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        :finished-text="t('common.noMore')"
        @load="onLoad"
      >
        <van-card
          v-for="customer in customers"
          :key="customer.id"
          class="customer-card"
          @click="viewCustomer(customer)"
        >
          <template #header>
            <div class="customer-header">
              <h3>{{ customer.name }}</h3>
              <van-tag :type="customer.level === 'vip' ? 'primary' : 'default'">
                {{ customer.level === 'vip' ? t('common.all') : t('customer.newCustomer') }}
              </van-tag>
            </div>
          </template>

          <template #default>
            <van-cell :title="t('customer.phone')" :value="customer.phone" />
            <van-cell :title="t('customer.email')" :value="customer.email" />
            <van-cell :title="t('customer.totalSpent')" :value="`NT$ ${formatMoney(customer.totalSpent)}`" />
          </template>
        </van-card>
      </van-list>
    </div>

    <van-floating-bubble
      axis="xy"
      icon="plus"
      @click="addCustomer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const searchValue = ref('')
const loading = ref(false)
const finished = ref(false)

const customers = ref([
  {
    id: 1,
    name: '优质客户A',
    phone: '0912-345-678',
    email: 'customer-a@example.com',
    level: 'vip',
    totalSpent: 150000,
  },
  {
    id: 2,
    name: '稳定客户B',
    phone: '0923-456-789',
    email: 'customer-b@example.com',
    level: 'normal',
    totalSpent: 75000,
  },
])

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('zh-TW').format(amount)
}

const onSearch = (value: string) => {
  console.log(t('common.search'), value)
}

const onLoad = () => {
  setTimeout(() => {
    loading.value = false
    finished.value = true
  }, 1000)
}

const viewCustomer = (customer: any) => {
  showToast(`${t('common.viewAll')}: ${customer.name}`)
}

const addCustomer = () => {
  showToast(t('customer.createCustomer'))
}

defineOptions({
  name: 'Customers',
})
</script>

<style lang="scss" scoped>
.customers-view {
  background: #f7f8fa;
  min-height: 100vh;
}

.customers-content {
  padding: 0 16px;
}

.customer-card {
  margin-bottom: 12px;
}

.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: 16px;
    color: #323233;
  }
}
</style>