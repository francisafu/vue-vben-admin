<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';
import {
  createUserApi,
  updateUserApi
} from '#/api/core/user';
import { message } from 'ant-design-vue';
import type { UserApi } from '#/api/core/user';

// 表单数据
const data = ref<Record<string, any>>({});
const isEdit = computed(() => data.value?.isEdit);
const isPasswordMode = computed(() => data.value?.isPasswordMode);
const userData = computed(() => data.value?.userData);
const loading = ref(false);
const submitting = ref(false);

// 创建字段信息
const baseFields = [
  // 隐藏的控制字段 - 用于表单内部联动
  {
    component: 'Input',
    componentProps: {
      style: { display: 'none' },
    },
    fieldName: '_formMode',
    label: '',
    defaultValue: 'create',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: $t('page.user.usernamePlaceholder'),
    },
    fieldName: 'username',
    label: $t('page.user.username'),
    rules: 'required',
    dependencies: {
      show: (values: Record<string, any>) => values._formMode !== 'password',
      triggerFields: ['_formMode'],
    },
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: $t('page.user.phonePlaceholder'),
      maxlength: 11,
    },
    fieldName: 'phone',
    label: $t('page.user.phone'),
    rules: z.string().regex(/^1[3-9]\d{9}$/, $t('page.user.phoneFormatError')),
    dependencies: {
      show: (values: Record<string, any>) => values._formMode !== 'password',
      triggerFields: ['_formMode'],
    },
  },
  {
    component: 'InputPassword',
    componentProps: {
      placeholder: $t('page.user.passwordPlaceholder'),
      style: { display: 'flex', height: '32px' }
    },
    fieldName: 'password',
    label: $t('page.user.password'),
    dependencies: {
      show: (values: Record<string, any>) => values._formMode !== 'edit',
      rules: (values: Record<string, any>) => {
        // 所有模式下都必填
        return z.string().min(6, $t('page.user.passwordLengthError'));
      },
      triggerFields: ['_formMode'],
    },
  },
  {
    component: 'InputPassword',
    componentProps: {
      placeholder: $t('page.user.confirmPasswordPlaceholder'),
      style: { display: 'flex', height: '32px' }
    },
    fieldName: 'confirmPassword',
    label: $t('page.user.confirmPassword'),
    dependencies: {
      show: (values: Record<string, any>) => values._formMode !== 'edit',
      rules: (values: Record<string, any>) => {
        // 所有模式下都必填
        return 'required';
      },
      triggerFields: ['_formMode'],
    },
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: $t('page.user.rolePlaceholder'),
      options: [
        { label: $t('page.user.roleAdmin'), value: 'ADMIN' },
        { label: $t('page.user.roleVip'), value: 'VIP' },
        { label: $t('page.user.roleUser'), value: 'USER' }
      ],
    },
    fieldName: 'role',
    label: $t('page.user.role'),
    defaultValue: 'USER',
    rules: 'required',
    dependencies: {
      show: (values: Record<string, any>) => values._formMode !== 'password',
      triggerFields: ['_formMode'],
    },
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: $t('page.user.pushplusTokenPlaceholder'),
    },
    fieldName: 'pushplusToken',
    label: $t('page.user.pushplusToken'),
    dependencies: {
      show: (values: Record<string, any>) => values._formMode !== 'password',
      triggerFields: ['_formMode'],
    },
  },
];

// 表单配置
const [UserForm, userFormApi] = useVbenForm({
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
  schema: baseFields,
});

// 初始化modal
const [Modal, modalApi] = useVbenModal({
  title: $t('page.user.userManagement'),
  draggable: true,
  footer: false,
  // 打开modal时获取数据
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 获取传入的数据
      data.value = modalApi.getData<Record<string, any>>() || {};

      // 重置表单
      (userFormApi as any).resetFields && (userFormApi as any).resetFields();

      // 根据模式选择不同的初始化方式
      if (isPasswordMode.value && userData.value) {
        // 密码修改模式：只显示密码相关字段
        userFormApi.setValues({
          _formMode: 'password',
          password: '',
          confirmPassword: ''
        });
      } else if (isEdit.value && userData.value) {
        // 编辑模式：填充表单数据
        const userInfo = userData.value;
        userFormApi.setValues({
          _formMode: 'edit',
          username: userInfo.username,
          phone: userInfo.phone,
          role: userInfo.role,
          pushplusToken: userInfo.pushplusToken || '',
        });
      } else {
        // 新建模式
        userFormApi.setValues({
          _formMode: 'create',
          username: '',
          phone: '',
          password: '',
          confirmPassword: '',
          role: 'USER',
          pushplusToken: ''
        });
      }
    }
  },
});

// 处理表单提交
async function handleSubmit(values: any) {
  try {
    submitting.value = true;

    // 从表单值中获取模式，而不是使用外部变量
    const formMode = values._formMode;

    if (formMode === 'password') {
      // 密码修改模式
      // 验证两次密码是否一致
      if (values.password !== values.confirmPassword) {
        message.error($t('page.user.passwordMismatch'));
        submitting.value = false;
        return;
      }
      
      // 执行密码更新
      const params: UserApi.UpdateUserParams = {
        password: values.password
      };
      
      await updateUserApi(userData.value.id, params);
      message.success($t('page.user.passwordChangeSuccess'));
    } else if (formMode === 'edit') {
      // 编辑用户
      const params: UserApi.UpdateUserParams = {
        username: values.username,
        phone: values.phone,
        role: values.role,
        pushplusToken: values.pushplusToken || null
      };

      await updateUserApi(userData.value.id, params);
      message.success($t('page.user.updateUserSuccess'));
    } else {
      // 新增用户
      // 验证两次密码是否一致
      if (values.password !== values.confirmPassword) {
        message.error($t('page.user.passwordMismatch'));
        submitting.value = false;
        return;
      }

      const params: UserApi.CreateUserParams = {
        username: values.username,
        password: values.password,
        phone: values.phone,
        role: values.role
      };

      await createUserApi(params);
      message.success($t('page.user.addUserSuccess'));
    }

    // 设置状态标记操作成功
    data.value.operationSuccess = true;

    // 关闭弹窗
    modalApi.close();

  } catch (error) {
    if (values._formMode === 'password') {
      message.error($t('page.user.passwordChangeError'));
    } else if (values._formMode === 'edit') {
      message.error($t('page.user.updateUserError'));
    } else {
      message.error($t('page.user.addUserError'));
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal>
    <div class="user-modal p-4">
      <div v-if="loading" class="flex-center py-10">
        <div class="text-center">{{ $t('page.common.loading') }}</div>
      </div>
      <div v-else>
        <UserForm />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.user-modal {
  min-height: 300px;
  max-width: 500px;
  width: auto;
  overflow-x: hidden;
}

/* 修复密码输入框样式 */
:deep(.ant-input-password-icon) {
  margin: 0;
  height: 100%;
  display: flex;
  align-items: center;
}
</style>
