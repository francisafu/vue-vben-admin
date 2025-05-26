import { requestClient } from '#/api/request';

export namespace ActivityApi {
  /** 获取活动列表参数 */
  export interface ListActivitiesParams {
    page?: number;
    pageSize?: number;
    brand?: string;
    timeRange?: [string, string];
  }

  /** 活动列表返回的活动信息 */
  export interface ActivityItem {
    id: number;
    brand: string;
    startTime: string;
    endTime: string;
    createdAt: string;
    updatedAt: string;
    userCount: number;
    taskCount: number;
    accountTotal: number;
    accountLimitTotal: number;
  }

  /** 活动列表返回结果 */
  export interface ActivityListResult {
    list: ActivityItem[];
    pagination: {
      current: number;
      pageSize: number;
      total: number;
    };
  }

  /** 创建活动参数 */
  export interface CreateActivityParams {
    brand: string;
    startTime: string;
    endTime: string;
  }

  /** 活动详情中的用户信息 */
  export interface ActivityUserItem {
    userId: number;
    username: string;
    accountLimit: number;
    accountCount: number;
    taskCount: number;
  }

  /** 获取活动详情返回结果 */
  export interface ActivityDetailResult {
    id: number;
    brand: string;
    startTime: string;
    endTime: string;
    createdAt: string;
    updatedAt: string;
    taskCount: number;
    users: ActivityUserItem[];
  }

  /** 更新活动参数 */
  export interface UpdateActivityParams {
    brand?: string;
    startTime?: string;
    endTime?: string;
  }

  /** 关联用户到活动的用户项 */
  export interface LinkUserItem {
    userId: number;
    accountLimit: number;
  }

  /** 关联用户到活动参数 */
  export interface LinkUsersParams {
    users: LinkUserItem[];
  }

  /** 关联用户返回的用户处理结果项 */
  export interface LinkUserResultItem {
    userId: number | string;
    status: string;
    message: string;
  }

  /** 关联用户返回结果 */
  export interface LinkUsersResult {
    success: number;
    updated: number;
    removed: number;
    failed: number;
    details: LinkUserResultItem[];
  }

  /** 用户活动列表项 */
  export interface UserActivityItem {
    id: number;
    brand: string;
    startTime: string;
    endTime: string;
  }
}

/**
 * 获取活动列表
 */
export async function listActivitiesApi(data: ActivityApi.ListActivitiesParams) {
  return requestClient.post<ActivityApi.ActivityListResult>('/activities/list', data);
}

/**
 * 创建新活动
 */
export async function createActivityApi(data: ActivityApi.CreateActivityParams) {
  return requestClient.post<ActivityApi.ActivityItem>('/activities/create', data);
}

/**
 * 根据ID获取活动信息
 */
export async function getActivityByIdApi(id: number) {
  return requestClient.post<ActivityApi.ActivityDetailResult>(`/activities/${id}/read`);
}

/**
 * 更新活动信息
 */
export async function updateActivityApi(
  id: number,
  data: ActivityApi.UpdateActivityParams,
) {
  return requestClient.post<ActivityApi.ActivityItem>(
    `/activities/${id}/update`,
    data,
  );
}

/**
 * 删除活动
 */
export async function deleteActivityApi(id: number) {
  return requestClient.post<null>(`/activities/${id}/delete`);
}

/**
 * 更新活动关联的用户
 */
export async function updateActivityUsersApi(
  id: number,
  data: ActivityApi.LinkUsersParams,
) {
  return requestClient.post<ActivityApi.LinkUsersResult>(
    `/activities/${id}/updatelinks`,
    data,
  );
}

/**
 * 获取当前用户参与的活动列表
 */
export async function getUserActivitiesApi() {
  return requestClient.post<ActivityApi.UserActivityItem[]>('/activities/myactivity');
}
