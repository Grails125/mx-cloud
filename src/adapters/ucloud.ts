/**
 * UCloud API适配器
 * 实现UCloud余额查询和资源使用情况查询
 */

import axios, { type AxiosInstance } from "axios";
import CryptoJS from "crypto-js";
import { BaseAdapter } from "./base";
import type {
  CloudAccount,
  AccountBalance,
  ResourceUsage,
  UCloudProject,
  UCloudRegion,
  UHostInstance,
  UDisk,
  UHostImage,
  EIP,
} from "@/types";

export class UCloudAdapter extends BaseAdapter {
  private apiClient: AxiosInstance;

  constructor() {
    super();
    this.apiClient = axios.create({
      baseURL: "https://api.ucloud.cn",
      timeout: 10000,
    });
  }

  /**
   * 格式化参数值（处理bool和浮点数）
   * 注意：
   * - 对于bool类型，应编码为true/false
   * - 对于浮点数类型，如果小数部分为0，应仅保留整数部分，如42.0应保留42
   * - 对于浮点数类型，不能使用科学计数法
   */
  private formatParamValue(value: any): string {
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    if (typeof value === "number") {
      // 如果是整数，直接返回字符串
      if (Number.isInteger(value)) {
        return value.toString();
      }
      // 浮点数处理
      const str = value.toString();
      // 如果包含科学计数法，转换为普通格式
      if (str.includes("e") || str.includes("E")) {
        // 转换为固定小数格式，然后去除末尾的0
        return value.toFixed(10).replace(/\.?0+$/, "");
      }
      // 如果小数部分为0，仅保留整数部分
      if (value % 1 === 0) {
        return Math.floor(value).toString();
      }
      return str;
    }
    return String(value);
  }

  /**
   * 生成UCloud API签名
   * 签名规则：
   * 1. 将请求参数按照名称进行升序排列
   * 2. 构造被签名参数串：所有请求参数拼接(无需HTTP转义)，并在结尾拼接API密钥的私钥（PrivateKey）
   * 3. 使用SHA1编码被签名串，生成最终签名（十六进制字符串，小写）
   */
  private generateSignature(
    params: Record<string, any>,
    privateKey: string
  ): string {
    // 1. 将请求参数按照名称进行升序排列
    const sortedKeys = Object.keys(params).sort();

    // 2. 构造被签名参数串：所有请求参数拼接(无需HTTP转义)
    const canonicalizedQueryString = sortedKeys
      .map((key) => `${key}${this.formatParamValue(params[key])}`)
      .join("");

    // 在结尾拼接API密钥的私钥（PrivateKey）
    const stringToSign = canonicalizedQueryString + privateKey;

    // 3. 使用SHA1编码被签名串，生成最终签名
    const signature = CryptoJS.SHA1(stringToSign);
    // 转换为十六进制字符串（小写），UCloud API要求
    return signature.toString(CryptoJS.enc.Hex).toLowerCase();
  }

  /**
   * 构建请求参数
   */
  private buildRequestParams(
    account: CloudAccount,
    action: string,
    additionalParams: Record<string, any> = {}
  ): Record<string, any> {
    const params: Record<string, any> = {
      Action: action,
      PublicKey: account.accessKeyId,
      ...additionalParams,
    };

    // 生成签名（注意：签名时不包含Signature参数本身）
    const signature = this.generateSignature(params, account.accessKeySecret);
    params.Signature = signature;

    return params;
  }

