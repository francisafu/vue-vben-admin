<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useVbenForm } from '#/adapter/form';
import { $t } from '#/locales';
import {
  createAccountInfoApi,
  updateAccountInfoApi
} from '#/api/core/account-info';
import { message } from 'ant-design-vue';

// 表单数据
const data = ref<Record<string, any>>({});
const isEdit = computed(() => data.value?.isEdit);
const accountInfoData = computed(() => data.value?.accountInfoData);
const activityId = computed(() => data.value?.activityId);
const loading = ref(false);
const submitting = ref(false);

// 表单配置
const [AccountInfoForm, accountInfoFormApi] = useVbenForm({
  layout: 'vertical',
  handleSubmit,
  submitButtonOptions: computed(() => ({
    content: $t('page.common.save'),
    disabled: submitting.value,
    loading: submitting.value,
  })),
  resetButtonOptions: computed(() => ({
    content: $t('page.common.clear'),
    disabled: submitting.value,
  })),
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.accountInfo.accountPlaceholder'),
      },
      fieldName: 'account',
      label: $t('page.accountInfo.account'),
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.accountInfo.passwordPlaceholder'),
        type: 'password',
      },
      fieldName: 'password',
      label: $t('page.accountInfo.password'),
      rules: 'required',
    },
  ],
});

// 初始化modal
const [Modal, modalApi] = useVbenModal({
  title: $t('page.accountInfo.accountInfoManagement'),
  draggable: true,
  footer: false,
  // 打开modal时获取数据
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 获取传入的数据
      data.value = modalApi.getData<Record<string, any>>() || {};

      // 重置表单
      (accountInfoFormApi as any).resetFields && (accountInfoFormApi as any).resetFields();

      if (isEdit.value && accountInfoData.value) {
        // 编辑模式：填充表单数据
        const accountInfo = accountInfoData.value;
        accountInfoFormApi.setValues({
          account: accountInfo.account,
          password: accountInfo.password,
        });
      } else {
        // 新建模式
        accountInfoFormApi.setValues({
          account: '',
          password: '',
        });
      }
    }
  },
});

// 处理表单提交
async function handleSubmit(values: any) {
  try {
    submitting.value = true;

    if (!activityId.value) {
      message.error($t('page.accountInfo.activityIdRequired'));
      return;
    }

    const formData = {
      ...values,
      activityId: activityId.value
    };

    if (isEdit.value) {
      // 编辑抢购账号
      await updateAccountInfoApi(accountInfoData.value.id, {
        account: values.account,
        password: values.password,
      });
      message.success($t('page.accountInfo.updateAccountInfoSuccess'));
    } else {
      // 新增抢购账号
      await createAccountInfoApi(formData);
      message.success($t('page.accountInfo.addAccountInfoSuccess'));
    }

    // 设置状态标记操作成功
    data.value.operationSuccess = true;

    // 关闭弹窗
    modalApi.close();

  } catch (error) {
    if (isEdit.value) {
      message.error($t('page.accountInfo.updateAccountInfoError'));
    } else {
      message.error($t('page.accountInfo.addAccountInfoError'));
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal>
    <div class="account-info-modal p-4">
      <div v-if="loading" class="flex-center py-10">
        <div class="text-center">{{ $t('page.common.loading') }}</div>
      </div>
      <div v-else>
        <AccountInfoForm />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.account-info-modal {
  min-height: 300px;
  max-width: 500px;
  width: auto;
  overflow-x: hidden;
}
</style>