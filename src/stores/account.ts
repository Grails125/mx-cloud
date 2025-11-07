/**
 * 账户管理状态存储
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { CloudAccount } from "@/types";
import { generateId } from "@/utils/crypto";
import { saveAccounts, loadAccounts } from "@/utils/storage";

export const useAccountStore = defineStore("account", () => {
  const accounts = ref<CloudAccount[]>([]);
  const masterPassword = ref<string>("");
  const isLoading = ref(false);

  /**
   * 账户数量
   */
  const accountCount = computed(() => accounts.value.length);

  /**
   * 按云服务商分组的账户
   */
  const accountsByProvider = computed(() => {
    const grouped: Record<string, CloudAccount[]> = {};
    accounts.value.forEach((account) => {
      if (!grouped[account.provider]) {
        grouped[account.provider] = [];
      }
      grouped[account.provider].push(account);
    });
    return grouped;
  });

  /**
   * 设置主密码
   */
  function setMasterPassword(password: string) {
    masterPassword.value = password;
  }

  /**
   * 添加账户
   */
  async function addAccount(
    accountData: Omit<CloudAccount, "id" | "createdAt" | "updatedAt">
  ) {
    const newAccount: CloudAccount = {
      ...accountData,
      enabled: accountData.enabled !== undefined ? accountData.enabled : true, // 默认启用
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    accounts.value.push(newAccount);
    await saveAccounts(accounts.value, masterPassword.value);
    return newAccount;
  }

  /**
   * 加载账户列表（兼容旧数据，没有enabled字段的账户默认为启用）
   */
  async function loadAccountList(password: string) {
    isLoading.value = true;
    try {
      const loadedAccounts = await loadAccounts(password);
      // 兼容旧数据：没有enabled字段的账户默认为启用
      accounts.value = loadedAccounts.map((account) => ({
        ...account,
        enabled: account.enabled !== undefined ? account.enabled : true,
      }));
      masterPassword.value = password;
    } catch (error) {
      console.error("加载账户失败:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 更新账户
   */
  async function updateAccount(id: string, updates: Partial<CloudAccount>) {
    const index = accounts.value.findIndex((acc) => acc.id === id);
    if (index === -1) {
      throw new Error("账户不存在");
    }

    accounts.value[index] = {
      ...accounts.value[index],
      ...updates,
      id,
      updatedAt: Date.now(),
    };

    await saveAccounts(accounts.value, masterPassword.value);
    return accounts.value[index];
  }

  /**
   * 删除账户
   */
  async function deleteAccount(id: string) {
    const index = accounts.value.findIndex((acc) => acc.id === id);
    if (index === -1) {
      throw new Error("账户不存在");
    }

    accounts.value.splice(index, 1);
    await saveAccounts(accounts.value, masterPassword.value);
  }

  /**
   * 根据ID获取账户
   */
  function getAccountById(id: string): CloudAccount | undefined {
    return accounts.value.find((acc) => acc.id === id);
  }

  /**
   * 清空账户列表
   */
  function clearAccounts() {
    accounts.value = [];
    masterPassword.value = "";
  }

  return {
    accounts,
    masterPassword,
    isLoading,
    accountCount,
    accountsByProvider,
    setMasterPassword,
    loadAccountList,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountById,
    clearAccounts,
  };
});
