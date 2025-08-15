<script setup lang="ts">
import { onMounted, ref, reactive, h, computed, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { 
  Button, 
  Card, 
  message, 
  Select, 
  Table, 
  Tag,
  Space,
  Image,
  Input,
  Empty,
  Tooltip
} from 'ant-design-vue';
import type { TablePaginationConfig, ColumnsType } from 'ant-design-vue/es/table';

import { $t } from '#/locales';
import {
  getLorealDatabaseByActivity,
  deleteLorealDatabase,
  getHotSaleData,
  getActivityList
} from '#/api/core/lorealDatabase';

import LorealDatabaseModal from './loreal-database-modal.vue';
import dayjs from 'dayjs';

// 产品列表
const productList = ref<any[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100', '200'],
  showTotal: (total) => `共 ${total} 条`
});

// 搜索参数
const searchKeyword = ref('');
const selectedActivityId = ref<number | undefined>(undefined);
const currentDatabase = ref<any>(null);

// 活动选项
const activityOptions = ref<any[]>([]);
const loadingActivities = ref(false);

// 热卖活动下载中
const downloadingHotSale = ref(false);

// 所有产品数据（用于搜索）
const allProducts = ref<any[]>([]);

// 过滤后的产品数据
const filteredProducts = computed(() => {
  if (!searchKeyword.value) return allProducts.value;
  
  const keyword = searchKeyword.value.toLowerCase();
  return allProducts.value.filter(product => {
    return (
      product.skuCode?.toLowerCase().includes(keyword) ||
      product.spuNameCn?.toLowerCase().includes(keyword) ||
      product.skuSpecName?.toLowerCase().includes(keyword) ||
      product.skuShortDesc?.toLowerCase().includes(keyword)
    );
  });
});

// 分页后的产品数据
const paginatedProducts = computed(() => {
  const current = pagination.current ?? 1;
  const pageSize = pagination.pageSize ?? 20;
  const start = (current - 1) * pageSize;
  const end = start + pageSize;
  return filteredProducts.value.slice(start, end);
});

// 监听过滤后的数据变化，更新分页总数
watch(filteredProducts, (newVal) => {
  pagination.total = newVal.length;
  pagination.current = 1; // 重置到第一页
});

// 弹窗控制
const [DatabaseModal, databaseModalApi] = useVbenModal({
  connectedComponent: LorealDatabaseModal,
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) {
      const data = databaseModalApi.getData<Record<string, any>>();
      if (data && data.operationSuccess) {
        // 操作成功后，刷新数据
        if (selectedActivityId.value) {
          await fetchProductsByActivity(selectedActivityId.value);
        }
      }
    }
  }
});



// 表格列配置
const columns: ColumnsType = [
  {
    title: '商品图片',
    dataIndex: 'spuImage',
    key: 'spuImage',
    width: 100,
    fixed: 'left',
    customRender: ({ record }) => {
      return h(Image, {
        src: record.spuImage,
        width: 60,
        height: 60,
        fallback: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        preview: true
      });
    }
  },
  {
    title: '标识符',
    dataIndex: 'skuCode',
    key: 'skuCode',
    width: 120,
    fixed: 'left',
    customRender: ({ record }) => {
      return h(Tooltip, { title: `点击复制: ${record.skuCode}` }, () =>
        h('span', { 
          class: 'cursor-pointer hover:text-blue-500',
          onClick: () => {
            navigator.clipboard.writeText(record.skuCode);
            message.success('标识符已复制');
          }
        }, record.skuCode)
      );
    }
  },
  {
    title: '商品ID',
    dataIndex: 'skuId',
    key: 'skuId',
    width: 100,
    align: 'center'
  },
  {
    title: '商品名称',
    dataIndex: 'spuNameCn',
    key: 'spuNameCn',
    width: 250,
    ellipsis: true,
    customRender: ({ record }) => {
      return h('div', [
        h('div', { class: 'font-medium' }, record.spuNameCn),
        record.skuShortDesc && h('div', { class: 'text-xs text-gray-500' }, record.skuShortDesc)
      ]);
    }
  },
  {
    title: '规格',
    dataIndex: 'skuSpecName',
    key: 'skuSpecName',
    width: 100,
    align: 'center'
  },
  {
    title: '库存数量',
    dataIndex: 'skuInvNum',
    key: 'skuInvNum',
    width: 120,
    align: 'center',
    sorter: (a: any, b: any) => a.skuInvNum - b.skuInvNum
  },
  {
    title: '销售价格',
    dataIndex: 'skuSalePrice',
    key: 'skuSalePrice',
    width: 120,
    align: 'center',
    sorter: (a: any, b: any) => a.skuSalePrice - b.skuSalePrice,
    customRender: ({ text }) => {
      const price = (text / 100).toFixed(2);
      return `¥${price}`;
    }
  },
  {
    title: '是否礼包',
    dataIndex: 'isVbPackage',
    key: 'isVbPackage',
    width: 100,
    align: 'center',
    filters: [
      { text: '礼包', value: true },
      { text: '单品', value: false }
    ],
    onFilter: (value: any, record: any) => record.isVbPackage === value,
    customRender: ({ record }) => {
      if (record.isVbPackage) {
        return h(Tag, { color: 'green' }, () => '礼包');
      }
      return h(Tag, { color: 'default' }, () => '单品');
    }
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right',
    customRender: ({ record }) => {
      return h('div', { class: 'flex gap-2' }, [
        h(Button, {
          type: 'link',
          size: 'small',
          onClick: () => {
            navigator.clipboard.writeText(record.skuCode);
            message.success('标识符已复制');
          }
        }, () => '复制标识符'),
        h(Button, {
          type: 'link',
          size: 'small',
          onClick: () => {
            const orderJson = JSON.stringify({
              skuId: record.skuId,
              skuCode: record.skuCode,
              quantity: 1
            });
            navigator.clipboard.writeText(orderJson);
            message.success('下单JSON已复制');
          }
        }, () => '复制JSON')
      ]);
    }
  }
];

