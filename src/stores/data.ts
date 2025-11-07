/**
 * 数据聚合状态存储
 * 管理账户余额、资源使用情况等聚合数据
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  AccountBalance,
  AggregatedAccountData,
  CloudAccount,
  UCloudProject,
  UHostInstance,
  UHostImage,
  EIP,
} from "@/types";
import { CloudProvider } from "@/types";
import { useAccountStore } from "./account";
import { AdapterFactory } from "@/adapters";
import { decrypt } from "@/utils/crypto";

export const useDataStore = defineStore("data", () => {
  const balances = ref<Map<string, AccountBalance>>(new Map());
  const projects = ref<Map<string, UCloudProject[]>>(new Map());
  const uHostInstances = ref<Map<string, UHostInstance[]>>(new Map());
  const images = ref<Map<string, UHostImage[]>>(new Map()); // 镜像列表
  const eips = ref<Map<string, EIP[]>>(new Map()); // 弹性IP列表
  // 缓存每个账户的有效 Region 列表（有 UHost 实例的 Region）
  const cachedRegions = ref<Map<string, string[]>>(new Map());
  const isLoading = ref(false);
  const lastUpdated = ref<number>(0);

  /**
   * 聚合后的账户数据
   */
  const aggregatedData = computed<AggregatedAccountData[]>(() => {
    const accountStore = useAccountStore();
    return accountStore.accounts.map((account) => ({
      account,
      balance: balances.value.get(account.id),
      resources: [], // 资源使用情况已移除
      alerts: [], // 预警信息由预警系统管理
      projects:
        account.provider === CloudProvider.UCLOUD
          ? projects.value.get(account.id)
          : undefined,
      uHostInstances:
        account.provider === CloudProvider.UCLOUD
          ? uHostInstances.value.get(account.id)
          : undefined,
      images:
        account.provider === CloudProvider.UCLOUD
          ? images.value.get(account.id) || []
          : undefined,
      eips:
        account.provider === CloudProvider.UCLOUD
          ? eips.value.get(account.id) || []
          : undefined,
    }));
  });

  /**
   * 总余额
   */
  const totalBalance = computed(() => {
    let total = 0;
    balances.value.forEach((balance) => {
      total += balance.balance;
    });
    return total;
  });

  /**
   * 解密账户凭证
   */
  async function decryptAccount(account: CloudAccount): Promise<CloudAccount> {
    const accountStore = useAccountStore();
    try {
      const decryptedKeyId = await decrypt(
        account.accessKeyId,
        accountStore.masterPassword
      );
      const decryptedKeySecret = await decrypt(
        account.accessKeySecret,
        accountStore.masterPassword
      );

      return {
        ...account,
        accessKeyId: decryptedKeyId,
        accessKeySecret: decryptedKeySecret,
      };
    } catch (error) {
      console.error("解密账户凭证失败:", error);
      throw new Error(`解密账户 ${account.name} 凭证失败`);
    }
  }

  /**
   * 刷新所有账户数据
   */
  async function refreshAllData() {
    const accountStore = useAccountStore();
    if (accountStore.accounts.length === 0) {
      return;
    }

    isLoading.value = true;
    try {
      const promises = accountStore.accounts
        .filter((account) => account.enabled !== false) // 只处理启用的账户
        .map(async (account) => {
          try {
            // 解密账户凭证
            const decryptedAccount = await decryptAccount(account);
            const adapter = AdapterFactory.getAdapter(account.provider);

            // 对于UCloud账户，同时获取项目列表和UHost实例列表
            if (account.provider === CloudProvider.UCLOUD) {
              const { UCloudAdapter } = await import("@/adapters/ucloud");
              const ucloudAdapter = adapter as InstanceType<
                typeof UCloudAdapter
              >;

              // 获取缓存的 Region 列表
              const cachedRegionList = cachedRegions.value.get(account.id);

              const [balance, projectList, instanceResult] = await Promise.all([
                adapter.getBalance(decryptedAccount),
                ucloudAdapter.getProjectList(decryptedAccount),
                ucloudAdapter.getUHostInstanceList(
                  decryptedAccount,
                  cachedRegionList
                ),
              ]);

              balances.value.set(account.id, balance);
              if (projectList && projectList.length > 0) {
                projects.value.set(account.id, projectList);
              }

              // 更新实例列表和有效 Region 缓存
              if (instanceResult.instances.length > 0) {
                // 为每个实例获取云硬盘信息
                const instancesWithDisks = await Promise.all(
                  instanceResult.instances.map(async (instance) => {
                    if (!instance.uHostId || !instance.region) {
                      return instance;
                    }

                    try {
                      // 获取该实例的云硬盘列表
                      const udisks = await ucloudAdapter.getUDiskList(
                        decryptedAccount,
                        instance.region,
                        instance.uHostId
                      );

                      return {
                        ...instance,
                        udisks: udisks.length > 0 ? udisks : undefined,
                      };
                    } catch (error) {
                      console.warn(
                        `获取实例 ${instance.uHostId} 的云硬盘列表失败:`,
                        error
                      );
                      return instance;
                    }
                  })
                );

                uHostInstances.value.set(account.id, instancesWithDisks);

                // 获取UHost实例存在的地域的镜像列表（不筛选，显示全部镜像）
                const allImages: UHostImage[] = [];
                const imageIdSet = new Set<string>(); // 用于去重

                // 收集所有UHost实例存在的地域
                const instanceRegions = new Set<string>();
                instancesWithDisks.forEach((instance) => {
                  if (instance.region) {
                    instanceRegions.add(instance.region);
                  }
                });

                if (instanceRegions.size > 0) {
                  // 只查询有实例的地域的镜像列表
                  await Promise.all(
                    Array.from(instanceRegions).map(async (region) => {
                      try {
                        const imageList = await ucloudAdapter.getImageList(
                          decryptedAccount,
                          region
                        );

                        // 添加所有镜像，并去重
                        imageList.forEach((image) => {
                          if (image.imageId && !imageIdSet.has(image.imageId)) {
                            imageIdSet.add(image.imageId);
                            allImages.push(image);
                          }
                        });
                      } catch (error) {
                        console.warn(
                          `获取地域 ${region} 的镜像列表失败:`,
                          error
                        );
                      }
                    })
                  );
                }

                // 无论是否有镜像，都设置镜像列表（可能是空数组）
                images.value.set(account.id, allImages);
                if (allImages.length > 0) {
                  console.log(
                    `账户 ${account.name} 获取到 ${allImages.length} 个镜像`
                  );
                }

                // 获取弹性IP列表（只查询有实例的地域）
                const allEIPs: EIP[] = [];
                const eipIdSet = new Set<string>(); // 用于去重

                if (instanceRegions.size > 0) {
                  await Promise.all(
                    Array.from(instanceRegions).map(async (region) => {
                      try {
                        const eipList = await ucloudAdapter.getEIPList(
                          decryptedAccount,
                          region
                        );

                        // 添加所有弹性IP，并去重
                        eipList.forEach((eip) => {
                          if (eip.eipId && !eipIdSet.has(eip.eipId)) {
                            eipIdSet.add(eip.eipId);
                            allEIPs.push(eip);
                          }
                        });
                      } catch (error) {
                        console.warn(
                          `获取地域 ${region} 的弹性IP列表失败:`,
                          error
                        );
                      }
                    })
                  );
                }

                // 无论是否有弹性IP，都设置弹性IP列表（可能是空数组）
                eips.value.set(account.id, allEIPs);
                if (allEIPs.length > 0) {
                  console.log(
                    `账户 ${account.name} 获取到 ${allEIPs.length} 个弹性IP`
                  );
                }
              }
              // 更新有效 Region 缓存（只有在有实例时才更新）
              if (instanceResult.validRegions.length > 0) {
                cachedRegions.value.set(
                  account.id,
                  instanceResult.validRegions
                );
              }
            } else {
              const balance = await adapter.getBalance(decryptedAccount);
              balances.value.set(account.id, balance);
            }
          } catch (error) {
            console.error(`刷新账户 ${account.name} 数据失败:`, error);
          }
        });

      await Promise.all(promises);
      lastUpdated.value = Date.now();
    } catch (error) {
      console.error("刷新数据失败:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 刷新单个账户数据
   */
  async function refreshAccountData(accountId: string) {
    const accountStore = useAccountStore();
    const account = accountStore.getAccountById(accountId);
    if (!account) {
      throw new Error("账户不存在");
    }

    // 如果账户已停用，不刷新数据
    if (account.enabled === false) {
      return;
    }

    try {
      // 解密账户凭证
      const decryptedAccount = await decryptAccount(account);
      const adapter = AdapterFactory.getAdapter(account.provider);
      const balance = await adapter.getBalance(decryptedAccount);

      balances.value.set(account.id, balance);
      lastUpdated.value = Date.now();
    } catch (error) {
      console.error(`刷新账户 ${account.name} 数据失败:`, error);
      throw error;
    }
  }

  /**
   * 获取账户余额
   */
  function getAccountBalance(accountId: string): AccountBalance | undefined {
    return balances.value.get(accountId);
  }

  /**
   * 获取账户项目列表（UCloud）
   */
  function getAccountProjects(accountId: string): UCloudProject[] {
    return projects.value.get(accountId) || [];
  }

  /**
   * 刷新区域缓存（使用全部区域全量调用）
   */
  async function refreshRegionCache(accountId?: string) {
    const accountStore = useAccountStore();
    let targetAccounts: CloudAccount[] = [];

    if (accountId) {
      const account = accountStore.getAccountById(accountId);
      if (
        account &&
        account.provider === CloudProvider.UCLOUD &&
        account.enabled !== false
      ) {
        targetAccounts = [account];
      }
    } else {
      targetAccounts = accountStore.accounts.filter(
        (account) =>
          account.provider === CloudProvider.UCLOUD && account.enabled !== false
      );
    }

    if (targetAccounts.length === 0) {
      return;
    }

    isLoading.value = true;
    try {
      const promises = targetAccounts.map(async (account) => {
        try {
          // 清除该账户的 Region 缓存
          cachedRegions.value.delete(account.id);

          // 解密账户凭证
          const decryptedAccount = await decryptAccount(account);
          const { UCloudAdapter } = await import("@/adapters/ucloud");
          const adapter = AdapterFactory.getAdapter(
            account.provider
          ) as InstanceType<typeof UCloudAdapter>;

          // 使用全部区域全量调用
          const instanceResult = await adapter.getUHostInstanceList(
            decryptedAccount
          );

          // 更新实例列表和有效 Region 缓存
          if (instanceResult.instances.length > 0) {
            // 为每个实例获取云硬盘信息
            const instancesWithDisks = await Promise.all(
              instanceResult.instances.map(async (instance) => {
                if (!instance.uHostId || !instance.region) {
                  return instance;
                }

                try {
                  // 获取该实例的云硬盘列表
                  const udisks = await adapter.getUDiskList(
                    decryptedAccount,
                    instance.region,
                    instance.uHostId
                  );

                  return {
                    ...instance,
                    udisks: udisks.length > 0 ? udisks : undefined,
                  };
                } catch (error) {
                  console.warn(
                    `获取实例 ${instance.uHostId} 的云硬盘列表失败:`,
                    error
                  );
                  return instance;
                }
              })
            );

            uHostInstances.value.set(account.id, instancesWithDisks);

            // 获取UHost实例存在的地域的镜像列表（不筛选，显示全部镜像）
            const allImages: UHostImage[] = [];
            const imageIdSet = new Set<string>(); // 用于去重

            // 收集所有UHost实例存在的地域
            const instanceRegions = new Set<string>();
            instancesWithDisks.forEach((instance) => {
              if (instance.region) {
                instanceRegions.add(instance.region);
              }
            });

            if (instanceRegions.size > 0) {
              // 只查询有实例的地域的镜像列表
              await Promise.all(
                Array.from(instanceRegions).map(async (region) => {
                  try {
                    const imageList = await adapter.getImageList(
                      decryptedAccount,
                      region
                    );

                    // 添加所有镜像，并去重
                    imageList.forEach((image) => {
                      if (image.imageId && !imageIdSet.has(image.imageId)) {
                        imageIdSet.add(image.imageId);
                        allImages.push(image);
                      }
                    });
                  } catch (error) {
                    console.warn(`获取地域 ${region} 的镜像列表失败:`, error);
                  }
                })
              );
            }

            // 无论是否有镜像，都设置镜像列表（可能是空数组）
            images.value.set(account.id, allImages);
            if (allImages.length > 0) {
              console.log(
                `账户 ${account.name} 刷新区域缓存获取到 ${allImages.length} 个镜像`
              );
            }

            // 获取弹性IP列表（只查询有实例的地域）
            const allEIPs: EIP[] = [];
            const eipIdSet = new Set<string>(); // 用于去重

            if (instanceRegions.size > 0) {
              await Promise.all(
                Array.from(instanceRegions).map(async (region) => {
                  try {
                    const eipList = await adapter.getEIPList(
                      decryptedAccount,
                      region
                    );

                    // 添加所有弹性IP，并去重
                    eipList.forEach((eip) => {
                      if (eip.eipId && !eipIdSet.has(eip.eipId)) {
                        eipIdSet.add(eip.eipId);
                        allEIPs.push(eip);
                      }
                    });
                  } catch (error) {
                    console.warn(`获取地域 ${region} 的弹性IP列表失败:`, error);
                  }
                })
              );
            }

            // 无论是否有弹性IP，都设置弹性IP列表（可能是空数组）
            eips.value.set(account.id, allEIPs);
            if (allEIPs.length > 0) {
              console.log(
                `账户 ${account.name} 刷新区域缓存获取到 ${allEIPs.length} 个弹性IP`
              );
            }
          }
          if (instanceResult.validRegions.length > 0) {
            cachedRegions.value.set(account.id, instanceResult.validRegions);
          }
        } catch (error) {
          console.error(`刷新账户 ${account.name} 区域缓存失败:`, error);
        }
      });

      await Promise.all(promises);
      lastUpdated.value = Date.now();
    } catch (error) {
      console.error("刷新区域缓存失败:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 清空所有数据
   */
  function clearData() {
    balances.value.clear();
    projects.value.clear();
    uHostInstances.value.clear();
    images.value.clear();
    eips.value.clear();
    cachedRegions.value.clear();
    lastUpdated.value = 0;
  }

  return {
    balances,
    projects,
    isLoading,
    lastUpdated,
    aggregatedData,
    totalBalance,
    refreshAllData,
    refreshAccountData,
    refreshRegionCache,
    getAccountBalance,
    getAccountProjects,
    clearData,
  };
});
