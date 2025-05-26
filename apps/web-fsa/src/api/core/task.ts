import { requestClient } from '#/api/request';

export namespace TaskApi {
  /** 商品信息 */
  export interface ProductInfo {
    skuCode: string;
    productName: string;
    quantity: number;
    order: number;
  }

  /** 订单日志信息 */
  export interface OrderLogInfo {
    orderNumber: number;
    status: string;
  }

  /** 解析商品文件返回结果 */
  export interface ParseProductsResult {
    products: ProductInfo[];
    ordersPreview: OrderLogInfo[];
    productCount: number;
    orderCount: number;
    parseSuccess: boolean;
  }

  /** 活动信息 */
  export interface ActivityInfo {
    id: number;
    brand: string;
    startTime: string;
    endTime: string;
  }

  /** 账号信息 */
  export interface AccountInfo {
    id: number;
    account: string;
    password: string;
  }

  /** 创建任务参数 */
  export interface CreateTaskParams {
    activityId: number;
    accountId: number;
    ordersDelay?: number;
    isScheduled?: boolean;
    startTime?: string;
    products: ProductInfo[];
    ordersLog: OrderLogInfo[];
  }

  /** 任务信息 */
  export interface TaskItem {
    id: number;
    activityId: number;
    activity: ActivityInfo;
    accountId: number;
    account: AccountInfo;
    ordersDelay: number;
    isScheduled: boolean;
    startTime: string | null;
    products: ProductInfo[];
    ordersLog: OrderLogInfo[];
    status: string;
    productCount: number;
    orderCount: number;
    isPolling: boolean;
    isEditable: boolean;
    createdAt: string;
    updatedAt: string;
  }

  /** 创建任务返回结果 */
  export interface CreateTaskResult extends TaskItem {}

  /** 更新任务参数 */
  export interface UpdateTaskParams {
    ordersDelay?: number;
    isScheduled?: boolean;
    startTime?: string;
    products?: ProductInfo[];
    ordersLog?: OrderLogInfo[];
  }

  /** 更新任务返回结果 */
  export interface UpdateTaskResult extends TaskItem {}

  /** 获取任务详情返回结果 */
  export interface TaskDetailResult extends TaskItem {}

  /** 任务日志信息 */
  export interface TaskLogInfo {
    id: number;
    taskId: number;
    logLevel: string;
    message: string;
    createdAt: string;
  }

  /** 获取任务日志返回结果 */
  export interface TaskLogsResult {
    logs: TaskLogInfo[];
    total: number;
  }

  /** 复制任务参数 */
  export interface CopyTaskParams {
    accountId: number;
  }

  /** 复制任务返回结果 */
  export interface CopyTaskResult extends TaskItem {}
}

/**
 * 解析Excel文件预览商品数据
 */
export async function parseProductsApi(file: File) {
  const formData = new FormData();
  formData.append('productsFile', file);
  
  return requestClient.post<TaskApi.ParseProductsResult>('/tasks/parseproducts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 创建新任务
 */
export async function createTaskApi(data: TaskApi.CreateTaskParams) {
  return requestClient.post<TaskApi.CreateTaskResult>('/tasks/create', data);
}

/**
 * 修改任务信息
 */
export async function updateTaskApi(
  id: number,
  data: TaskApi.UpdateTaskParams,
) {
  return requestClient.post<TaskApi.UpdateTaskResult>(
    `/tasks/${id}/update`,
    data,
  );
}

/**
 * 获取任务日志
 */
export async function getTaskLogsApi(id: number) {
  return requestClient.post<TaskApi.TaskLogsResult>(`/tasks/${id}/getlogs`);
}

/**
 * 复制任务
 */
export async function copyTaskApi(
  id: number,
  data: TaskApi.CopyTaskParams,
) {
  return requestClient.post<TaskApi.CopyTaskResult>(
    `/tasks/${id}/copy`,
    data,
  );
}

/**
 * 删除任务
 */
export async function deleteTaskApi(id: number) {
  return requestClient.post<null>(`/tasks/${id}/delete`);
}

/**
 * 获取任务详情
 */
export async function getTaskByIdApi(id: number) {
  return requestClient.post<TaskApi.TaskDetailResult>(`/tasks/${id}/read`);
}
