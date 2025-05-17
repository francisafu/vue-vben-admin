<script setup lang="ts">
import type { UserApi } from '#/api/core/user';

import { onMounted, ref, reactive, h } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, Card, Input, message, Select, Table } from 'ant-design-vue';
import type { TablePaginationConfig, ColumnsType } from 'ant-design-vue/es/table';

import { $t } from '#/locales';
import {
  listUsersApi,
  deleteUserApi,
  updateUserApi
} from '#/api/core/user';

import UserModal from './user-modal.vue';

// 用户数据
const userList = ref<UserApi.UserItem[]>([]);
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
const searchParams = ref<UserApi.ListUsersParams>({
  page: 1,
  pageSize: 10,
  keyword: '',
  role: undefined,
  isEnabled: undefined
});

const [Modal, modalApi] = useVbenModal({
  connectedComponent: UserModal,
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      if (data && data.operationSuccess) {
        // 用户操作成功后，刷新用户列表
        await fetchUserList();
      }
    }
  }
});

// 处理状态切换
async function handleToggleStatus(row: UserApi.UserItem) {
  try {
    loading.value = true;
    // 构造更新参数，仅包含状态字段，反转当前状态
    const params: UserApi.UpdateUserParams = {
      isEnabled: !row.isEnabled
    };
    
    await updateUserApi(row.id, params);
    
    if (row.isEnabled) {
      message.success($t('page.user.disableUserSuccess'));
    } else {
      message.success($t('page.user.enableUserSuccess'));
    }
    
    // 刷新用户列表
    await fetchUserList();
  } catch (error) {
    if (row.isEnabled) {
      message.error($t('page.user.disableUserError'));
    } else {
      message.error($t('page.user.enableUserError'));
    }
  } finally {
    loading.value = false;
  }
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
    title: $t('page.user.username'),
    dataIndex: 'username',
    key: 'username',
    minWidth: 120
  },
  {
    title: $t('page.user.phone'),
    dataIndex: 'phone',
    key: 'phone',
    minWidth: 120
  },
  {
    title: $t('page.user.role'),
    dataIndex: 'role',
    key: 'role',
    minWidth: 120,
    customRender: ({ text }: { text: string }) => {
      const roleMap: Record<string, string> = {
        'ADMIN': $t('page.user.roleAdmin'),
        'VIP': $t('page.user.roleVip'),
        'USER': $t('page.user.roleUser')
      };
      return roleMap[text] || text;
    }
  },
  {
    title: $t('page.user.status'),
    dataIndex: 'isEnabled',
    key: 'isEnabled',
    minWidth: 100,
    customRender: ({ record }: { record: UserApi.UserItem }) => {
      const isEnabled = record.isEnabled;
      return h(Button, {
        type: isEnabled ? 'primary' : 'default',
        danger: !isEnabled,
        size: 'small',
        onClick: () => handleToggleStatus(record),
        style: isEnabled ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {}
      }, () => isEnabled 
        ? $t('page.user.statusEnabled')
        : $t('page.user.statusDisabled')
      );
    }
  },
  {
    title: $t('page.common.action'),
    key: 'action',
    minWidth: 180
  }
];

// 创建用户按钮
function handleCreateUser() {
  modalApi.setState({ title: $t('page.user.addUser') }).setData({
    userData: null,
    isEdit: false
  }).open();
}

// 编辑用户按钮
function handleEditUser(row: UserApi.UserItem) {
  modalApi.setState({ title: $t('page.user.editUser') }).setData({
    userData: row,
    isEdit: true
  }).open();
}

// 修改密码按钮
function handleChangePassword(row: UserApi.UserItem) {
  modalApi.setState({ title: $t('page.user.changePassword') }).setData({
    userData: row,
    isPasswordMode: true
  }).open();
}

// 删除用户按钮
async function handleDeleteUser(row: UserApi.UserItem) {
  try {
    loading.value = true;
    await deleteUserApi(row.id);
    message.success($t('page.user.deleteUserSuccess'));

    // 刷新用户列表
    await fetchUserList();
  } catch (error) {
    message.error($t('page.user.deleteUserError'));
  } finally {
    loading.value = false;
  }
}

// 获取用户列表
async function fetchUserList() {
  try {
    loading.value = true;
    const res = await listUsersApi({
      ...searchParams.value,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10
    });

    userList.value = res.list;
    pagination.current = res.pagination.current;
    pagination.pageSize = res.pagination.pageSize;
    pagination.total = res.pagination.total;
  } catch (error) {
    message.error($t('page.user.fetchUserListError'));
  } finally {
    loading.value = false;
  }
}

// 处理表格变化（分页、排序、筛选）
function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchUserList();
}

// 处理搜索
function handleSearch() {
  pagination.current = 1;
  fetchUserList();
}

// 处理重置搜索
function handleReset() {
  searchParams.value = {
    page: 1,
    pageSize: 10,
    keyword: '',
    role: undefined,
    isEnabled: undefined
  };
  pagination.current = 1;
  fetchUserList();
}

// 初始化页面
onMounted(async () => {
  await fetchUserList();
});
</script>

<template>
  <Page>
    <Modal />
    <div class="p-4">
      <h1 class="mb-4 text-2xl font-bold">{{ $t('page.user.title') }}</h1>

      <!-- 搜索表单Card -->
      <Card :bordered="false" class="mb-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center">
            <span class="mr-2">{{ $t('page.user.keyword') }}</span>
            <Input
              v-model:value="searchParams.keyword"
              :placeholder="$t('page.user.keywordPlaceholder')"
              style="width: 200px"
              @pressEnter="handleSearch"
            />
          </div>

          <div class="flex items-center">
            <span class="mr-2">{{ $t('page.user.role') }}</span>
            <Select
              v-model:value="searchParams.role"
              :placeholder="$t('page.user.rolePlaceholder')"
              style="width: 120px"
              allowClear
            >
              <Select.Option value="ADMIN">{{ $t('page.user.roleAdmin') }}</Select.Option>
              <Select.Option value="VIP">{{ $t('page.user.roleVip') }}</Select.Option>
              <Select.Option value="USER">{{ $t('page.user.roleUser') }}</Select.Option>
            </Select>
          </div>

          <div class="flex items-center">
            <span class="mr-2">{{ $t('page.user.status') }}</span>
            <Select
              v-model:value="searchParams.isEnabled"
              :placeholder="$t('page.user.statusPlaceholder')"
              style="width: 120px"
              allowClear
            >
              <Select.Option value="true">{{ $t('page.user.statusEnabled') }}</Select.Option>
              <Select.Option value="false">{{ $t('page.user.statusDisabled') }}</Select.Option>
            </Select>
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
          <Button type="primary" @click="handleCreateUser">
            {{ $t('page.user.addUser') }}
          </Button>
        </template>

        <div style="width: 100%">
          <Table 
            :columns="columns" 
            :dataSource="userList" 
            :pagination="pagination"
            :loading="loading"
            rowKey="id"
            :scroll="{ y: 500 }"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <Button type="link" @click="() => handleEditUser(record as unknown as UserApi.UserItem)">
                  {{ $t('page.common.edit') }}
                </Button>
                <Button type="link" style="color: #faad14" @click="() => handleChangePassword(record as unknown as UserApi.UserItem)">
                  {{ $t('page.user.changePassword') }}
                </Button>
                <Button type="link" danger @click="() => handleDeleteUser(record as unknown as UserApi.UserItem)">
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
