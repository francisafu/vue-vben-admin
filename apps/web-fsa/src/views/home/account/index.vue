<script setup lang="ts">
import type { AccountApi } from '#/api/core/account';

import { onMounted, ref, reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, Card, Divider, message, TabPane, Tabs, Table } from 'ant-design-vue';
import type { PaginationProps } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';
import {
  deleteAddressApi,
  getAccountInfoApi,
  getAddressDataApi,
  updateAccountBasicApi,
  updateAccountPasswordApi,
} from '#/api/core/account';

import AddressModal from './address-modal.vue';

const [Modal, modalApi] = useVbenModal({
  connectedComponent: AddressModal,
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      if (data && data.operationSuccess) {
        // 当地址操作成功后，立即刷新用户信息
        await fetchUserInfo();
      }
    }
  }
});

function handleNewAddress() {
  // 明确设置为空数据，确保不会有历史数据残留
  modalApi.setState({ title: $t('page.account.addAddress') }).setData({
    addressData: null
  }).open();
}

// 编辑地址按钮
function handleEditAddress(row: AccountApi.AccountAddress) {
  modalApi.setState({ title: $t('page.account.editAddress') }).setData({
    addressData: row
  }).open();
}

// 用户信息
const userInfo = ref<AccountApi.AccountInfo | null>(null);
const loading = ref(false);

// 基本信息表单
const [BaseInfoForm, baseInfoFormApi] = useVbenForm({
  layout: 'horizontal',
  handleSubmit: (values: Record<string, any>) =>
    handleUpdateBasicInfo(values as AccountApi.UpdateAccountBasicParams),
  resetButtonOptions: { show: false },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.account.usernamePlaceholder'),
      },
      fieldName: 'username',
      label: $t('page.account.username'),
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.account.phonePlaceholder'),
        maxlength: 11,
      },
      fieldName: 'phone',
      label: $t('page.account.phone'),
      rules: z.string().regex(/^1[3-9]\d{9}$/, $t('page.account.phoneFormatError')),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.account.pushplusTokenPlaceholder'),
      },
      fieldName: 'pushplusToken',
      label: $t('page.account.pushplusToken'),
    },
  ],
  submitButtonOptions: {
    content: $t('page.common.save'),
  },
});

// 密码修改表单
const [PasswordForm, passwordFormApi] = useVbenForm({
  layout: 'horizontal',
  handleSubmit: (values: Record<string, any>) => {
    // 在提交前先验证密码是否一致
    const { newPassword, confirmPassword } = values;
    if (newPassword !== confirmPassword) {
      message.error($t('page.account.passwordMismatch'));
      return;
    }

    // 密码一致，继续处理提交
    return handleUpdatePassword(
      values as { confirmPassword: string; newPassword: string },
    );
  },
  schema: [
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: $t('page.account.newPasswordPlaceholder'),
      },
      fieldName: 'newPassword',
      label: $t('page.account.newPassword'),
      rules: z.string().min(6, $t('page.account.passwordLengthError')),
    },
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: $t('page.account.confirmPasswordPlaceholder'),
      },
      fieldName: 'confirmPassword',
      label: $t('page.account.confirmPassword'),
      rules: z.string().min(1, $t('page.account.confirmPasswordRequired')),
    },
  ],
  submitButtonOptions: {
    content: $t('page.common.save'),
  },
  resetButtonOptions: {
    content: $t('page.common.clear'),
  },
});

// 地址数据
const addressData = ref<AccountApi.AddressData | null>(null);

// AntDV表格数据
const tableData = ref<AccountApi.AccountAddress[]>([]);
const tablePagination = reactive<PaginationProps>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  showTotal: (total) => `${$t('page.common.total')} ${total} ${$t('page.common.items')}`
});

// 表格列定义
const columns = [
  {
    title: $t('page.common.seqNo'),
    key: 'seq',
    width: 60,
    customRender: ({ index }: { index: number }) => {
      return (tablePagination.current! - 1) * tablePagination.pageSize! + index + 1;
    }
  },
  {
    title: $t('page.account.recipient'),
    dataIndex: 'userName',
    key: 'userName',
    width: 100
  },
  {
    title: $t('page.account.phone'),
    dataIndex: 'mobilePhone',
    key: 'mobilePhone',
    width: 130
  },
  {
    title: $t('page.account.address'),
    key: 'address',
    customRender: ({ record }: { record: AccountApi.AccountAddress }) => {
      return `${record.provinceName} ${record.cityName} ${record.districtName} ${record.addrDetail}`;
    }
  },
  {
    title: $t('page.common.action'),
    key: 'action',
    width: 160
  }
];

// 处理分页变化
function handleTableChange(pagination: PaginationProps) {
  console.log('分页变化:', pagination);
  tablePagination.current = pagination.current;
  tablePagination.pageSize = pagination.pageSize;
  loadTableData();
}

