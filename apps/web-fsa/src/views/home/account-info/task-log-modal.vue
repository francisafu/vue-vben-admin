<script lang="ts" setup>
import { ref, onUnmounted, computed } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { Badge, Input, Space, Tag, Select, Checkbox, Button, Spin } from 'ant-design-vue';
import { $t } from '#/locales';
import { useSocket } from '#/composables/useSocket';
import dayjs from 'dayjs';

// 日志级别样式配置
const logLevelColors: Record<string, { color: string; text: string }> = {
  info: { color: 'blue', text: 'INFO' },
  warn: { color: 'orange', text: 'WARN' },
  error: { color: 'red', text: 'ERROR' },
  debug: { color: 'gray', text: 'DEBUG' }
};

// 数据引用
const data = ref<Record<string, any>>({});
const taskId = computed(() => data.value?.taskId);
const taskName = computed(() => data.value?.taskName || '');

// 日志数据
const logs = ref<Array<{
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
}>>([]);

// 过滤和搜索
const levelFilter = ref<string>('all');
const searchKeyword = ref<string>('');
const autoScroll = ref<boolean>(true);

// 加载状态
const loading = ref(false);

// Socket订阅
const { subscribeTaskLogs } = useSocket();
let unsubscribeFn: (() => void) | null = null;

// 日志容器引用
const logContainerRef = ref<HTMLElement | null>(null);

// 过滤后的日志
const filteredLogs = computed(() => {
  let result = logs.value;
  
  // 级别过滤
  if (levelFilter.value !== 'all') {
    result = result.filter(log => log.level === levelFilter.value);
  }
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(log => 
      log.message.toLowerCase().includes(keyword) ||
      JSON.stringify(log.metadata || {}).toLowerCase().includes(keyword)
    );
  }
  
  return result;
});

// 级别选项
const levelOptions = [
  { label: $t('page.common.all'), value: 'all' },
  { label: 'INFO', value: 'info' },
  { label: 'WARN', value: 'warn' },
  { label: 'ERROR', value: 'error' },
  { label: 'DEBUG', value: 'debug' }
];

// 初始化modal
const [Modal, modalApi] = useVbenModal({
  title: $t('page.accountInfo.taskLogs'),
  class: 'w-[900px]',
  draggable: true,
  fullscreenButton: true,
  footer: false,
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      data.value = modalApi.getData<Record<string, any>>() || {};
      
      // 重置状态
      logs.value = [];
      levelFilter.value = 'all';
      searchKeyword.value = '';
      loading.value = true;
      
      // 订阅任务日志
      if (taskId.value) {
        try {
          console.log('开始订阅任务日志:', taskId.value);
          
          // 订阅实时日志
          unsubscribeFn = subscribeTaskLogs(taskId.value, handleLogUpdate);
          
          // TODO: 可以在这里加载历史日志
          // const historicalLogs = await loadTaskHistoryLogs(taskId.value);
          // logs.value = historicalLogs;
          
          loading.value = false;
        } catch (error) {
          console.error('订阅任务日志失败:', error);
          loading.value = false;
        }
      }
    } else {
      // 取消订阅
      if (unsubscribeFn) {
        unsubscribeFn();
        unsubscribeFn = null;
      }
    }
  },
});

// 处理日志更新
function handleLogUpdate(data: { taskId: number; logs: Array<any> }) {
  console.log('收到日志更新:', data);
  
  if (data.taskId === taskId.value) {
    // 批量添加新日志
    logs.value.push(...data.logs);
    console.log('当前日志总数:', logs.value.length);
    
    // 限制最大日志数量，防止内存溢出
    const maxLogs = 500; // 减少到500条避免卡顿
    if (logs.value.length > maxLogs) {
      logs.value = logs.value.slice(-maxLogs);
    }
    
    // 检测是否有新日志
    if (!autoScroll.value && logContainerRef.value) {
      const container = logContainerRef.value;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      if (!isAtBottom) {
        hasNewLogs.value = true;
      }
    }
    
    // 自动滚动
    if (autoScroll.value) {
      // 使用 requestAnimationFrame 优化滚动性能
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }
}

// 滚动到底部
function scrollToBottom() {
  if (logContainerRef.value) {
    logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
  }
}

// 清空显示
function clearLogs() {
  logs.value = [];
}

// 格式化时间戳
function formatTimestamp(timestamp: string) {
  return dayjs(timestamp).format('HH:mm:ss.SSS');
}

// 格式化元数据
function formatMetadata(metadata: any) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return '';
  }
  
  // 提取进度信息
  if (metadata.progress !== undefined) {
    return ` [${metadata.progress}%]`;
  }
  
  // 其他元数据
  return ` ${JSON.stringify(metadata)}`;
}