// 获取活动列表
async function fetchActivityList() {
  try {
    loadingActivities.value = true;
    // 使用专门的欧莱雅活动接口
    const response = await getActivityList({});
    
    console.log('欧莱雅活动列表响应:', response);
    
    // 处理响应数据
    const list = response?.list || [];
    
    if (Array.isArray(list) && list.length > 0) {
      // 活动已经按照开始时间倒序排序（后端已处理）
      activityOptions.value = list.map((item: any) => ({
        label: `活动${item.id} - ${dayjs(item.startTime).format('YYYY-MM-DD')} ~ ${dayjs(item.endTime).format('YYYY-MM-DD')}`,
        value: item.id,
        startTime: item.startTime,
        endTime: item.endTime
      }));
      
      // 默认选择最新的活动
      if (activityOptions.value.length > 0 && !selectedActivityId.value) {
        selectedActivityId.value = activityOptions.value[0].value;
      }
      
      message.success(`加载了 ${activityOptions.value.length} 个欧莱雅活动`);
    } else {
      message.warning('没有找到欧莱雅活动，请先创建活动');
      activityOptions.value = [];
    }
  } catch (error: any) {
    console.error('获取欧莱雅活动列表失败:', error);
    message.error(`获取活动列表失败: ${error?.message || '未知错误'}`);
    activityOptions.value = [];
  } finally {
    loadingActivities.value = false;
  }
}

// 根据活动ID获取产品数据
async function fetchProductsByActivity(activityId: number) {
  try {
    loading.value = true;
    console.log('正在获取活动数据，活动ID:', activityId);
    
    const response = await getLorealDatabaseByActivity({ activityId });
    console.log('获取活动数据响应:', response);
    
    // 处理响应数据 - response 已经是 data 部分了（requestClient 配置了 responseReturn: 'data'）
    const data = response;
    
    if (data && data.id) {
      currentDatabase.value = data;
      // 确保 products 是数组
      const products = Array.isArray(data.products) ? data.products : 
                      (data.products ? JSON.parse(data.products) : []);
      allProducts.value = products;
      productList.value = paginatedProducts.value;
      
      // 显示数据统计
      if (allProducts.value.length > 0) {
        const totalProducts = allProducts.value.length;
        const totalStock = allProducts.value.reduce((sum: number, p: any) => sum + (p.skuInvNum || 0), 0);
        const avgPrice = (allProducts.value.reduce((sum: number, p: any) => sum + (p.skuSalePrice || 0), 0) / totalProducts / 100).toFixed(2);
        
        message.success(`成功加载 ${totalProducts} 个商品，总库存 ${totalStock}，平均价格 ¥${avgPrice}`);
      } else {
        message.warning('该活动数据库存在但暂无商品数据');
      }
    } else {
      allProducts.value = [];
      productList.value = [];
      currentDatabase.value = null;
      message.info('该活动尚未爬取商品数据，请先爬取');
    }
  } catch (error: any) {
    console.error('获取产品数据失败:', error);
    
    // 根据错误类型显示不同的消息
    if (error?.response?.status === 404) {
      message.info('该活动尚未爬取商品数据，请先爬取');
    } else {
      message.error(`获取产品数据失败: ${error?.message || '未知错误'}`);
    }
    
    allProducts.value = [];
    productList.value = [];
    currentDatabase.value = null;
  } finally {
    loading.value = false;
  }
}

// 监听活动选择变化
watch(selectedActivityId, (newVal) => {
  if (newVal) {
    fetchProductsByActivity(newVal);
  }
});

// 搜索
function handleSearch() {
  productList.value = paginatedProducts.value;
}

// 表格分页变化
function handleTableChange(pager: TablePaginationConfig) {
  pagination.current = pager.current!;
  pagination.pageSize = pager.pageSize!;
  productList.value = paginatedProducts.value;
}

