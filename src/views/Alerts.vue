<template>
  <Layout>
    <div class="alerts-page">
      <div class="page-header">
        <h2>预警中心</h2>
        <div class="header-actions">
          <button @click="showRuleModal = true" class="btn btn-primary">
            添加预警规则
          </button>
          <button
            v-if="alertStore.unreadCount > 0"
            @click="alertStore.markAllAsRead()"
            class="btn"
          >
            全部标记为已读
          </button>
        </div>
      </div>

      <!-- 预警规则列表 -->
      <div class="rules-section">
        <h3>预警规则</h3>
        <div v-if="alertStore.rules.length === 0" class="empty">
          <p>暂无预警规则，请添加预警规则</p>
        </div>
        <div v-else class="rules-list">
          <div
            v-for="rule in alertStore.rules"
            :key="rule.id"
            class="rule-item"
          >
            <div class="rule-main">
              <div class="rule-info">
                <div class="rule-header">
                  <h4>{{ getAccountName(rule.accountId) }}</h4>
                  <span class="rule-type">{{
                    rule.type === "balance" ? "余额预警" : "使用量预警"
                  }}</span>
                </div>
                <div class="rule-condition">
                  {{ rule.type === "balance" ? "余额" : "使用量" }}
                  {{ getOperatorText(rule.operator) }}
                  {{ rule.threshold }}
                  {{ rule.type === "balance" ? "元" : "" }}
                </div>
              </div>
              <div class="rule-actions">
                <label class="switch">
                  <input
                    type="checkbox"
                    :checked="rule.enabled"
                    @change="handleToggleRule(rule.id, $event)"
                  />
                  <span class="slider"></span>
                </label>
                <button @click="handleEditRule(rule)" class="btn">编辑</button>
                <button
                  @click="handleDeleteRule(rule.id)"
                  class="btn btn-danger"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 预警通知列表 -->
      <div class="notifications-section">
        <h3>预警通知</h3>
        <div v-if="alertStore.notifications.length === 0" class="empty">
          <p>暂无预警通知</p>
        </div>
        <div v-else class="notifications-list">
          <div
            v-for="notification in alertStore.notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read, [notification.level]: true }"
          >
            <div class="notification-main">
              <div class="notification-icon">
                <span v-if="notification.level === 'critical'">⚠️</span>
                <span v-else>ℹ️</span>
              </div>
              <div class="notification-content">
                <div class="notification-message">
                  {{ notification.message }}
                </div>
                <div class="notification-meta">
                  <span>{{ getAccountName(notification.accountId) }}</span>
                  <span>{{ formatTime(notification.triggeredAt) }}</span>
                </div>
              </div>
            </div>
            <div class="notification-actions">
              <button
                v-if="!notification.read"
                @click="alertStore.markAsRead(notification.id)"
                class="btn btn-sm"
              >
                标记已读
              </button>
              <button
                @click="alertStore.deleteNotification(notification.id)"
                class="btn btn-sm btn-danger"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加/编辑预警规则模态框 -->
      <div
        v-if="showRuleModal || editingRule"
        class="modal-overlay"
        @click="closeRuleModal"
      >
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>{{ editingRule ? "编辑预警规则" : "添加预警规则" }}</h3>
            <button @click="closeRuleModal" class="modal-close">×</button>
          </div>
          <form @submit.prevent="handleRuleSubmit" class="modal-body">
            <div class="form-group">
              <label class="label">账户</label>
              <select v-model="ruleFormData.accountId" class="input" required>
                <option value="">请选择账户</option>
                <option
                  v-for="account in accountStore.accounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="label">预警类型</label>
              <select v-model="ruleFormData.type" class="input" required>
                <option value="">请选择</option>
                <option value="balance">余额预警</option>
                <option value="usage">使用量预警</option>
              </select>
            </div>

            <div class="form-group">
              <label class="label">操作符</label>
              <select v-model="ruleFormData.operator" class="input" required>
                <option value="">请选择</option>
                <option value="lt">低于</option>
                <option value="lte">低于或等于</option>
                <option value="gt">高于</option>
                <option value="gte">高于或等于</option>
              </select>
            </div>

            <div class="form-group">
              <label class="label">阈值</label>
              <input
                v-model.number="ruleFormData.threshold"
                type="number"
                class="input"
                placeholder="请输入阈值"
                step="0.01"
                required
              />
            </div>

            <div class="form-group">
              <label class="switch-label">
                <input
                  v-model="ruleFormData.enabled"
                  type="checkbox"
                  class="checkbox"
                />
                <span>启用规则</span>
              </label>
            </div>

            <div class="form-group">
              <label class="switch-label">
                <input
                  v-model="ruleFormData.emailEnabled"
                  type="checkbox"
                  class="checkbox"
                />
                <span>启用邮件通知</span>
              </label>
            </div>

            <div v-if="ruleFormData.emailEnabled" class="form-group">
              <label class="label">邮件收件人</label>
              <div class="email-recipients">
                <div
                  v-for="(email, index) in ruleFormData.emailRecipients"
                  :key="index"
                  class="email-recipient-item"
                >
                  <input
                    v-model="ruleFormData.emailRecipients[index]"
                    type="email"
                    class="input"
                    placeholder="请输入邮箱地址"
                    style="flex: 1"
                  />
                  <button
                    type="button"
                    @click="removeEmailRecipient(index)"
                    class="btn btn-danger btn-sm"
                  >
                    删除
                  </button>
                </div>
                <button
                  type="button"
                  @click="addEmailRecipient"
                  class="btn btn-secondary btn-sm"
                >
                  + 添加收件人
                </button>
              </div>
            </div>

            <div v-if="ruleFormData.emailEnabled" class="form-group">
              <label class="label">邮件模板</label>
              <select v-model="ruleFormData.emailTemplateId" class="input">
                <option value="">使用默认模板</option>
                <option
                  v-for="template in emailTemplates"
                  :key="template.id"
                  :value="template.id"
                >
                  {{ template.name }}
                </option>
              </select>
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>

            <div class="modal-footer">
              <button type="button" @click="closeRuleModal" class="btn">
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
import { ref, reactive, onMounted } from "vue";
import { useAccountStore } from "@/stores/account";
import { useAlertStore } from "@/stores/alert";
import { loadEmailTemplates } from "@/utils/storage";
import type { AlertRule, EmailTemplate } from "@/types";
import Layout from "@/components/Layout.vue";

