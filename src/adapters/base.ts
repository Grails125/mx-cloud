/**
 * 云服务适配器基类
 * 定义统一的适配器接口，便于扩展新的云服务商
 */

import type { CloudAccount, AccountBalance, ResourceUsage } from '@/types'

/**
 * 适配器接口
 */
export interface ICloudAdapter {
  /**
   * 获取账户余额
   */
  getBalance(account: CloudAccount): Promise<AccountBalance>

  /**
   * 获取资源使用情况
   */
  getResourceUsage(account: CloudAccount): Promise<ResourceUsage[]>

  /**
   * 验证账户凭证
   */
  validateCredentials(account: CloudAccount): Promise<boolean>
}

/**
 * 适配器基类
 */
export abstract class BaseAdapter implements ICloudAdapter {
  abstract getBalance(account: CloudAccount): Promise<AccountBalance>
  abstract getResourceUsage(account: CloudAccount): Promise<ResourceUsage[]>
  abstract validateCredentials(account: CloudAccount): Promise<boolean>

  /**
   * 通用错误处理
   */
  protected handleError(error: unknown, operation: string): never {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[${this.constructor.name}] ${operation} 失败:`, message)
    throw new Error(`${operation}失败: ${message}`)
  }
}

