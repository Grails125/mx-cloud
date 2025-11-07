/**
 * Pinia Store 统一导出
 */

import { createPinia } from 'pinia'

export const pinia = createPinia()

export { useAccountStore } from './account'
export { useDataStore } from './data'
export { useAlertStore } from './alert'