const accountStore = useAccountStore();
const alertStore = useAlertStore();

const showRuleModal = ref(false);
const editingRule = ref<AlertRule | null>(null);
const loading = ref(false);
const error = ref("");
const emailTemplates = ref<EmailTemplate[]>([]);

const ruleFormData = reactive({
  accountId: "",
  type: "" as "balance" | "usage" | "",
  operator: "" as "lt" | "lte" | "gt" | "gte" | "",
  threshold: 0,
  enabled: true,
  emailEnabled: false,
  emailRecipients: [] as string[],
  emailTemplateId: "",
});

function getAccountName(accountId: string): string {
  const account = accountStore.getAccountById(accountId);
  return account?.name || "未知账户";
}

function getOperatorText(operator: string): string {
  const map: Record<string, string> = {
    lt: "低于",
    lte: "低于或等于",
    gt: "高于",
    gte: "高于或等于",
  };
  return map[operator] || operator;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN");
}

function handleEditRule(rule: AlertRule) {
  editingRule.value = rule;
  ruleFormData.accountId = rule.accountId;
  ruleFormData.type = rule.type;
  ruleFormData.operator = rule.operator;
  ruleFormData.threshold = rule.threshold;
  ruleFormData.enabled = rule.enabled;
  ruleFormData.emailEnabled = rule.emailEnabled || false;
  ruleFormData.emailRecipients = rule.emailRecipients ? [...rule.emailRecipients] : [];
  ruleFormData.emailTemplateId = rule.emailTemplateId || "";
}

function closeRuleModal() {
  showRuleModal.value = false;
  editingRule.value = null;
  error.value = "";
  ruleFormData.accountId = "";
  ruleFormData.type = "" as "balance" | "usage" | "";
  ruleFormData.operator = "" as "lt" | "lte" | "gt" | "gte" | "";
  ruleFormData.threshold = 0;
  ruleFormData.enabled = true;
  ruleFormData.emailEnabled = false;
  ruleFormData.emailRecipients = [];
  ruleFormData.emailTemplateId = "";
}

function addEmailRecipient() {
  ruleFormData.emailRecipients.push("");
}

function removeEmailRecipient(index: number) {
  ruleFormData.emailRecipients.splice(index, 1);
}

function handleToggleRule(ruleId: string, event: Event) {
  const enabled = (event.target as HTMLInputElement).checked;
  alertStore.updateRule(ruleId, { enabled });
}

async function handleRuleSubmit() {
  if (!ruleFormData.accountId || !ruleFormData.type || !ruleFormData.operator) {
    error.value = "请填写所有必填项";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    if (editingRule.value) {
      alertStore.updateRule(
        editingRule.value.id,
        ruleFormData as Partial<AlertRule>
      );
    } else {
      alertStore.addRule(ruleFormData as Omit<AlertRule, "id" | "createdAt">);
    }
    closeRuleModal();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "操作失败，请重试";
  } finally {
    loading.value = false;
  }
}

function handleDeleteRule(ruleId: string) {
  if (!confirm("确定要删除此预警规则吗？")) {
    return;
  }
  alertStore.deleteRule(ruleId);
}

onMounted(() => {
  alertStore.loadRules();
  alertStore.requestNotificationPermission();
  // 加载邮件模板
  emailTemplates.value = loadEmailTemplates();
});
</script>

<style scoped>
.alerts-page {
  padding: 24px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.rules-section,
.notifications-section {
  margin-bottom: 32px;
}

.rules-section h3,
.notifications-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.rules-list,
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rule-item,
.notification-item {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--shadow);
}

.rule-main,
.notification-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.rule-header h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.rule-type {
  padding: 4px 8px;
  font-size: 12px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 4px;
}

.rule-condition {
  font-size: 14px;
  color: var(--text-secondary);
}

.rule-actions {
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

.slider {
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

.slider:before {
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

input:checked + .slider {
  background-color: var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.notification-item {
  border-left: 4px solid var(--border-color);
}

.notification-item.unread {
  border-left-color: var(--warning-color);
  background: #fffbe6;
}

.notification-item.critical {
  border-left-color: var(--error-color);
}

.notification-item.warning {
  border-left-color: var(--warning-color);
}

.notification-main {
  flex: 1;
  display: flex;
  gap: 16px;
}

.notification-icon {
  font-size: 24px;
}

.notification-content {
  flex: 1;
}

.notification-message {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.notification-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.email-recipients {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.email-recipient-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
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
