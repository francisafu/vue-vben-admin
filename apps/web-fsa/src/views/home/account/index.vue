<script setup lang="ts">
import type { AccountApi } from '#/api/core/account';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, message, TabPane, Tabs } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';
import {
  getAccountInfoApi,
  updateAccountBasicApi,
  updateAccountPasswordApi,
} from '#/api/core/account';

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

// 初始化页面
onMounted(async () => {
  await fetchUserInfo();
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

  } catch (error) {
    message.error($t('page.account.fetchUserInfoError'));
  } finally {
    loading.value = false;
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
</script>

<template>
  <Page>
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
</style>