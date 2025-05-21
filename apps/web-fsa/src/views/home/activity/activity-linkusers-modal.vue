<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '#/locales';

// 表单数据
const data = ref<Record<string, any>>({});
const activityData = ref<any>(null);
const loading = ref(false);

// 初始化modal
const [Modal, modalApi] = useVbenModal({
  title: $t('page.activity.linkUsers'),
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
        
        // 这里可以添加加载用户列表或其他数据的逻辑
        
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        loading.value = false;
      }
    }
  },
});
</script>

<template>
  <Modal>
    <div class="activity-users-modal p-4">
      <div v-if="loading" class="flex-center py-10">
        <div class="text-center">{{ $t('page.common.loading') }}</div>
      </div>
      <div v-else>
        <!-- 这里将来会添加关联用户的内容 -->
        <p>{{ $t('page.activity.linkUsersDescription') }}</p>
        
        <!-- 显示当前活动信息 -->
        <div v-if="activityData" class="mt-4">
          <p>{{ $t('page.activity.brand') }}: {{ activityData.brand }}</p>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.activity-users-modal {
  min-height: 300px;
  width: auto;
  overflow-x: hidden;
}
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