// 加载表格数据
function loadTableData() {
  if (!userInfo.value?.addresses) return;
  
  const allData = userInfo.value.addresses;
  tablePagination.total = allData.length;
  
  // 计算当前页数据
  const startIndex = ((tablePagination.current || 1) - 1) * (tablePagination.pageSize || 10);
  const endIndex = startIndex + (tablePagination.pageSize || 10);
  tableData.value = allData.slice(startIndex, endIndex);
}

// 初始化页面
onMounted(async () => {
  await fetchUserInfo();
  await fetchAddressData();
});

// 获取当前用户信息
async function fetchUserInfo() {
  try {
    loading.value = true;
    const res = await getAccountInfoApi();
    userInfo.value = res;

    // 更新表单初始值
    baseInfoFormApi.setValues({
      username: res.username,
      phone: res.phone,
      pushplusToken: res.pushplusToken || '',
    });

    // 更新表格数据
    if (res.addresses && res.addresses.length > 0) {
      // 初始化分页并加载第一页数据
      tablePagination.current = 1;
      loadTableData();
    } else {
      // 清空数据
      tableData.value = [];
      tablePagination.total = 0;
    }
  } catch (error) {
    message.error($t('page.account.fetchUserInfoError'));
  } finally {
    loading.value = false;
  }
}

// 获取地址数据
async function fetchAddressData() {
  try {
    const res = await getAddressDataApi();
    addressData.value = res;
  } catch (error) {
    message.error($t('page.account.fetchAddressDataError'));
  }
}

// 更新基本信息
async function handleUpdateBasicInfo(
  values: AccountApi.UpdateAccountBasicParams,
) {
  try {
    loading.value = true;
    await updateAccountBasicApi(values);
    message.success($t('page.account.updateBasicInfoSuccess'));
    await fetchUserInfo();
  } catch (error) {
    message.error($t('page.account.updateBasicInfoError'));
  } finally {
    loading.value = false;
  }
}

// 更新密码
async function handleUpdatePassword(values: {
  confirmPassword: string;
  newPassword: string;
}) {
  try {
    loading.value = true;
    await updateAccountPasswordApi({ newPassword: values.newPassword });
    message.success($t('page.account.updatePasswordSuccess'));

    // 清空表单
    // @ts-ignore
    passwordFormApi.resetFields && passwordFormApi.resetFields();

    // 密码更新成功后重新获取用户信息，确保数据不丢失
    await fetchUserInfo();
  } catch (error) {
    message.error($t('page.account.updatePasswordError'));
  } finally {
    loading.value = false;
  }
}

// 删除地址按钮
async function handleDeleteAddress(row: AccountApi.AccountAddress) {
  try {
    await deleteAddressApi({ id: row.id });
    message.success($t('page.account.deleteAddressSuccess'));

    // 刷新用户信息
    await fetchUserInfo();
  } catch (error) {
    message.error($t('page.account.deleteAddressError'));
  }
}
</script>

<template>
  <Page>
    <Modal />
    <div class="p-4">
      <h1 class="mb-4 text-2xl font-bold">{{ $t('page.account.title') }}</h1>

      <div class="mb-4">
        <Card :loading="loading" :bordered="false">
          <Tabs class="account-tabs">
            <TabPane key="basic" :tab="$t('page.account.basicInfo')">
              <div class="tab-content">
                <BaseInfoForm />
              </div>
            </TabPane>
            <TabPane key="password" :tab="$t('page.account.modifyPassword')">
              <div class="tab-content">
                <PasswordForm />
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>

      <Divider>{{ $t('page.account.addressManagement') }}</Divider>

      <div class="address-list">
        <Card :loading="loading" :bordered="false">
          <template #extra>
            <Button type="primary" @click="handleNewAddress">{{ $t('page.account.addAddress') }}</Button>
          </template>

          <Table 
            :columns="columns" 
            :dataSource="tableData" 
            :pagination="tablePagination"
            :loading="loading"
            rowKey="id"
            :scroll="{ y: 500 }"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <Button type="link" @click="() => handleEditAddress(record as unknown as AccountApi.AccountAddress)">
                  {{ $t('page.common.edit') }}
                </Button>
                <Button type="link" danger @click="() => handleDeleteAddress(record as unknown as AccountApi.AccountAddress)">
                  {{ $t('page.common.delete') }}
                </Button>
              </template>
            </template>
          </Table>
        </Card>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.account-tabs .tab-content {
  display: flex;
  flex-direction: column;
  height: 240px;
  min-height: 240px;
  padding: 20px 0;
}

.address-list {
  margin-bottom: 20px;
}

:deep(.address-modal) {
  width: 600px;
}
</style>
