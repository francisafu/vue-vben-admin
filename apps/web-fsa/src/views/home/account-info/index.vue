<script setup lang="ts">
import type { ActivityApi, AccountInfoApi } from '#/api/core';

import { onMounted, ref, computed } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Card, message, Select, Table, Descriptions, Tag, Button, Popconfirm } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';

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
    title: $t('page.accountInfo.account'),
    dataIndex: 'account',
    key: 'account',
    width: 120
  },
  {
    title: $t('page.accountInfo.password'),
    dataIndex: 'password',
    key: 'password',
    width: 120
  },
  {
    title: $t('page.accountInfo.address'),
    key: 'address',
    width: 200,
    customRender: ({ record }: { record: AccountInfoApi.AccountInfoItem }) => {
      const addr = record.address;
      if (!addr) return '';
      return `${addr.userName || ''} ${addr.mobilePhone || ''} ${addr.provinceName || ''}${addr.cityName || ''}${addr.districtName || ''}${addr.addrDetail || ''}`;
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

        <div style="width: 100%; height: 600px;">
          <Table 
            :columns="columns" 
            :dataSource="accountInfoList" 
            :loading="loading"
            rowKey="id"
            :scroll="{ y: 500, x: 780 }"
            :pagination="false"
          >
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
</style>
