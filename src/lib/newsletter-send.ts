export type NewsletterProvider = "resend";

export type NewsletterSendInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  from: string;
  replyTo?: string;
};

export type NewsletterSendResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string };

function normalizeProvider(input: string | undefined): NewsletterProvider {
  const normalized = (input ?? "resend").trim().toLowerCase();
  return normalized === "resend" ? "resend" : "resend";
}

function clipMessage(input: string, max = 400) {
  const text = input.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function getResendConfig() {
  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  const from = (process.env.NEWSLETTER_FROM_EMAIL ?? "").trim();
  const replyTo = (process.env.NEWSLETTER_REPLY_TO_EMAIL ?? "").trim() || undefined;
  return { apiKey, from, replyTo };
}

export function getNewsletterSendingConfig() {
  const provider = normalizeProvider(process.env.NEWSLETTER_PROVIDER);
  const resend = getResendConfig();
  return {
    provider,
    from: resend.from,
    replyTo: resend.replyTo,
    ready: provider === "resend" && Boolean(resend.apiKey && resend.from),
    missing: [
      ...(resend.apiKey ? [] : ["RESEND_API_KEY"]),
      ...(resend.from ? [] : ["NEWSLETTER_FROM_EMAIL"]),
    ],
  };
}

export function toSimpleHtmlBody(bodyText: string) {
  const escaped = bodyText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p>${chunk.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  return [
    "<!doctype html>",
    '<html lang="zh-CN">',
    "<body style=\"margin:0;padding:24px;font-family:'Noto Serif SC','Source Han Serif SC',serif;color:#1f2937;line-height:1.75;\">",
    `<article style="max-width:700px;margin:0 auto;">${paragraphs || "<p>（空内容）</p>"}</article>`,
    "</body>",
    "</html>",
  ].join("");
}

async function sendViaResend(input: NewsletterSendInput): Promise<NewsletterSendResult> {
  const { apiKey } = getResendConfig();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY 未配置" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
        reply_to: input.replyTo || undefined,
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; error?: string }
      | null;

    if (!response.ok) {
      const message =
        payload?.message || payload?.error || `Resend 请求失败：HTTP ${response.status}`;
      return { ok: false, error: clipMessage(message) };
    }

    return { ok: true, messageId: payload?.id };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? clipMessage(error.message) : "发送请求失败（未知错误）",
    };
  }
}

export async function sendNewsletterEmail(
  input: NewsletterSendInput,
): Promise<NewsletterSendResult> {
  const provider = normalizeProvider(process.env.NEWSLETTER_PROVIDER);
  if (provider === "resend") {
    return sendViaResend(input);
  }
  return { ok: false, error: `不支持的 Newsletter Provider：${provider}` };
}
