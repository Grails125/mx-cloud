<template>
  <Layout>
    <div class="accounts-page">
      <div class="page-header">
        <h2>账户管理</h2>
        <button @click="showAddModal = true" class="btn btn-primary">
          添加账户
        </button>
      </div>

      <div v-if="accountStore.accounts.length === 0" class="empty">
        <p>暂无账户，请添加云账户</p>
        <button @click="showAddModal = true" class="btn btn-primary mt-16">
          添加账户
        </button>
      </div>

      <div v-else class="accounts-list">
        <div
          v-for="account in accountStore.accounts"
          :key="account.id"
          class="account-item"
        >
          <div class="account-main">
            <div class="account-info">
              <h3>
                {{ account.name }}
                <span
                  v-if="!account.enabled"
                  class="status-badge disabled"
                  title="账户已停用"
                >
                  已停用
                </span>
              </h3>
              <div class="account-meta">
                <span class="provider-badge">{{
                  getProviderName(account.provider)
                }}</span>
                <span v-if="account.region" class="region">{{
                  account.region
                }}</span>
                <span class="time"
                  >创建于 {{ formatTime(account.createdAt) }}</span
                >
              </div>
            </div>
            <div class="account-actions">
              <label class="switch">
                <input
                  type="checkbox"
                  :checked="account.enabled !== false"
                  @change="
                    handleToggleStatus(
                      account.id,
                      ($event.target as HTMLInputElement).checked
                    )
                  "
                />
                <span class="slider"></span>
              </label>
              <button @click="handleEdit(account)" class="btn">编辑</button>
              <button @click="handleDelete(account.id)" class="btn btn-danger">
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加/编辑账户模态框 -->
      <div
        v-if="showAddModal || editingAccount"
        class="modal-overlay"
        @click="closeModal"
      >
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>{{ editingAccount ? "编辑账户" : "添加账户" }}</h3>
            <button @click="closeModal" class="modal-close">×</button>
          </div>
          <form @submit.prevent="handleSubmit" class="modal-body">
            <div class="form-group">
              <label class="label">账户名称</label>
              <input
                v-model="formData.name"
                type="text"
                class="input"
                placeholder="请输入账户名称"
                required
              />
            </div>

            <div class="form-group">
              <label class="label">云服务商</label>
              <select v-model="formData.provider" class="input" required>
                <option value="">请选择</option>
                <option :value="CloudProvider.UCLOUD">UCloud</option>
              </select>
            </div>

            <div class="form-group">
              <label class="label">AccessKey ID</label>
              <input
                v-model="formData.accessKeyId"
                type="text"
                class="input"
                placeholder="请输入 AccessKey ID"
                required
              />
            </div>

            <div class="form-group">
              <label class="label">AccessKey Secret</label>
              <input
                v-model="formData.accessKeySecret"
                type="password"
                class="input"
                placeholder="请输入 AccessKey Secret"
                required
              />
            </div>

            <div class="form-group">
              <label class="label">区域（可选）</label>
              <input
                v-model="formData.region"
                type="text"
                class="input"
                placeholder="如: cn-hangzhou"
              />
            </div>

            <div class="form-group">
              <label class="switch-label">
                <input
                  v-model="formData.enabled"
                  type="checkbox"
                  class="checkbox"
                />
                <span>启用账户（停用后将不再查询资源信息）</span>
              </label>
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>

            <div class="modal-footer">
              <button type="button" @click="closeModal" class="btn">
                取消
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? "保存中..." : "保存" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useAccountStore } from "@/stores/account";
import { CloudProvider } from "@/types";
import Layout from "@/components/Layout.vue";
import { encrypt, decrypt } from "@/utils/crypto";

const accountStore = useAccountStore();

const showAddModal = ref(false);
const editingAccount = ref<(typeof accountStore.accounts)[0] | null>(null);
const loading = ref(false);
const error = ref("");

