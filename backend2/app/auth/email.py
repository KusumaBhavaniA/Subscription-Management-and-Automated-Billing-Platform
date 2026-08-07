"""
Email utility for the authentication module.
Uses Python's built-in smtplib with STARTTLS — no extra dependencies needed.
Falls back to console logging when SMTP credentials are not configured so
the app still runs locally without an email provider.
"""

import smtplib
import logging
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Internal send helper
# ---------------------------------------------------------------------------

def _send(to_email: str, subject: str, html_body: str, text_body: str) -> None:
    """
    Sends an email.  If SMTP credentials are absent, logs the content to the
    console instead so development works without an email provider.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Development fallback — print to console
        logger.info(
            "\n========== EMAIL (console fallback) ==========\n"
            "To      : %s\n"
            "Subject : %s\n"
            "Body    :\n%s\n"
            "==============================================",
            to_email, subject, text_body
        )
        return

    smtp_user = settings.SMTP_USER.strip()
    smtp_password = settings.SMTP_PASSWORD.replace(" ", "").strip()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    from_email = settings.EMAIL_FROM or smtp_user
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{from_email}>"
    msg["To"] = to_email

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=settings.SMTP_TIMEOUT_SECONDS,
        ) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, [to_email], msg.as_string())
        logger.info("Email sent to %s — subject: %s", to_email, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        raise


# ---------------------------------------------------------------------------
# OTP verification email
# ---------------------------------------------------------------------------

def send_otp_email(to_email: str, first_name: str, otp: str) -> None:
    subject = "Your Billing Platform verification code"

    text_body = (
        f"Hi {first_name},\n\n"
        f"Your email verification code is: {otp}\n\n"
        f"This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
        "If you did not request this, you can safely ignore this email.\n\n"
        "— Billing Platform"
    )

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:28px 32px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;
                           letter-spacing:-0.5px;">Billing Platform</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1e293b;">
                Hi {first_name},
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                Use the verification code below to confirm your email address.
                It expires in <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>.
              </p>
              <!-- OTP box -->
              <div style="text-align:center;margin:0 0 28px;">
                <span style="display:inline-block;padding:18px 40px;
                             background:#f1f5f9;border-radius:12px;
                             font-size:36px;font-weight:900;letter-spacing:10px;
                             color:#2563eb;font-family:monospace;">
                  {otp}
                </span>
              </div>
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;text-align:center;
                       border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © 2026 Billing Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    _send(to_email, subject, html_body, text_body)


# ---------------------------------------------------------------------------
# Welcome email (sent after successful OTP verification)
# ---------------------------------------------------------------------------

def send_welcome_email(to_email: str, first_name: str) -> None:
    subject = "Welcome to Billing Platform!"

    text_body = (
        f"Hi {first_name},\n\n"
        "Your account has been verified successfully. Welcome to Billing Platform!\n\n"
        f"You can log in at: {settings.FRONTEND_URL}/login\n\n"
        "— Billing Platform"
    )

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <tr>
            <td style="background:#2563eb;padding:28px 32px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;">Billing Platform</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1e293b;">
                Welcome, {first_name}! 🎉
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                Your email has been verified and your account is now active.
                You can sign in and start managing your subscriptions.
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <a href="{settings.FRONTEND_URL}/login"
                   style="display:inline-block;padding:14px 32px;background:#2563eb;
                          color:#ffffff;border-radius:8px;font-size:14px;
                          font-weight:700;text-decoration:none;">
                  Sign In Now
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;text-align:center;
                       border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © 2026 Billing Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    _send(to_email, subject, html_body, text_body)


# ---------------------------------------------------------------------------
# Password reset email
# ---------------------------------------------------------------------------

def send_password_reset_email(to_email: str, first_name: str, reset_token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    subject = "Reset your Billing Platform password"

    text_body = (
        f"Hi {first_name},\n\n"
        "We received a request to reset your password.\n\n"
        f"Click this link to reset it (expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes):\n"
        f"{reset_url}\n\n"
        "If you didn't request a password reset, ignore this email.\n\n"
        "— Billing Platform"
    )

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <tr>
            <td style="background:#2563eb;padding:28px 32px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;">Billing Platform</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1e293b;">
                Hi {first_name},
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                We received a request to reset your password. Click the button below.
                This link expires in <strong>{settings.RESET_TOKEN_EXPIRE_MINUTES} minutes</strong>.
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <a href="{reset_url}"
                   style="display:inline-block;padding:14px 32px;background:#2563eb;
                          color:#ffffff;border-radius:8px;font-size:14px;
                          font-weight:700;text-decoration:none;">
                  Reset Password
                </a>
              </div>
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0;font-size:11px;color:#2563eb;word-break:break-all;">
                {reset_url}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;text-align:center;
                       border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                If you didn't request this, you can safely ignore this email.
                © 2026 Billing Platform.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    _send(to_email, subject, html_body, text_body)