  /**
   * 获取账户余额
   * UCloud API返回格式：
   * {
   *   RetCode: number,      // 返回状态码，0为成功
   *   Action: string,       // 操作指令名称
   *   Message?: string,     // 错误消息（RetCode非0时）
   *   AccountInfo: {         // 账户余额信息
   *     AmountAvailable: string,  // 账户可用余额（优先使用）
   *     Amount: string,           // 账户余额
   *     AmountFreeze: string,     // 冻结账户金额
   *     AmountCredit: string,      // 信用账户余额
   *     AmountFree: string         // 赠送账户余额
   *   }
   * }
   */
  async getBalance(account: CloudAccount): Promise<AccountBalance> {
    try {
      const params = this.buildRequestParams(account, "GetBalance");
      const response = await this.apiClient.get("/", { params });

      const data = response.data;

      // 检查返回状态码
      if (data.RetCode !== 0) {
        const errorMessage = data.Message || "获取余额失败";
        throw new Error(
          `UCloud API错误 (RetCode: ${data.RetCode}): ${errorMessage}`
        );
      }

      // 检查AccountInfo是否存在
      if (!data.AccountInfo) {
        throw new Error("响应中缺少AccountInfo字段");
      }

      const accountInfo = data.AccountInfo;

      // 优先使用可用余额（AmountAvailable），如果没有则使用账户余额（Amount）
      const balanceStr =
        accountInfo.AmountAvailable !== undefined &&
        accountInfo.AmountAvailable !== null &&
        accountInfo.AmountAvailable !== ""
          ? accountInfo.AmountAvailable
          : accountInfo.Amount || "0";

      const balance = parseFloat(balanceStr);

      if (isNaN(balance)) {
        throw new Error(`无法解析余额值: ${balanceStr}`);
      }

      return {
        accountId: account.id,
        balance: balance,
        currency: "CNY",
        lastUpdated: Date.now(),
      };
    } catch (error) {
      this.handleError(error, "获取余额");
    }
  }

  /**
   * 获取地域和可用区列表
   * UCloud API返回格式：
   * {
   *   RetCode: number,      // 返回状态码，0为成功
   *   Action: string,       // 操作指令名称
   *   Message?: string,     // 错误消息（RetCode非0时）
   *   Regions: [            // 地域列表
   *     {
   *       RegionId: number,
   *       RegionName: string,
   *       IsDefault: boolean,
   *       BitMaps: string,
   *       Region: string,    // 地域名字，如cn-bj
   *       Zone: string       // 可用区名字，如cn-bj-01
   *     }
   *   ]
   * }
   */
  async getRegionList(account: CloudAccount): Promise<UCloudRegion[]> {
    try {
      const params = this.buildRequestParams(account, "GetRegion");
      const response = await this.apiClient.get("/", { params });

      const data = response.data;

      // 检查返回状态码
      if (data.RetCode !== 0) {
        const errorMessage = data.Message || "获取地域列表失败";
        throw new Error(
          `UCloud API错误 (RetCode: ${data.RetCode}): ${errorMessage}`
        );
      }

      // 检查Regions是否存在
      if (!data.Regions || !Array.isArray(data.Regions)) {
        return [];
      }

      // 转换地域数据格式
      return data.Regions.map((region: any) => ({
        regionId: region.RegionId,
        regionName: region.RegionName,
        isDefault: region.IsDefault || false,
        bitMaps: region.BitMaps || "",
        region: region.Region || "",
        zone: region.Zone || "",
      }));
    } catch (error) {
      console.error("获取地域列表失败:", error);
      // 不抛出错误，返回空数组，避免影响其他数据获取
      return [];
    }
  }

