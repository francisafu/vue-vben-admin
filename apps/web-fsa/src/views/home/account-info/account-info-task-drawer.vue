<script lang="ts" setup>
import type { AccountInfoApi } from '#/api/core';

import { ref, reactive, onMounted, computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { 
  Form, 
  FormItem, 
  Input, 
  InputNumber, 
  Switch, 
  DatePicker, 
  Button, 
  message,
  Card,
  Table,
  Popconfirm,
  Upload
} from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { $t } from '#/locales';
import dayjs from 'dayjs';
import { parseProductsApi, createTaskApi, updateTaskApi } from '#/api/core/task';

// 获取抽屉实例
const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onOpenChange(isOpen: boolean) {
    console.log('TaskDrawer onOpenChange:', isOpen);
    if (isOpen) {
      const data = drawerApi.getData<{
        taskData?: AccountInfoApi.TaskInfo;
        isEdit?: boolean;
        accountId?: number;
        activityId?: number;
        activityStartTime?: string;
      }>();
      console.log('TaskDrawer getData result:', data);
      
      if (data) {
        isEdit.value = data.isEdit || false;
        taskData.value = data.taskData || undefined;
        accountId.value = data.accountId || null;
        activityId.value = data.activityId || null;
        activityStartTime.value = data.activityStartTime || null;
        
        console.log('Data assigned - isEdit:', isEdit.value, 'accountId:', accountId.value, 'activityStartTime:', activityStartTime.value);
        
        // 如果是编辑模式，填充表单数据
        if (isEdit.value && taskData.value) {
          formData.ordersDelay = taskData.value.ordersDelay || 1;
          formData.isScheduled = taskData.value.isScheduled || false;
          formData.startTime = taskData.value.startTime ? dayjs(taskData.value.startTime) : undefined;
          formData.isPolling = taskData.value.isPolling || false;
          formData.products = taskData.value.products ? [...taskData.value.products] : [];
          console.log('Edit mode - form data populated');
        } else {
          // 新建模式时重置表单
          resetForm();
          console.log('Create mode - form reset');
        }
      }
    }
  }
});

// 表单数据
const formData = reactive<{
  ordersDelay: number;
  isScheduled: boolean;
  startTime: Dayjs | undefined;
  isPolling: boolean;
  products: Array<{
    id?: number;
    productId: string;
    targetCount: number;
    productName?: string;
  }>;
}>({
  ordersDelay: 1,
  isScheduled: false,
  startTime: undefined,
  isPolling: false,
  products: []
});

// 表单引用
const formRef = ref();

// 提交状态
const submitting = ref(false);

// 是否为编辑模式
const isEdit = ref(false);
const taskData = ref<AccountInfoApi.TaskInfo | undefined>(undefined);
const accountId = ref<number | null>(null);
const activityId = ref<number | null>(null);
const activityStartTime = ref<string | null>(null);

// 文件上传状态
const uploading = ref(false);
const fileList = ref<any[]>([]);

// 商品表格列定义
const productColumns = [
  {
    title: $t('page.common.seqNo'),
    key: 'seq',
    width: 80,
    customRender: ({ index }: { index: number }) => index + 1
  },
  {
    title: 'SKU编码',
    dataIndex: 'productId',
    key: 'productId',
    width: 200
  },
  {
    title: '购买数量',
    dataIndex: 'targetCount',
    key: 'targetCount',
    width: 120
  },
  {
    title: $t('page.common.action'),
    key: 'action',
    width: 100
  }
];

// 表单验证规则
const rules = {
  ordersDelay: [
    { required: true, message: '请输入订单间隔时间' }
  ]
};

// 禁用的开始时间
const disabledStartTime = (current: Dayjs) => {
  return current && current.isBefore(dayjs().startOf('day'));
};

// 重置表单
function resetForm() {
  formData.ordersDelay = 1;
  formData.isScheduled = false;
  formData.startTime = undefined;
  formData.isPolling = false;
  formData.products = [];
  
  formRef.value?.resetFields();
}

