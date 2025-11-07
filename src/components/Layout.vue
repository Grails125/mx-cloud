<template>
  <div class="layout">
    <header class="header">
      <div class="header-content">
        <h1 class="logo">MX Cloud</h1>
        <nav class="nav">
          <router-link to="/dashboard" class="nav-item">仪表盘</router-link>
          <router-link to="/accounts" class="nav-item">账户管理</router-link>
          <router-link to="/alerts" class="nav-item">
            预警中心
            <span v-if="alertStore.unreadCount > 0" class="badge">{{ alertStore.unreadCount }}</span>
          </router-link>
          <router-link to="/settings" class="nav-item">设置</router-link>
        </nav>
        <div class="header-actions">
          <button @click="handleLogout" class="btn btn-danger">退出登录</button>
        </div>
      </div>
    </header>
    <main class="main">
      <div class="container">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAccountStore } from '@/stores/account'
import { useAlertStore } from '@/stores/alert'
import { useRouter } from 'vue-router'

const accountStore = useAccountStore()
const alertStore = useAlertStore()
const router = useRouter()

function handleLogout() {
  accountStore.clearAccounts()
  alertStore.clearData()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: var(--card-bg);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.nav {
  display: flex;
  gap: 32px;
  flex: 1;
  margin-left: 48px;
}

.nav-item {
  position: relative;
  padding: 8px 0;
  color: var(--text-color);
  text-decoration: none;
  transition: color 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item:hover {
  color: var(--primary-color);
}

.nav-item.router-link-active {
  color: var(--primary-color);
  font-weight: 500;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  font-size: 12px;
  background: var(--error-color);
  color: #fff;
  border-radius: 9px;
}

.main {
  flex: 1;
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
</style>

