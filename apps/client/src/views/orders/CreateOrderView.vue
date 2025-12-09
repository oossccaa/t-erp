<template>
  <div class="create-order-view">
    <van-nav-bar
      :title="$t('order.create.title')"
      :left-text="$t('common.cancel')"
      :right-text="$t('common.save')"
      @click-left="$router.go(-1)"
      @click-right="saveOrder"
    />

    <van-form @submit="onSubmit">
      <van-cell-group :title="$t('order.detail.info')">
        <van-field
          v-model="form.customerName"
          name="customerName"
          :label="$t('customer.name')"
          :placeholder="$t('order.create.selectCustomer')"
          :rules="[{ required: true, message: customerNameValidation }]"
        />
        <van-field
          v-model="form.customerPhone"
          name="customerPhone"
          :label="$t('customer.phone')"
          :placeholder="$t('customer.phone')"
        />
      </van-cell-group>

      <van-cell-group :title="$t('order.create.orderInfo')">
        <van-field
          v-model="form.orderDate"
          name="orderDate"
          :label="$t('order.detail.info')"
          :placeholder="$t('order.detail.info')"
          readonly
          is-link
          @click="showDatePicker = true"
        />
        <van-field
          v-model="form.remark"
          name="remark"
          :label="$t('order.detail.notes')"
          type="textarea"
          :placeholder="$t('order.create.pleaseEnterRemark')"
          rows="3"
        />
      </van-cell-group>

      <div class="order-items">
        <van-cell-group :title="$t('order.detail.products')">
          <van-empty v-if="!form.items.length" :description="$t('order.create.selectProducts')" />
          <div v-else>
            <van-swipe-cell
              v-for="(item, index) in form.items"
              :key="index"
            >
              <div class="item-card">
                <div class="item-info">
                  <h4>{{ item.name }}</h4>
                  <p>{{ $t('product.sku') }}: {{ item.sku }}</p>
                  <p>{{ $t('order.create.price') }}: NT$ {{ formatMoney(item.price) }}</p>
                </div>
                <div class="item-quantity">
                  <van-stepper v-model="item.quantity" min="1" />
                </div>
                <div class="item-total">
                  NT$ {{ formatMoney(item.price * item.quantity) }}
                </div>
              </div>
              <template #right>
                <van-button
                  square
                  type="danger"
                  :text="$t('common.delete')"
                  @click="removeItem(index)"
                />
              </template>
            </van-swipe-cell>
          </div>
        </van-cell-group>

        <van-button
          block
          type="primary"
          plain
          icon="plus"
          @click="addProduct"
        >
          {{ $t('order.create.addProduct') }}
        </van-button>
      </div>

      <div class="order-total">
        <van-cell :title="$t('order.detail.subtotal')" :value="`NT$ ${formatMoney(totalAmount)}`" />
        <van-cell :title="$t('order.detail.discount')" :value="`-NT$ ${formatMoney(discountAmount)}`" />
        <van-cell :title="$t('order.detail.total')" :value="`NT$ ${formatMoney(finalAmount)}`" />
      </div>
    </van-form>

    <!-- Date Picker -->
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker
        v-model="currentDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()
const { t } = useI18n()

const showDatePicker = ref(false)
const currentDate = ref([new Date().getFullYear().toString(), (new Date().getMonth() + 1).toString().padStart(2, '0'), new Date().getDate().toString().padStart(2, '0')])

const form = reactive({
  customerName: '',
  customerPhone: '',
  orderDate: dayjs().format('YYYY-MM-DD'),
  remark: '',
  items: [] as any[],
})

const discountAmount = ref(0)

const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const finalAmount = computed(() => {
  return Math.max(0, totalAmount.value - discountAmount.value)
})

const customerNameValidation = computed(() => {
  return t('order.create.pleaseEnterRemark')
})

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('zh-TW').format(amount)
}

const onDateConfirm = (value: Date) => {
  form.orderDate = dayjs(value).format('YYYY-MM-DD')
  showDatePicker.value = false
}

const addProduct = () => {
  showToast(t('home.actions.scanDeveloping'))
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

const onSubmit = () => {
  // Form submission logic
}

const saveOrder = () => {
  showToast(t('common.success'))
  router.go(-1)
}

defineOptions({
  name: 'CreateOrder',
})
</script>

<style lang="scss" scoped>
.create-order-view {
  background: #f7f8fa;
  min-height: 100vh;
}

.order-items {
  margin: 16px 0;
  
  .item-card {
    display: flex;
    align-items: center;
    padding: 16px;
    background: white;
    
    .item-info {
      flex: 1;
      
      h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        color: #323233;
      }
      
      p {
        margin: 2px 0;
        font-size: 12px;
        color: #969799;
      }
    }
    
    .item-quantity {
      margin: 0 16px;
    }
    
    .item-total {
      font-weight: 600;
      color: #1989fa;
    }
  }
}

.order-total {
  margin: 16px 0;
  
  :deep(.van-cell) {
    font-weight: 600;
    
    &:last-child {
      color: #1989fa;
      font-size: 18px;
    }
  }
}
</style>