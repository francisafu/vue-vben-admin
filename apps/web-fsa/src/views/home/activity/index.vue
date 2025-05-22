<script setup lang="ts">
import type { ActivityApi } from '#/api/core/activity';

import { onMounted, ref, reactive, h, computed } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, Card, message, Select, Table, DatePicker, Tag, Input, Popconfirm, InputNumber } from 'ant-design-vue';
import type { TablePaginationConfig, ColumnsType } from 'ant-design-vue/es/table';

import { $t } from '#/locales';
import {
  listActivitiesApi,
  deleteActivityApi,
  getActivityByIdApi,
  updateActivityUsersApi
} from '#/api/core/activity';
import { listUsersApi } from '#/api/core/user';

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

// 活动用户数据
const activityUsersMap = ref<Record<number, ActivityApi.ActivityUserItem[]>>({});
const activityUsersOriginalMap = ref<Record<number, ActivityApi.ActivityUserItem[]>>({});
const activityUsersLoadingMap = ref<Record<number, boolean>>({});
const activityUsersEditingMap = ref<Record<number, boolean>>({});
const activityUsersSavingMap = ref<Record<number, boolean>>({});
const newUserRow = ref<Record<number, { userId: number | null; accountLimit: number }>>({});

// 可选用户列表
const allUsers = ref<{ label: string; value: number }[]>([]);
const loadingUsers = ref(false);

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

// 角色映射
const roleMap: Record<string, string> = {
  'ADMIN': $t('page.user.roleAdmin'),
  'VIP': $t('page.user.roleVip'),
  'USER': $t('page.user.roleUser')
};

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
      return h(Tag, {
        color: status.type
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
    title: $t('page.activity.taskCount'),
    dataIndex: 'taskCount',
    key: 'taskCount',
    width: 120
  },
  {
    title: $t('page.activity.accountInfo'),
    dataIndex: 'accountTotal',
    key: 'accountTotal',
    width: 120,
    customRender: ({ record }: { record: ActivityApi.ActivityItem }) => {
      return `${record.accountTotal}/${record.accountLimitTotal}`;
    }
  },
  {
    title: $t('page.common.action'),
    key: 'action',
    minWidth: 150
  }
];

// 用户表格列定义
const userColumns: ColumnsType = [
  {
    title: $t('page.user.username'),
    dataIndex: 'username',
    key: 'username',
    width: 120
  },
  {
    title: $t('page.user.phone'),
    dataIndex: 'phone',
    key: 'phone',
    width: 120
  },
  {
    title: $t('page.user.role'),
    dataIndex: 'role',
    key: 'role',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      return roleMap[text] || text;
    }
  },
  {
    title: $t('page.activity.taskCount'),
    dataIndex: 'taskCount',
    key: 'taskCount',
    width: 100
  },
  {
    title: $t('page.activity.accountTotal'),
    key: 'accountInfo',
    width: 120,
    customRender: ({ record }: { record: ActivityApi.ActivityUserItem }) => {
      return `${record.accountCount}`;
    }
  },
  {
    title: $t('page.activity.accountLimit'),
    dataIndex: 'accountLimit',
    key: 'accountLimit',
    width: 120,
    customRender: ({ text, record, index }: { text: number, record: ActivityApi.ActivityUserItem, index: number }) => {
      const activityId = (record as any)._activityId;
      
      if (!activityUsersEditingMap.value[activityId]) {
        return text;
      }
      
      return h(InputNumber, {
        value: text,
        min: 1,
        style: { width: '100px' },
        onChange: (value: number) => {
          const users = activityUsersMap.value[activityId];
          if (users && users[index]) {
            users[index] = { ...users[index], accountLimit: value };
          }
        }
      });
    }
  },
  {
    title: $t('page.common.action'),
    key: 'action',
    width: 120
  }
];

