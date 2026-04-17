import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL || "뚝딱 <noreply@ttukddak.kr>";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!apiKey) return null;
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] RESEND_API_KEY not set in production");
    } else {
      console.log("[email:dev]", opts.subject, "→", opts.to);
    }
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (error) {
      console.error("[email] send failed:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send threw:", err);
    return { ok: false, error: String(err) };
  }
}

export { from as DEFAULT_FROM };
