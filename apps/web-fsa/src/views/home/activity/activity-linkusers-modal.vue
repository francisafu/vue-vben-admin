<script lang="ts" setup>
import { ref, reactive, computed, h } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { useVbenForm } from '#/adapter/form';
import { Button, Table, InputNumber, Select, message, Space } from 'ant-design-vue';
import { $t } from '#/locales';
import dayjs from 'dayjs';
import { 
  getActivityUsersApi, 
  updateActivityUsersApi
} from '#/api/core/activity';
import type { ActivityApi } from '#/api/core/activity';
import { listUsersApi } from '#/api/core/user';
import type { UserApi } from '#/api/core/user';

// 表单数据
const data = ref<Record<string, any>>({});
const activityData = ref<any>(null);
const loading = ref(false);
const submitting = ref(false);

// 用户相关数据
const linkedUsers = ref<ActivityApi.ActivityUserDetail[]>([]);
const allUsers = ref<UserApi.UserItem[]>([]);
const availableUsers = computed(() => {
  return allUsers.value.filter(user => !linkedUsers.value.some(lu => lu.userId === user.id));
});

// 临时编辑的用户数据
const editableUsers = ref<any[]>([]);

// 品牌映射
const brandMap: Record<string, string> = {
  'LOREAL': $t('page.activity.brandLOREAL'),
  'ESTEE': $t('page.activity.brandESTEE'),
  'LOCCITANE': $t('page.activity.brandLOCCITANE')
};

// 生成活动名称
function generateActivityName(brand: string, startTime: string) {
  const date = dayjs(startTime);
  const yearMonth = date.format('YYYY.MM');
  return `${brandMap[brand] || brand}-${yearMonth}`;
}

// 角色映射
const roleMap: Record<string, string> = {
  'ADMIN': $t('page.user.roleAdmin'),
  'VIP': $t('page.user.roleVip'),
  'USER': $t('page.user.roleUser')
};

// 处理账号限制变更
function handleAccountLimitChange(record: any, value: number) {
  if (value === null) return;
  
  const index = editableUsers.value.findIndex(u => u.userId === record.userId);
  if (index > -1) {
    editableUsers.value[index].accountLimit = value;
  }
}

// 新增用户表单字段
const formFields = [
  {
    component: 'Select',
    componentProps: {
      placeholder: $t('page.activity.selectUserPlaceholder'),
      style: { width: '200px' },
      showSearch: true,
      optionFilterProp: 'label',
      options: computed(() => availableUsers.value.map(user => ({
        label: `${user.username} (${user.phone})`,
        value: user.id,
      }))),
    },
    fieldName: 'userId',
    label: $t('page.user.username'),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: $t('page.activity.accountLimitPlaceholder'),
      style: { width: '100px' },
      min: 1,
      max: 100,
    },
    fieldName: 'accountLimit',
    label: $t('page.activity.accountLimit'),
    rules: 'required',
  },
];

// 生成计算的标题
const modalTitle = computed(() => {
  if (!activityData.value) return $t('page.activity.linkUsers');
  
  const activityName = generateActivityName(
    activityData.value.brand,
    activityData.value.startTime
  );
  
  return `${$t('page.activity.linkUsers')}（${activityName}）`;
});

// 创建表单
const [AddUserForm, addUserFormApi] = useVbenForm({
  layout: 'horizontal' as const,
  handleSubmit: handleAddUser,
  submitButtonOptions: {
    content: $t('page.activity.addUser'),
    disabled: false,
    loading: false,
  },
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: formFields,
});

// 表格列定义
const columns = [
  {
    title: $t('page.common.seqNo'),
    key: 'seq',
    width: 60,
    customRender: ({ index }: { index: number }) => index + 1
  },
  {
    title: $t('page.user.username'),
    dataIndex: 'username',
    key: 'username',
    width: 120
  },
  {
    title: $t('page.user.phone'),
    dataIndex: 'phone',
    key: 'phone',
    width: 120
  },
  {
    title: $t('page.user.role'),
    dataIndex: 'role',
    key: 'role',
    width: 100,
    customRender: ({ text }: { text: string }) => roleMap[text] || text
  },
  {
    title: $t('page.activity.accountLimit'),
    dataIndex: 'accountLimit',
    key: 'accountLimit',
    width: 150,
    customRender: ({ record }: { record: any }) => {
      return h(InputNumber, {
        value: record.accountLimit,
        min: 0,
        max: 100,
        onChange: (value: number | string | null) => {
          if (typeof value === 'number') {
            handleAccountLimitChange(record, value);
          }
        },
        style: { width: '100px' }
      });
    }
  }
];

