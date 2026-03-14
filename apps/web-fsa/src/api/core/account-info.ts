import { requestClient } from '#/api/request';

export namespace AccountInfoApi {
  /** 获取抢购账号列表参数 */
  export interface ListAccountInfosParams {
    activityId: number;
  }

  /** 活动信息 */
  export interface ActivityInfo {
    id: number;
    brand: string;
    startTime: string;
    endTime: string;
  }

  /** 任务信息 */
  export interface TaskInfo {
    id: number;
    ordersDelay: number;
    isScheduled: boolean;
    startTime: string | null;
    isPolling: boolean;
    isEditable: boolean;
    status: string;
    products: any[];
  }

  /** 抢购账号信息 */
  export interface AccountInfoItem {
    id: number;
    account: string;
    password: string;
    taskCount: number;
    tasks: TaskInfo[];
  }

  /** 获取抢购账号列表返回结果 */
  export interface AccountInfoListResult {
    activity: ActivityInfo;
    accountLimit: number;
    currentAccountCount: number;
    accountInfos: AccountInfoItem[];
  }

  /** 创建抢购账号参数 */
  export interface CreateAccountInfoParams {
    activityId: number;
    account: string;
    password: string;
  }

  /** 创建抢购账号返回结果 */
  export interface CreateAccountInfoResult {
    id: number;
    account: string;
    password: string;
    activity: ActivityInfo;
  }

  /** 更新抢购账号参数 */
  export interface UpdateAccountInfoParams {
    account?: string;
    password?: string;
  }

  /** 更新抢购账号返回结果 */
  export interface UpdateAccountInfoResult {
    id: number;
    account: string;
    password: string;
    activity: ActivityInfo;
  }
}

/**
 * 获取用户的抢购账号列表
 */
export async function listAccountInfosApi(data: AccountInfoApi.ListAccountInfosParams) {
  return requestClient.post<AccountInfoApi.AccountInfoListResult>('/accountinfos/list', data);
}

/**
 * 创建新的抢购账号
 */
export async function createAccountInfoApi(data: AccountInfoApi.CreateAccountInfoParams) {
  return requestClient.post<AccountInfoApi.CreateAccountInfoResult>('/accountinfos/create', data);
}

/**
 * 更新抢购账号信息
 */
export async function updateAccountInfoApi(
  id: number,
  data: AccountInfoApi.UpdateAccountInfoParams,
) {
  return requestClient.post<AccountInfoApi.UpdateAccountInfoResult>(
    `/accountinfos/${id}/update`,
    data,
  );
}

/**
 * 删除抢购账号
 */
export async function deleteAccountInfoApi(id: number) {
  return requestClient.post<null>(`/accountinfos/${id}/delete`);
}
