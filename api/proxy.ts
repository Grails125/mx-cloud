/**
 * Vercel Serverless Function - UCloud API 代理
 * 用于解决浏览器 CORS 跨域问题
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 处理 OPTIONS 预检请求
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  // 只允许 GET 请求
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 获取查询参数
  const { url, ...params } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    // 构建完整的请求URL
    const targetUrl = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === "string") {
        targetUrl.searchParams.append(key, value);
      }
    });

    // 转发请求到 UCloud API
    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "MX-Cloud/1.0",
      },
    });

    // 获取响应数据
    const data = await response.json();

    // 设置 CORS 头
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    // 返回响应
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Proxy error:", error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({
      error: "Proxy error",
      message: error.message,
    });
  }
}
