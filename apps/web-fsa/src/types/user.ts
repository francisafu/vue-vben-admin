/**
 * 项目级用户信息类型扩展
 */
import type { UserInfo as VbenUserInfo } from '@vben/types';

/**
 * 扩展的用户信息类型，添加项目特定字段
 */
export interface ExtendedUserInfo extends VbenUserInfo {
  /**
   * 手机号
   */
  phone?: string;
  // username 字段已经在 VbenUserInfo 中定义，不需要重复定义
}

// 为了方便使用，也导出一个别名
export type UserInfo = ExtendedUserInfo;
