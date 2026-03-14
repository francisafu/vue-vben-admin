import { requestClient } from '#/api/request';

export namespace WxappLorealApi {
  export interface TokenStatusItem {
    accountId: number;
    account: string;
    activityId: number;
    brand: string;
    hasToken: boolean;
    isValid: boolean;
    expiry: string | null;
    remainingMinutes: number;
    updatedAt: string | null;
  }
}

export async function getAllTokenStatusApi() {
  return requestClient.post<WxappLorealApi.TokenStatusItem[]>('/wxapp/loreal/token/status-all');
}
