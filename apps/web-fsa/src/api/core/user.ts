import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace UserApi {
  /** 获取用户列表参数 */
  export interface ListUsersParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    role?: string;
  }

  /** 用户列表返回的用户信息 */
  export interface UserItem {
    id: number;
    username: string;
    phone: string;
    role: string;
    isEnabled: boolean;
    createdAt: string;
  }

  /** 用户列表返回结果 */
  export interface UserListResult {
    list: UserItem[];
    pagination: {
      current: number;
      pageSize: number;
      total: number;
    };
  }

  /** 创建用户参数 */
  export interface CreateUserParams {
    username: string;
    password: string;
    phone: string;
    role?: string;
  }

  /** 创建用户返回结果 */
  export interface CreateUserResult {
    id: number;
    username: string;
    phone: string;
    role: string;
  }

  /** 获取用户详情返回结果 */
  export interface UserDetailResult {
    id: number;
    username: string;
    phone: string;
    role: string;
    isEnabled: boolean;
    createdAt: string;
    pushplusToken: null | string;
  }

  /** 更新用户参数 */
  export interface UpdateUserParams {
    username?: string;
    password?: string;
    phone?: string;
    role?: string;
    isEnabled?: boolean;
    pushplusToken?: null | string;
  }
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/users/info');
}

/**
 * 获取用户列表
 */
export async function listUsersApi(data: UserApi.ListUsersParams) {
  return requestClient.post<UserApi.UserListResult>('/users/list', data);
}

/**
 * 创建新用户
 */
export async function createUserApi(data: UserApi.CreateUserParams) {
  return requestClient.post<UserApi.CreateUserResult>('/users/create', data);
}

/**
 * 根据ID获取用户信息
 */
export async function getUserByIdApi(id: number) {
  return requestClient.post<UserApi.UserDetailResult>(`/users/${id}/read`);
}

/**
 * 更新用户信息
 */
export async function updateUserApi(
  id: number,
  data: UserApi.UpdateUserParams,
) {
  return requestClient.post<UserApi.UserDetailResult>(
    `/users/${id}/update`,
    data,
  );
}

/**
 * 删除用户
 */
export async function deleteUserApi(id: number) {
  return requestClient.post<null>(`/users/${id}/delete`);
}