  /**
   * 获取指定地域的UHost实例列表
   * @param account 云账户
   * @param region 地域
   * @returns UHost实例列表和是否有实例的标识
   */
  private async getUHostInstancesByRegion(
    account: CloudAccount,
    region: string
  ): Promise<{ instances: UHostInstance[]; hasInstances: boolean }> {
    try {
      const params = this.buildRequestParams(account, "DescribeUHostInstance", {
        Region: region,
      });
      const response = await this.apiClient.get("/", { params });

      // 检查返回状态码
      if (response.data.RetCode !== 0) {
        // 某些地域可能没有权限或没有实例，不抛出错误
        console.warn(
          `获取地域 ${region} 的UHost实例失败 (RetCode: ${
            response.data.RetCode
          }): ${response.data.Message || ""}`
        );
        return { instances: [], hasInstances: false };
      }

      const instances = response.data?.UHostSet || [];
      // 转换实例数据格式，添加地域信息
      const mappedInstances = instances.map((instance: any) => ({
        zone: instance.Zone,
        uHostId: instance.UHostId,
        uHostType: instance.UHostType,
        machineType: instance.MachineType,
        cpuPlatform: instance.CpuPlatform,
        storageType: instance.StorageType,
        imageId: instance.ImageId,
        basicImageId: instance.BasicImageId,
        basicImageName: instance.BasicImageName,
        tag: instance.Tag,
        remark: instance.Remark,
        name: instance.Name,
        state: instance.State,
        createTime: instance.CreateTime,
        chargeType: instance.ChargeType,
        expireTime: instance.ExpireTime,
        cpu: instance.CPU,
        memory: instance.Memory,
        autoRenew: instance.AutoRenew,
        diskSet: instance.DiskSet?.map((disk: any) => ({
          diskType: disk.DiskType,
          isBoot: disk.IsBoot,
          encrypted: disk.Encrypted,
          type: disk.Type,
          diskId: disk.DiskId,
          name: disk.Name,
          drive: disk.Drive,
          size: disk.Size,
          backupType: disk.BackupType,
        })),
        ipSet: instance.IPSet?.map((ip: any) => ({
          ipMode: ip.IPMode,
          default: ip.Default,
          mac: ip.Mac,
          weight: ip.Weight,
          type: ip.Type,
          ipId: ip.IPId,
          ip: ip.IP,
          bandwidth: ip.Bandwidth,
          vpcId: ip.VPCId,
          subnetId: ip.SubnetId,
          networkInterfaceId: ip.NetworkInterfaceId,
        })),
        netCapability: instance.NetCapability,
        networkState: instance.NetworkState,
        timemachineFeature: instance.TimemachineFeature,
        subnetType: instance.SubnetType,
        osName: instance.OsName,
        osType: instance.OsType,
        hostType: instance.HostType,
        lifeCycle: instance.LifeCycle,
        gpu: instance.GPU,
        gpuType: instance.GpuType,
        hotPlugMaxCpu: instance.HotPlugMaxCpu,
        bootDiskState: instance.BootDiskState,
        totalDiskSpace: instance.TotalDiskSpace,
        isolationGroup: instance.IsolationGroup,
        rdmaClusterId: instance.RdmaClusterId,
        restrictMode: instance.RestrictMode,
        hotplugFeature: instance.HotplugFeature,
        cloudInitFeature: instance.CloudInitFeature,
        ipv6Feature: instance.IPv6Feature,
        hpcFeature: instance.HpcFeature,
        epcInstance: instance.EpcInstance,
        secGroupInstance: instance.SecGroupInstance,
        netFeatureTag: instance.NetFeatureTag,
        hiddenKvm: instance.HiddenKvm,
        keyPair: instance.KeyPair
          ? {
              keyPairId: instance.KeyPair.KeyPairId,
              keyPairState: instance.KeyPair.KeyPairState,
            }
          : undefined,
        region: region, // 添加地域信息
      }));

      return {
        instances: mappedInstances,
        hasInstances: mappedInstances.length > 0,
      };
    } catch (error) {
      // 单个地域查询失败不影响整体统计
      console.warn(`获取地域 ${region} 的UHost实例失败:`, error);
      return { instances: [], hasInstances: false };
    }
  }

