import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Formix Clinical <onboarding@resend.dev>";

interface SendFormAssignmentEmailInput {
  to: string;
  patientName: string;
  formTitle: string;
  formDescription?: string;
  link: string;
}

export async function sendFormAssignmentEmail({
  to,
  patientName,
  formTitle,
  formDescription,
  link,
}: SendFormAssignmentEmailInput) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email send (dev mode). Link:", link);
    return;
  }

  const html = buildEmailHtml({ patientName, formTitle, formDescription, link });

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Action needed: please complete "${formTitle}"`,
    html,
  });

  if (error) {
    console.error("Resend send failed:", error);
    throw new Error("Failed to send form assignment email.");
  }
}

function buildEmailHtml({
  patientName,
  formTitle,
  formDescription,
  link,
}: Omit<SendFormAssignmentEmailInput, "to">) {
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#F4F1EC;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E0D8;">
            <tr>
              <td style="background:#132A33;padding:28px 32px;">
                <span style="color:#8FBFA0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">
                  Formix Clinical
                </span>
                <h1 style="color:#ffffff;font-size:20px;margin:8px 0 0;font-weight:600;">
                  A form is waiting for you
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="font-size:15px;color:#1A1A1A;margin:0 0 16px;">Hi ${escapeHtml(patientName)},</p>
                <p style="font-size:14px;color:#4A4A4A;line-height:1.6;margin:0 0 20px;">
                  Your care team has sent you a form to complete: <strong>${escapeHtml(formTitle)}</strong>.
                  ${formDescription ? escapeHtml(formDescription) : "Completing it accurately helps your provider give you the best possible care."}
                </p>
                <div style="text-align:center;margin:28px 0;">
                  <a href="${link}" style="display:inline-block;background:#2E7D6B;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:8px;">
                    Fill out the form
                  </a>
                </div>
                <p style="font-size:12px;color:#8A8A8A;line-height:1.5;margin:0;">
                  This link is unique to you and doesn't require a password. If the button doesn't work, copy this link into your browser:
                  <br />
                  <a href="${link}" style="color:#2E7D6B;word-break:break-all;">${link}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#F4F1EC;border-top:1px solid #E5E0D8;">
                <p style="font-size:11px;color:#9A9A9A;margin:0;">
                  This is an automated message from Formix Clinical. Please do not reply directly to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}