// 检测是否有新日志（用于提示）
const hasNewLogs = ref(false);

// 监听滚动
function handleScroll(event: Event) {
  const container = event.target as HTMLElement;
  const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
  
  if (isAtBottom) {
    hasNewLogs.value = false;
  }
}

// 组件卸载时清理
onUnmounted(() => {
  if (unsubscribeFn) {
    unsubscribeFn();
  }
});
</script>

<template>
  <Modal>
    <div class="task-log-modal">
      <!-- 标题栏 -->
      <div class="mb-4">
        <div class="text-sm mb-2">
          {{ $t('page.accountInfo.taskName') }}: {{ taskName }}
        </div>
        
        <!-- 过滤器栏 -->
        <Space class="w-full">
          <Select 
            v-model:value="levelFilter"
            :options="levelOptions"
            style="width: 120px"
            :placeholder="$t('page.accountInfo.logLevel')"
          />
          
          <Input.Search
            v-model:value="searchKeyword"
            :placeholder="$t('page.accountInfo.searchLogs')"
            style="width: 300px"
            allow-clear
          />
          
          <Checkbox v-model:checked="autoScroll">
            {{ $t('page.accountInfo.autoScroll') }}
          </Checkbox>
          
          <Button @click="clearLogs" size="small">
            {{ $t('page.accountInfo.clearDisplay') }}
          </Button>
          
          <div class="flex-1"></div>
          
          <Badge :count="filteredLogs.length" :showZero="true">
            <span class="text-sm">{{ $t('page.accountInfo.logCount') }}</span>
          </Badge>
        </Space>
      </div>
      
      <!-- 日志内容区 -->
      <Spin :spinning="loading">
        <div 
          ref="logContainerRef"
          class="log-container"
          @scroll="handleScroll"
        >
          <!-- 日志列表 -->
          <div v-show="filteredLogs.length > 0">
            <div 
              v-for="(log, index) in filteredLogs" 
              :key="`${log.timestamp}-${index}`"
              class="log-item"
              :class="{ 'log-error': log.level === 'error', 'log-warn': log.level === 'warn' }"
            >
              <span class="log-time">{{ formatTimestamp(log.timestamp) }}</span>
              <Tag 
                :color="logLevelColors[log.level]?.color || 'default'" 
                class="log-level"
              >
                {{ logLevelColors[log.level]?.text || log.level.toUpperCase() }}
              </Tag>
              <span class="log-message">
                {{ log.message }}
                <span v-if="log.metadata" class="log-metadata">{{ formatMetadata(log.metadata) }}</span>
              </span>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-show="filteredLogs.length === 0" class="empty-state">
            <div>
              {{ loading ? $t('page.accountInfo.loadingLogs') : $t('page.accountInfo.noLogs') }}
            </div>
          </div>
          
          <!-- 新日志提示 -->
          <div 
            v-if="hasNewLogs && !autoScroll" 
            class="new-logs-hint"
            @click="scrollToBottom"
          >
            ↓ {{ $t('page.accountInfo.newLogs') }}
          </div>
        </div>
      </Spin>
    </div>
  </Modal>
</template>

<style scoped>
.task-log-modal {
  min-height: 400px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.log-container {
  flex: 1;
  height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid;
  border-radius: 4px;
  padding: 8px;
  font-size: 13px;
  line-height: 1.5;
  position: relative;
}

.log-item {
  padding: 4px 8px;
  margin-bottom: 2px;
  border-radius: 2px;
  word-break: break-all;
  transition: background-color 0.2s;
  display: flex;
  align-items: flex-start;
}

.log-time {
  margin-right: 8px;
  user-select: none;
  flex-shrink: 0;
}

.log-level {
  margin-right: 8px;
  flex-shrink: 0;
}

.log-message {
  flex: 1;
  word-wrap: break-word;
}

.log-metadata {
  font-style: italic;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.new-logs-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 16px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  box-shadow: 0 2px 8px;
}

/* 滚动条样式 */
.log-container::-webkit-scrollbar {
  width: 6px;
}

.log-container::-webkit-scrollbar-track {
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb {
  border-radius: 3px;
}

</style>