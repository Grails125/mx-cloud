import emailjs from "@emailjs/browser";
import type { EmailJSConfig, EmailTemplate } from "@/types";

export interface SendEmailParams {
  to: string[]; // 收件人列表
  subject: string; // 邮件主题
  body: string; // 邮件正文
  emailJSConfig: EmailJSConfig; // EmailJS 配置
}

export interface SendEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 发送邮件
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResponse> {
  try {
    const { to, subject, body, emailJSConfig } = params;

    // 初始化 EmailJS (虽然 send 方法可以直接传 publicKey，但有些版本可能需要 init)
    // emailjs.init(emailJSConfig.publicKey);

    const templateParams = {
      to_email: to.join(","),
      subject: subject,
      message: body,
      // 还可以添加其他变量，视模板定义而定
    };

    const response = await emailjs.send(
      emailJSConfig.serviceId,
      emailJSConfig.templateId,
      templateParams,
      emailJSConfig.publicKey
    );

    if (response.status === 200) {
      return {
        success: true,
        message: "邮件发送成功",
      };
    } else {
      return {
        success: false,
        error: response.text || "发送邮件失败",
      };
    }
  } catch (error: any) {
    console.error("发送邮件失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "发送邮件失败",
    };
  }
}

/**
 * 渲染邮件模板
 */
export function renderEmailTemplate(
  template: EmailTemplate,
  variables: Record<string, string | number>
): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  // 替换变量
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    subject = subject.replace(regex, String(value));
    body = body.replace(regex, String(value));
  });

  return { subject, body };
}

/**
 * 格式化时间
 */
export function formatEmailTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * 格式化预警级别
 */
export function formatEmailLevel(level: "warning" | "critical"): string {
  return level === "critical" ? "严重" : "警告";
}

/**
 * 格式化操作符
 */
export function formatEmailOperator(operator: string): string {
  const map: Record<string, string> = {
    lt: "低于",
    lte: "低于或等于",
    gt: "高于",
    gte: "高于或等于",
  };
  return map[operator] || operator;
}