// 初始化modal
const [Modal, modalApi] = useVbenModal({
  get title() {
    return modalTitle.value;
  },
  draggable: true,
  footer: false,
  // 打开modal时获取数据
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      loading.value = true;
      try {
        // 获取传入的数据
        data.value = modalApi.getData<Record<string, any>>() || {};
        activityData.value = data.value.activityData;
        
        // 更新标题
        if (activityData.value) {
          const activityName = generateActivityName(
            activityData.value.brand,
            activityData.value.startTime
          );
          // 只设置标题
          modalApi.setState({
            title: `${$t('page.activity.linkUsers')}（${activityName}）`
          });
        }
        
        // 加载已关联用户列表
        await fetchLinkedUsers();
        
        // 加载所有可用用户列表
        await fetchAllUsers();
        
      } catch (error) {
        console.error('加载数据失败:', error);
        message.error($t('page.activity.fetchActivityUsersError'));
      } finally {
        loading.value = false;
      }
    }
  },
});

// 获取已关联用户列表
async function fetchLinkedUsers() {
  if (!activityData.value) return;
  
  try {
    const response = await getActivityUsersApi(activityData.value.id);
    linkedUsers.value = response;
    
    // 复制到可编辑数组
    editableUsers.value = [...response];
  } catch (error) {
    console.error('获取关联用户失败:', error);
    message.error($t('page.activity.fetchActivityUsersError'));
  }
}

// 获取所有可用用户
async function fetchAllUsers() {
  try {
    const response = await listUsersApi({
      isEnabled: 'true',
      all: true
    });
    allUsers.value = response.list;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    message.error($t('page.user.fetchUserListError'));
  }
}

// 添加新用户
async function handleAddUser(values: any) {
  const { userId, accountLimit } = values;
  
  // 验证表单
  if (!userId) {
    message.warning($t('page.activity.selectUserWarning'));
    return;
  }
  
  const selectedUser = allUsers.value.find(u => u.id === userId);
  if (!selectedUser) {
    message.warning($t('page.activity.userNotFoundWarning'));
    return;
  }
  
  // 检查用户是否已存在
  if (editableUsers.value.some(u => u.userId === userId)) {
    message.warning($t('page.activity.userAlreadyExistsWarning'));
    return;
  }
  
  // 添加新用户到可编辑列表
  editableUsers.value.push({
    userId: selectedUser.id,
    username: selectedUser.username,
    phone: selectedUser.phone,
    role: selectedUser.role,
    accountLimit: accountLimit
  });
  
  // 重置表单
  // 手动重置表单值
  const formEl = document.querySelector('form');
  if (formEl) {
    formEl.reset();
  }
  
  // 清空选择
  setTimeout(() => {
    if (addUserFormApi && addUserFormApi.setValues) {
      addUserFormApi.setValues({
        userId: undefined,
        accountLimit: 1
      });
    }
  }, 0);
}

// 提交更改
async function handleSubmit() {
  if (!activityData.value) return;
  
  submitting.value = true;
  try {
    const users = editableUsers.value.map(user => ({
      userId: user.userId,
      accountLimit: user.accountLimit
    }));
    
    // 调用API更新关联
    await updateActivityUsersApi(activityData.value.id, { users });
    
    message.success($t('page.activity.updateLinksSuccess'));
    
    // 设置操作成功标记
    data.value.operationSuccess = true;
    
    // 关闭弹窗
    modalApi.close();
    
  } catch (error) {
    console.error('更新用户关联失败:', error);
    message.error($t('page.activity.updateLinksError'));
  } finally {
    submitting.value = false;
  }
}

// 取消操作
function handleCancel() {
  modalApi.close();
}
</script>

<template>
  <Modal class="w-[800px]">
    <div class="activity-users-modal p-4">
      <div v-if="loading" class="flex-center py-10">
        <div class="text-center">{{ $t('page.common.loading') }}</div>
      </div>
      <div v-else>
        <!-- 添加新用户表单 -->
        <div class="add-user-form mb-4 p-3 border rounded">
          <AddUserForm />
        </div>
        
        <!-- 用户关联表格 -->
        <div class="users-table mb-4">
          <Table
            :columns="columns"
            :dataSource="editableUsers"
            :rowKey="(record) => record.userId"
            :pagination="false"
            :bordered="true"
            size="middle"
            style="width: 100%"
          />
          
          <div v-if="editableUsers.length === 0" class="py-6 text-center text-gray-500">
            {{ $t('page.activity.noLinkedUsers') }}
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="actions flex justify-end mt-6">
          <Space>
            <Button @click="handleCancel">
              {{ $t('page.common.cancel') }}
            </Button>
            <Button 
              type="primary" 
              @click="handleSubmit" 
              :loading="submitting"
            >
              {{ $t('page.common.save') }}
            </Button>
          </Space>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.activity-users-modal {
  min-height: 300px;
  width: 100%;
}
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
