<script setup lang="ts">
import type { UserApi } from '#/api/core/user';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, Card, Input, message, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';
import {
  listUsersApi,
  deleteUserApi
} from '#/api/core/user';

import UserModal from './user-modal.vue';

// 用户数据
const userList = ref<UserApi.UserItem[]>([]);
const loading = ref(false);
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
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

// 表格设置
const gridOptions = {
  border: true,
  height: 500,
  showOverflow: true,
  columnConfig: {
    resizable: true,
  },
  pagerConfig: {
    enabled: true,
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
    layouts: ['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total'],
    total: 0,
    currentPage: 1,
    onPageChange: handlePageChange
  },
  columns: [
    { title: $t('page.common.seqNo', { defaultValue: '序号' }), type: 'seq', width: 60 },
    { field: 'username', title: $t('page.user.username', { defaultValue: '用户名' }), minWidth: 120 },
    { field: 'phone', title: $t('page.user.phone', { defaultValue: '手机号' }), minWidth: 120 },
    {
      field: 'role',
      title: $t('page.user.role', { defaultValue: '角色' }),
      minWidth: 120,
      formatter: ({ cellValue }: { cellValue: string }) => {
        const roleMap: Record<string, string> = {
          'ADMIN': $t('page.user.roleAdmin', { defaultValue: '管理员' }),
          'VIP': $t('page.user.roleVip', { defaultValue: '会员' }),
          'USER': $t('page.user.roleUser', { defaultValue: '用户' })
        };
        return roleMap[cellValue] || cellValue;
      }
    },
    {
      field: 'isEnabled',
      title: $t('page.user.status', { defaultValue: '状态' }),
      minWidth: 100,
      slots: { default: 'status' }
    },
    {
      field: 'action',
      title: $t('page.common.action', { defaultValue: '操作' }),
      minWidth: 180,
      slots: { default: 'action' }
    },
  ],
  // 表格样式
  // 关键：使用fit让内容自动填充表格宽度
  fit: true,
  // 使用响应式表格
  size: 'medium'
} as any;

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

// 创建用户按钮
function handleCreateUser() {
  modalApi.setState({ title: $t('page.user.addUser', { defaultValue: '新增用户' }) }).setData({
    userData: null,
    isEdit: false
  }).open();
}

// 编辑用户按钮
function handleEditUser(row: UserApi.UserItem) {
  modalApi.setState({ title: $t('page.user.editUser', { defaultValue: '编辑用户' }) }).setData({
    userData: row,
    isEdit: true
  }).open();
}

// 删除用户按钮
async function handleDeleteUser(row: UserApi.UserItem) {
  try {
    loading.value = true;
    await deleteUserApi(row.id);
    message.success($t('page.user.deleteUserSuccess', { defaultValue: '用户删除成功' }));

    // 刷新用户列表
    await fetchUserList();
  } catch (error) {
    message.error($t('page.user.deleteUserError', { defaultValue: '删除用户失败' }));
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
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    });

    userList.value = res.list;
    pagination.value = {
      current: res.pagination.current,
      pageSize: res.pagination.pageSize,
      total: res.pagination.total
    };
    console.log(pagination.value);

    // 更新表格数据和分页信息
    if (gridApi.grid) {
      // 更新表格数据
      gridApi.grid.loadData(userList.value);

      // 关键修复：直接设置pagerConfig的total属性
      if (gridApi.grid.pagerConfig) {
        gridApi.grid.pagerConfig.total = pagination.value.total;
      }

      // 手动刷新表格
      gridApi.grid.refreshScroll();
      gridApi.grid.recalculate();
    }
  } catch (error) {
    message.error($t('page.user.fetchUserListError', { defaultValue: '获取用户列表失败' }));
  } finally {
    loading.value = false;
  }
}

// 处理分页变化
function handlePageChange({ pageSize, currentPage }: { pageSize: number; currentPage: number }) {
  pagination.value.current = currentPage;
  pagination.value.pageSize = pageSize;
  fetchUserList();
}

// 处理搜索
function handleSearch() {
  pagination.value.current = 1;
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
  pagination.value.current = 1;
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
      <h1 class="mb-4 text-2xl font-bold">{{ $t('page.user.title', { defaultValue: '用户管理' }) }}</h1>

      <!-- 搜索表单Card -->
      <Card :bordered="false" class="mb-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center">
            <span class="mr-2">{{ $t('page.user.keyword', { defaultValue: '关键字' }) }}</span>
            <Input
              v-model:value="searchParams.keyword"
              :placeholder="$t('page.user.keywordPlaceholder', { defaultValue: '用户名/手机号' })"
              style="width: 200px"
              @pressEnter="handleSearch"
            />
          </div>

          <div class="flex items-center">
            <span class="mr-2">{{ $t('page.user.role', { defaultValue: '角色' }) }}</span>
            <Select
              v-model:value="searchParams.role"
              :placeholder="$t('page.user.rolePlaceholder', { defaultValue: '选择角色' })"
              style="width: 120px"
              allowClear
            >
              <Select.Option value="ADMIN">{{ $t('page.user.roleAdmin', { defaultValue: '管理员' }) }}</Select.Option>
              <Select.Option value="VIP">{{ $t('page.user.roleVip', { defaultValue: '会员' }) }}</Select.Option>
              <Select.Option value="USER">{{ $t('page.user.roleUser', { defaultValue: '用户' }) }}</Select.Option>
            </Select>
          </div>

          <div class="flex items-center">
            <span class="mr-2">{{ $t('page.user.status', { defaultValue: '状态' }) }}</span>
            <Select
              v-model:value="searchParams.isEnabled"
              :placeholder="$t('page.user.statusPlaceholder', { defaultValue: '选择状态' })"
              style="width: 120px"
              allowClear
            >
              <Select.Option value="true">{{ $t('page.user.statusEnabled', { defaultValue: '启用' }) }}</Select.Option>
              <Select.Option value="false">{{ $t('page.user.statusDisabled', { defaultValue: '禁用' }) }}</Select.Option>
            </Select>
          </div>

          <div class="flex items-center ml-4">
            <Button type="primary" @click="handleSearch" class="mr-2">
              {{ $t('page.common.search', { defaultValue: '搜索' }) }}
            </Button>

            <Button @click="handleReset">
              {{ $t('page.common.clear', { defaultValue: '重置' }) }}
            </Button>
          </div>
        </div>
      </Card>

      <!-- 表格Card -->
      <Card :bordered="false">
        <template #extra>
          <Button type="primary" @click="handleCreateUser">
            {{ $t('page.user.addUser', { defaultValue: '新增用户' }) }}
          </Button>
        </template>

        <div style="width: 100%">
          <Grid ref="gridRef" :loading="loading">
            <template #status="{ row }">
              <span :class="row.isEnabled ? 'text-success' : 'text-danger'">
                {{ row.isEnabled
                  ? $t('page.user.statusEnabled', { defaultValue: '启用' })
                  : $t('page.user.statusDisabled', { defaultValue: '禁用' })
                }}
              </span>
            </template>

            <template #action="{ row }">
              <Button type="link" @click="handleEditUser(row)">{{ $t('page.common.edit', { defaultValue: '编辑' }) }}</Button>
              <Button type="link" danger @click="handleDeleteUser(row)">
                {{ $t('page.common.delete', { defaultValue: '删除' }) }}
              </Button>
            </template>
          </Grid>
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
