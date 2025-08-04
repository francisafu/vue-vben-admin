<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useVbenForm } from '#/adapter/form';
import { $t } from '#/locales';
import {
  createLorealDatabase,
  updateLorealDatabase
} from '#/api/core/lorealDatabase';
import { message } from 'ant-design-vue';

// 表单数据
const data = ref<Record<string, any>>({});
const isUpdate = computed(() => data.value?.mode === 'update');
const database = computed(() => data.value?.database);
const activityOptions = computed(() => data.value?.activityOptions || []);
const loading = ref(false);
const submitting = ref(false);

// 创建字段信息
const createFields = [
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择欧莱雅活动',
      options: activityOptions,
    },
    fieldName: 'activityId',
    label: '选择活动',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入欧莱雅账号',
      autocomplete: 'off',
    },
    fieldName: 'account',
    label: '欧莱雅账号',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入欧莱雅密码',
      autocomplete: 'new-password',
      type: 'password',
    },
    fieldName: 'password',
    label: '欧莱雅密码',
    rules: 'required',
  },
];

const updateFields = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入欧莱雅账号',
      autocomplete: 'off',
    },
    fieldName: 'account',
    label: '欧莱雅账号',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入欧莱雅密码',
      autocomplete: 'new-password',
      type: 'password',
    },
    fieldName: 'password',
    label: '欧莱雅密码',
    rules: 'required',
  },
];

// 表单配置
const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  handleSubmit,
  submitButtonOptions: computed(() => ({
    content: isUpdate.value ? '更新' : '创建',
    disabled: submitting.value,
    loading: submitting.value,
  })),
  resetButtonOptions: computed(() => ({
    content: '清空',
    disabled: submitting.value,
  })),
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: computed(() => isUpdate.value ? updateFields : createFields),
});

// 初始化modal
const [Modal, modalApi] = useVbenModal({
  title: computed(() => isUpdate.value ? '更新欧莱雅数据库' : '添加欧莱雅数据库'),
  draggable: true,
  footer: false,
  width: 600,
  // 打开modal时获取数据
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 获取传入的数据
      data.value = modalApi.getData<Record<string, any>>() || {};

      // 重置表单
      (formApi as any).resetFields && (formApi as any).resetFields();

      if (isUpdate.value && database.value) {
        // 更新模式：清空表单
        formApi.setValues({
          account: '',
          password: ''
        });
      } else {
        // 新建模式
        formApi.setValues({
          activityId: undefined,
          account: '',
          password: ''
        });
      }
    }
  },
});

// 处理表单提交
async function handleSubmit(values: any) {
  try {
    submitting.value = true;

    if (isUpdate.value) {
      // 更新数据库
      await updateLorealDatabase(database.value.id, {
        account: values.account,
        password: values.password
      });
      message.success('更新成功');
    } else {
      // 创建数据库
      await createLorealDatabase({
        activityId: values.activityId,
        account: values.account,
        password: values.password
      });
      message.success('创建成功');
    }

    // 设置状态标记操作成功
    data.value.operationSuccess = true;

    // 关闭弹窗
    modalApi.close();

  } catch (error: any) {
    message.error(error.message || '操作失败');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal>
    <div class="loreal-database-modal p-4">
      <div v-if="loading" class="flex-center py-10">
        <div class="text-center">加载中...</div>
      </div>
      <div v-else>
        <div v-if="isUpdate" class="mb-4 p-4 bg-gray-50 rounded">
          <div class="text-sm text-gray-600">
            <div class="mb-1">活动ID: {{ database?.activityId }}</div>
            <div class="mb-1">当前商品数: {{ database?.productCount }} 个</div>
            <div>上次爬取: {{ new Date(database?.scrapedAt).toLocaleString() }}</div>
          </div>
        </div>
        
        <div class="mb-4 p-4 bg-blue-50 rounded">
          <div class="text-sm text-blue-600">
            <div class="flex items-start">
              <span class="font-semibold mr-2">提示：</span>
              <span v-if="isUpdate">重新爬取将替换现有的所有商品数据</span>
              <span v-else>爬取可能需要几分钟时间，请耐心等待</span>
            </div>
          </div>
        </div>

        <Form />

        <div class="mt-4 p-4 bg-yellow-50 rounded">
          <div class="text-sm text-yellow-700">
            <div class="flex items-start">
              <span class="font-semibold mr-2">注意：</span>
              <span>请确保账号密码正确，且该账号有权限访问欧莱雅官网</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.loreal-database-modal {
  min-height: 300px;
  overflow-x: hidden;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.bg-blue-50 {
  background-color: #eff6ff;
}

.bg-yellow-50 {
  background-color: #fefce8;
}

.text-gray-600 {
  color: #4b5563;
}

.text-blue-600 {
  color: #2563eb;
}

.text-yellow-700 {
  color: #a16207;
}
</style>