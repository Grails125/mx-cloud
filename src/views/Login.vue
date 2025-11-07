<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <h1 class="title">MX Cloud</h1>
        <p class="subtitle">多云资产管理平台</p>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="label">主密码</label>
            <input
              v-model="password"
              type="password"
              class="input"
              placeholder="请输入主密码（用于加密存储账户凭证）"
              required
              autocomplete="current-password"
            />
            <p class="hint">首次使用将创建主密码，后续用于解密账户数据</p>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            :disabled="loading"
          >
            {{ loading ? "登录中..." : "登录" }}
          </button>
        </form>

        <div class="security-tips">
          <h3>安全提示</h3>
          <ul>
            <li>主密码用于加密存储所有云账户凭证，请妥善保管</li>
            <li>忘记主密码将无法恢复已存储的账户数据</li>
            <li>所有数据仅存储在本地浏览器，不会上传到服务器</li>
            <li>建议定期备份账户数据</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAccountStore } from "@/stores/account";
import {
  initMasterPassword,
  verifyMasterPassword,
  getMasterPasswordHash,
} from "@/utils/storage";

const router = useRouter();
const accountStore = useAccountStore();

const password = ref("");
const loading = ref(false);
const error = ref("");

async function handleLogin() {
  if (!password.value.trim()) {
    error.value = "请输入主密码";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const hasPassword = getMasterPasswordHash() !== null;

    if (!hasPassword) {
      // 首次使用，初始化主密码
      await initMasterPassword(password.value);
      accountStore.setMasterPassword(password.value);
      router.push("/dashboard");
    } else {
      // 验证主密码
      const isValid = await verifyMasterPassword(password.value);
      if (isValid) {
        accountStore.setMasterPassword(password.value);
        await accountStore.loadAccountList(password.value);
        router.push("/dashboard");
      } else {
        error.value = "主密码错误，请重试";
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "登录失败，请重试";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
}

.login-container {
  width: 100%;
  max-width: 480px;
}

.login-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.title {
  font-size: 32px;
  font-weight: 600;
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 32px;
}

.login-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
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

.btn-block {
  width: 100%;
  padding: 12px;
  font-size: 16px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.security-tips {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--border-color);
}

.security-tips h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-color);
}

.security-tips ul {
  list-style: none;
  padding: 0;
}

.security-tips li {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  padding-left: 20px;
  position: relative;
}

.security-tips li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--primary-color);
}
</style>
