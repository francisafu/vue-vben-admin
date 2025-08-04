<script setup lang="ts">
import { onMounted, ref, reactive, h } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { 
  Button, 
  Card, 
  message, 
  Select, 
  Table, 
  Tag, 
  Popconfirm,
  Space
} from 'ant-design-vue';
import type { TablePaginationConfig, ColumnsType } from 'ant-design-vue/es/table';

import { $t } from '#/locales';
import {
  getLorealDatabaseList,
  deleteLorealDatabase,
  getLorealDatabaseDetail,
  getHotSaleData,
  getActivityList
} from '#/api/core/lorealDatabase';

import LorealDatabaseModal from './loreal-database-modal.vue';
import LorealDatabaseDetailModal from './loreal-database-detail-modal.vue';
import dayjs from 'dayjs';

// 数据库列表
const databaseList = ref<any[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total) => `共 ${total} 条`
});

// 搜索参数
const searchParams = ref({
  page: 1,
  pageSize: 10,
  activityId: undefined
});

// 活动选项
const activityOptions = ref<any[]>([]);
const loadingActivities = ref(false);

// 热卖活动下载中
const downloadingHotSale = ref(false);

// 弹窗控制
const [DatabaseModal, databaseModalApi] = useVbenModal({
  connectedComponent: LorealDatabaseModal,
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) {
      const data = databaseModalApi.getData<Record<string, any>>();
      if (data && data.operationSuccess) {
        // 操作成功后，刷新列表
        await fetchDatabaseList();
      }
    }
  }
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: LorealDatabaseDetailModal,
});

// 表格列配置
const columns: ColumnsType = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '活动',
    key: 'activity',
    width: 300,
    customRender: ({ record }) => {
      const { activity } = record;
      if (!activity) return '-';
      
      const brand = activity.brand === 'LOREAL' ? '欧莱雅' : activity.brand;
      const startTime = dayjs(activity.startTime).format('YYYY-MM-DD');
      const endTime = dayjs(activity.endTime).format('YYYY-MM-DD');
      
      return h('div', [
        h('div', `${brand} - 活动ID: ${activity.id}`),
        h('div', { class: 'text-sm text-gray-500' }, `${startTime} ~ ${endTime}`)
      ]);
    }
  },
  {
    title: '商品数量',
    dataIndex: 'productCount',
    key: 'productCount',
    width: 120,
    align: 'center',
    customRender: ({ record }) => {
      return h(Tag, { color: 'blue' }, () => `${record.productCount} 个`);
    }
  },
  {
    title: '爬取时间',
    dataIndex: 'scrapedAt',
    key: 'scrapedAt',
    width: 180,
    customRender: ({ record }) => {
      return dayjs(record.scrapedAt).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
    customRender: ({ record }) => {
      return dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
    customRender: ({ record }) => {
      return h(Space, [
        h(Button, {
          type: 'link',
          size: 'small',
          onClick: () => handleView(record)
        }, () => '查看'),
        h(Button, {
          type: 'link',
          size: 'small',
          onClick: () => handleUpdate(record)
        }, () => '更新'),
        h(Popconfirm, {
          title: '确定要删除这条记录吗？',
          onConfirm: () => handleDelete(record)
        }, () => h(Button, {
          type: 'link',
          size: 'small',
          danger: true
        }, () => '删除'))
      ]);
    }
  }
];

// 获取活动列表
async function fetchActivityList() {
  try {
    loadingActivities.value = true;
    const { data } = await getActivityList({
      page: 1,
      pageSize: 100,
      brand: 'LOREAL' // 只获取欧莱雅的活动
    });
    
    if (data && data.list) {
      activityOptions.value = data.list.map((item: any) => ({
        label: `活动${item.id} - ${dayjs(item.startTime).format('YYYY-MM-DD')} ~ ${dayjs(item.endTime).format('YYYY-MM-DD')}`,
        value: item.id
      }));
    }
  } catch (error) {
    message.error('获取活动列表失败');
  } finally {
    loadingActivities.value = false;
  }
}

// 获取数据库列表
async function fetchDatabaseList() {
  try {
    loading.value = true;
    const { data } = await getLorealDatabaseList({
      ...searchParams.value,
      page: pagination.current,
      pageSize: pagination.pageSize
    });
    
    if (data) {
      databaseList.value = data.list || [];
      pagination.total = data.pagination?.total || 0;
    }
  } catch (error) {
    message.error('获取数据库列表失败');
  } finally {
    loading.value = false;
  }
}

// 搜索
function handleSearch() {
  pagination.current = 1;
  fetchDatabaseList();
}

// 重置搜索
function handleReset() {
  searchParams.value = {
    page: 1,
    pageSize: 10,
    activityId: undefined
  };
  pagination.current = 1;
  fetchDatabaseList();
}

// 表格分页变化
function handleTableChange(pager: TablePaginationConfig) {
  pagination.current = pager.current!;
  pagination.pageSize = pager.pageSize!;
  fetchDatabaseList();
}

// 添加数据库
function handleAdd() {
  databaseModalApi.setState({ title: '添加欧莱雅数据库' }).setData({
    mode: 'create',
    activityOptions: activityOptions.value
  }).open();
}

// 查看详情
async function handleView(record: any) {
  try {
    const { data } = await getLorealDatabaseDetail(record.id);
    detailModalApi.setState({ title: '欧莱雅数据库详情' }).setData({
      database: data
    }).open();
  } catch (error) {
    message.error('获取数据库详情失败');
  }
}

// 更新数据库
function handleUpdate(record: any) {
  databaseModalApi.setState({ title: '更新欧莱雅数据库' }).setData({
    mode: 'update',
    database: record,
    activityOptions: activityOptions.value
  }).open();
}

// 删除数据库
async function handleDelete(record: any) {
  try {
    await deleteLorealDatabase(record.id);
    message.success('删除成功');
    await fetchDatabaseList();
  } catch (error) {
    message.error('删除失败');
  }
}

// 下载热卖活动数据
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
    link.download = `热卖活动_${dayjs().format('YYYY-MM-DD_HHmmss')}.txt`;
    
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

onMounted(() => {
  fetchActivityList();
  fetchDatabaseList();
});
</script>

<template>
  <Page content-class="p-4" :title="$t('page.home.lorealDatabase')">
    <DatabaseModal />
    <DetailModal />
    
    <Card :title="$t('page.home.lorealDatabase')">
      <!-- 搜索区域 -->
      <div class="mb-4">
        <div class="flex items-center gap-4 mb-4">
          <Select
            v-model:value="searchParams.activityId"
            :placeholder="'请选择活动'"
            :options="activityOptions"
            :loading="loadingActivities"
            allowClear
            style="width: 300px"
          />
          <Button type="primary" @click="handleSearch">搜索</Button>
          <Button @click="handleReset">重置</Button>
          <div class="flex-1"></div>
          <Button type="primary" @click="handleAdd">添加数据库</Button>
          <Button 
            type="default" 
            @click="handleDownloadHotSale"
            :loading="downloadingHotSale"
          >
            下载热卖活动
          </Button>
        </div>
      </div>

      <!-- 表格 -->
      <Table
        :dataSource="databaseList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        :scroll="{ x: 1200 }"
        rowKey="id"
      />
    </Card>
  </Page>
</template>

<style scoped>
.text-sm {
  font-size: 0.875rem;
}
.text-gray-500 {
  color: #6b7280;
}
</style>