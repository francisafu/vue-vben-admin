<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';
import {
  createActivityApi,
  updateActivityApi
} from '#/api/core/activity';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

// 表单数据
const data = ref<Record<string, any>>({});
const isEdit = computed(() => data.value?.isEdit);
const activityData = computed(() => data.value?.activityData);
const loading = ref(false);
const submitting = ref(false);

// 创建字段信息
const baseFields = [
  {
    component: 'Select',
    componentProps: {
      placeholder: $t('page.activity.brandPlaceholder'),
      options: [
        { label: $t('page.activity.brandLOREAL'), value: 'LOREAL' },
        { label: $t('page.activity.brandESTEE'), value: 'ESTEE' },
        { label: $t('page.activity.brandLOCCITANE'), value: 'LOCCITANE' }
      ],
    },
    fieldName: 'brand',
    label: $t('page.activity.brand'),
    rules: 'required',
  },
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: $t('page.activity.startTimePlaceholder'),
      showTime: { format: 'HH:mm' },
      format: 'YYYY-MM-DD HH:mm',
      style: { width: '100%' }
    },
    fieldName: 'startTime',
    label: $t('page.activity.startTime'),
    rules: 'required',
  },
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: $t('page.activity.endTimePlaceholder'),
      showTime: { format: 'HH:mm' },
      format: 'YYYY-MM-DD HH:mm',
      style: { width: '100%' }
    },
    fieldName: 'endTime',
    label: $t('page.activity.endTime'),
    rules: 'required',
  },
];

// 表单配置
const [ActivityForm, activityFormApi] = useVbenForm({
  layout: 'vertical',
  handleSubmit,
  submitButtonOptions: {
    content: $t('page.common.save'),
    disabled: false,
    loading: submitting.value,
  },
  resetButtonOptions: {
    content: $t('page.common.clear'),
  },
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: baseFields,
});

// 初始化modal
const [Modal, modalApi] = useVbenModal({
  title: $t('page.activity.activityManagement'),
  draggable: true,
  footer: false,
  // 打开modal时获取数据
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 获取传入的数据
      data.value = modalApi.getData<Record<string, any>>() || {};

      // 重置表单
      (activityFormApi as any).resetFields && (activityFormApi as any).resetFields();

      if (isEdit.value && activityData.value) {
        // 编辑模式：填充表单数据
        const activity = activityData.value;
        activityFormApi.setValues({
          brand: activity.brand,
          startTime: dayjs(activity.startTime),
          endTime: dayjs(activity.endTime),
        });
      } else {
        // 新建模式
        activityFormApi.setValues({
          brand: 'LOREAL',
          startTime: null,
          endTime: null
        });
      }
    }
  },
});

// 验证结束时间是否晚于开始时间
function validateTimeRange(startTime: dayjs.Dayjs, endTime: dayjs.Dayjs): boolean {
  if (!startTime || !endTime) return false;
  return endTime.isAfter(startTime);
}

// 处理表单提交
async function handleSubmit(values: any) {
  try {
    submitting.value = true;

    // 验证开始时间和结束时间
    if (!validateTimeRange(values.startTime, values.endTime)) {
      message.error($t('page.activity.timeRangeError'));
      submitting.value = false;
      return;
    }

    // 格式化时间
    const formattedValues = {
      ...values,
      startTime: values.startTime.format('YYYY-MM-DD HH:mm:00'),
      endTime: values.endTime.format('YYYY-MM-DD HH:mm:00')
    };

    if (isEdit.value) {
      // 编辑活动
      await updateActivityApi(activityData.value.id, formattedValues);
      message.success($t('page.activity.updateActivitySuccess'));
    } else {
      // 新增活动
      await createActivityApi(formattedValues);
      message.success($t('page.activity.addActivitySuccess'));
    }

    // 设置状态标记操作成功
    data.value.operationSuccess = true;

    // 关闭弹窗
    modalApi.close();

  } catch (error) {
    if (isEdit.value) {
      message.error($t('page.activity.updateActivityError'));
    } else {
      message.error($t('page.activity.addActivityError'));
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal>
    <div class="activity-modal p-4">
      <div v-if="loading" class="flex-center py-10">
        <div class="text-center">{{ $t('page.common.loading') }}</div>
      </div>
      <div v-else>
        <ActivityForm />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.activity-modal {
  min-height: 300px;
  max-width: 500px;
  width: auto;
  overflow-x: hidden;
}
</style>
