/**
 * 云服务商类型枚举
 */
export enum CloudProvider {
  UCLOUD = "ucloud",
}

/**
 * 云账户信息接口
 */
export interface CloudAccount {
  id: string;
  name: string;
  provider: CloudProvider;
  accessKeyId: string; // 加密存储
  accessKeySecret: string; // 加密存储
  region?: string;
  enabled: boolean; // 账户状态，true为启用，false为停用，默认启用
  createdAt: number;
  updatedAt: number;
}

/**
 * 账户余额信息
 */
export interface AccountBalance {
  accountId: string;
  balance: number;
  currency: string;
  lastUpdated: number;
}

/**
 * 资源使用情况
 */
export interface ResourceUsage {
  accountId: string;
  resourceType: string;
  usage: number;
  limit?: number;
  unit: string;
  lastUpdated: number;
}

/**
 * 预警规则配置
 */
export interface AlertRule {
  id: string;
  accountId: string;
  type: "balance" | "usage";
  threshold: number;
  operator: "lt" | "lte" | "gt" | "gte";
  enabled: boolean;
  createdAt: number;
}

/**
 * 预警通知记录
 */
export interface AlertNotification {
  id: string;
  ruleId: string;
  accountId: string;
  message: string;
  level: "warning" | "critical";
  triggeredAt: number;
  read: boolean;
}

/**
 * UCloud项目信息
 */
export interface UCloudProject {
  projectId: string;
  projectName: string;
  createTime: number;
  userCount: number; // 用户数量
  // 以下字段在新API中不再提供，保留为可选以兼容旧数据
  isDefault?: boolean;
  resourceCount?: number;
  memberCount?: number;
  parentId?: string;
  parentName?: string;
}

/**
 * UCloud地域信息
 */
export interface UCloudRegion {
  regionId: number;
  regionName: string;
  isDefault: boolean;
  bitMaps: string;
  region: string; // 地域名字，如cn-bj
  zone: string; // 可用区名字，如cn-bj-01
}

/**
 * 账户项目列表（按云服务商区分）
 */
export interface AccountProjects {
  accountId: string;
  provider: CloudProvider;
  projects: UCloudProject[];
  lastUpdated: number;
}

/**
 * UHost实例磁盘信息
 */
export interface UHostDiskSet {
  diskType: string;
  isBoot: string;
  encrypted?: string;
  type?: string;
  diskId?: string;
  name?: string;
  drive?: string;
  size?: number;
  backupType?: string;
}

/**
 * UHost实例IP信息
 */
export interface UHostIPSet {
  ipMode: string;
  default?: string;
  mac?: string;
  weight?: number;
  type?: string;
  ipId?: string;
  ip?: string;
  bandwidth?: number;
  vpcId?: string;
  subnetId?: string;
  networkInterfaceId?: string;
}

/**
 * UHost实例密钥信息
 */
export interface UHostKeyPair {
  keyPairId?: string;
  keyPairState?: string;
}

/**
 * UDisk云硬盘信息
 */
export interface UDisk {
  zone?: string;
  uDiskId?: string;
  name?: string;
  size?: number;
  status?: string;
  createTime?: number;
  expiredTime?: number;
  uHostId?: string;
  uHostName?: string;
  uHostIP?: string;
  hostId?: string;
  hostName?: string;
  hostIP?: string;
  deviceName?: string;
  chargeType?: string;
  tag?: string;
  isExpire?: string;
  version?: string;
  uDataArkMode?: string;
  snapshotCount?: number;
  snapshotLimit?: number;
  diskType?: string;
  cloneEnable?: number;
  snapEnable?: number;
  arkSwitchEnable?: number;
  ukmsMode?: string;
  cmkId?: string;
  dataKey?: string;
  cmkIdStatus?: string;
  cmkIdAlias?: string;
  isBoot?: string;
  backupMode?: string;
  rdmaClusterId?: string;
  region?: string; // 添加地域信息，用于显示
}

/**
 * UHost镜像信息
 */
export interface UHostImage {
  zone?: string;
  imageId?: string;
  imageName?: string;
  tag?: string;
  osType?: string;
  osName?: string;
  imageType?: string;
  features?: string[];
  funcType?: string;
  integratedSoftware?: string;
  vendor?: string;
  links?: string;
  state?: string;
  imageDescription?: string;
  createTime?: number;
  imageSize?: number;
  minimalCPU?: string;
  maintainEol?: string;
  dataSnapshotIds?: string[];
  supportedGPUTypes?: string[];
  sceneCategories?: string[];
  primarySoftware?: string;
  priceSet?: Array<{
    chargeType?: string;
    price?: number;
    originalPrice?: number;
  }>;
  region?: string; // 添加地域信息，用于显示
}

/**
 * UHost实例信息
 */
export interface UHostInstance {
  zone?: string;
  uHostId?: string;
  uHostType?: string;
  machineType?: string;
  cpuPlatform?: string;
  storageType?: string;
  imageId?: string;
  basicImageId?: string;
  basicImageName?: string;
  tag?: string;
  remark?: string;
  name?: string;
  state?: string;
  createTime?: number;
  chargeType?: string;
  expireTime?: number;
  cpu?: number;
  memory?: number;
  autoRenew?: string;
  diskSet?: UHostDiskSet[];
  ipSet?: UHostIPSet[];
  netCapability?: string;
  networkState?: string;
  timemachineFeature?: string;
  subnetType?: string;
  osName?: string;
  osType?: string;
  hostType?: string;
  lifeCycle?: string;
  gpu?: number;
  gpuType?: string;
  hotPlugMaxCpu?: number;
  bootDiskState?: string;
  totalDiskSpace?: number;
  isolationGroup?: string;
  rdmaClusterId?: string;
  restrictMode?: string;
  hotplugFeature?: boolean;
  cloudInitFeature?: boolean;
  ipv6Feature?: boolean;
  hpcFeature?: boolean;
  epcInstance?: boolean;
  secGroupInstance?: boolean;
  netFeatureTag?: string;
  hiddenKvm?: boolean;
  keyPair?: UHostKeyPair;
  region?: string; // 添加地域信息，用于显示
  udisks?: UDisk[]; // 云硬盘列表
}

/**
 * 弹性IP信息
 */
export interface EIP {
  eipId?: string;
  eipAddr?: string;
  bandwidth?: number;
  bandwidthType?: string;
  createTime?: number;
  expireTime?: number;
  chargeType?: string;
  name?: string;
  tag?: string;
  remark?: string;
  status?: string;
  weight?: number;
  payMode?: string;
  shareBandwidthId?: string;
  eipType?: string;
  operatorName?: string;
  bandwidthGuarantee?: number;
  vpcId?: string;
  subnetId?: string;
  privateIp?: string;
  bindResourceType?: string;
  bindResourceId?: string;
  bindResourceName?: string;
  region?: string; // 地域信息
  zone?: string; // 可用区信息
}

/**
 * 聚合后的账户数据
 */
export interface AggregatedAccountData {
  account: CloudAccount;
  balance?: AccountBalance;
  resources: ResourceUsage[];
  alerts: AlertNotification[];
  projects?: UCloudProject[]; // UCloud项目列表
  uHostInstances?: UHostInstance[]; // UHost实例列表
  images?: UHostImage[]; // 镜像列表
  eips?: EIP[]; // 弹性IP列表
}
