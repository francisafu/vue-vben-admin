import { requestClient } from '#/api/request';

export namespace AccountApi {

  /** 账号地址信息 */
  export interface AccountAddress {
    id: number;
    userName: string;
    mobilePhone: string;
    provinceName: string;
    cityName: string;
    districtName: string;
    addrDetail: string;
    createdAt: string;
  }

  /** 账号基本信息接口返回值 */
  export interface AccountInfo {
    id: number;
    username: string;
    phone: string;
    pushplusToken: null | string;
    addresses: AccountAddress[];
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

  /** 地址数据结构 */
  export interface AddressData {
    address: {
      children: {
        children: {
          name: string;
        }[];
        name: string;
      }[];
      name: string;
    }[];
  }

  /** 添加地址参数 */
  export interface AddAddressParams {
    provinceName: string;
    cityName: string;
    districtName: string;
    userName: string;
    mobilePhone: string;
    addrDetail: string;
  }

  /** 更新地址参数 */
  export interface UpdateAddressParams extends AddAddressParams {
    id: number;
  }

  /** 删除地址参数 */
  export interface DeleteAddressParams {
    id: number;
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

/**
 * 获取系统内置地址数据
 */
export async function getAddressDataApi() {
  return requestClient.post<AccountApi.AddressData>('/account/getaddrdata');
}

/**
 * 添加收货地址
 */
export async function addAddressApi(data: AccountApi.AddAddressParams) {
  return requestClient.post<AccountApi.AccountAddress>(
    '/account/createaddr',
    data,
  );
}

/**
 * 更新收货地址
 */
export async function updateAddressApi(data: AccountApi.UpdateAddressParams) {
  return requestClient.post<AccountApi.AccountAddress>(
    '/account/updateaddr',
    data,
  );
}

/**
 * 删除收货地址
 */
export async function deleteAddressApi(data: AccountApi.DeleteAddressParams) {
  return requestClient.post<null>('/account/deleteaddr', data);
}