// 提交表单
async function handleSubmit() {
  try {
    // 验证表单
    await formRef.value.validate();
    
    // 验证商品列表
    if (formData.products.length === 0) {
      message.warning('请至少添加一个商品');
      return;
    }
    
    // 验证商品数据完整性
    for (let i = 0; i < formData.products.length; i++) {
      const product = formData.products[i];
      if (!product?.productId || !product.productId.trim()) {
        message.warning(`请填写第${i + 1}个商品的商品ID`);
        return;
      }
      if (!product?.targetCount || product.targetCount <= 0) {
        message.warning(`请填写第${i + 1}个商品的购买数量`);
        return;
      }
    }
    
    submitting.value = true;
    
    if (isEdit.value && taskData.value) {
      // 编辑模式 - 构建更新数据
      const updateData = {
        ordersDelay: formData.ordersDelay,
        isScheduled: formData.isScheduled,
        startTime: formData.isScheduled && formData.startTime ? formData.startTime.format('YYYY-MM-DD HH:mm:ss') : undefined,
        isPolling: formData.isPolling,
        products: formData.products.map((p, index) => ({
          skuCode: p.productId.trim(),
          productName: p.productName || '', // 使用保存的商品名称
          quantity: p.targetCount,
          order: index + 1
        }))
      };
      
      await updateTaskApi(taskData.value.id, updateData);
      message.success('任务更新成功');
    } else {
      // 新建模式 - 构建创建数据
      const createData = {
        accountId: accountId.value!,
        activityId: activityId.value!,
        ordersDelay: formData.ordersDelay,
        isScheduled: formData.isScheduled,
        startTime: formData.isScheduled && formData.startTime ? formData.startTime.format('YYYY-MM-DD HH:mm:ss') : undefined,
        isPolling: formData.isPolling,
        products: formData.products.map((p, index) => ({
          skuCode: p.productId.trim(),
          productName: p.productName || '', // 使用保存的商品名称
          quantity: p.targetCount,
          order: index + 1
        }))
      };
      
      await createTaskApi(createData);
      message.success('任务创建成功');
    }
    
    // 通知父组件刷新数据
    drawerApi.setData({ operationSuccess: true });
    drawerApi.close();
    
  } catch (error) {
    console.error('提交任务失败:', error);
    message.error(isEdit.value ? '任务更新失败' : '任务创建失败');
  } finally {
    submitting.value = false;
  }
}

// 计算提交按钮选项
const submitButtonOptions = computed(() => ({
  type: 'primary' as const,
  loading: submitting.value,
  disabled: submitting.value
}));

// 计算取消按钮选项
const cancelButtonOptions = computed(() => ({
  disabled: submitting.value
}));

// 取消操作
function handleCancel() {
  drawerApi.close();
}

// 组件挂载时的初始化
onMounted(() => {
  console.log('TaskDrawer onMounted');
});

// 处理文件上传前的验证
function beforeUpload(file: File) {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (!isExcel) {
    message.error('只能上传 Excel(.xlsx) 文件！');
    return false;
  }
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件大小不能超过 10MB！');
    return false;
  }
  return true;
}

// 处理文件上传
async function handleUpload(info: any) {
  const { file, fileList: newFileList } = info;
  
  fileList.value = newFileList;
  
  if (file.status === 'uploading') {
    uploading.value = true;
    return;
  }
  
  if (file.status === 'done') {
    uploading.value = false;
    message.success(`${file.name} 文件上传成功`);
    
    // 处理API返回的解析后的商品数据
    if (file.response && file.response.products) {
      // 将API返回的ProductInfo[]转换为表单需要的格式
      formData.products = file.response.products.map((product: any) => ({
        productId: product.skuCode, // 使用skuCode作为productId
        targetCount: product.quantity, // 使用quantity作为targetCount
        productName: product.productName // 使用productName作为productName
      }));
      console.log('Products converted from API:', formData.products);
      message.success(`成功解析 ${formData.products.length} 个商品`);
    }
  } else if (file.status === 'error') {
    uploading.value = false;
    message.error(`${file.name} 文件上传失败`);
  }
}

// 自定义上传请求
async function customRequest(options: any) {
  const { file, onSuccess, onError, onProgress } = options;
  
  try {
    // 使用真实的API调用
    const result = await parseProductsApi(file);
    
    // API调用成功
    onSuccess(result);
    console.log('Products parsed from API:', result);
  } catch (error) {
    console.error('上传解析失败:', error);
    onError(error);
  }
}

