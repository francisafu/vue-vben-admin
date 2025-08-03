import { io, Socket } from 'socket.io-client';
import { ref, onMounted, onUnmounted } from 'vue';
import { useAccessStore } from '@vben/stores';
import { notification } from 'ant-design-vue';

// Socket连接状态
export enum SocketStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

// 任务状态更新事件
export interface TaskStatusUpdate {
  taskId: number;
  status: 'CREATED' | 'PENDING' | 'ACTIVE' | 'RETRY' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  updatedAt: string;
}

// 任务日志更新事件
export interface TaskLogUpdate {
  taskId: number;
  log: string;
  timestamp: string;
}

// Socket实例
let socket: Socket | null = null;

// 全局状态
const connectionStatus = ref<SocketStatus>(SocketStatus.DISCONNECTED);
const reconnectAttempts = ref(0);
const maxReconnectAttempts = 5;

// 任务状态订阅者
const taskStatusSubscribers = new Map<number, Set<(update: TaskStatusUpdate) => void>>();
// 任务日志订阅者
const taskLogSubscribers = new Map<number, Set<(update: TaskLogUpdate) => void>>();

/**
 * 初始化Socket连接
 */
export function initializeSocket() {
  if (socket?.connected) {

    return;
  }

  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  // 调试信息
    if (!token) {
    connectionStatus.value = SocketStatus.ERROR;
    return;
  }

  connectionStatus.value = SocketStatus.CONNECTING;

  // 创建Socket连接
  const socketUrl = import.meta.env.VITE_GLOB_SOCKET_URL || '/';
  socket = io(socketUrl, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionAttempts: maxReconnectAttempts,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'], // 明确指定传输方式
  });

  // 连接成功
  socket.on('connect', () => {

    connectionStatus.value = SocketStatus.CONNECTED;
    reconnectAttempts.value = 0;
    
    notification.success({
      message: '实时连接已建立',
      description: '任务状态将实时更新',
      duration: 3,
    });
  });

  // 连接断开
  socket.on('disconnect', (reason) => {

    connectionStatus.value = SocketStatus.DISCONNECTED;
    
    if (reason === 'io server disconnect') {
      // 服务器主动断开连接，需要手动重连
      socket?.connect();
    }
  });

  // 连接错误
  socket.on('connect_error', (_error) => {
    connectionStatus.value = SocketStatus.ERROR;
    reconnectAttempts.value++;
    
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      notification.error({
        message: '实时连接失败',
        description: '无法建立实时连接，请刷新页面重试',
        duration: 0,
      });
    }
  });

  // 任务状态更新
  socket.on('task:status-update', (data: TaskStatusUpdate) => {
    
    
    // 通知该任务的所有订阅者
    const subscribers = taskStatusSubscribers.get(data.taskId);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  });

  // 任务日志更新
  socket.on('task:log-update', (data: TaskLogUpdate) => {
    
    
    // 通知该任务的所有订阅者
    const subscribers = taskLogSubscribers.get(data.taskId);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  });

  // 错误消息
  socket.on('error', (data: { message: string }) => {
    
    notification.error({
      message: '系统错误',
      description: data.message,
    });
  });
}

/**
 * 断开Socket连接
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionStatus.value = SocketStatus.DISCONNECTED;
  }
}

/**
 * 订阅任务状态更新
 */
export function subscribeTaskStatus(taskId: number, callback: (update: TaskStatusUpdate) => void) {
  if (!socket?.connected) {

    return () => {};
  }

  // 添加订阅者
  if (!taskStatusSubscribers.has(taskId)) {
    taskStatusSubscribers.set(taskId, new Set());
    // 向服务器订阅
    socket.emit('subscribe:task', taskId);
  }
  taskStatusSubscribers.get(taskId)?.add(callback);

  // 返回取消订阅函数
  return () => {
    const subscribers = taskStatusSubscribers.get(taskId);
    if (subscribers) {
      subscribers.delete(callback);
      // 如果没有订阅者了，向服务器取消订阅
      if (subscribers.size === 0) {
        taskStatusSubscribers.delete(taskId);
        socket?.emit('unsubscribe:task', taskId);
      }
    }
  };
}

/**
 * 订阅任务日志更新
 */
export function subscribeTaskLog(taskId: number, callback: (update: TaskLogUpdate) => void) {
  if (!socket?.connected) {

    return () => {};
  }

  // 添加订阅者
  if (!taskLogSubscribers.has(taskId)) {
    taskLogSubscribers.set(taskId, new Set());
    // 如果还没有订阅该任务，向服务器订阅
    if (!taskStatusSubscribers.has(taskId)) {
      socket.emit('subscribe:task', taskId);
    }
  }
  taskLogSubscribers.get(taskId)?.add(callback);

  // 返回取消订阅函数
  return () => {
    const subscribers = taskLogSubscribers.get(taskId);
    if (subscribers) {
      subscribers.delete(callback);
      // 如果没有订阅者了，检查是否需要取消订阅
      if (subscribers.size === 0) {
        taskLogSubscribers.delete(taskId);
        // 如果状态订阅者也没有了，向服务器取消订阅
        if (!taskStatusSubscribers.has(taskId)) {
          socket?.emit('unsubscribe:task', taskId);
        }
      }
    }
  };
}

/**
 * 订阅用户的所有任务更新
 */
export function subscribeUserTasks() {
  if (!socket?.connected) {

    return;
  }

  socket.emit('subscribe:user-tasks');
}

/**
 * 发送心跳
 */
export function sendPing() {
  if (socket?.connected) {
    socket.emit('ping');
  }
}

/**
 * 获取连接状态
 */
export function getConnectionStatus() {
  return connectionStatus.value;
}

/**
 * 组合式函数：在组件中使用Socket
 */
export function useSocket() {
  let unsubscribers: Array<() => void> = [];

  onMounted(() => {
    // 确保Socket已初始化
    if (!socket) {
      initializeSocket();
    }
  });

  onUnmounted(() => {
    // 清理所有订阅
    unsubscribers.forEach(unsub => unsub());
    unsubscribers = [];
  });

  return {
    connectionStatus,
    subscribeTaskStatus: (taskId: number, callback: (update: TaskStatusUpdate) => void) => {
      const unsub = subscribeTaskStatus(taskId, callback);
      unsubscribers.push(unsub);
      return unsub;
    },
    subscribeTaskLog: (taskId: number, callback: (update: TaskLogUpdate) => void) => {
      const unsub = subscribeTaskLog(taskId, callback);
      unsubscribers.push(unsub);
      return unsub;
    },
    subscribeUserTasks,
    sendPing,
  };
}

// 定期发送心跳
setInterval(() => {
  sendPing();
}, 30000);