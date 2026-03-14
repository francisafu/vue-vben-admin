<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  createLorealDatabase,
  updateLorealDatabase
} from '#/api/core/lorealDatabase';
import { Button, message, Progress } from 'ant-design-vue';
import { getSocketInstance } from '#/composables/useSocket';

const data = ref<Record<string, any>>({});
const isUpdate = computed(() => data.value?.mode === 'update');
const database = computed(() => data.value?.database);
const crawling = ref(false);
const crawlProgress = ref({ phase: '', current: 0, total: 0, message: '' });

const modalTitle = computed(() => isUpdate.value ? '更新欧莱雅商品数据' : '爬取欧莱雅商品数据');

const progressPercent = computed(() => {
  if (!crawlProgress.value.total) return 0;
  return Math.round((crawlProgress.value.current / crawlProgress.value.total) * 100);
});

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  footer: false,
  closable: computed(() => !crawling.value) as any,
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      data.value = modalApi.getData<Record<string, any>>() || {};
      crawling.value = false;
      crawlProgress.value = { phase: '', current: 0, total: 0, message: '' };
    }
  },
});

function setupSocketListener() {
  const socket = getSocketInstance();
  if (!socket) return null;

  const handler = (update: any) => {
    if (update?.type === 'crawl:progress') {
      crawlProgress.value = {
        phase: update.phase || '',
        current: update.current || 0,
        total: update.total || 0,
        message: update.message || ''
      };
    }
  };

  socket.on('task:status-update', handler);
  return () => socket.off('task:status-update', handler);
}

async function handleCrawl() {
  try {
    crawling.value = true;
    crawlProgress.value = { phase: 'init', current: 0, total: 0, message: '正在准备爬取...' };

    const cleanup = setupSocketListener();

    try {
      if (isUpdate.value) {
        await updateLorealDatabase(database.value.id);
      } else {
        const activityId = data.value?.activityId;
        if (!activityId) {
          message.error('请先选择一个活动');
          return;
        }
        await createLorealDatabase({ activityId });
      }

      message.success(isUpdate.value ? '更新成功' : '爬取成功');
      data.value.operationSuccess = true;
      modalApi.close();
    } finally {
      if (cleanup) cleanup();
    }
  } catch (error: any) {
    message.error(error.message || '爬取失败');
  } finally {
    crawling.value = false;
  }
}
</script>

<template>
  <Modal :title="modalTitle">
    <div class="loreal-database-modal p-4">
      <div class="mb-4 p-4 bg-gray-50 rounded">
        <div class="text-sm text-gray-600">
          <div v-if="isUpdate">
            <div class="mb-1">活动ID: {{ database?.activityId }}</div>
            <div class="mb-1">当前商品数: {{ database?.productCount }} 个</div>
            <div>上次爬取: {{ new Date(database?.scrapedAt).toLocaleString() }}</div>
          </div>
          <div v-else>
            <div class="mb-1">当前选择的活动ID: {{ data?.activityId }}</div>
            <div>系统将自动选择 token 有效期最长的账号进行爬取</div>
          </div>
        </div>
      </div>

      <div class="mb-4 p-4 bg-blue-50 rounded">
        <div class="text-sm text-blue-600">
          <div class="flex items-start">
            <span class="font-semibold mr-2">提示：</span>
            <span v-if="isUpdate">重新爬取将替换现有的所有商品数据</span>
            <span v-else>爬取约需 2-3 分钟，请耐心等待</span>
          </div>
        </div>
      </div>

      <div v-if="crawling" class="mb-4">
        <Progress :percent="progressPercent" :status="crawlProgress.phase === 'done' ? 'success' : 'active'" />
        <div class="text-sm text-gray-500 mt-2">{{ crawlProgress.message }}</div>
      </div>

      <div class="flex justify-end gap-2">
        <Button :disabled="crawling" @click="modalApi.close()">取消</Button>
        <Button type="primary" :loading="crawling" @click="handleCrawl">
          {{ crawling ? '爬取中...' : (isUpdate ? '开始更新' : '开始爬取') }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.loreal-database-modal {
  min-height: 200px;
  overflow-x: hidden;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.bg-blue-50 {
  background-color: #eff6ff;
}

.text-gray-600 {
  color: #4b5563;
}

.text-gray-500 {
  color: #6b7280;
}

.text-blue-600 {
  color: #2563eb;
}
</style>
