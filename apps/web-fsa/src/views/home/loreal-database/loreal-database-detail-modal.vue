<script lang="ts" setup>
import { ref, computed, watchEffect, h } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  Table,
  Input,
  Tag,
  Image,
  Descriptions,
  DescriptionsItem
} from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';
import dayjs from 'dayjs';

// 数据
const data = ref<Record<string, any>>({});
const database = computed(() => data.value?.database);

const searchText = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

// 过滤后的商品列表
const filteredProducts = computed(() => {
  if (!database.value?.products) return [];
  
  const products = database.value.products;
  if (!searchText.value) return products;
  
  const search = searchText.value.toLowerCase();
  return products.filter((item: any) => {
    return (
      item.skuCode?.toLowerCase().includes(search) ||
      item.spuNameCn?.toLowerCase().includes(search) ||
      item.skuSpecName?.toLowerCase().includes(search) ||
      item.skuShortDesc?.toLowerCase().includes(search)
    );
  });
});

// 分页后的商品列表
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredProducts.value.slice(start, end);
});

// 总数
const total = computed(() => filteredProducts.value.length);

// 表格列配置
const columns: ColumnsType = [
  {
    title: 'SKU编码',
    dataIndex: 'skuCode',
    key: 'skuCode',
    width: 150,
    fixed: 'left'
  },
  {
    title: '商品图片',
    key: 'image',
    width: 100,
    customRender: ({ record }) => {
      const imgUrl = record.spuImage || (record.skuImages && record.skuImages[0]);
      return imgUrl ? h(Image, {
        src: imgUrl,
        width: 60,
        height: 60,
        fallback: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      }) : '-';
    }
  },
  {
    title: '商品名称',
    dataIndex: 'spuNameCn',
    key: 'spuNameCn',
    width: 200,
    ellipsis: true
  },
  {
    title: '规格',
    dataIndex: 'skuSpecName',
    key: 'skuSpecName',
    width: 150,
    ellipsis: true
  },
  {
    title: '描述',
    dataIndex: 'skuShortDesc',
    key: 'skuShortDesc',
    width: 200,
    ellipsis: true
  },
  {
    title: '库存',
    dataIndex: 'skuInvNum',
    key: 'skuInvNum',
    width: 100,
    align: 'center',
    customRender: ({ record }) => {
      const stock = record.skuInvNum || 0;
      const color = stock > 50 ? 'green' : stock > 10 ? 'orange' : 'red';
      return h(Tag, { color }, () => stock);
    }
  },
  {
    title: '价格',
    dataIndex: 'skuSalePrice',
    key: 'skuSalePrice',
    width: 120,
    align: 'right',
    customRender: ({ record }) => {
      return `¥${(record.skuSalePrice || 0).toFixed(2)}`;
    }
  },
  {
    title: '类型',
    key: 'type',
    width: 100,
    align: 'center',
    customRender: ({ record }) => {
      return h(Tag, {
        color: record.isVbPackage ? 'purple' : 'blue'
      }, () => record.isVbPackage ? '特惠礼包' : '普通商品');
    }
  }
];

// 初始化modal
const [Modal, modalApi] = useVbenModal({
  title: '欧莱雅数据库详情',
  width: 1200,
  footer: null,
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 获取传入的数据
      data.value = modalApi.getData<Record<string, any>>() || {};
      // 重置状态
      searchText.value = '';
      currentPage.value = 1;
    }
  },
});

// 处理分页变化
function handlePageChange(page: number, size: number) {
  currentPage.value = page;
  pageSize.value = size;
}
</script>

<template>
  <Modal>
    <div v-if="database" class="loreal-database-detail">
      <!-- 基本信息 -->
      <Descriptions :column="2" bordered class="mb-4">
        <DescriptionsItem label="数据库ID">{{ database.id }}</DescriptionsItem>
        <DescriptionsItem label="活动ID">{{ database.activityId }}</DescriptionsItem>
        <DescriptionsItem label="商品总数">
          <Tag color="blue">{{ database.productCount }} 个</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="爬取时间">
          {{ dayjs(database.scrapedAt).format('YYYY-MM-DD HH:mm:ss') }}
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">
          {{ dayjs(database.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
        </DescriptionsItem>
        <DescriptionsItem label="更新时间">
          {{ dayjs(database.updatedAt).format('YYYY-MM-DD HH:mm:ss') }}
        </DescriptionsItem>
      </Descriptions>

      <!-- 搜索框 -->
      <div class="mb-4">
        <Input.Search
          v-model:value="searchText"
          placeholder="搜索商品编码、名称、规格或描述"
          allowClear
          style="width: 400px"
        />
      </div>

      <!-- 商品列表 -->
      <Table
        :dataSource="paginatedProducts"
        :columns="columns"
        :pagination="{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total) => `共 ${total} 个商品`
        }"
        @change="({ current, pageSize }) => handlePageChange(current!, pageSize!)"
        :scroll="{ x: 1400, y: 400 }"
        rowKey="skuId"
        size="small"
      />
    </div>
  </Modal>
</template>

<style scoped>
.loreal-database-detail {
  padding: 16px;
}
</style>