const formData = reactive({
  name: "",
  provider: "" as CloudProvider | "",
  accessKeyId: "",
  accessKeySecret: "",
  region: "",
  enabled: true, // 默认启用
});

function getProviderName(provider: CloudProvider): string {
  const map: Record<CloudProvider, string> = {
    [CloudProvider.UCLOUD]: "UCloud",
  };
  return map[provider] || provider;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN");
}

async function handleEdit(account: (typeof accountStore.accounts)[0]) {
  editingAccount.value = account;
  formData.name = account.name;
  formData.provider = account.provider;
  formData.enabled = account.enabled !== false; // 默认为true

  // 解密凭证用于编辑
  try {
    formData.accessKeyId = await decrypt(
      account.accessKeyId,
      accountStore.masterPassword
    );
    formData.accessKeySecret = await decrypt(
      account.accessKeySecret,
      accountStore.masterPassword
    );
  } catch (error) {
    console.error("解密凭证失败:", error);
    alert("解密凭证失败，请重新登录");
    return;
  }

  formData.region = account.region || "";
}

function closeModal() {
  showAddModal.value = false;
  editingAccount.value = null;
  error.value = "";
  formData.name = "";
  formData.provider = "" as CloudProvider | "";
  formData.accessKeyId = "";
  formData.accessKeySecret = "";
  formData.region = "";
  formData.enabled = true;
}

async function handleSubmit() {
  if (
    !formData.name ||
    !formData.provider ||
    !formData.accessKeyId ||
    !formData.accessKeySecret
  ) {
    error.value = "请填写所有必填项";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    // 加密存储凭证
    const encryptedKeyId = await encrypt(
      formData.accessKeyId,
      accountStore.masterPassword
    );
    const encryptedKeySecret = await encrypt(
      formData.accessKeySecret,
      accountStore.masterPassword
    );

    if (editingAccount.value) {
      // 更新账户
      await accountStore.updateAccount(editingAccount.value.id, {
        name: formData.name,
        provider: formData.provider as CloudProvider,
        accessKeyId: encryptedKeyId,
        accessKeySecret: encryptedKeySecret,
        region: formData.region || undefined,
        enabled: formData.enabled,
      });
    } else {
      // 添加账户
      await accountStore.addAccount({
        name: formData.name,
        provider: formData.provider as CloudProvider,
        accessKeyId: encryptedKeyId,
        accessKeySecret: encryptedKeySecret,
        region: formData.region || undefined,
        enabled: formData.enabled,
      });
    }

    closeModal();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "操作失败，请重试";
  } finally {
    loading.value = false;
  }
}

async function handleToggleStatus(accountId: string, enabled: boolean) {
  try {
    await accountStore.updateAccount(accountId, { enabled });
  } catch (err) {
    alert(err instanceof Error ? err.message : "更新状态失败，请重试");
  }
}

async function handleDelete(accountId: string) {
  if (!confirm("确定要删除此账户吗？此操作不可恢复。")) {
    return;
  }

  try {
    await accountStore.deleteAccount(accountId);
  } catch (err) {
    alert(err instanceof Error ? err.message : "删除失败，请重试");
  }
}
</script>

<style scoped>
.accounts-page {
  padding: 24px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.account-item {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--shadow);
}

.account-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.account-info h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.account-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.provider-badge {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 4px;
}

.region {
  padding: 4px 8px;
  background: var(--bg-color);
  border-radius: 4px;
}

.account-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch .slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.switch .slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.switch input:checked + .slider {
  background-color: var(--primary-color);
}

.switch input:checked + .slider:before {
  transform: translateX(20px);
}

.switch input:focus + .slider {
  box-shadow: 0 0 1px var(--primary-color);
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 3px;
  margin-left: 8px;
  background: var(--text-secondary);
  color: #fff;
}

.status-badge.disabled {
  background: var(--error-color);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: var(--card-bg);
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.modal-close:hover {
  background: var(--bg-color);
  color: var(--text-color);
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.error-message {
  padding: 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: var(--error-color);
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