  /**
   * 获取所有地域的UHost实例列表
   * @param account 云账户
   * @param regions 可选的地域列表，如果不提供则使用全部地域
   * @returns UHost实例列表和有效地域列表
   */
  async getUHostInstanceList(
    account: CloudAccount,
    regions?: string[]
  ): Promise<{ instances: UHostInstance[]; validRegions: string[] }> {
    try {
      // 如果没有提供地域列表，获取所有地域列表
      let targetRegions: string[] = regions || [];
      if (targetRegions.length === 0) {
        const regionList = await this.getRegionList(account);
        targetRegions = regionList.map((r) => r.region);
      }

      if (targetRegions.length === 0) {
        console.warn("未获取到地域列表，返回空实例列表");
        return { instances: [], validRegions: [] };
      }

      // 并发查询所有地域的UHost实例
      const regionQueries = targetRegions.map((r) =>
        this.getUHostInstancesByRegion(account, r)
      );

      // 等待所有地域查询完成
      const results = await Promise.all(regionQueries);

      // 合并所有地域的实例列表，并收集有实例的地域
      const allInstances: UHostInstance[] = [];
      const validRegions: string[] = [];

      results.forEach((result, index) => {
        if (result.hasInstances) {
          allInstances.push(...result.instances);
          validRegions.push(targetRegions[index]);
        }
      });

      return { instances: allInstances, validRegions };
    } catch (error) {
      console.error("获取UHost实例列表失败:", error);
      return { instances: [], validRegions: [] };
    }
  }

  /**
   * 获取云硬盘列表
   * @param account 云账户
   * @param region 地域
   * @param uHostId 可选的UHost实例ID，用于过滤
   * @returns 云硬盘列表
   */
  async getUDiskList(
    account: CloudAccount,
    region: string,
    uHostId?: string
  ): Promise<UDisk[]> {
    try {
      const additionalParams: Record<string, any> = {
        Region: region,
      };

      // 如果提供了 UHostId，用于过滤
      if (uHostId) {
        additionalParams.UHostIdForAttachment = uHostId;
      }

      const params = this.buildRequestParams(
        account,
        "DescribeUDisk",
        additionalParams
      );
      const response = await this.apiClient.get("/", { params });

      const data = response.data;

      // 检查返回状态码
      if (data.RetCode !== 0) {
        const errorMessage = data.Message || "获取云硬盘列表失败";
        console.warn(
          `获取地域 ${region} 的云硬盘列表失败 (RetCode: ${data.RetCode}): ${errorMessage}`
        );
        return [];
      }

      // 检查DataSet是否存在
      if (!data.DataSet || !Array.isArray(data.DataSet)) {
        return [];
      }

      // 转换云硬盘数据格式
      return data.DataSet.map((udisk: any) => ({
        zone: udisk.Zone,
        uDiskId: udisk.UDiskId,
        name: udisk.Name,
        size: udisk.Size,
        status: udisk.Status,
        createTime: udisk.CreateTime,
        expiredTime: udisk.ExpiredTime,
        uHostId: udisk.UHostId || udisk.HostId,
        uHostName: udisk.UHostName || udisk.HostName,
        uHostIP: udisk.UHostIP || udisk.HostIP,
        hostId: udisk.HostId,
        hostName: udisk.HostName,
        hostIP: udisk.HostIP,
        deviceName: udisk.DeviceName,
        chargeType: udisk.ChargeType,
        tag: udisk.Tag,
        isExpire: udisk.IsExpire,
        version: udisk.Version,
        uDataArkMode: udisk.UDataArkMode,
        snapshotCount: udisk.SnapshotCount,
        snapshotLimit: udisk.SnapshotLimit,
        diskType: udisk.DiskType,
        cloneEnable: udisk.CloneEnable,
        snapEnable: udisk.SnapEnable,
        arkSwitchEnable: udisk.ArkSwitchEnable,
        ukmsMode: udisk.UKmsMode,
        cmkId: udisk.CmkId,
        dataKey: udisk.DataKey,
        cmkIdStatus: udisk.CmkIdStatus,
        cmkIdAlias: udisk.CmkIdAlias,
        isBoot: udisk.IsBoot,
        backupMode: udisk.BackupMode,
        rdmaClusterId: udisk.RdmaClusterId,
        region: region,
      }));
    } catch (error) {
      console.error(`获取地域 ${region} 的云硬盘列表失败:`, error);
      return [];
    }
  }

