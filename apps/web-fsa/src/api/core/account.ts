import { requestClient } from '#/api/request';

export namespace AccountApi {

  /** 账号基本信息接口返回值 */
  export interface AccountInfo {
    id: number;
    username: string;
    phone: string;
    pushplusToken: null | string;
  }

  /** 更新账号基本信息参数 */
  export interface UpdateAccountBasicParams {
    username?: string;
    phone?: string;
    pushplusToken?: null | string;
  }

  /** 更新账号密码参数 */
  export interface UpdateAccountPasswordParams {
    newPassword: string;
  }
}

/**
 * 获取当前用户账号信息
 */
export async function getAccountInfoApi() {
  return requestClient.post<AccountApi.AccountInfo>('/account/info');
}

/**
 * 更新账号基本信息
 */
export async function updateAccountBasicApi(
  data: AccountApi.UpdateAccountBasicParams,
) {
  return requestClient.post<AccountApi.AccountInfo>('/account/basic', data);
}

/**
 * 更新账号密码
 */
export async function updateAccountPasswordApi(
  data: AccountApi.UpdateAccountPasswordParams,
) {
  return requestClient.post<null>('/account/password', data);
}
