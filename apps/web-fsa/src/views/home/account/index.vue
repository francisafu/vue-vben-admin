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
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      if (data && data.operationSuccess) {
        // 当地址操作成功后，立即刷新用户信息
        await fetchUserInfo();

        // 额外添加一个延迟刷新，确保表格完全更新
        setTimeout(() => {
          if (userInfo.value?.addresses && userInfo.value.addresses.length > 0) {
            const addressesCopy = JSON.parse(JSON.stringify(userInfo.value.addresses));
            gridApi.grid?.reloadData(addressesCopy);
          }
        }, 300);
      }
    }
  }
});

function handleNewAddress() {
  // 明确设置为空数据，确保不会有历史数据残留
  modalApi.setState({ title: '新增地址' }).setData({
    addressData: null
  }).open();
}

// 编辑地址按钮
function handleEditAddress(row: AccountApi.AccountAddress) {
  modalApi.setState({ title: '编辑地址' }).setData({
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
        placeholder: '请输入推送加Token，不需要请留空',
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
  handleSubmit: (values: Record<string, any>) => {
    // 在提交前先验证密码是否一致
    const { newPassword, confirmPassword } = values;
    if (newPassword !== confirmPassword) {
      message.error('两次输入的密码不一致');
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
      rules: z.string().min(1, '请输入确认密码'),
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
  ],
  pagerConfig: {
    enabled: false,
  },
} as any;

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

// 初始化页面
onMounted(async () => {
  await fetchUserInfo();
  await fetchAddressData();

  // 确保表格在初始化完成后显示数据
  setTimeout(() => {
    if (userInfo.value?.addresses?.length) {
      const addressesCopy = JSON.parse(JSON.stringify(userInfo.value.addresses));
      gridApi.grid?.reloadData(addressesCopy);
    }
  }, 500);
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

      // 使用深拷贝确保数据是全新的对象
      const addressesCopy = JSON.parse(JSON.stringify(res.addresses));

      // 首先清空数据，然后重新加载
      gridApi.grid?.clearData();
      gridApi.grid?.loadData(addressesCopy);

      // 强制渲染表格
      gridApi.grid?.reloadData(addressesCopy);
    } else {
      gridApi.grid?.clearData();
    }

    // 延迟执行一次额外的表格更新，确保数据正确渲染
    setTimeout(() => {
      if (res.addresses && res.addresses.length > 0) {
        gridApi.grid?.reloadData(res.addresses);
      }
    }, 300);
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
    message.success('密码修改成功');

    // 清空表单
    // @ts-ignore
    passwordFormApi.resetFields && passwordFormApi.resetFields();

    // 密码更新成功后重新获取用户信息，确保数据不丢失
    await fetchUserInfo();
  } catch (error) {
    console.error('更新密码失败', error);
    message.error('更新密码失败');
  } finally {
    loading.value = false;
  }
}

// 删除地址按钮
async function handleDeleteAddress(row: AccountApi.AccountAddress) {
  try {
    await deleteAddressApi({ id: row.id });
    message.success('地址删除成功');

    // 刷新用户信息
    await fetchUserInfo();

    // 额外添加一个延迟刷新，确保表格完全更新
    setTimeout(() => {
      if (userInfo.value?.addresses) {
        const addressesCopy = JSON.parse(JSON.stringify(userInfo.value.addresses || []));
        gridApi.grid?.reloadData(addressesCopy);
      } else {
        gridApi.grid?.clearData();
      }
    }, 300);
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
            <Button type="primary" @click="handleNewAddress">新增地址</Button>
          </template>

          <Grid ref="gridRef">
            <template #address="{ row }">
              {{ row.provinceName }} {{ row.cityName }} {{ row.districtName }}
              {{ row.addrDetail }}
            </template>

            <template #action="{ row }">
              <Button type="link" @click="handleEditAddress(row)">编辑</Button>
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