// 移除单个商品
function removeProduct(index: number) {
  formData.products.splice(index, 1);
}

// 处理定时启动切换
function handleScheduledChange(checked: boolean | string | number) {
  const isChecked = Boolean(checked);
  formData.isScheduled = isChecked;
  
  // 如果开启定时启动且有活动开始时间，设置为活动开始时间
  if (isChecked && activityStartTime.value) {
    formData.startTime = dayjs(activityStartTime.value);
    console.log('Set start time to activity start time:', activityStartTime.value);
  } else if (!isChecked) {
    // 如果关闭定时启动，清空时间
    formData.startTime = undefined;
    console.log('Cleared start time because scheduled is disabled');
  }
}
</script>

<template>
  <Drawer :title="isEdit ? '编辑任务' : '新建任务'">
    <div class="p-6">
      <Form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <!-- 基础设置 -->
        <Card title="基础设置" class="mb-4">
          <!-- 第一行：是否定时启动 和 是否轮询 -->
          <div class="grid grid-cols-2 gap-6 mb-4">
            <FormItem label="是否定时启动" name="isScheduled">
              <Switch v-model:checked="formData.isScheduled" @change="handleScheduledChange" />
            </FormItem>
            
            <FormItem label="是否轮询" name="isPolling">
              <Switch v-model:checked="formData.isPolling" />
              <div class="mt-1 text-xs text-gray-500">
                开启后将持续轮询检查商品状态
              </div>
            </FormItem>
          </div>
          
          <!-- 第二行：启动时间 和 订单间隔 -->
          <div class="grid grid-cols-2 gap-6">
            <FormItem 
              v-if="formData.isScheduled" 
              label="启动时间" 
              name="startTime"
            >
              <DatePicker
                v-model:value="formData.startTime"
                format="YYYY-MM-DD HH:mm:ss"
                :disabled-date="disabledStartTime"
                :show-time="{ format: 'HH:mm:ss' }"
                placeholder="请选择启动时间"
                style="width: 280px"
              />
            </FormItem>
            <div v-else></div>
            
            <FormItem label="订单间隔(秒)" name="ordersDelay">
              <InputNumber
                v-model:value="formData.ordersDelay"
                :min="1"
                :max="60000"
                :step="1"
                style="width: 200px"
                placeholder="请输入订单间隔时间"
              />
              <div class="mt-1 text-xs text-gray-500">
                建议设置1秒以上，避免请求过于频繁
              </div>
            </FormItem>
          </div>
        </Card>

        <!-- 商品设置 -->
        <Card title="商品设置" class="mb-4">
          <div class="mb-4">
            <Upload
              :fileList="fileList"
              :before-upload="beforeUpload"
              :custom-request="customRequest"
              @change="handleUpload"
              accept=".xlsx"
              :multiple="false"
            >
              <Button type="dashed" :loading="uploading" style="width: 100%">
                <template v-if="uploading">
                  上传中...
                </template>
                <template v-else>
                  + 上传Excel文件
                </template>
              </Button>
            </Upload>
            <div class="mt-2 text-xs text-gray-500">
              仅支持.xlsx格式，文件大小不超过10MB
            </div>
          </div>
          
          <Table
            v-if="formData.products.length > 0"
            :columns="productColumns"
            :dataSource="formData.products"
            :pagination="false"
            size="small"
            bordered
            rowKey="productId"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'action'">
                <Popconfirm
                  title="确定删除这个商品吗？"
                  @confirm="() => removeProduct(index)"
                >
                  <Button type="link" danger size="small">
                    删除
                  </Button>
                </Popconfirm>
              </template>
            </template>
          </Table>
          
          <div v-else class="text-center text-gray-500 py-8">
            暂无商品，请点击上方按钮上传Excel文件
          </div>
        </Card>
      </Form>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button v-bind="cancelButtonOptions" @click="handleCancel">
          {{ $t('page.common.cancel') }}
        </Button>
        <Button v-bind="submitButtonOptions" @click="handleSubmit">
          {{ isEdit ? $t('page.common.update') : $t('page.common.save') }}
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.ant-card {
  border-radius: 8px;
}

.ant-form-item {
  margin-bottom: 16px;
}

</style>