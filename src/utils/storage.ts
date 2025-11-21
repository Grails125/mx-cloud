/**
 * 安全存储管理模块
 * 使用 localStorage 存储加密后的账户数据
 */

import type { CloudAccount, AlertRule, EmailJSConfig, EmailTemplate } from "@/types";
import { encrypt, decrypt } from "./crypto";
import CryptoJS from "crypto-js";

const STORAGE_KEY_ACCOUNTS = "mx_cloud_accounts";
const STORAGE_KEY_RULES = "mx_cloud_alert_rules";
const STORAGE_KEY_MASTER_PASSWORD = "mx_cloud_master_password_hash";
const STORAGE_KEY_EMAILJS_CONFIG = "mx_cloud_emailjs_config";
const STORAGE_KEY_EMAIL_TEMPLATES = "mx_cloud_email_templates";

/**
 * 检查 Web Crypto API 是否可用
 */
function isCryptoSubtleAvailable(): boolean {
  return (
    typeof crypto !== "undefined" &&
    crypto !== null &&
    typeof crypto.subtle !== "undefined" &&
    crypto.subtle !== null
  );
}

/**
 * 使用 Web Crypto API 计算 SHA-256 哈希
 */
async function sha256WebCrypto(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle!.digest(
    "SHA-256",
    data.buffer as ArrayBuffer
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * 使用 CryptoJS 计算 SHA-256 哈希（降级方案）
 */
function sha256CryptoJS(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
}

/**
 * 计算密码的 SHA-256 哈希值
 * 优先使用 Web Crypto API，如果不可用则使用 CryptoJS
 */
async function hashPassword(password: string): Promise<string> {
  if (isCryptoSubtleAvailable()) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      return await sha256WebCrypto(data);
    } catch (error) {
      console.warn("Web Crypto API 失败，使用 CryptoJS 降级方案:", error);
      return sha256CryptoJS(password);
    }
  } else {
    // 非 HTTPS 环境，使用 CryptoJS
    return sha256CryptoJS(password);
  }
}

/**
 * 获取主密码哈希（用于验证）
 */
export function getMasterPasswordHash(): string | null {
  return localStorage.getItem(STORAGE_KEY_MASTER_PASSWORD);
}

/**
 * 设置主密码哈希
 */
export function setMasterPasswordHash(hash: string): void {
  localStorage.setItem(STORAGE_KEY_MASTER_PASSWORD, hash);
}

/**
 * 验证主密码
 */
export async function verifyMasterPassword(password: string): Promise<boolean> {
  const storedHash = getMasterPasswordHash();
  if (!storedHash) return false;

  const hashHex = await hashPassword(password);
  return hashHex === storedHash;
}

/**
 * 初始化主密码
 */
export async function initMasterPassword(password: string): Promise<void> {
  const hashHex = await hashPassword(password);
  setMasterPasswordHash(hashHex);
}

/**
 * 保存加密的账户列表
 */
export async function saveAccounts(
  accounts: CloudAccount[],
  password: string
): Promise<void> {
  const encrypted = await encrypt(JSON.stringify(accounts), password);
  localStorage.setItem(STORAGE_KEY_ACCOUNTS, encrypted);
}

/**
 * 加载并解密账户列表
 */
export async function loadAccounts(password: string): Promise<CloudAccount[]> {
  const encrypted = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
  if (!encrypted) return [];

  try {
    const decrypted = await decrypt(encrypted, password);
    return JSON.parse(decrypted) as CloudAccount[];
  } catch (error) {
    console.error("加载账户失败:", error);
    return [];
  }
}

/**
 * 保存预警规则（不加密，因为不包含敏感信息）
 */
export function saveAlertRules(rules: AlertRule[]): void {
  localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
}

/**
 * 加载预警规则
 */
export function loadAlertRules(): AlertRule[] {
  const data = localStorage.getItem(STORAGE_KEY_RULES);
  if (!data) return [];
  try {
    return JSON.parse(data) as AlertRule[];
  } catch {
    return [];
  }
}

/**
 * 清除所有存储数据
 */
export function clearAllStorage(): void {
  localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
  localStorage.removeItem(STORAGE_KEY_RULES);
  localStorage.removeItem(STORAGE_KEY_MASTER_PASSWORD);
  localStorage.removeItem(STORAGE_KEY_EMAILJS_CONFIG);
  localStorage.removeItem(STORAGE_KEY_EMAIL_TEMPLATES);
}

/**
 * 保存 EmailJS 配置
 */
export function saveEmailJSConfig(config: EmailJSConfig): void {
  localStorage.setItem(STORAGE_KEY_EMAILJS_CONFIG, JSON.stringify(config));
}

/**
 * 加载 EmailJS 配置
 */
export function loadEmailJSConfig(): EmailJSConfig | null {
  const data = localStorage.getItem(STORAGE_KEY_EMAILJS_CONFIG);
  if (!data) return null;

  try {
    return JSON.parse(data) as EmailJSConfig;
  } catch (error) {
    console.error("加载 EmailJS 配置失败:", error);
    return null;
  }
}

/**
 * 保存邮件模板
 */
export function saveEmailTemplates(templates: EmailTemplate[]): void {
  localStorage.setItem(STORAGE_KEY_EMAIL_TEMPLATES, JSON.stringify(templates));
}

/**
 * 加载邮件模板
 */
export function loadEmailTemplates(): EmailTemplate[] {
  const data = localStorage.getItem(STORAGE_KEY_EMAIL_TEMPLATES);
  if (!data) {
    // 返回默认模板
    return [
      {
        id: "default",
        name: "默认模板",
        subject: "云资产预警通知 - {accountName}",
        body: `账户名称: {accountName}
预警级别: {level}
预警消息: {message}
触发时间: {time}
阈值: {threshold}
操作符: {operator}`,
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  }
  try {
    return JSON.parse(data) as EmailTemplate[];
  } catch {
    return [];
  }
}
