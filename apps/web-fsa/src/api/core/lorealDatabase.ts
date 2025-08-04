import { requestClient } from '#/api/request';

// 获取欧莱雅数据库列表
export function getLorealDatabaseList(data: {
  page?: number;
  pageSize?: number;
  activityId?: number;
}) {
  return requestClient.post('/lorealdb/list', data);
}

// 创建欧莱雅数据库（爬取）
export function createLorealDatabase(data: {
  activityId: number;
  account: string;
  password: string;
}) {
  return requestClient.post('/lorealdb/create', data);
}

// 获取欧莱雅数据库详情
export function getLorealDatabaseDetail(id: number) {
  return requestClient.post(`/lorealdb/${id}/read`);
}

// 通过活动ID获取欧莱雅数据库
export function getLorealDatabaseByActivity(data: {
  activityId: number;
}) {
  return requestClient.post('/lorealdb/activity', data);
}

// 更新欧莱雅数据库（重新爬取）
export function updateLorealDatabase(
  id: number,
  data: {
    account: string;
    password: string;
  }
) {
  return requestClient.post(`/lorealdb/${id}/update`, data);
}

// 删除欧莱雅数据库
export function deleteLorealDatabase(id: number) {
  return requestClient.post(`/lorealdb/${id}/delete`);
}

// 获取热卖活动数据
export function getHotSaleData() {
  return requestClient.post('/lorealdb/hotsale', {}, {
    responseType: 'blob', // 返回文件流
  });
}

// 获取活动列表（用于选择器）
export function getActivityList(data: {
  page?: number;
  pageSize?: number;
  brand?: string;
}) {
  return requestClient.post('/activities/list', data);
}