  /**
   * 获取镜像列表
   * @param account 云账户
   * @param region 地域
   * @returns 镜像列表
   */
  async getImageList(
    account: CloudAccount,
    region: string
  ): Promise<UHostImage[]> {
    try {
      const additionalParams: Record<string, any> = {
        Region: region,
      };
      const params = this.buildRequestParams(
        account,
        "DescribeImage",
        additionalParams
      );
      const response = await this.apiClient.get("/", { params });

      const data = response.data;

      // 检查返回状态码
      if (data.RetCode !== 0) {
        const errorMessage = data.Message || "获取镜像列表失败";
        console.warn(
          `获取地域 ${region} 的镜像列表失败 (RetCode: ${data.RetCode}): ${errorMessage}`
        );
        return [];
      }

      // 检查ImageSet是否存在
      if (
        !data.ImageSet ||
        !Array.isArray(data.ImageSet) ||
        data.ImageSet.length === 0
      ) {
        console.log(`获取地域 ${region} 的镜像列表：ImageSet 为空或不存在`);
        return [];
      }

      console.log(
        `获取地域 ${region} 的镜像列表：返回 ${data.ImageSet.length} 个镜像`
      );

      // 转换镜像数据格式
      return data.ImageSet.map((imageData: any) => ({
        zone: imageData.Zone,
        imageId: imageData.ImageId,
        imageName: imageData.ImageName,
        tag: imageData.Tag,
        osType: imageData.OsType,
        osName: imageData.OsName,
        imageType: imageData.ImageType,
        features: imageData.Features || [],
        funcType: imageData.FuncType,
        integratedSoftware: imageData.IntegratedSoftware,
        vendor: imageData.Vendor,
        links: imageData.Links,
        state: imageData.State,
        imageDescription: imageData.ImageDescription,
        createTime: imageData.CreateTime,
        imageSize: imageData.ImageSize,
        minimalCPU: imageData.MinimalCPU,
        maintainEol: imageData.MaintainEol,
        dataSnapshotIds: imageData.DataSnapshotIds || [],
        supportedGPUTypes: imageData.SupportedGPUTypes || [],
        sceneCategories: imageData.SceneCategories || [],
        primarySoftware: imageData.PrimarySoftware,
        priceSet: imageData.PriceSet?.map((price: any) => ({
          chargeType: price.ChargeType,
          price: price.Price,
          originalPrice: price.OriginalPrice,
        })),
        region: region,
      }));
    } catch (error) {
      console.error(`获取地域 ${region} 的镜像列表失败:`, error);
      return [];
    }
  }

  /**
   * 获取弹性IP列表
   * @param account 云账户
   * @param region 地域
   * @returns 弹性IP列表
   */
  async getEIPList(account: CloudAccount, region: string): Promise<EIP[]> {
    try {
      const additionalParams: Record<string, any> = {
        Region: region,
      };
      const params = this.buildRequestParams(
        account,
        "DescribeEIPWithAllNum",
        additionalParams
      );
      const response = await this.apiClient.get("/", { params });

      const data = response.data;

      // 检查返回状态码
      if (data.RetCode !== 0) {
        const errorMessage = data.Message || "获取弹性IP列表失败";
        console.warn(
          `获取地域 ${region} 的弹性IP列表失败 (RetCode: ${data.RetCode}): ${errorMessage}`
        );
        return [];
      }

      // 检查EIPSet是否存在
      if (
        !data.EIPSet ||
        !Array.isArray(data.EIPSet) ||
        data.EIPSet.length === 0
      ) {
        return [];
      }

      // 转换弹性IP数据格式
      return data.EIPSet.map((eipData: any) => ({
        eipId: eipData.EIPId,
        eipAddr: eipData.EIPAddr,
        bandwidth: eipData.Bandwidth,
        bandwidthType: eipData.BandwidthType,
        createTime: eipData.CreateTime,
        expireTime: eipData.ExpireTime,
        chargeType: eipData.ChargeType,
        name: eipData.Name,
        tag: eipData.Tag,
        remark: eipData.Remark,
        status: eipData.Status,
        weight: eipData.Weight,
        payMode: eipData.PayMode,
        shareBandwidthId: eipData.ShareBandwidthId,
        eipType: eipData.EIPType,
        operatorName: eipData.OperatorName,
        bandwidthGuarantee: eipData.BandwidthGuarantee,
        vpcId: eipData.VPCId,
        subnetId: eipData.SubnetId,
        privateIp: eipData.PrivateIp,
        bindResourceType: eipData.BindResourceType,
        bindResourceId: eipData.BindResourceId,
        bindResourceName: eipData.BindResourceName,
        region: region,
        zone: eipData.Zone,
      }));
    } catch (error) {
      console.error(`获取地域 ${region} 的弹性IP列表失败:`, error);
      return [];
    }
  }

