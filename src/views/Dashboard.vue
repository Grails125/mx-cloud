<template>
  <Layout>
    <div class="dashboard">
      <div class="dashboard-header">
        <h2>仪表盘</h2>
        <div class="header-actions">
          <button
            @click="handleRefresh"
            class="btn btn-primary"
            :disabled="dataStore.isLoading"
          >
            {{ dataStore.isLoading ? "刷新中..." : "刷新数据" }}
          </button>
          <button
            @click="handleRefreshRegionCache"
            class="btn btn-secondary"
            :disabled="dataStore.isLoading"
          >
            {{ dataStore.isLoading ? "刷新中..." : "刷新区域缓存" }}
          </button>
        </div>
      </div>

      <!-- 总览卡片 -->
      <div class="overview-cards">
        <div class="overview-card">
          <div class="card-icon" style="background: #e6f7ff; color: #1890ff">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"
              />
            </svg>
          </div>
          <div class="card-content">
            <div class="card-label">总余额</div>
            <div class="card-value">
              ¥{{ formatNumber(dataStore.totalBalance) }}
            </div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon" style="background: #f6ffed; color: #52c41a">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
          </div>
          <div class="card-content">
            <div class="card-label">账户数量</div>
            <div class="card-value">{{ accountStore.accountCount }}</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon" style="background: #fff7e6; color: #faad14">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </div>
          <div class="card-content">
            <div class="card-label">未读预警</div>
            <div class="card-value">{{ alertStore.unreadCount }}</div>
          </div>
        </div>
      </div>

      <!-- 账户列表 -->
      <div class="accounts-section">
        <h3>账户详情</h3>
        <div v-if="dataStore.aggregatedData.length === 0" class="empty">
          <p>暂无账户数据，请先添加云账户</p>
          <router-link to="/accounts" class="btn btn-primary mt-16"
            >添加账户</router-link
          >
        </div>
        <div v-else class="accounts-grid">
          <div
            v-for="item in dataStore.aggregatedData"
            :key="item.account.id"
            class="account-card"
          >
            <div class="account-header">
              <div class="account-info">
                <h4>
                  {{ item.account.name }}
                  <span
                    v-if="!item.account.enabled"
                    class="status-badge disabled"
                    title="账户已停用"
                  >
                    已停用
                  </span>
                </h4>
                <span class="provider-badge">{{
                  getProviderName(item.account.provider)
                }}</span>
              </div>
              <div class="account-balance">
                <div class="balance-label">余额</div>
                <div class="balance-value">
                  ¥{{
                    item.balance ? formatNumber(item.balance.balance) : "--"
                  }}
                </div>
              </div>
            </div>

            <!-- UCloud项目列表 -->
            <div
              v-if="item.projects && item.projects.length > 0"
              class="projects-section"
            >
              <div
                class="projects-header"
                @click="toggleProjects(item.account.id)"
              >
                <span class="projects-label">项目列表</span>
                <span class="projects-count"
                  >{{ item.projects.length }} 个</span
                >
                <span class="projects-toggle">
                  {{ expandedProjects.has(item.account.id) ? "收起" : "展开" }}
                </span>
              </div>
              <div
                v-if="expandedProjects.has(item.account.id)"
                class="projects-list"
              >
                <div
                  v-for="project in item.projects"
                  :key="project.projectId"
                  class="project-item"
                >
                  <div class="project-main">
                    <div class="project-info">
                      <span class="project-name">{{
                        project.projectName
                      }}</span>
                      <span
                        v-if="project.isDefault"
                        class="project-badge default"
                      >
                        默认
                      </span>
                    </div>
                    <div class="project-meta">
                      <span class="project-id"
                        >ID: {{ project.projectId }}</span
                      >
                      <span class="project-stats">
                        <span v-if="project.resourceCount !== undefined">
                          资源: {{ project.resourceCount }} |
                        </span>
                        成员: {{ project.memberCount ?? project.userCount }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- UHost实例列表 -->
            <div
              v-if="item.uHostInstances && item.uHostInstances.length > 0"
              class="instances-section"
            >
              <div
                class="instances-header"
                @click="toggleInstances(item.account.id)"
              >
                <span class="instances-label">UHost实例</span>
                <span class="instances-count"
                  >{{ item.uHostInstances.length }} 个</span
                >
                <span class="instances-toggle">
                  {{ expandedInstances.has(item.account.id) ? "收起" : "展开" }}
                </span>
              </div>
              <div
                v-if="expandedInstances.has(item.account.id)"
                class="instances-list"
              >
                <div
                  v-for="instance in item.uHostInstances"
                  :key="instance.uHostId"
                  class="instance-item"
                >
                  <div class="instance-main">
                    <div class="instance-info">
                      <span class="instance-name">{{
                        instance.name || instance.uHostId || "未命名"
                      }}</span>
                      <span
                        v-if="instance.state"
                        class="instance-state-badge"
                        :class="getStateClass(instance.state)"
                      >
                        {{ getStateText(instance.state) }}
                      </span>
                    </div>
                    <div class="instance-meta">
                      <div class="instance-meta-row">
                        <span class="instance-meta-label">ID:</span>
                        <span class="instance-meta-value">{{
                          instance.uHostId
                        }}</span>
                      </div>
                      <div
                        v-if="instance.region || instance.zone"
                        class="instance-meta-row"
                      >
                        <span class="instance-meta-label">地域/可用区:</span>
                        <span class="instance-meta-value">{{
                          [instance.region, instance.zone]
                            .filter(Boolean)
                            .join(" / ")
                        }}</span>
                      </div>
                      <div
                        v-if="instance.cpu !== undefined || instance.memory"
                        class="instance-meta-row"
                      >
                        <span class="instance-meta-label">配置:</span>
                        <span class="instance-meta-value">
                          <span v-if="instance.cpu !== undefined"
                            >{{ instance.cpu }}核</span
                          >
                          <span
                            v-if="instance.cpu !== undefined && instance.memory"
                          >
                            /
                          </span>
                          <span v-if="instance.memory">{{
                            formatMemory(instance.memory)
                          }}</span>
                        </span>
                      </div>
                      <div
                        v-if="instance.ipSet && instance.ipSet.length > 0"
                        class="instance-meta-row"
                      >
                        <span class="instance-meta-label">IP:</span>
                        <span class="instance-meta-value">
                          <span
                            v-for="(ip, index) in instance.ipSet"
                            :key="index"
                            class="ip-item"
                          >
                            {{ ip.ip }}
                            <span v-if="ip.type" class="ip-type"
                              >({{ ip.type }})</span
                            >
                            <span v-if="index < instance.ipSet.length - 1"
                              >,
                            </span>
                          </span>
                        </span>
                      </div>
                      <div v-if="instance.chargeType" class="instance-meta-row">
                        <span class="instance-meta-label">计费模式:</span>
                        <span class="instance-meta-value">{{
                          getChargeTypeText(instance.chargeType)
                        }}</span>
                      </div>
                      <div v-if="instance.createTime" class="instance-meta-row">
                        <span class="instance-meta-label">创建时间:</span>
                        <span class="instance-meta-value">{{
                          formatTime(instance.createTime)
                        }}</span>
                      </div>
                    </div>

                    <!-- 云硬盘列表 -->
                    <div
                      v-if="instance.udisks && instance.udisks.length > 0"
                      class="udisks-section"
                    >
                      <div
                        class="udisks-header"
                        @click="
                          toggleDisks(item.account.id, instance.uHostId || '')
                        "
                      >
                        <span class="udisks-label">云硬盘</span>
                        <span class="udisks-count"
                          >{{ instance.udisks.length }} 个</span
                        >
                        <span class="udisks-toggle">
                          {{
                            isDiskExpanded(
                              item.account.id,
                              instance.uHostId || ""
                            )
                              ? "收起"
                              : "展开"
                          }}
                        </span>
                      </div>
                      <div
                        v-if="
                          isDiskExpanded(
                            item.account.id,
                            instance.uHostId || ''
                          )
                        "
                        class="udisks-list"
                      >
                        <div
                          v-for="udisk in instance.udisks"
                          :key="udisk.uDiskId"
                          class="udisk-item"
                        >
                          <div class="udisk-main">
                            <div class="udisk-info">
                              <span class="udisk-name">{{
                                udisk.name || udisk.uDiskId || "未命名"
                              }}</span>
                              <span
                                v-if="udisk.status"
                                class="udisk-status-badge"
                                :class="getDiskStatusClass(udisk.status)"
                              >
                                {{ getDiskStatusText(udisk.status) }}
                              </span>
                              <span
                                v-if="udisk.isBoot === 'True'"
                                class="udisk-boot-badge"
                              >
                                系统盘
                              </span>
                            </div>
                            <div class="udisk-meta">
                              <div class="udisk-meta-row">
                                <span class="udisk-meta-label">ID:</span>
                                <span class="udisk-meta-value">{{
                                  udisk.uDiskId
                                }}</span>
                              </div>
                              <div
                                v-if="udisk.size !== undefined"
                                class="udisk-meta-row"
                              >
                                <span class="udisk-meta-label">容量:</span>
                                <span class="udisk-meta-value"
                                  >{{ udisk.size }}GB</span
                                >
                              </div>
                              <div v-if="udisk.diskType" class="udisk-meta-row">
                                <span class="udisk-meta-label">类型:</span>
                                <span class="udisk-meta-value">{{
                                  udisk.diskType
                                }}</span>
                              </div>
                              <div
                                v-if="udisk.chargeType"
                                class="udisk-meta-row"
                              >
                                <span class="udisk-meta-label">计费模式:</span>
                                <span class="udisk-meta-value">{{
                                  getChargeTypeText(udisk.chargeType)
                                }}</span>
                              </div>
                              <div
                                v-if="udisk.createTime"
                                class="udisk-meta-row"
                              >
                                <span class="udisk-meta-label">创建时间:</span>
                                <span class="udisk-meta-value">{{
                                  formatTime(udisk.createTime)
                                }}</span>
                              </div>
                              <div
                                v-if="udisk.deviceName"
                                class="udisk-meta-row"
                              >
                                <span class="udisk-meta-label">设备名:</span>
                                <span class="udisk-meta-value">{{
                                  udisk.deviceName
                                }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 弹性IP列表 -->
            <div
              v-if="
                item.eips && Array.isArray(item.eips) && item.eips.length > 0
              "
              class="eips-section"
            >
              <div class="eips-header" @click="toggleEIPs(item.account.id)">
                <span class="eips-label">弹性IP</span>
                <span class="eips-count">{{ item.eips.length }} 个</span>
                <span class="eips-toggle">
                  {{ expandedEIPs.has(item.account.id) ? "收起" : "展开" }}
                </span>
              </div>
              <div v-if="expandedEIPs.has(item.account.id)" class="eips-list">
                <div v-for="eip in item.eips" :key="eip.eipId" class="eip-item">
                  <div class="eip-main">
                    <div class="eip-info">
                      <span class="eip-name">{{
                        eip.name || eip.eipAddr || eip.eipId || "未命名"
                      }}</span>
                      <span
                        v-if="eip.status"
                        class="eip-status-badge"
                        :class="getEIPStatusClass(eip.status)"
                      >
                        {{ getEIPStatusText(eip.status) }}
                      </span>
                      <span v-if="eip.eipType" class="eip-type-badge">
                        {{ eip.eipType }}
                      </span>
                    </div>
                    <div class="eip-meta">
                      <div v-if="eip.eipId" class="eip-meta-row">
                        <span class="eip-meta-label">ID:</span>
                        <span class="eip-meta-value">{{ eip.eipId }}</span>
                      </div>
                      <div
                        class="eip-meta-row"
                        v-if="eip.eipAddr && eip.eipAddr.length > 0"
                      >
                        <span class="eip-meta-label">IP地址:</span>
                        <span class="eip-meta-value">{{
                          eip.eipAddr[0]?.IP || "-"
                        }}</span>
                      </div>
                      <div
                        class="eip-meta-row"
                        v-if="eip.eipAddr && eip.eipAddr.length > 0"
                      >
                        <span class="eip-meta-label">线路:</span>
                        <span class="eip-meta-value">{{
                          eip.eipAddr[0]?.OperatorName || "-"
                        }}</span>
                      </div>
                      <div v-if="eip.region || eip.zone" class="eip-meta-row">
                        <span class="eip-meta-label">地域/可用区:</span>
                        <span class="eip-meta-value">{{
                          [eip.region, eip.zone].filter(Boolean).join(" / ")
                        }}</span>
                      </div>
                      <div
                        v-if="eip.bandwidth !== undefined"
                        class="eip-meta-row"
                      >
                        <span class="eip-meta-label">带宽:</span>
                        <span class="eip-meta-value"
                          >{{ eip.bandwidth }}Mbps</span
                        >
                      </div>
                      <div v-if="eip.chargeType" class="eip-meta-row">
                        <span class="eip-meta-label">计费模式:</span>
                        <span class="eip-meta-value">{{
                          getChargeTypeText(eip.chargeType)
                        }}</span>
                      </div>
                      <div v-if="eip.payMode" class="eip-meta-row">
                        <span class="eip-meta-label">付费类型:</span>
                        <span class="eip-meta-value">{{
                          getPayModeText(eip.payMode)
                        }}</span>
                      </div>
                      <div v-if="eip.createTime" class="eip-meta-row">
                        <span class="eip-meta-label">创建时间:</span>
                        <span class="eip-meta-value">{{
                          formatTime(eip.createTime)
                        }}</span>
                      </div>
                      <div v-if="eip.expireTime" class="eip-meta-row">
                        <span class="eip-meta-label">过期时间:</span>
                        <span class="eip-meta-value">{{
                          formatTime(eip.expireTime)
                        }}</span>
                      </div>
                      <div v-if="eip.bindResourceName" class="eip-meta-row">
                        <span class="eip-meta-label">绑定资源:</span>
                        <span class="eip-meta-value">{{
                          eip.bindResourceName
                        }}</span>
                      </div>
                      <div v-if="eip.remark" class="eip-meta-row">
                        <span class="eip-meta-label">备注:</span>
                        <span class="eip-meta-value">{{ eip.remark }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 镜像列表 -->
            <div
              v-if="
                item.images &&
                Array.isArray(item.images) &&
                item.images.length > 0
              "
              class="images-section"
            >
              <div class="images-header" @click="toggleImages(item.account.id)">
                <span class="images-label">镜像</span>
                <span class="images-count">{{ item.images.length }} 个</span>
                <span class="images-toggle">
                  {{ expandedImages.has(item.account.id) ? "收起" : "展开" }}
                </span>
              </div>
              <div
                v-if="expandedImages.has(item.account.id)"
                class="images-list"
              >
                <div
                  v-for="image in item.images"
                  :key="image.imageId"
                  class="image-item"
                >
                  <div class="image-main">
                    <div class="image-info">
                      <span class="image-name">{{
                        image.imageName || image.imageId || "未命名"
                      }}</span>
                      <span v-if="image.imageType" class="image-type-badge">
                        {{ getImageTypeText(image.imageType) }}
                      </span>
                      <span v-if="image.osType" class="image-os-badge">
                        {{ image.osType }}
                      </span>
                      <span
                        v-if="image.state"
                        class="image-state-badge"
                        :class="getImageStateClass(image.state)"
                      >
                        {{ getImageStateText(image.state) }}
                      </span>
                    </div>
                    <div class="image-meta">
                      <div class="image-meta-row">
                        <span class="image-meta-label">ID:</span>
                        <span class="image-meta-value">{{
                          image.imageId
                        }}</span>
                      </div>
                      <div v-if="image.osName" class="image-meta-row">
                        <span class="image-meta-label">操作系统:</span>
                        <span class="image-meta-value">{{ image.osName }}</span>
                      </div>
                      <div
                        v-if="image.imageSize !== undefined"
                        class="image-meta-row"
                      >
                        <span class="image-meta-label">大小:</span>
                        <span class="image-meta-value">{{
                          formatImageSize(image.imageSize)
                        }}</span>
                      </div>
                      <div v-if="image.createTime" class="image-meta-row">
                        <span class="image-meta-label">创建时间:</span>
                        <span class="image-meta-value">{{
                          formatTime(image.createTime)
                        }}</span>
                      </div>
                      <div v-if="image.imageDescription" class="image-meta-row">
                        <span class="image-meta-label">描述:</span>
                        <span class="image-meta-value">{{
                          image.imageDescription
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="item.balance" class="last-updated">
              最后更新: {{ formatTime(item.balance.lastUpdated) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 余额趋势图表 -->
      <!-- <div v-if="dataStore.aggregatedData.length > 0" class="chart-section">
        <h3>余额分布</h3>
        <div class="card">
          <v-chart :option="balanceChartOption" style="height: 300px" />
        </div>
      </div> -->
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAccountStore } from "@/stores/account";
import { useDataStore } from "@/stores/data";
import { useAlertStore } from "@/stores/alert";
import { CloudProvider } from "@/types";
import Layout from "@/components/Layout.vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import VChart from "vue-echarts";

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

const accountStore = useAccountStore();
const dataStore = useDataStore();
const alertStore = useAlertStore();

// 展开的项目ID集合
const expandedProjects = ref<Set<string>>(new Set());

// 展开的实例ID集合
const expandedInstances = ref<Set<string>>(new Set());

// 展开的云硬盘ID集合（按实例ID分组）
const expandedDisks = ref<Map<string, Set<string>>>(new Map());

// 展开的镜像ID集合
const expandedImages = ref<Set<string>>(new Set());

// 展开的弹性IPID集合
const expandedEIPs = ref<Set<string>>(new Set());

// 切换项目列表展开/折叠
function toggleProjects(accountId: string) {
  if (expandedProjects.value.has(accountId)) {
    expandedProjects.value.delete(accountId);
  } else {
    expandedProjects.value.add(accountId);
  }
}

// 切换实例列表展开/折叠
function toggleInstances(accountId: string) {
  if (expandedInstances.value.has(accountId)) {
    expandedInstances.value.delete(accountId);
  } else {
    expandedInstances.value.add(accountId);
  }
}

// 获取实例状态样式类
function getStateClass(state: string): string {
  const stateMap: Record<string, string> = {
    Running: "state-running",
    Stopped: "state-stopped",
    Starting: "state-starting",
    Stopping: "state-stopping",
    Rebooting: "state-rebooting",
    "Install Fail": "state-error",
    Initializing: "state-initializing",
  };
  return stateMap[state] || "state-unknown";
}

// 获取实例状态文本
function getStateText(state: string): string {
  const stateMap: Record<string, string> = {
    Running: "运行中",
    Stopped: "已停止",
    Starting: "启动中",
    Stopping: "停止中",
    Rebooting: "重启中",
    "Install Fail": "安装失败",
    Initializing: "初始化中",
  };
  return stateMap[state] || state || "未知";
}

// 格式化内存大小
function formatMemory(memory: number): string {
  if (memory >= 1024) {
    return `${(memory / 1024).toFixed(1)}GB`;
  }
  return `${memory}MB`;
}

// 获取计费模式文本
function getChargeTypeText(chargeType: string): string {
  const typeMap: Record<string, string> = {
    Year: "包年",
    Month: "包月",
    Dynamic: "按需",
    Preemptive: "抢占式",
    Trial: "试用",
    Postpay: "后付费",
  };
  return typeMap[chargeType] || chargeType;
}

// 切换云硬盘列表展开/折叠
function toggleDisks(accountId: string, uHostId: string) {
  if (!expandedDisks.value.has(accountId)) {
    expandedDisks.value.set(accountId, new Set());
  }
  const diskSet = expandedDisks.value.get(accountId)!;
  if (diskSet.has(uHostId)) {
    diskSet.delete(uHostId);
  } else {
    diskSet.add(uHostId);
  }
}

// 检查云硬盘列表是否展开
function isDiskExpanded(accountId: string, uHostId: string): boolean {
  const diskSet = expandedDisks.value.get(accountId);
  return diskSet ? diskSet.has(uHostId) : false;
}

// 获取云硬盘状态样式类
function getDiskStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    Available: "status-available",
    InUse: "status-inuse",
    Attaching: "status-attaching",
    Detaching: "status-detaching",
    Initializating: "status-initializing",
    Failed: "status-failed",
    Cloning: "status-cloning",
    Restoring: "status-restoring",
    RestoreFailed: "status-failed",
  };
  return statusMap[status] || "status-unknown";
}

// 获取云硬盘状态文本
function getDiskStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    Available: "可用",
    InUse: "已挂载",
    Attaching: "挂载中",
    Detaching: "卸载中",
    Initializating: "分配中",
    Failed: "创建失败",
    Cloning: "克隆中",
    Restoring: "恢复中",
    RestoreFailed: "恢复失败",
  };
  return statusMap[status] || status || "未知";
}

// 切换镜像列表展开/折叠
function toggleImages(accountId: string) {
  if (expandedImages.value.has(accountId)) {
    expandedImages.value.delete(accountId);
  } else {
    expandedImages.value.add(accountId);
  }
}

// 切换弹性IP列表展开/折叠
function toggleEIPs(accountId: string) {
  if (expandedEIPs.value.has(accountId)) {
    expandedEIPs.value.delete(accountId);
  } else {
    expandedEIPs.value.add(accountId);
  }
}

function getEIPStatusClass(status: string): string {
  switch (status?.toLowerCase()) {
    case "used":
    case "available":
      return "status-available";
    case "free":
      return "status-free";
    case "failed":
      return "status-failed";
    default:
      return "status-unknown";
  }
}

function getEIPStatusText(status: string): string {
  switch (status?.toLowerCase()) {
    case "used":
      return "已使用";
    case "available":
      return "可用";
    case "free":
      return "空闲";
    case "failed":
      return "失败";
    default:
      return status || "未知";
  }
}

function getPayModeText(payMode: string): string {
  switch (payMode) {
    case "Bandwidth":
      return "带宽";
    case "Traffic":
      return "流量";
    default:
      return payMode || "未知";
  }
}

// 获取镜像类型文本
function getImageTypeText(imageType: string): string {
  const typeMap: Record<string, string> = {
    Base: "标准镜像",
    Business: "行业镜像",
    Custom: "自定义镜像",
  };
  return typeMap[imageType] || imageType || "未知";
}

// 获取镜像状态样式类
function getImageStateClass(state: string): string {
  const stateMap: Record<string, string> = {
    Available: "state-available",
    Making: "state-making",
    Unavailable: "state-unavailable",
    Copying: "state-copying",
  };
  return stateMap[state] || "state-unknown";
}

// 获取镜像状态文本
function getImageStateText(state: string): string {
  const stateMap: Record<string, string> = {
    Available: "可用",
    Making: "制作中",
    Unavailable: "不可用",
    Copying: "复制中",
  };
  return stateMap[state] || state || "未知";
}

// 格式化镜像大小
function formatImageSize(size: number): string {
  if (size < 1024) {
    return `${size}MB`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)}GB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)}TB`;
  }
}

// 余额分布图表配置
const balanceChartOption = computed(() => {
  const data = dataStore.aggregatedData
    .filter((item) => item.balance)
    .map((item) => ({
      value: item.balance!.balance,
      name: item.account.name,
    }));

  return {
    tooltip: {
      trigger: "item",
      formatter: "{b}: ¥{c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    series: [
      {
        name: "账户余额",
        type: "pie",
        radius: "50%",
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };
});

function getProviderName(provider: CloudProvider): string {
  const map: Record<CloudProvider, string> = {
    [CloudProvider.UCLOUD]: "UCloud",
  };
  return map[provider] || provider;
}

function formatNumber(num: number): string {
  return num.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTime(timestamp: number): string {
  // 判断是秒级时间戳还是毫秒级时间戳
  // Unix 时间戳通常是秒级（10位数字），JavaScript Date 需要毫秒级（13位数字）
  const timestampMs =
    timestamp.toString().length <= 10 ? timestamp * 1000 : timestamp;
  const date = new Date(timestampMs);

  // 格式化为年月日时分秒
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function handleRefresh() {
  try {
    await dataStore.refreshAllData();
    await alertStore.checkAlerts();
  } catch (error) {
    console.error("刷新数据失败:", error);
  }
}

async function handleRefreshRegionCache() {
  try {
    await dataStore.refreshRegionCache();
    await alertStore.checkAlerts();
  } catch (error) {
    console.error("刷新区域缓存失败:", error);
  }
}

onMounted(async () => {
  if (accountStore.accounts.length > 0) {
    await handleRefresh();
  }
});
</script>

<style scoped>
.dashboard {
  padding: 24px 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dashboard-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.overview-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
}

.accounts-section {
  margin-bottom: 32px;
}

.accounts-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.account-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--shadow);
  transition: all 0.3s;
}

.account-card:hover {
  box-shadow: var(--shadow-hover);
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.account-info h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.provider-badge {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 4px;
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

.account-balance {
  text-align: right;
}

.balance-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.balance-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
}

.projects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 8px 0;
  transition: all 0.3s;
}

.projects-header:hover {
  color: var(--primary-color);
}

.projects-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.projects-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: auto;
  margin-right: 12px;
}

.projects-toggle {
  font-size: 12px;
  color: var(--primary-color);
}

.projects-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-item {
  padding: 12px;
  background: var(--bg-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.project-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.project-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: var(--primary-color);
  color: #fff;
}

.project-badge.default {
  background: var(--success-color);
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.project-id {
  font-family: monospace;
}

.project-stats {
  font-size: 11px;
}

.instances-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.instances-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 8px 0;
  transition: all 0.3s;
}

.instances-header:hover {
  color: var(--primary-color);
}

.instances-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.instances-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: auto;
  margin-right: 12px;
}

.instances-toggle {
  font-size: 12px;
  color: var(--primary-color);
}

.instances-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.instance-item {
  padding: 12px;
  background: var(--bg-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.instance-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.instance-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.instance-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.instance-state-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: var(--text-secondary);
  color: #fff;
}

.instance-state-badge.state-running {
  background: var(--success-color);
}

.instance-state-badge.state-stopped {
  background: var(--text-secondary);
}

.instance-state-badge.state-starting,
.instance-state-badge.state-stopping,
.instance-state-badge.state-rebooting,
.instance-state-badge.state-initializing {
  background: var(--warning-color);
}

.instance-state-badge.state-error {
  background: var(--error-color);
}

.instance-state-badge.state-unknown {
  background: var(--text-secondary);
}

.instance-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.instance-meta-row {
  display: flex;
  gap: 8px;
}

.instance-meta-label {
  font-weight: 500;
  min-width: 80px;
}

.instance-meta-value {
  font-family: monospace;
  color: var(--text-color);
  flex: 1;
  word-break: break-all;
}

.ip-item {
  display: inline;
}

.ip-type {
  font-size: 11px;
  color: var(--text-secondary);
  margin-left: 4px;
}

.udisks-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.udisks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 6px 0;
  transition: all 0.3s;
  font-size: 13px;
}

.udisks-header:hover {
  color: var(--primary-color);
}

.udisks-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
}

.udisks-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: auto;
  margin-right: 12px;
}

.udisks-toggle {
  font-size: 12px;
  color: var(--primary-color);
}

.udisks-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.udisk-item {
  padding: 10px;
  background: var(--bg-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  margin-left: 12px;
}

.udisk-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.udisk-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.udisk-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
}

.udisk-status-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: var(--text-secondary);
  color: #fff;
}

.udisk-status-badge.status-available {
  background: var(--success-color);
}

.udisk-status-badge.status-inuse {
  background: var(--primary-color);
}

.udisk-status-badge.status-attaching,
.udisk-status-badge.status-detaching,
.udisk-status-badge.status-initializing,
.udisk-status-badge.status-cloning,
.udisk-status-badge.status-restoring {
  background: var(--warning-color);
}

.udisk-status-badge.status-failed {
  background: var(--error-color);
}

.udisk-status-badge.status-unknown {
  background: var(--text-secondary);
}

.udisk-boot-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: #722ed1;
  color: #fff;
}

.udisk-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: var(--text-secondary);
}

.udisk-meta-row {
  display: flex;
  gap: 8px;
}

.udisk-meta-label {
  font-weight: 500;
  min-width: 70px;
}

.udisk-meta-value {
  font-family: monospace;
  color: var(--text-color);
  flex: 1;
  word-break: break-all;
}

.image-type-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: #722ed1;
  color: #fff;
  margin-left: 6px;
}

.image-os-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: var(--primary-color);
  color: #fff;
  margin-left: 6px;
}

.images-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.images-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 8px 0;
  transition: all 0.3s;
}

.images-header:hover {
  color: var(--primary-color);
}

.images-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.images-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: auto;
  margin-right: 12px;
}

.images-toggle {
  font-size: 12px;
  color: var(--primary-color);
}

.images-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-item {
  padding: 12px;
  background: var(--bg-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.image-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.image-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.image-type-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: #722ed1;
  color: #fff;
  margin-left: 6px;
}

.image-os-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: var(--primary-color);
  color: #fff;
  margin-left: 6px;
}

.image-state-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: var(--text-secondary);
  color: #fff;
}

.image-state-badge.state-available {
  background: var(--success-color);
}

.image-state-badge.state-making {
  background: var(--warning-color);
}

.image-state-badge.state-unavailable {
  background: var(--error-color);
}

.image-state-badge.state-copying {
  background: var(--warning-color);
}

.image-state-badge.state-unknown {
  background: var(--text-secondary);
}

.image-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.image-meta-row {
  display: flex;
  gap: 8px;
}

.image-meta-label {
  font-weight: 500;
  min-width: 80px;
}

.image-meta-value {
  font-family: monospace;
  color: var(--text-color);
  flex: 1;
  word-break: break-all;
}

.eips-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.eips-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 8px 0;
  transition: all 0.3s;
}

.eips-header:hover {
  color: var(--primary-color);
}

.eips-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.eips-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: auto;
  margin-right: 12px;
}

.eips-toggle {
  font-size: 12px;
  color: var(--primary-color);
}

.eips-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eip-item {
  padding: 12px;
  background: var(--bg-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.eip-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eip-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.eip-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.eip-status-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: var(--text-secondary);
  color: #fff;
}

.eip-status-badge.status-available {
  background: var(--success-color);
}

.eip-status-badge.status-free {
  background: var(--warning-color);
}

.eip-status-badge.status-failed {
  background: var(--error-color);
}

.eip-status-badge.status-unknown {
  background: var(--text-secondary);
}

.eip-type-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: #722ed1;
  color: #fff;
  margin-left: 6px;
}

.eip-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.eip-meta-row {
  display: flex;
  gap: 8px;
}

.eip-meta-label {
  font-weight: 500;
  min-width: 80px;
}

.eip-meta-value {
  font-family: monospace;
  color: var(--text-color);
  flex: 1;
  word-break: break-all;
}

.last-updated {
  font-size: 12px;
  color: var(--text-secondary);
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  margin-top: 12px;
}

.chart-section {
  margin-bottom: 32px;
}

.chart-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}
</style>