// 新增用户行列定义
const newUserColumns: ColumnsType = [
  {
    title: $t('page.user.username'),
    key: 'username',
    width: 120,
    customRender: ({ record }: { record: any }) => {
      const activityId = record._activityId;
      return h(Select, {
        value: newUserRow.value[activityId]?.userId || null,
        placeholder: $t('page.activity.selectUserPlaceholder'),
        style: { width: '100%' },
        options: allUsers.value,
        loading: loadingUsers.value,
        onChange: (value: number) => {
          if (!newUserRow.value[activityId]) {
            newUserRow.value[activityId] = { userId: null, accountLimit: 1 };
          }
          newUserRow.value[activityId].userId = value;
        }
      });
    }
  },
  {
    title: '',
    key: 'spacer1',
    width: 120
  },
  {
    title: '',
    key: 'spacer2',
    width: 100
  },
  {
    title: '',
    key: 'spacer3',
    width: 100
  },
  {
    title: '',
    key: 'spacer4',
    width: 120
  },
  {
    title: $t('page.activity.accountLimit'),
    key: 'accountLimit',
    width: 120,
    customRender: ({ record }: { record: any }) => {
      const activityId = record._activityId;
      return h(InputNumber, {
        value: newUserRow.value[activityId]?.accountLimit || 1,
        min: 1,
        style: { width: '100px' },
        onChange: (value: number) => {
          if (!newUserRow.value[activityId]) {
            newUserRow.value[activityId] = { userId: null, accountLimit: 1 };
          }
          newUserRow.value[activityId].accountLimit = value;
        }
      });
    }
  },
  {
    title: $t('page.common.action'),
    key: 'action',
    width: 120,
    customRender: ({ record }: { record: any }) => {
      const activityId = record._activityId;
      return h(Button, {
        type: 'primary',
        size: 'small',
        onClick: () => handleAddUser(activityId)
      }, () => $t('page.common.add'));
    }
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

// 获取活动用户
async function fetchActivityUsers(activityId: number) {
  // 如果已经获取过并且不在编辑状态，直接返回
  if (activityUsersMap.value[activityId] && !activityUsersEditingMap.value[activityId]) {
    return;
  }
  
  try {
    activityUsersLoadingMap.value[activityId] = true;
    const detail = await getActivityByIdApi(activityId);
    
    // 为每个用户记录添加所属活动ID，方便后续操作
    const users = detail.users.map(user => ({
      ...user,
      _activityId: activityId,
      phone: user.phone || '',
      role: user.role || 'USER'
    }));
    
    activityUsersMap.value[activityId] = users;
    activityUsersOriginalMap.value[activityId] = JSON.parse(JSON.stringify(users));
    
    // 初始化新用户行
    if (!newUserRow.value[activityId]) {
      newUserRow.value[activityId] = { userId: null, accountLimit: 1 };
    }
  } catch (error) {
    message.error($t('page.activity.fetchActivityUsersError'));
  } finally {
    activityUsersLoadingMap.value[activityId] = false;
  }
}

// 获取所有用户列表
async function fetchAllUsers() {
  if (allUsers.value.length > 0) {
    return;
  }
  
  try {
    loadingUsers.value = true;
    const res = await listUsersApi({ all: true });
    allUsers.value = res.list.map(user => ({
      label: `${user.username} (${user.phone})`,
      value: user.id
    }));
  } catch (error) {
    message.error($t('page.user.fetchUserListError'));
  } finally {
    loadingUsers.value = false;
  }
}

// 处理表格变化（分页、排序、筛选）
function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchActivityList();
}

// 处理行展开
function handleExpand(expanded: boolean, record: ActivityApi.ActivityItem) {
  if (expanded) {
    fetchActivityUsers(record.id);
    fetchAllUsers();
  }
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

// 处理编辑用户
function handleEditUsers(activityId: number) {
  activityUsersEditingMap.value[activityId] = true;
}

// 处理取消编辑
function handleCancelEdit(activityId: number) {
  // 恢复原始数据
  activityUsersMap.value[activityId] = JSON.parse(JSON.stringify(activityUsersOriginalMap.value[activityId]));
  activityUsersEditingMap.value[activityId] = false;
  // 重置新用户行
  newUserRow.value[activityId] = { userId: null, accountLimit: 1 };
}

// 处理保存编辑
async function handleSaveEdit(activityId: number) {
  // 构建参数
  const users = activityUsersMap.value[activityId]?.map(user => ({
    userId: user.userId,
    accountLimit: user.accountLimit
  })) || [];
  
  try {
    activityUsersSavingMap.value[activityId] = true;
    await updateActivityUsersApi(activityId, { users });
    message.success($t('page.activity.updateLinksSuccess'));
    activityUsersEditingMap.value[activityId] = false;
    
    // 重新获取数据
    await fetchActivityUsers(activityId);
    // 刷新活动列表
    await fetchActivityList();
  } catch (error) {
    message.error($t('page.activity.updateLinksError'));
  } finally {
    activityUsersSavingMap.value[activityId] = false;
  }
}

// 处理删除用户
function handleRemoveUser(activityId: number, index: number) {
  activityUsersMap.value[activityId].splice(index, 1);
}

// 处理添加用户
function handleAddUser(activityId: number) {
  const { userId, accountLimit } = newUserRow.value[activityId];
  
  if (!userId) {
    message.warning($t('page.activity.selectUserWarning'));
    return;
  }
  
  // 检查用户是否已存在
  const existingUser = activityUsersMap.value[activityId].find(u => u.userId === userId);
  if (existingUser) {
    message.warning($t('page.activity.userAlreadyExistsWarning'));
    return;
  }
  
  // 查找用户信息
  const userInfo = allUsers.value.find(u => u.value === userId);
  if (!userInfo) {
    message.warning($t('page.activity.userNotFoundWarning'));
    return;
  }
  
  // 添加用户
  activityUsersMap.value[activityId].push({
    userId,
    username: userInfo.label.split(' ')[0],
    phone: userInfo.label.split('(')[1]?.replace(')', ''),
    role: 'USER', // 默认角色
    accountLimit,
    accountCount: 0,
    taskCount: 0,
    _activityId: activityId
  });
  
  // 重置新用户行
  newUserRow.value[activityId] = { userId: null, accountLimit: 1 };
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
            @expand="handleExpand"
          >
            <!-- 展开图标列添加标题 -->
            <template #expandColumnTitle>
              <span>{{ $t('page.activity.linkUsers') }}</span>
            </template>
            
            <!-- 展开行插槽 -->
            <template #expandedRowRender="{ record }">
              <div class="px-4">
                <div class="flex justify-between items-center mb-2">
                  <div class="font-medium">{{ $t('page.activity.linkUsersDescription') }}</div>
                  <div>
                    <template v-if="!activityUsersEditingMap[record.id]">
                      <Button type="primary" size="small" @click="() => handleEditUsers(record.id)" class="mr-2">
                        {{ $t('page.common.edit') }}
                      </Button>
                    </template>
                    <template v-else>
                      <Button 
                        type="primary" 
                        size="small" 
                        @click="() => handleSaveEdit(record.id)" 
                        class="mr-2"
                        :loading="activityUsersSavingMap[record.id]"
                      >
                        {{ $t('page.common.save') }}
                      </Button>
                      <Button size="small" @click="() => handleCancelEdit(record.id)">
                        {{ $t('page.common.cancel') }}
                      </Button>
                    </template>
                  </div>
                </div>
                
                <Table
                  :columns="userColumns"
                  :dataSource="activityUsersMap[record.id] || []"
                  :loading="activityUsersLoadingMap[record.id] || activityUsersSavingMap[record.id]"
                  :pagination="false"
                  size="small"
                  rowKey="userId"
                  bordered
                >
                  <template #bodyCell="{ column, record: userRecord, index }">
                    <template v-if="column.key === 'action' && activityUsersEditingMap[userRecord._activityId]">
                      <Popconfirm
                        :title="$t('page.common.confirmDelete')"
                        @confirm="() => handleRemoveUser(userRecord._activityId, index)"
                      >
                        <Button type="link" danger size="small">
                          {{ $t('page.common.delete') }}
                        </Button>
                      </Popconfirm>
                    </template>
                  </template>
                  
                  <template #footer v-if="activityUsersEditingMap[record.id]">
                    <Table
                      :columns="newUserColumns"
                      :dataSource="[{ _activityId: record.id }]"
                      :pagination="false"
                      size="small"
                      :showHeader="false"
                      bordered
                    />
                  </template>
                </Table>
                
                <div v-if="activityUsersMap[record.id]?.length === 0" class="py-4 text-center text-gray-500">
                  {{ $t('page.activity.noLinkedUsers') }}
                </div>
              </div>
            </template>
            
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
