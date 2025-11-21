<template>
  <Layout>
    <div class="settings-page">
      <div class="page-header">
        <h2>设置</h2>
      </div>

      <div class="settings-content">
        <!-- 数据管理 -->
        <div class="settings-section">
          <h3>数据管理</h3>
          <div class="card">
            <div class="setting-item">
              <div class="setting-info">
                <h4>自动刷新间隔</h4>
                <p>设置自动刷新账户数据的时间间隔（分钟）</p>
              </div>
              <div class="setting-control">
                <input
                  v-model.number="autoRefreshInterval"
                  type="number"
                  class="input"
                  min="1"
                  max="1440"
                  style="width: 120px"
                  @change="handleAutoRefreshIntervalChange"
                />
                <span class="setting-unit">分钟</span>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>启用浏览器通知</h4>
                <p>允许应用在触发预警时发送浏览器通知</p>
              </div>
              <div class="setting-control">
                <label class="switch">
                  <input
                    type="checkbox"
                    :checked="notificationEnabled"
                    @change="handleToggleNotification"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>提醒邮箱</h4>
                <p>设置接收预警通知的邮箱地址</p>
              </div>
              <div class="setting-control">
                <input
                  v-model="alertEmail"
                  type="email"
                  class="input"
                  placeholder="请输入邮箱地址"
                  style="width: 250px"
                  @change="handleEmailChange"
                />
                <button
                  v-if="alertEmail"
                  @click="handleTestEmail"
                  class="btn btn-secondary"
                  :disabled="testingEmail"
                >
                  {{ testingEmail ? "测试中..." : "测试" }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- EmailJS 配置 -->
        <div class="settings-section">
          <h3>EmailJS 配置</h3>
          <div class="card">
            <div class="setting-item">
              <div class="setting-info">
                <h4>Service ID</h4>
                <p>EmailJS 服务 ID</p>
              </div>
              <div class="setting-control">
                <input
                  v-model="emailJSConfig.serviceId"
                  type="text"
                  class="input"
                  placeholder="service_xxxxxx"
                  style="width: 250px"
                />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>Template ID</h4>
                <p>EmailJS 模板 ID</p>
              </div>
              <div class="setting-control">
                <input
                  v-model="emailJSConfig.templateId"
                  type="text"
                  class="input"
                  placeholder="template_xxxxxx"
                  style="width: 250px"
                />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>Public Key</h4>
                <p>EmailJS Public Key</p>
              </div>
              <div class="setting-control">
                <input
                  v-model="emailJSConfig.publicKey"
                  type="text"
                  class="input"
                  placeholder="public_key_xxxxxx"
                  style="width: 250px"
                />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>操作</h4>
                <p>保存配置或测试连接</p>
              </div>
              <div class="setting-control">
                <button
                  @click="handleSaveEmailJSConfig"
                  class="btn btn-primary"
                  :disabled="savingConfig"
                >
                  {{ savingConfig ? "保存中..." : "保存配置" }}
                </button>
                <button
                  @click="handleTestEmailJS"
                  class="btn btn-secondary"
                  :disabled="testingConfig"
                  style="margin-left: 12px"
                >
                  {{ testingConfig ? "测试中..." : "测试连接" }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据备份与恢复 -->
        <div class="settings-section">
          <h3>数据备份与恢复</h3>
          <div class="card">
            <div class="setting-item">
              <div class="setting-info">
                <h4>导出数据</h4>
                <p>导出所有账户数据和预警规则（加密格式）</p>
              </div>
              <div class="setting-control">
                <button @click="handleExport" class="btn btn-primary">
                  导出数据
                </button>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>导入数据</h4>
                <p>从备份文件恢复账户数据和预警规则</p>
              </div>
              <div class="setting-control">
                <input
                  ref="fileInput"
                  type="file"
                  accept=".json"
                  @change="handleImport"
                  style="display: none"
                />
                <button @click="() => fileInput?.click()" class="btn">
                  选择文件
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 危险操作 -->
        <div class="settings-section">
          <h3>危险操作</h3>
          <div class="card">
            <div class="setting-item">
              <div class="setting-info">
                <h4>清除所有数据</h4>
                <p>删除所有账户数据、预警规则和通知记录。此操作不可恢复！</p>
              </div>
              <div class="setting-control">
                <button @click="handleClearAll" class="btn btn-danger">
                  清除所有数据
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div class="settings-section">
          <h3>关于</h3>
          <div class="card">
            <div class="about-content">
              <h4>MX Cloud</h4>
              <p>版本: 1.0.0</p>
              <p>多云资产管理平台 - 安全、高效、用户友好</p>
              <div class="about-features">
                <h5>主要功能：</h5>
                <ul>
                  <li>支持UCloud账户管理</li>
                  <li>前端加密存储，保护账户凭证安全</li>
                  <li>实时余额查询和资源使用监控</li>
                  <li>自定义预警规则和通知提醒</li>
                  <li>数据可视化展示</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { useAccountStore } from "@/stores/account";
import { useAlertStore } from "@/stores/alert";
import { useDataStore } from "@/stores/data";
import {
  clearAllStorage,
  saveEmailJSConfig,
  loadEmailJSConfig,
} from "@/utils/storage";
import { sendEmail } from "@/utils/email";
import type { EmailJSConfig } from "@/types";
import Layout from "@/components/Layout.vue";

const accountStore = useAccountStore();
const alertStore = useAlertStore();
const dataStore = useDataStore();

const autoRefreshInterval = ref(30);
const notificationEnabled = ref(false);
const alertEmail = ref("");
const testingEmail = ref(false);
const savingConfig = ref(false);
const testingConfig = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
let refreshTimer: number | null = null;

const emailJSConfig = reactive<EmailJSConfig>({
  serviceId: "",
  templateId: "",
  publicKey: "",
});

onMounted(async () => {
  // 加载设置
  const savedInterval = localStorage.getItem("autoRefreshInterval");
  if (savedInterval) {
    autoRefreshInterval.value = parseInt(savedInterval, 10);
  }

  const savedNotification = localStorage.getItem("notificationEnabled");
  if (savedNotification) {
    notificationEnabled.value = savedNotification === "true";
  }

  const savedEmail = localStorage.getItem("alertEmail");
  if (savedEmail) {
    alertEmail.value = savedEmail;
  }

  // 加载 EmailJS 配置
  if (accountStore.masterPassword) {
    try {
      const savedConfig = await loadEmailJSConfig();
      if (savedConfig) {
        Object.assign(emailJSConfig, savedConfig);
      }
    } catch (error) {
      console.error("加载 EmailJS 配置失败:", error);
    }
  }

  // 启动自动刷新
  startAutoRefresh();
});

function startAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  if (autoRefreshInterval.value > 0) {
    refreshTimer = window.setInterval(async () => {
      if (accountStore.accounts.length > 0) {
        try {
          await dataStore.refreshAllData();
          await alertStore.checkAlerts();
        } catch (error) {
          console.error("自动刷新失败:", error);
        }
      }
    }, autoRefreshInterval.value * 60 * 1000);
  }
}

function handleAutoRefreshIntervalChange() {
  if (autoRefreshInterval.value < 1) {
    autoRefreshInterval.value = 1;
  } else if (autoRefreshInterval.value > 1440) {
    autoRefreshInterval.value = 1440;
  }
  localStorage.setItem(
    "autoRefreshInterval",
    String(autoRefreshInterval.value)
  );
  // 立即重新启动自动刷新
  startAutoRefresh();
}

function handleToggleNotification(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  notificationEnabled.value = checked;
  localStorage.setItem("notificationEnabled", String(checked));

  if (checked) {
    alertStore.requestNotificationPermission();
  }
}

function handleEmailChange() {
  localStorage.setItem("alertEmail", alertEmail.value);
}

function handleTestEmail() {
  if (!alertEmail.value) {
    alert("请输入邮箱地址");
    return;
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(alertEmail.value)) {
    alert("邮箱格式不正确");
    return;
  }

  testingEmail.value = true;
  // 模拟测试发送（实际应用中应该调用后端API）
  setTimeout(() => {
    testingEmail.value = false;
    alert("测试邮件已发送，请检查邮箱");
  }, 1500);
}

async function handleSaveEmailJSConfig() {
  if (
    !emailJSConfig.serviceId ||
    !emailJSConfig.templateId ||
    !emailJSConfig.publicKey
  ) {
    alert("请填写完整的 EmailJS 配置信息");
    return;
  }

  if (!accountStore.masterPassword) {
    alert("请先登录");
    return;
  }

  savingConfig.value = true;
  try {
    await saveEmailJSConfig(emailJSConfig);
    alert("EmailJS 配置保存成功");
  } catch (error: unknown) {
    console.error("保存 EmailJS 配置失败:", error);
    alert("保存失败: " + (error instanceof Error ? error.message : "未知错误"));
  } finally {
    savingConfig.value = false;
  }
}

async function handleTestEmailJS() {
  if (
    !emailJSConfig.serviceId ||
    !emailJSConfig.templateId ||
    !emailJSConfig.publicKey
  ) {
    alert("请先填写完整的 EmailJS 配置信息");
    return;
  }

  if (!alertEmail.value) {
    alert("请先设置测试邮箱地址");
    return;
  }

  testingConfig.value = true;
  try {
    const result = await sendEmail({
      to: [alertEmail.value],
      subject: "EmailJS 配置测试",
      body: "这是一封测试邮件，如果您收到此邮件，说明 EmailJS 配置正确。",
      emailJSConfig,
    });

    if (result.success) {
      alert("测试邮件发送成功，请检查邮箱");
    } else {
      alert("测试失败: " + (result.error || "未知错误"));
    }
  } catch (error: unknown) {
    console.error("测试 EmailJS 失败:", error);
    alert("测试失败: " + (error instanceof Error ? error.message : "未知错误"));
  } finally {
    testingConfig.value = false;
  }
}

function handleExport() {
  const data = {
    accounts: accountStore.accounts,
    rules: alertStore.rules,
    exportTime: Date.now(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mx-cloud-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.accounts && Array.isArray(data.accounts)) {
      // 导入账户数据
      for (const account of data.accounts) {
        try {
          await accountStore.addAccount(account);
        } catch (error) {
          console.error("导入账户失败:", error);
        }
      }
    }

    if (data.rules && Array.isArray(data.rules)) {
      // 导入预警规则
      for (const rule of data.rules) {
        try {
          alertStore.addRule(rule);
        } catch (error) {
          console.error("导入规则失败:", error);
        }
      }
    }

    alert("数据导入成功");
  } catch (error) {
    alert(
      "数据导入失败: " + (error instanceof Error ? error.message : "未知错误")
    );
  }
}

function handleClearAll() {
  if (!confirm("确定要清除所有数据吗？此操作不可恢复！")) {
    return;
  }

  if (!confirm("再次确认：确定要清除所有数据吗？")) {
    return;
  }

  clearAllStorage();
  accountStore.clearAccounts();
  alertStore.clearData();
  dataStore.clearData();

  // 清除设置
  localStorage.removeItem("autoRefreshInterval");
  localStorage.removeItem("notificationEnabled");
  localStorage.removeItem("alertEmail");
  localStorage.removeItem("mx_cloud_emailjs_config");
  localStorage.removeItem("mx_cloud_email_templates");

  alert("所有数据已清除");
  window.location.href = "/login";
}
</script>

<style scoped>
.settings-page {
  padding: 24px 0;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-info h4 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.setting-info p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-unit {
  font-size: 14px;
  color: var(--text-secondary);
}



.about-content h4 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.about-content p {
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.about-features {
  margin-top: 24px;
}

.about-features h5 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.about-features ul {
  list-style: none;
  padding: 0;
}

.about-features li {
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
  color: var(--text-secondary);
}

.about-features li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--primary-color);
}
</style>
