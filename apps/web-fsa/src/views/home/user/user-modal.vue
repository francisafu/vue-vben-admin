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
const userData = computed(() => data.value?.userData);
const loading = ref(false);
const submitting = ref(false);

// 初始化modal
const [Modal, modalApi] = useVbenModal({
  title: $t('page.user.userManagement', { defaultValue: '用户管理' }),
  draggable: true,
  footer: false,
  // 打开modal时获取数据
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 获取传入的数据
      data.value = modalApi.getData<Record<string, any>>() || {};

      // 根据模式选择不同的初始化方式
      if (isEdit.value && userData.value) {
        // 编辑模式：直接填充表单数据
        const userInfo = userData.value;

        // 设置表单值
        userFormApi.setValues({
          username: userInfo.username,
          phone: userInfo.phone,
          role: userInfo.role,
          isEnabled: userInfo.isEnabled.toString(),
          pushplusToken: userInfo.pushplusToken || ''
        });

        // 编辑模式不需要显示密码字段
        userFormApi.updateSchema([
          {
            componentProps: {
              style: { display: 'none' }
            },
            fieldName: 'password',
          },
          {
            componentProps: {
              style: { display: 'none' }
            },
            fieldName: 'confirmPassword',
          }
        ]);
      } else {
        // 新建模式：重置所有状态
        resetAllState();

        // 显示密码字段
        userFormApi.updateSchema([
          {
            componentProps: {
              style: { display: 'block' }
            },
            fieldName: 'password',
          },
          {
            componentProps: {
              style: { display: 'block' }
            },
            fieldName: 'confirmPassword',
          }
        ]);
      }
    } else {
      // 关闭modal时重置状态
      resetAllState();
    }
  },
});

// 重置所有状态
function resetAllState() {
  // 重置表单数据 - 使用any类型绕过类型检查
  (userFormApi as any).resetFields && (userFormApi as any).resetFields();

  // 重置表单值为空
  userFormApi.setValues({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    isEnabled: 'true',
    pushplusToken: ''
  });
}

// 处理表单提交
async function handleSubmit(values: any) {
  try {
    submitting.value = true;

    if (isEdit.value) {
      // 编辑用户
      const params: UserApi.UpdateUserParams = {
        username: values.username,
        phone: values.phone,
        role: values.role,
        isEnabled: values.isEnabled === 'true',
        pushplusToken: values.pushplusToken || null
      };

      await updateUserApi(userData.value.id, params);
      message.success($t('page.user.updateUserSuccess', { defaultValue: '用户更新成功' }));
    } else {
      // 新增用户
      // 验证两次密码是否一致
      if (values.password !== values.confirmPassword) {
        message.error($t('page.user.passwordMismatch', { defaultValue: '两次输入的密码不一致' }));
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
      message.success($t('page.user.addUserSuccess', { defaultValue: '用户添加成功' }));
    }

    // 设置状态标记操作成功
    data.value.operationSuccess = true;

    // 关闭弹窗
    modalApi.close();

  } catch (error) {
    message.error(isEdit.value
      ? $t('page.user.updateUserError', { defaultValue: '更新用户失败' })
      : $t('page.user.addUserError', { defaultValue: '添加用户失败' })
    );
  } finally {
    submitting.value = false;
  }
}

// 表单配置
const [UserForm, userFormApi] = useVbenForm({
  layout: 'vertical',
  handleSubmit,
  submitButtonOptions: {
    content: $t('page.common.save', { defaultValue: '保存' }),
    disabled: false,
    loading: submitting.value,
  },
  resetButtonOptions: {
    content: $t('page.common.clear', { defaultValue: '清空' }),
  },
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.user.usernamePlaceholder', { defaultValue: '请输入用户名' }),
      },
      fieldName: 'username',
      label: $t('page.user.username', { defaultValue: '用户名' }),
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.user.phonePlaceholder', { defaultValue: '请输入手机号' }),
        maxlength: 11,
      },
      fieldName: 'phone',
      label: $t('page.user.phone', { defaultValue: '手机号' }),
      rules: z.string().regex(/^1[3-9]\d{9}$/, $t('page.user.phoneFormatError', { defaultValue: '请输入正确的手机号格式' })),
    },
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: $t('page.user.passwordPlaceholder', { defaultValue: '请输入密码' }),
      },
      fieldName: 'password',
      label: $t('page.user.password', { defaultValue: '密码' }),
      rules: z.string().min(6, $t('page.user.passwordLengthError', { defaultValue: '密码长度不能少于6位' })),
    },
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: $t('page.user.confirmPasswordPlaceholder', { defaultValue: '请确认密码' }),
      },
      fieldName: 'confirmPassword',
      label: $t('page.user.confirmPassword', { defaultValue: '确认密码' }),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: $t('page.user.rolePlaceholder', { defaultValue: '请选择角色' }),
        options: [
          { label: $t('page.user.roleAdmin', { defaultValue: '管理员' }), value: 'ADMIN' },
          { label: $t('page.user.roleVip', { defaultValue: '会员' }), value: 'VIP' },
          { label: $t('page.user.roleUser', { defaultValue: '用户' }), value: 'USER' }
        ],
      },
      fieldName: 'role',
      label: $t('page.user.role', { defaultValue: '角色' }),
      defaultValue: 'USER',
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: $t('page.user.statusEnabled', { defaultValue: '启用' }), value: 'true' },
          { label: $t('page.user.statusDisabled', { defaultValue: '禁用' }), value: 'false' }
        ],
      },
      fieldName: 'isEnabled',
      label: $t('page.user.status', { defaultValue: '状态' }),
      defaultValue: 'true',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.user.pushplusTokenPlaceholder', { defaultValue: '请输入推送加Token，不需要请留空' }),
      },
      fieldName: 'pushplusToken',
      label: $t('page.user.pushplusToken', { defaultValue: '推送加Token' }),
    },
  ],
});

</script>

<template>
  <Modal>
    <div class="user-modal p-4">
      <div v-if="loading" class="flex-center py-10">
        <div class="text-center">{{ $t('page.common.loading', { defaultValue: '加载中...' }) }}</div>
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
  width: 500px;
}
</style>