  /**
   * 获取资源使用情况
   * 遍历所有地域，汇总UHost实例数量
   * @param account 云账户
   * @param _region 地域（已废弃，保留以兼容接口，不再使用）
   */
  async getResourceUsage(
    account: CloudAccount,
    _region?: string
  ): Promise<ResourceUsage[]> {
    try {
      // 获取所有地域列表
      const regions = await this.getRegionList(account);
      if (regions.length === 0) {
        console.warn("未获取到地域列表，返回空资源使用情况");
        return [
          {
            accountId: account.id,
            resourceType: "UHost实例",
            usage: 0,
            unit: "个",
            lastUpdated: Date.now(),
          },
        ];
      }

      // 并发查询所有地域的UHost实例
      const regionQueries = regions.map((r) =>
        this.getUHostInstancesByRegion(account, r.region)
      );

      // 等待所有地域查询完成
      const results = await Promise.all(regionQueries);

      // 汇总所有地域的实例数量
      const totalInstances = results.reduce(
        (sum, result) => sum + result.instances.length,
        0
      );

      return [
        {
          accountId: account.id,
          resourceType: "UHost实例",
          usage: totalInstances,
          unit: "个",
          lastUpdated: Date.now(),
        },
      ];
    } catch (error) {
      console.warn("获取资源使用情况失败，返回空数组:", error);
      return [];
    }
  }

  /**
   * 获取项目列表
   * UCloud API返回格式：
   * {
   *   RetCode: number,      // 返回状态码，0为成功
   *   Action: string,       // 操作指令名称
   *   Message?: string,     // 错误消息（RetCode非0时）
   *   TotalCount: number,  // 项目总数
   *   Projects: [          // 项目列表
   *     {
   *       ProjectID: string,
   *       ProjectName: string,
   *       UserCount: number,
   *       CreatedAt: number
   *     }
   *   ]
   * }
   */
  async getProjectList(
    account: CloudAccount,
    offset?: string,
    limit?: string
  ): Promise<UCloudProject[]> {
    try {
      const additionalParams: Record<string, any> = {};
      if (offset) {
        additionalParams.Offset = offset;
      }
      if (limit) {
        additionalParams.Limit = limit;
      }

      const params = this.buildRequestParams(
        account,
        "ListProjects",
        additionalParams
      );
      const response = await this.apiClient.get("/", { params });

      const data = response.data;

      // 检查返回状态码
      if (data.RetCode !== 0) {
        const errorMessage = data.Message || "获取项目列表失败";
        throw new Error(
          `UCloud API错误 (RetCode: ${data.RetCode}): ${errorMessage}`
        );
      }

      // 检查Projects是否存在
      if (!data.Projects || !Array.isArray(data.Projects)) {
        return [];
      }

      // 转换项目数据格式
      return data.Projects.map((project: any) => ({
        projectId: project.ProjectID,
        projectName: project.ProjectName,
        createTime: project.CreatedAt,
        userCount: project.UserCount || 0,
        // 兼容旧字段（新API不再提供）
        memberCount: project.UserCount || 0, // 使用UserCount作为memberCount
      }));
    } catch (error) {
      console.error("获取项目列表失败:", error);
      // 不抛出错误，返回空数组，避免影响其他数据获取
      return [];
    }
  }

  /**
   * 验证账户凭证
   */
  async validateCredentials(account: CloudAccount): Promise<boolean> {
    try {
      await this.getBalance(account);
      return true;
    } catch (error) {
      console.error("验证凭证失败:", error);
      return false;
    }
  }
}
