/**
 * 适配器工厂
 * 根据云服务商类型返回对应的适配器实例
 */

import { CloudProvider } from "@/types";
import { UCloudAdapter } from "./ucloud";
import type { ICloudAdapter } from "./base";

/**
 * 适配器工厂类
 */
export class AdapterFactory {
  private static adapters: Map<CloudProvider, ICloudAdapter> = new Map();

  /**
   * 获取适配器实例（单例模式）
   */
  static getAdapter(provider: CloudProvider): ICloudAdapter {
    if (!this.adapters.has(provider)) {
      switch (provider) {
        case CloudProvider.UCLOUD:
          this.adapters.set(provider, new UCloudAdapter());
          break;
        default:
          throw new Error(`不支持的云服务商: ${provider}`);
      }
    }

    return this.adapters.get(provider)!;
  }

  /**
   * 清除所有适配器实例
   */
  static clearAdapters(): void {
    this.adapters.clear();
  }
}
