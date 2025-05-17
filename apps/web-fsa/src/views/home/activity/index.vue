<script setup lang="ts">
import type { ActivityApi } from '#/api/core/activity';

import { onMounted, ref, reactive, h } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, Card, message, Select, Table, DatePicker } from 'ant-design-vue';
import type { TablePaginationConfig, ColumnsType } from 'ant-design-vue/es/table';

import { $t } from '#/locales';
import {
  listActivitiesApi,
  deleteActivityApi
} from '#/api/core/activity';

import ActivityModal from './activity-modal.vue';
import dayjs from 'dayjs';

// 活动数据
const activityList = ref<ActivityApi.ActivityItem[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total) => `${$t('page.common.total')} ${total} ${$t('page.common.items')}`
});

// 搜索参数
const searchParams = ref<ActivityApi.ListActivitiesParams>({
  page: 1,
  pageSize: 10,
  brand: undefined,
  timeRange: undefined
});

const [Modal, modalApi] = useVbenModal({
  connectedComponent: ActivityModal,
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      if (data && data.operationSuccess) {
        // 活动操作成功后，刷新活动列表
        await fetchActivityList();
      }
    }
  }
});

// 品牌映射
const brandMap: Record<string, string> = {
  'LOREAL': $t('page.activity.brandLOREAL'),
  'ESTEE': $t('page.activity.brandESTEE'),
  'LOCCITANE': $t('page.activity.brandLOCCITANE')
};

// 获取活动状态
function getActivityStatus(startTime: string, endTime: string) {
  const now = dayjs();
  const start = dayjs(startTime);
  const end = dayjs(endTime);

  if (now.isBefore(start)) {
    return { text: $t('page.activity.statusNotStarted'), type: 'default' };
  } else if (now.isAfter(end)) {
    return { text: $t('page.activity.statusEnded'), type: 'danger' };
  } else {
    return { text: $t('page.activity.statusInProgress'), type: 'success' };
  }
}

// 生成活动名称
function generateActivityName(brand: string, startTime: string) {
  const date = dayjs(startTime);
  const yearMonth = date.format('YYYY.MM');
  return `${brandMap[brand] || brand}-${yearMonth}`;
}