// 爬取数据
function handleCrawl() {
  if (!selectedActivityId.value) {
    message.warning('请先选择活动');
    return;
  }
  
  databaseModalApi.setState({ title: `爬取活动${selectedActivityId.value}的商品数据` }).setData({
    mode: 'create',
    activityId: selectedActivityId.value
  }).open();
}

// 更新数据
function handleUpdate() {
  if (!selectedActivityId.value || !currentDatabase.value) {
    message.warning('请先选择活动');
    return;
  }
  
  databaseModalApi.setState({ title: '更新欧莱雅商品数据' }).setData({
    mode: 'update',
    database: currentDatabase.value,
    activityId: selectedActivityId.value,
    activityOptions: activityOptions.value
  }).open();
}



// 下载赠品表数据
async function handleDownloadHotSale() {
  try {
    downloadingHotSale.value = true;
    const response = await getHotSaleData();
    
    // 创建 Blob 对象
    const blob = new Blob([response], { type: 'text/plain;charset=utf-8' });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `赠品表_${dayjs().format('YYYY-MM-DD_HHmmss')}.txt`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    message.success('下载成功');
  } catch (error) {
    message.error('下载失败');
  } finally {
    downloadingHotSale.value = false;
  }
}

// 删除数据库记录
async function handleDeleteDatabase() {
  if (!currentDatabase.value || !currentDatabase.value.id) {
    message.warning('请先选择要删除的数据');
    return;
  }
  
  // 使用 Ant Design Vue 的 Modal.confirm
  const Modal = await import('ant-design-vue').then(m => m.Modal);
  
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除活动${selectedActivityId.value}的商品数据吗？此操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteLorealDatabase(currentDatabase.value.id);
        message.success('删除成功');
        
        // 清空当前数据
        currentDatabase.value = null;
        allProducts.value = [];
        productList.value = [];
        
        // 重新获取活动列表
        await fetchActivityList();
        
        // 如果还有活动，选择第一个
        if (activityOptions.value.length > 0) {
          selectedActivityId.value = activityOptions.value[0].value;
        } else {
          selectedActivityId.value = undefined;
        }
      } catch (error: any) {
        message.error(`删除失败: ${error?.message || '未知错误'}`);
      }
    }
  });
}

onMounted(() => {
  fetchActivityList();
});
</script>

<template>
  <Page content-class="p-4" :title="$t('page.home.lorealDatabase')">
    <DatabaseModal />
    
    <Card :title="$t('page.home.lorealDatabase')">
      <!-- 搜索区域 -->
      <div class="mb-4">
        <div class="flex items-center gap-4 mb-4">
          <Select
            v-model:value="selectedActivityId"
            :placeholder="'请选择活动'"
            :options="activityOptions"
            :loading="loadingActivities"
            style="width: 350px"
          />
          <Input
            v-model:value="searchKeyword"
            placeholder="搜索商品名称、标识符、规格等"
            style="width: 300px"
            @pressEnter="handleSearch"
          />
          <Button type="primary" @click="handleSearch">搜索</Button>
          <div class="flex-1"></div>
          <Button type="primary" @click="handleCrawl">爬取数据</Button>
          <Button @click="handleUpdate" :disabled="!currentDatabase">更新数据</Button>
          <Button 
            danger
            @click="handleDeleteDatabase" 
            :disabled="!currentDatabase"
          >
            删除数据
          </Button>
          <Button 
            type="default" 
            @click="handleDownloadHotSale"
            :loading="downloadingHotSale"
          >
            下载赠品表
          </Button>
        </div>
        
        <!-- 数据统计信息 -->
        <div v-if="currentDatabase" class="mb-2 text-sm text-gray-600">
          <Space>
            <span>爬取时间: {{ dayjs(currentDatabase.scrapedAt).format('YYYY-MM-DD HH:mm:ss') }}</span>
            <span>商品总数: {{ allProducts.length }}</span>
            <span>总库存: {{ allProducts.reduce((sum, p) => sum + p.skuInvNum, 0) }}</span>
          </Space>
        </div>
      </div>

      <!-- 表格 -->
      <Table
        v-if="selectedActivityId"
        :dataSource="productList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        :scroll="{ x: 1500 }"
        rowKey="skuId"
      />
      
      <!-- 空状态 -->
      <Empty 
        v-else
        description="请选择活动查看商品数据"
        class="py-16"
      />
    </Card>
  </Page>
</template>

<style scoped>
.text-sm {
  font-size: 0.875rem;
}
.text-xs {
  font-size: 0.75rem;
}
.text-gray-500 {
  color: #6b7280;
}
.text-gray-600 {
  color: #4b5563;
}
.font-medium {
  font-weight: 500;
}
.font-semibold {
  font-weight: 600;
}
.text-red-500 {
  color: #ef4444;
}
.cursor-pointer {
  cursor: pointer;
}
.hover\:text-blue-500:hover {
  color: #3b82f6;
}
</style>