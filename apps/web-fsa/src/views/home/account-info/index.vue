<script setup lang="ts">
import type { ActivityApi, AccountInfoApi } from '#/api/core';

import { onMounted, ref, computed, h } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Card, message, Select, Table, Descriptions, Tag, Button, Popconfirm } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';

import { Eye, EyeOff } from '@vben/icons';
import { $t } from '#/locales';
import { getUserActivitiesApi } from '#/api/core/activity';
import { listAccountInfosApi, deleteAccountInfoApi } from '#/api/core/account-info';
import dayjs from 'dayjs';

import AccountInfoModal from './account-info-modal.vue';

// 用户活动数据
const userActivities = ref<ActivityApi.UserActivityItem[]>([]);
const loadingActivities = ref(false);

// 选中的活动ID
const selectedActivityId = ref<number | undefined>(undefined);

// 抢购账号数据
const accountInfoList = ref<AccountInfoApi.AccountInfoItem[]>([]);
const loading = ref(false);
const accountInfoData = ref<AccountInfoApi.AccountInfoListResult | null>(null);

// 当前时间
const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'));

// 显示/隐藏状态
const showAccount = ref(true);
const showPassword = ref(true);
const showAddress = ref(true);

// 任务相关状态
const accountTasksMap = ref<Record<number, AccountInfoApi.TaskInfo[]>>({});
const accountTasksLoadingMap = ref<Record<number, boolean>>({});

