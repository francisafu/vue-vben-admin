<script setup lang="ts">
import type { AccountApi } from '#/api/core/account';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, Card, Divider, message, TabPane, Tabs } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
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
});

function newAddressModal() {
  modalApi.setState({ title: '新增地址' }).open();
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
        placeholder: '请输入用户名',
      },
      fieldName: 'username',
      label: '用户名',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号',
        maxlength: 11,
      },
      fieldName: 'phone',
      label: '手机号',
      rules: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号格式'),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入推送加Token',
      },
      fieldName: 'pushplusToken',
      label: '推送加Token',
    },
  ],
  submitButtonOptions: {
    content: '保存',
  },
});

// 密码修改表单
const [PasswordForm, passwordFormApi] = useVbenForm({
  layout: 'horizontal',
  handleSubmit: (values: Record<string, any>) =>
    handleUpdatePassword(
      values as { confirmPassword: string; newPassword: string },
    ),
  schema: [
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: '请输入新密码',
      },
      fieldName: 'newPassword',
      label: '新密码',
      rules: z.string().min(6, '密码长度不能少于6位'),
    },
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: '请再次输入新密码',
      },
      fieldName: 'confirmPassword',
      label: '确认密码',
      rules: z.string().superRefine((val, ctx) => {
        const formData = ctx.path[0] ? ctx.path[0] : {};
        if (val !== (formData as any).newPassword) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '两次输入的密码不一致',
          });
        }
      }),
    },
  ],
  submitButtonOptions: {
    content: '保存',
  },
  resetButtonOptions: {
    content: '清空',
  },
});

// 地址数据
const addressData = ref<AccountApi.AddressData | null>(null);

// 地址表格选项
const gridOptions = {
  border: true,
  height: 'auto',
  showOverflow: true,
  columnConfig: {
    resizable: true,
  },
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'userName', title: '收件人', width: 100 },
    { field: 'mobilePhone', title: '手机号', width: 130 },
    {
      field: 'address',
      title: '地址',
      minWidth: 300,
      slots: { default: 'address' },
    },
    {
      field: 'action',
      title: '操作',
      width: 160,
      slots: { default: 'action' },
    },
  ] as any[],
  data: [],
  pagerConfig: {
    enabled: false,
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

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
    gridApi.grid?.loadData(res.addresses);
  } catch (error) {
    console.error('获取用户信息失败', error);
    message.error('获取用户信息失败');
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
    console.error('获取地址数据失败', error);
    message.error('获取地址数据失败');
  }
}

// 更新基本信息
async function handleUpdateBasicInfo(
  values: AccountApi.UpdateAccountBasicParams,
) {
  try {
    loading.value = true;
    await updateAccountBasicApi(values);
    message.success('基本信息更新成功');
    await fetchUserInfo();
  } catch (error) {
    console.error('更新基本信息失败', error);
    message.error('更新基本信息失败');
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
    // 清空表单
    // @ts-ignore
    passwordFormApi.resetFields && passwordFormApi.resetFields();
  } catch (error) {
    console.error('更新密码失败', error);
  } finally {
    loading.value = false;
  }
}

// 删除地址按钮
async function handleDeleteAddress(row: AccountApi.AccountAddress) {
  try {
    await deleteAddressApi({ id: row.id });
    message.success('地址删除成功');
    await fetchUserInfo();
  } catch (error) {
    console.error('删除地址失败', error);
    message.error('删除地址失败');
  }
}
</script>

<template>
  <Page>
    <Modal />
    <div class="p-4">
      <h1 class="mb-4 text-2xl font-bold">个人中心</h1>

      <div class="mb-4">
        <Card :loading="loading" :bordered="false">
          <Tabs class="account-tabs">
            <TabPane key="basic" tab="基本资料">
              <div class="tab-content">
                <BaseInfoForm />
              </div>
            </TabPane>
            <TabPane key="password" tab="修改密码">
              <div class="tab-content">
                <PasswordForm />
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>

      <Divider>地址管理</Divider>

      <div class="address-list">
        <Card :loading="loading" :bordered="false">
          <template #extra>
            <Button type="primary" @click="newAddressModal">新增地址</Button>
          </template>

          <Grid>
            <template #address="{ row }">
              {{ row.provinceName }} {{ row.cityName }} {{ row.districtName }}
              {{ row.addrDetail }}
            </template>

            <template #action="{ row }">
              <Button type="link">编辑</Button>
              <Button type="link" danger @click="handleDeleteAddress(row)">
                删除
              </Button>
            </template>
          </Grid>
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
