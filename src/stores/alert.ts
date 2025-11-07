/**
 * 预警系统状态存储
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AlertRule, AlertNotification } from '@/types'
import { generateId } from '@/utils/crypto'
import { saveAlertRules, loadAlertRules } from '@/utils/storage'
import { useDataStore } from './data'

export const useAlertStore = defineStore('alert', () => {
  const rules = ref<AlertRule[]>([])
  const notifications = ref<AlertNotification[]>([])
  const isChecking = ref(false)

  /**
   * 未读通知数量
   */
  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  /**
   * 未读通知列表
   */
  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.read).sort((a, b) => b.triggeredAt - a.triggeredAt)
  })

  /**
   * 加载预警规则
   */
  function loadRules() {
    rules.value = loadAlertRules()
  }

  /**
   * 保存预警规则
   */
  function saveRules() {
    saveAlertRules(rules.value)
  }

  /**
   * 添加预警规则
   */
  function addRule(ruleData: Omit<AlertRule, 'id' | 'createdAt'>) {
    const newRule: AlertRule = {
      ...ruleData,
      id: generateId(),
      createdAt: Date.now()
    }
    rules.value.push(newRule)
    saveRules()
    return newRule
  }

  /**
   * 更新预警规则
   */
  function updateRule(id: string, updates: Partial<AlertRule>) {
    const index = rules.value.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('预警规则不存在')
    }
    rules.value[index] = { ...rules.value[index], ...updates }
    saveRules()
  }

  /**
   * 删除预警规则
   */
  function deleteRule(id: string) {
    const index = rules.value.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('预警规则不存在')
    }
    rules.value.splice(index, 1)
    saveRules()
  }

  /**
   * 获取账户的预警规则
   */
  function getRulesByAccount(accountId: string): AlertRule[] {
    return rules.value.filter(r => r.accountId === accountId && r.enabled)
  }

  /**
   * 检查预警条件
   */
  async function checkAlerts() {
    const dataStore = useDataStore()
    if (rules.value.length === 0) return

    isChecking.value = true
    try {
      const enabledRules = rules.value.filter(r => r.enabled)
      
      for (const rule of enabledRules) {
        const balance = dataStore.getAccountBalance(rule.accountId)

        let shouldAlert = false
        let message = ''
        let level: 'warning' | 'critical' = 'warning'

        if (rule.type === 'balance' && balance) {
          shouldAlert = evaluateCondition(balance.balance, rule.threshold, rule.operator)
          if (shouldAlert) {
            message = `账户余额 ${balance.balance} ${balance.currency} ${getOperatorText(rule.operator)} ${rule.threshold}`
            level = balance.balance < rule.threshold ? 'critical' : 'warning'
          }
        } else if (rule.type === 'usage') {
          // 资源使用情况预警已移除，跳过检查
          continue
        }

        if (shouldAlert) {
          // 检查是否已存在相同的未读通知
          const existingNotification = notifications.value.find(
            n => n.ruleId === rule.id && !n.read && n.message === message
          )

          if (!existingNotification) {
            const notification: AlertNotification = {
              id: generateId(),
              ruleId: rule.id,
              accountId: rule.accountId,
              message,
              level,
              triggeredAt: Date.now(),
              read: false
            }
            notifications.value.unshift(notification)
            
            // 触发浏览器通知
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('云资产预警', {
                body: message,
                icon: '/vite.svg',
                tag: notification.id
              })
            }
          }
        }
      }

      // 限制通知数量，保留最近100条
      if (notifications.value.length > 100) {
        notifications.value = notifications.value.slice(0, 100)
      }
    } catch (error) {
      console.error('检查预警失败:', error)
    } finally {
      isChecking.value = false
    }
  }

  /**
   * 评估条件
   */
  function evaluateCondition(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'lt':
        return value < threshold
      case 'lte':
        return value <= threshold
      case 'gt':
        return value > threshold
      case 'gte':
        return value >= threshold
      default:
        return false
    }
  }

  /**
   * 获取操作符文本
   */
  function getOperatorText(operator: string): string {
    const map: Record<string, string> = {
      lt: '低于',
      lte: '低于或等于',
      gt: '高于',
      gte: '高于或等于'
    }
    return map[operator] || operator
  }

  /**
   * 标记通知为已读
   */
  function markAsRead(notificationId: string) {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  /**
   * 标记所有通知为已读
   */
  function markAllAsRead() {
    notifications.value.forEach(n => {
      n.read = true
    })
  }

  /**
   * 删除通知
   */
  function deleteNotification(notificationId: string) {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * 请求浏览器通知权限
   */
  async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  /**
   * 清空所有数据
   */
  function clearData() {
    rules.value = []
    notifications.value = []
  }

  return {
    rules,
    notifications,
    isChecking,
    unreadCount,
    unreadNotifications,
    loadRules,
    addRule,
    updateRule,
    deleteRule,
    getRulesByAccount,
    checkAlerts,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission,
    clearData
  }
})