// Modal配置
const [Modal, modalApi] = useVbenModal({
  connectedComponent: AccountInfoModal,
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      if (data && data.operationSuccess) {
        // 账号操作成功后，刷新账号列表
        await fetchAccountInfoList();
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

// 生成活动选项
const activityOptions = computed(() => {
  return userActivities.value.map(activity => {
    const date = new Date(activity.startTime);
    const yearMonth = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = `${brandMap[activity.brand] || activity.brand}-${yearMonth}`;
    
    return {
      label,
      value: activity.id
    };
  });
});

// 获取当前选中的活动信息
const selectedActivity = computed(() => {
  if (!selectedActivityId.value) return null;
  return userActivities.value.find(activity => activity.id === selectedActivityId.value);
});

// 获取活动状态
function getActivityStatus(startTime: string, endTime: string) {
  const now = dayjs();
  const start = dayjs(startTime);
  const end = dayjs(endTime);

  if (now.isBefore(start)) {
    return { text: $t('page.activity.statusNotStarted'), type: 'blue' };
  } else if (now.isAfter(end)) {
    return { text: $t('page.activity.statusEnded'), type: 'red' };
  } else {
    return { text: $t('page.activity.statusInProgress'), type: 'green' };
  }
}

// 切换账号显示状态
function toggleAccountVisibility() {
  showAccount.value = !showAccount.value;
}

// 切换密码显示状态
function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}

// 切换地址显示状态
function toggleAddressVisibility() {
  showAddress.value = !showAddress.value;
}

// 格式化账号显示
function formatAccount(account: string) {
  if (showAccount.value) {
    return account;
  }
  return '*'.repeat(account.length);
}

// 格式化密码显示
function formatPassword(password: string) {
  if (showPassword.value) {
    return password;
  }
  return '*'.repeat(password.length);
}

// 格式化地址显示
function formatAddress(address: any) {
  if (!address) return '';
  
  const fullAddress = `${address.userName || ''} ${address.mobilePhone || ''} ${address.provinceName || ''}${address.cityName || ''}${address.districtName || ''}${address.addrDetail || ''}`;
  
  if (showAddress.value) {
    return fullAddress;
  }
  return '*'.repeat(fullAddress.length);
}

// 表格列定义
const columns: ColumnsType = [
  {
    title: $t('page.common.seqNo'),
    key: 'seq',
    width: 80,
    customRender: ({ index }: { index: number }) => {
      return index + 1;
    }
  },
  {
    title: () => {
      return h('div', { style: 'display: flex; align-items: center; justify-content: space-between;' }, [
        h('span', $t('page.accountInfo.account')),
        h(Button, {
          type: 'text',
          size: 'small',
          onClick: toggleAccountVisibility,
          style: 'padding: 0; min-width: auto; height: auto;'
        }, {
          icon: () => showAccount.value ? h(Eye) : h(EyeOff)
        })
      ]);
    },
    key: 'account',
    width: 120,
    customRender: ({ record }: { record: AccountInfoApi.AccountInfoItem }) => {
      return formatAccount(record.account);
    }
  },
  {
    title: () => {
      return h('div', { style: 'display: flex; align-items: center; justify-content: space-between;' }, [
        h('span', $t('page.accountInfo.password')),
        h(Button, {
          type: 'text',
          size: 'small',
          onClick: togglePasswordVisibility,
          style: 'padding: 0; min-width: auto; height: auto;'
        }, {
          icon: () => showPassword.value ? h(Eye) : h(EyeOff)
        })
      ]);
    },
    key: 'password',
    width: 120,
    customRender: ({ record }: { record: AccountInfoApi.AccountInfoItem }) => {
      return formatPassword(record.password);
    }
  },
  {
    title: () => {
      return h('div', { style: 'display: flex; align-items: center; justify-content: space-between;' }, [
        h('span', $t('page.accountInfo.address')),
        h(Button, {
          type: 'text',
          size: 'small',
          onClick: toggleAddressVisibility,
          style: 'padding: 0; min-width: auto; height: auto;'
        }, {
          icon: () => showAddress.value ? h(Eye) : h(EyeOff)
        })
      ]);
    },
    key: 'address',
    width: 200,
    customRender: ({ record }: { record: AccountInfoApi.AccountInfoItem }) => {
      const addr = record.address;
      if (!addr) return '';
      return formatAddress(addr);
    }
  },
  {
    title: $t('page.accountInfo.taskCount'),
    dataIndex: 'taskCount',
    key: 'taskCount',
    width: 100
  },
  {
    title: $t('page.common.action'),
    key: 'action',
    width: 160,
    fixed: 'right'
  }
];

// 任务子表格列定义
const taskColumns: ColumnsType = [
  {
    title: $t('page.common.seqNo'),
    key: 'seq',
    width: 60,
    customRender: ({ index }: { index: number }) => {
      return index + 1;
    }
  },
  {
    title: '商品数量',
    key: 'productCount',
    width: 100,
    customRender: ({ record }: { record: AccountInfoApi.TaskInfo }) => {
      return record.products ? record.products.length : 0;
    }
  },
  {
    title: '订单间隔',
    dataIndex: 'ordersDelay',
    key: 'ordersDelay',
    width: 100,
    customRender: ({ text }: { text: number }) => {
      return `${text}ms`;
    }
  },
  {
    title: '是否定时',
    dataIndex: 'isScheduled',
    key: 'isScheduled',
    width: 100,
    customRender: ({ text }: { text: boolean }) => {
      return text ? '是' : '否';
    }
  },
  {
    title: '启动时间',
    dataIndex: 'startTime',
    key: 'startTime',
    width: 170,
    customRender: ({ text }: { text: string | null }) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
    }
  },
  {
    title: '是否轮询',
    dataIndex: 'isPolling',
    key: 'isPolling',
    width: 100,
    customRender: ({ text }: { text: boolean }) => {
      return text ? '是' : '否';
    }
  },
  {
    title: $t('page.common.action'),
    key: 'action',
    width: 160,
    fixed: 'right'
  }
];

// 获取用户活动列表
async function fetchUserActivities() {
  try {
    loadingActivities.value = true;
    const activities = await getUserActivitiesApi();
    userActivities.value = activities;
    
    // 如果有活动，默认选择第一个
    if (activities.length > 0 && activities[0]) {
      selectedActivityId.value = activities[0].id;
      await fetchAccountInfoList();
    }
  } catch (error) {
    message.error($t('page.accountInfo.fetchActivitiesError'));
  } finally {
    loadingActivities.value = false;
  }
}

// 获取抢购账号列表
async function fetchAccountInfoList() {
  if (!selectedActivityId.value) {
    accountInfoList.value = [];
    accountInfoData.value = null;
    return;
  }

  try {
    loading.value = true;
    const result = await listAccountInfosApi({
      activityId: selectedActivityId.value
    });
    
    accountInfoData.value = result;
    accountInfoList.value = result.accountInfos;
    
    // 提取任务数据到映射中
    result.accountInfos.forEach(accountInfo => {
      if (accountInfo.tasks && accountInfo.tasks.length > 0) {
        accountTasksMap.value[accountInfo.id] = accountInfo.tasks;
      } else {
        accountTasksMap.value[accountInfo.id] = [];
      }
    });
  } catch (error) {
    message.error($t('page.accountInfo.fetchAccountInfoError'));
    accountInfoList.value = [];
    accountInfoData.value = null;
  } finally {
    loading.value = false;
  }
}

// 处理活动选择变化
async function handleActivityChange(value: any) {
  const activityId = Number(value);
  if (!isNaN(activityId)) {
    selectedActivityId.value = activityId;
    await fetchAccountInfoList();
  }
}

// 处理新建账号
function handleCreateAccountInfo() {
  if (!selectedActivityId.value) {
    message.warning($t('page.accountInfo.pleaseSelectActivity'));
    return;
  }
  
  modalApi.setState({ title: $t('page.accountInfo.addAccountInfo') }).setData({
    accountInfoData: null,
    isEdit: false,
    activityId: selectedActivityId.value
  }).open();
}

// 处理编辑账号
function handleEditAccountInfo(row: AccountInfoApi.AccountInfoItem) {
  modalApi.setState({ title: $t('page.accountInfo.editAccountInfo') }).setData({
    accountInfoData: row,
    isEdit: true,
    activityId: selectedActivityId.value
  }).open();
}

// 处理删除账号
async function handleDeleteAccountInfo(row: AccountInfoApi.AccountInfoItem) {
  try {
    loading.value = true;
    await deleteAccountInfoApi(row.id);
    message.success($t('page.accountInfo.deleteAccountInfoSuccess'));

    // 刷新账号列表
    await fetchAccountInfoList();
  } catch (error) {
    message.error($t('page.accountInfo.deleteAccountInfoError'));
  } finally {
    loading.value = false;
  }
}

// 处理表格展开
function handleExpand(expanded: boolean, record: AccountInfoApi.AccountInfoItem) {
  if (expanded) {
    // 如果任务数据还未加载或为空，则显示loading状态
    if (!accountTasksMap.value[record.id]) {
      accountTasksLoadingMap.value[record.id] = false; // 数据已经在fetchAccountInfoList中加载了
    }
  }
}

// 处理新建任务（暂时无功能）
function handleCreateTask(accountId: number) {
  message.info('新建任务功能即将开放，敬请期待！');
}

// 更新当前时间
function updateCurrentTime() {
  currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
}

// 初始化页面
onMounted(async () => {
  await fetchUserActivities();
  
  // 每秒更新当前时间
  setInterval(updateCurrentTime, 1000);
});
</script>

<template>
  <Page>
    <Modal />
    <div class="p-4">
      <h1 class="mb-4 text-2xl font-bold">{{ $t('page.accountInfo.title') }}</h1>

      <!-- 活动选择Card -->
      <Card :bordered="false" class="mb-4">
        <div class="flex items-center">
          <span class="mr-2 font-medium">{{ $t('page.accountInfo.selectActivity') }}：</span>
          <Select
            v-model:value="selectedActivityId"
            :placeholder="$t('page.accountInfo.selectActivityPlaceholder')"
            style="width: 300px"
            :loading="loadingActivities"
            :options="activityOptions"
            @change="handleActivityChange"
          />
        </div>
      </Card>

      <!-- 活动信息Card -->
      <Card v-if="selectedActivity && accountInfoData" :bordered="false" class="mb-4">
        <template #title>
          <span>{{ $t('page.accountInfo.activityInfo') }}</span>
        </template>
        
        <Descriptions :column="3" size="small">
          <Descriptions.Item :label="$t('page.accountInfo.brand')">
            {{ brandMap[selectedActivity.brand] || selectedActivity.brand }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('page.accountInfo.startTime')">
            {{ dayjs(selectedActivity.startTime).format('YYYY-MM-DD HH:mm:ss') }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('page.accountInfo.endTime')">
            {{ dayjs(selectedActivity.endTime).format('YYYY-MM-DD HH:mm:ss') }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('page.accountInfo.accountUsage')">
            {{ accountInfoData.currentAccountCount }}/{{ accountInfoData.accountLimit }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('page.accountInfo.currentTime')">
            {{ currentTime }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('page.activity.status')">
            <Tag :color="getActivityStatus(selectedActivity.startTime, selectedActivity.endTime).type">
              {{ getActivityStatus(selectedActivity.startTime, selectedActivity.endTime).text }}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <!-- 表格Card -->
      <Card :bordered="false">
        <template #extra>
          <Button 
            type="primary" 
            @click="handleCreateAccountInfo"
            :disabled="!selectedActivityId"
          >
            {{ $t('page.accountInfo.addAccountInfo') }}
          </Button>
        </template>

        <div class="table-container">
          <Table 
            :columns="columns" 
            :dataSource="accountInfoList" 
            :loading="loading"
            rowKey="id"
            :scroll="{ x: 780 }"
            :pagination="false"
            @expand="handleExpand"
          >
            <!-- 展开图标列添加标题 -->
            <template #expandColumnTitle>
              <span>任务列表</span>
            </template>
            
            <!-- 展开行插槽 -->
            <template #expandedRowRender="{ record }">
              <div class="px-4">
                <div class="flex justify-between items-center mb-2">
                  <div class="font-medium">账号 {{ formatAccount(record.account) }} 的任务列表</div>
                  <div>
                    <Button 
                      type="primary" 
                      size="small" 
                      @click="() => handleCreateTask(record.id)"
                    >
                      新建任务
                    </Button>
                  </div>
                </div>
                
                <Table
                  :columns="taskColumns"
                  :dataSource="accountTasksMap[record.id] || []"
                  :loading="accountTasksLoadingMap[record.id]"
                  :pagination="false"
                  size="small"
                  rowKey="id"
                  bordered
                  :scroll="{ x: 1000 }"
                >
                  <template #bodyCell="{ column, record: taskRecord }">
                    <template v-if="column.key === 'action'">
                      <!-- 暂时留空，稍后添加任务操作按钮 -->
                    </template>
                  </template>
                </Table>
                
                <div v-if="accountTasksMap[record.id]?.length === 0" class="py-4 text-center text-gray-500">
                  该账号暂无任务
                </div>
              </div>
            </template>

            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <Button 
                  type="link" 
                  @click="() => handleEditAccountInfo(record as AccountInfoApi.AccountInfoItem)"
                >
                  {{ $t('page.common.edit') }}
                </Button>
                <Popconfirm
                  :title="$t('page.common.confirmDelete')"
                  @confirm="() => handleDeleteAccountInfo(record as AccountInfoApi.AccountInfoItem)"
                >
                  <Button type="link" danger>
                    {{ $t('page.common.delete') }}
                  </Button>
                </Popconfirm>
              </template>
            </template>

            <template #emptyText>
              <div class="py-8 text-center text-gray-500">
                {{ selectedActivityId ? $t('page.accountInfo.noAccountData') : $t('page.accountInfo.pleaseSelectActivity') }}
              </div>
            </template>
          </Table>
        </div>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
/* 使用CSS变量确保颜色跟随主题变化 */
.table-container {
  width: 100%;
  max-height: 80vh; /* 使用视口高度，更好地适应不同屏幕 */
  min-height: 400px; /* 确保最小高度 */
  overflow-y: auto;
  overflow-x: hidden; /* 水平滚动由Table组件内部处理 */
}

/* 当表格内容较少时，让容器自然收缩 */
.table-container :deep(.ant-table-wrapper) {
  height: auto;
}

/* 优化滚动条样式 */
.table-container::-webkit-scrollbar {
  width: 6px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
