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
  background-color: var(--bg-color);
}

.header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 980px; /* Apple's content width is often narrower, around 980px or 1024px */
  margin: 0 auto;
  padding: 0 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px; /* Apple's nav is usually 44px or 48px */
}

.logo {
  font-size: 19px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  letter-spacing: -0.01em;
}

.nav {
  display: flex;
  gap: 36px;
  flex: 1;
  margin-left: 48px;
}

.nav-item {
  position: relative;
  padding: 8px 0;
  color: var(--text-secondary); /* Default to gray */
  text-decoration: none;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px; /* Apple nav is usually small */
  font-weight: 400;
  letter-spacing: -0.01em;
}

.nav-item:hover {
  color: var(--primary-color);
}

.nav-item.router-link-active {
  color: var(--text-color); /* Active is black/dark */
  font-weight: 500;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  background: var(--error-color);
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
}

.main {
  flex: 1;
  padding: 40px 0;
}

.container {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 22px;
}
</style>