// 表格列定义
const columns: ColumnsType = [
  {
    title: $t('page.common.seqNo'),
    key: 'seq',
    width: 60,
    customRender: ({ index }: { index: number }) => {
      return (pagination.current! - 1) * pagination.pageSize! + index + 1;
    }
  },
  {
    title: $t('page.activity.name'),
    key: 'name',
    minWidth: 150,
    customRender: ({ record }: { record: ActivityApi.ActivityItem }) => {
      return generateActivityName(record.brand, record.startTime);
    }
  },
  {
    title: $t('page.activity.startTime'),
    dataIndex: 'startTime',
    key: 'startTime',
    minWidth: 170,
    customRender: ({ text }: { text: string }) => {
      return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  {
    title: $t('page.activity.endTime'),
    dataIndex: 'endTime',
    key: 'endTime',
    minWidth: 170,
    customRender: ({ text }: { text: string }) => {
      return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  {
    title: $t('page.activity.status'),
    key: 'status',
    minWidth: 100,
    customRender: ({ record }: { record: ActivityApi.ActivityItem }) => {
      const status = getActivityStatus(record.startTime, record.endTime);
      const buttonType = status.type === 'success' ? 'primary' : 
                         status.type === 'danger' ? 'danger' : 'default';
      
      const buttonStyle = status.type === 'success' ? 
        { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {};
      
      return h(Button, {
        type: buttonType as 'primary' | 'default' | 'dashed' | 'text' | 'link',
        size: 'small',
        style: buttonStyle
      }, () => status.text);
    }
  },
  {
    title: $t('page.activity.userCount'),
    dataIndex: 'userCount',
    key: 'userCount',
    width: 120
  },
  {
    title: $t('page.activity.accountTotal'),
    dataIndex: 'accountTotal',
    key: 'accountTotal',
    width: 120
  },
  {
    title: $t('page.activity.taskCount'),
    dataIndex: 'taskCount',
    key: 'taskCount',
    width: 120
  },
  {
    title: $t('page.common.action'),
    key: 'action',
    minWidth: 150
  }
];

// 创建活动按钮
function handleCreateActivity() {
  modalApi.setState({ title: $t('page.activity.addActivity') }).setData({
    activityData: null,
    isEdit: false
  }).open();
}

// 编辑活动按钮
function handleEditActivity(row: ActivityApi.ActivityItem) {
  modalApi.setState({ title: $t('page.activity.editActivity') }).setData({
    activityData: row,
    isEdit: true
  }).open();
}

// 删除活动按钮
async function handleDeleteActivity(row: ActivityApi.ActivityItem) {
  try {
    loading.value = true;
    await deleteActivityApi(row.id);
    message.success($t('page.activity.deleteActivitySuccess'));

    // 刷新活动列表
    await fetchActivityList();
  } catch (error) {
    message.error($t('page.activity.deleteActivityError'));
  } finally {
    loading.value = false;
  }
}

// 获取活动列表
async function fetchActivityList(params = searchParams.value) {
  try {
    loading.value = true;
    const res = await listActivitiesApi({
      ...params,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10
    });

    activityList.value = res.list;
    pagination.current = res.pagination.current;
    pagination.pageSize = res.pagination.pageSize;
    pagination.total = res.pagination.total;
  } catch (error) {
    message.error($t('page.activity.fetchActivityListError'));
  } finally {
    loading.value = false;
  }
}

// 处理表格变化（分页、排序、筛选）
function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchActivityList();
}

// 处理搜索
function handleSearch() {
  pagination.current = 1;
  
  // 处理时间范围
  if (searchParams.value.timeRange && searchParams.value.timeRange.length === 2) {
    // 转换时间范围：开始时间设为当天 00:00:00，结束时间设为当天 23:59:59
    const formattedTimeRange: [string, string] = [
      dayjs(searchParams.value.timeRange[0]).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
      dayjs(searchParams.value.timeRange[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss')
    ];
    
    // 创建一个新的对象而不是修改原对象
    const params = {
      ...searchParams.value,
      timeRange: formattedTimeRange
    };
    
    fetchActivityList(params);
  } else {
    fetchActivityList();
  }
}

// 处理重置搜索
function handleReset() {
  searchParams.value = {
    page: 1,
    pageSize: 10,
    brand: undefined,
    timeRange: undefined
  };
  pagination.current = 1;
  fetchActivityList();
}

// 初始化页面
onMounted(async () => {
  await fetchActivityList();
});
</script>

<template>
  <Page>
    <Modal />
    <div class="p-4">
      <h1 class="mb-4 text-2xl font-bold">{{ $t('page.activity.title') }}</h1>

      <!-- 搜索表单Card -->
      <Card :bordered="false" class="mb-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center">
            <span class="mr-2">{{ $t('page.activity.brand') }}</span>
            <Select
              v-model:value="searchParams.brand"
              :placeholder="$t('page.activity.brandPlaceholder')"
              style="width: 120px"
              allowClear
            >
              <Select.Option value="LOREAL">{{ $t('page.activity.brandLOREAL') }}</Select.Option>
              <Select.Option value="ESTEE">{{ $t('page.activity.brandESTEE') }}</Select.Option>
              <Select.Option value="LOCCITANE">{{ $t('page.activity.brandLOCCITANE') }}</Select.Option>
            </Select>
          </div>

          <div class="flex items-center">
            <span class="mr-2">{{ $t('page.activity.timeRange') }}</span>
            <DatePicker.RangePicker
              v-model:value="searchParams.timeRange"
              :placeholder="[$t('page.activity.startTimePlaceholder'), $t('page.activity.endTimePlaceholder')]"
              style="width: 280px"
              format="YYYY-MM-DD"
            />
          </div>

          <div class="flex items-center ml-4">
            <Button type="primary" @click="handleSearch" class="mr-2">
              {{ $t('page.common.search') }}
            </Button>

            <Button @click="handleReset">
              {{ $t('page.common.clear') }}
            </Button>
          </div>
        </div>
      </Card>

      <!-- 表格Card -->
      <Card :bordered="false">
        <template #extra>
          <Button type="primary" @click="handleCreateActivity">
            {{ $t('page.activity.addActivity') }}
          </Button>
        </template>

        <div style="width: 100%; height: 880px;">
          <Table 
            :columns="columns" 
            :dataSource="activityList" 
            :pagination="pagination"
            :loading="loading"
            rowKey="id"
            :scroll="{ y: 750 }"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <Button type="link" @click="() => handleEditActivity(record as unknown as ActivityApi.ActivityItem)">
                  {{ $t('page.common.edit') }}
                </Button>
                <Button type="link" danger @click="() => handleDeleteActivity(record as unknown as ActivityApi.ActivityItem)">
                  {{ $t('page.common.delete') }}
                </Button>
              </template>
            </template>
          </Table>
        </div>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.text-success {
  color: #52c41a;
}
.text-danger {
  color: #f5222d;
}
</style>
