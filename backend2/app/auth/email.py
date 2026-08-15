"""
Email utility for the authentication module.
Uses Python's built-in smtplib with STARTTLS using environment variables.
Console log fallbacks are removed to enforce real SMTP delivery.
"""

import smtplib
import logging
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid

from app.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Connection Validation & Internal Send Helper
# ---------------------------------------------------------------------------

def validate_smtp_connection() -> bool:
    """
    Validates SMTP connection and authentication credentials.
    Returns True if connection & login succeed, False otherwise.
    """
    smtp_user = (settings.SMTP_USER or "").strip()
    smtp_password = (settings.SMTP_PASSWORD or "").replace(" ", "").strip()

    if not smtp_user or not smtp_password:
        logger.warning("SMTP configuration missing SMTP_USER or SMTP_PASSWORD.")
        return False

    try:
        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=settings.SMTP_TIMEOUT_SECONDS,
        ) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            server.login(smtp_user, smtp_password)
        logger.info("SMTP Connection & Authentication validated successfully for %s", smtp_user)
        return True
    except Exception as exc:
        logger.error("SMTP Connection validation failed: %s", exc)
        return False


def _send(to_email: str, subject: str, html_body: str, text_body: str) -> None:
    """
    Sends an email via SMTP configured by environment variables.
    Includes RFC 5322 compliant headers (Message-ID, Date, formataddr From, Reply-To)
    to ensure external inbox providers (Gmail, Outlook, Yahoo) accept and deliver.
    """
    smtp_user = (settings.SMTP_USER or "").strip()
    smtp_password = (settings.SMTP_PASSWORD or "").replace(" ", "").strip()

    if not smtp_user or not smtp_password:
        logger.error(
            "SMTP configuration incomplete. Unable to send email to %s (subject: %s). "
            "Please set SMTP_USER and SMTP_PASSWORD in environment variables.",
            to_email, subject
        )
        raise RuntimeError("SMTP credentials are not configured. Cannot send email.")

    clean_to = to_email.strip()
    from_email = (settings.EMAIL_FROM or smtp_user).strip()
    from_name = (settings.EMAIL_FROM_NAME or "Billing Platform").strip()

    domain = from_email.split("@")[-1] if "@" in from_email else "gmail.com"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((from_name, from_email))
    msg["To"] = clean_to
    msg["Reply-To"] = from_email
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain=domain)
    msg["Auto-Submitted"] = "auto-generated"
    msg["X-Mailer"] = "BillingPlatform-FastAPI/1.0"

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    logger.info("=== SMTP SEND INITIATED ===")
    logger.info("SMTP host: %s", settings.SMTP_HOST)
    logger.info("SMTP port: %s", settings.SMTP_PORT)
    logger.info("SMTP username: %s", smtp_user)
    logger.info("Sender email: %s", from_email)
    logger.info("Receiver email: %s", clean_to)
    logger.info("Email subject: %s", subject)

    try:
        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=settings.SMTP_TIMEOUT_SECONDS,
        ) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            logger.info("SMTP Connection & STARTTLS established successfully.")
            
            server.login(smtp_user, smtp_password)
            logger.info("SMTP Authentication successful.")
            
            refused = server.sendmail(from_email, [clean_to], msg.as_string())
            if refused:
                logger.error("SMTP Refused Recipient: %s", refused)
                raise smtplib.SMTPRecipientsRefused(refused)
            else:
                logger.info("SMTP ACCEPTED: Email accepted by relay.")
    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error("SMTP AUTHENTICATION FAILURE for user %s: %s", smtp_user, auth_err)
        raise auth_err
    except smtplib.SMTPRecipientsRefused as recip_err:
        logger.error("SMTP RECIPIENT DELIVERY FAILURE for %s: %s", clean_to, recip_err)
        raise recip_err
    except smtplib.SMTPException as smtp_err:
        logger.error("SMTP DELIVERY FAILURE for recipient %s: %s", clean_to, smtp_err)
        raise smtp_err
    except Exception as exc:
        logger.error("UNEXPECTED SMTP ERROR during delivery to %s: %s", clean_to, exc)
        raise exc


# ---------------------------------------------------------------------------
# OTP verification email
# ---------------------------------------------------------------------------

def send_otp_email(to_email: str, first_name: str, otp: str) -> None:
    subject = "Your Billing Platform verification code"

    text_body = (
        f"Hi {first_name},\n\n"
        f"Your email verification code is: {otp}\n\n"
        f"This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
        "Security Notice: Never share this verification code with anyone.\n\n"
        "If you did not request this code, please ignore this email or contact support.\n\n"
        "— Billing Platform Team"
    )

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:16px;overflow:hidden;
                      box-shadow:0 10px 30px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          <!-- Header Branding -->
          <tr>
            <td style="background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);padding:32px;text-align:center;">
              <div style="margin-bottom:10px;">
                <span style="display:inline-block;padding:6px 18px;background:rgba(255,255,255,0.2);border-radius:8px;color:#ffffff;font-weight:900;font-size:16px;letter-spacing:1px;">[LOGO] BILLING PLATFORM</span>
              </div>
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;display:block;">
                Billing Platform
              </span>
              <span style="font-size:12px;color:#93c5fd;font-weight:500;margin-top:4px;display:block;">
                Identity Verification & Account Security
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">
                Hi {first_name},
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                Thank you for creating an account with Billing Platform. Please use the verification code below to complete your registration.
              </p>
              
              <!-- Verification Code Box -->
              <div style="text-align:center;margin:0 0 28px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:14px;padding:24px 16px;">
                <span style="display:block;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                  Your Verification Code
                </span>
                <span style="display:inline-block;font-size:38px;font-weight:900;letter-spacing:12px;color:#2563eb;font-family:Consolas,Monaco,monospace;">
                  {otp}
                </span>
                <span style="display:block;font-size:12px;color:#64748b;margin-top:10px;font-weight:600;">
                  ⏱️ Expires in {settings.OTP_EXPIRE_MINUTES} minutes
                </span>
              </div>

              <!-- Security Warning -->
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:12px;color:#991b1b;line-height:1.5;font-weight:500;">
                  🔒 <strong>Security Warning:</strong> Never share this verification code with anyone. Billing Platform staff will never ask for your code.
                </p>
              </div>

              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;text-align:center;">
                If you did not request this email, no action is required and you can safely ignore it.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:500;">
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
# Profile Incomplete Email Notification
# ---------------------------------------------------------------------------

def send_profile_incomplete_email(to_email: str, user_name: str, missing_fields: list[str]) -> None:
    logger.info("=== [BACKGROUND TASK STARTED] Sending Profile Incomplete email to %s ===", to_email)
    subject = "Complete Your Billing Platform Profile"
    profile_url = f"{settings.FRONTEND_URL}/customer/profile"

    fields_text = "\n".join([f"- {field}" for field in missing_fields]) if missing_fields else "- Contact / Billing Information"
    text_body = (
        f"Hi {user_name},\n\n"
        "Your Billing Platform profile is incomplete. Please complete your profile details.\n\n"
        f"Missing information:\n{fields_text}\n\n"
        f"Update your profile here:\n{profile_url}\n\n"
        "— Billing Platform Team"
    )

    fields_html = "".join(
        [
            f'<li style="margin-bottom:8px;color:#0f172a;font-weight:600;">{field}</li>'
            for field in missing_fields
        ]
    ) if missing_fields else '<li style="margin-bottom:8px;color:#0f172a;font-weight:600;">Contact & Billing Details</li>'

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:16px;overflow:hidden;
                      box-shadow:0 10px 30px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);padding:32px;text-align:center;">
              <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;display:block;">
                Billing Platform
              </span>
              <span style="font-size:12px;color:#93c5fd;font-weight:500;margin-top:4px;display:block;">
                Account Profile & Security Notice
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;">
                Hi {user_name},
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                Your profile information is incomplete. Please update your profile to ensure seamless service and accurate invoice billing.
              </p>
              
              <!-- Missing Fields Box -->
              <div style="background:#fffbe6;border:1px solid #ffe58f;border-radius:12px;padding:20px;margin-bottom:28px;">
                <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#873800;text-transform:uppercase;letter-spacing:0.5px;">
                  ⚠️ Missing Profile Information:
                </p>
                <ul style="margin:0;padding-left:20px;font-size:14px;color:#431407;">
                  {fields_html}
                </ul>
              </div>

              <!-- Button CTA -->
              <div style="text-align:center;margin:32px 0;">
                <a href="{profile_url}"
                   style="display:inline-block;padding:14px 36px;background:#2563eb;
                          color:#ffffff;border-radius:10px;font-size:14px;
                          font-weight:700;text-decoration:none;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
                  Complete Profile
                </a>
              </div>

              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;text-align:center;">
                Or copy and paste this URL into your browser: <br/>
                <a href="{profile_url}" style="color:#2563eb;word-break:break-all;">{profile_url}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:500;">
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
# Welcome email
# ---------------------------------------------------------------------------

def send_welcome_email(to_email: str, first_name: str) -> None:
    subject = "Welcome to Billing Platform!"

    text_body = (
        f"Hi {first_name},\n\n"
        "Your account has been verified successfully. Welcome to Billing Platform!\n\n"
        f"You can log in at: {settings.FRONTEND_URL}/login\n\n"
        "— Billing Platform Team"
    )

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:16px;overflow:hidden;
                      box-shadow:0 10px 30px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);padding:32px;text-align:center;">
              <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Billing Platform</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;">
                Welcome, {first_name}! 🎉
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                Your email address has been verified and your account is active. You can now log in to access your billing dashboard.
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <a href="{settings.FRONTEND_URL}/login"
                   style="display:inline-block;padding:14px 36px;background:#2563eb;
                          color:#ffffff;border-radius:10px;font-size:14px;
                          font-weight:700;text-decoration:none;">
                  Sign In Now
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
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
# Test email helper (For Debugging Plain Text Delivery)
# ---------------------------------------------------------------------------

def send_test_email(to_email: str) -> None:
    logger.info("TEST EMAIL FUNCTION CALLED")
    logger.info("Sending test email to: %s", to_email)
    subject = "Billing Platform Test Email"
    text_body = (
        "Hello,\n\n"
        "This is a test email from Billing Platform SMTP."
    )
    html_body = (
        "<!DOCTYPE html><html><body>"
        "<p>Hello,</p>"
        "<p>This is a test email from Billing Platform SMTP.</p>"
        "</body></html>"
    )
    _send(to_email, subject, html_body, text_body)


# ---------------------------------------------------------------------------
# Password reset email
# ---------------------------------------------------------------------------

def send_password_reset_email(to_email: str, first_name: str, reset_token: str) -> None:
    logger.info("PASSWORD RESET EMAIL FUNCTION CALLED")
    logger.info("Sending password reset email to: %s", to_email)

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    subject = "Reset your Billing Platform password"

    text_body = (
        f"Hi {first_name},\n\n"
        "We received a request to reset your password.\n\n"
        f"Click this link to reset it (expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes):\n"
        f"{reset_url}\n\n"
        "If you didn't request a password reset, ignore this email.\n\n"
        "— Billing Platform Team"
    )

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:16px;overflow:hidden;
                      box-shadow:0 10px 30px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);padding:32px;text-align:center;">
              <span style="font-size:24px;font-weight:800;color:#ffffff;">Billing Platform</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;">
                Hi {first_name},
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                We received a request to reset your password. Click the button below. This link expires in <strong>{settings.RESET_TOKEN_EXPIRE_MINUTES} minutes</strong>.
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <a href="{reset_url}"
                   style="display:inline-block;padding:14px 36px;background:#2563eb;
                          color:#ffffff;border-radius:10px;font-size:14px;
                          font-weight:700;text-decoration:none;">
                  Reset Password
                </a>
              </div>
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-align:center;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0;font-size:11px;color:#2563eb;word-break:break-all;text-align:center;">
                {reset_url}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
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


# ---------------------------------------------------------------------------
# Account suspension email
# ---------------------------------------------------------------------------

def send_suspension_email(to_email: str, first_name: str, reason: str = "") -> None:
    logger.info("=== [BACKGROUND TASK] Sending Account Suspension email to %s ===", to_email)
    subject = "Your Billing Platform account has been suspended"
    support_url = f"{settings.FRONTEND_URL}/customer/support"

    reason_text = f"\nReason: {reason}\n" if reason else ""
    text_body = (
        f"Hi {first_name},\n\n"
        "Your Billing Platform account has been temporarily suspended.\n"
        f"{reason_text}\n"
        "Your account is currently unavailable for normal access.\n\n"
        "If you believe this suspension was made in error or you would like to request account restoration, please contact our Support team:\n"
        f"{support_url}\n\n"
        "— Billing Platform Team"
    )

    reason_html = f'<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;margin-bottom:24px;"><p style="margin:0;font-size:13px;color:#991b1b;"><strong>Reason:</strong> {reason}</p></div>' if reason else ""

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:16px;overflow:hidden;
                      box-shadow:0 10px 30px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%);padding:32px;text-align:center;">
              <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;display:block;">Billing Platform</span>
              <span style="font-size:12px;color:#feccae;font-weight:500;margin-top:4px;display:block;">Account Status Update</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;">
                Hi {first_name},
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
                Your Billing Platform account has been temporarily suspended by an administrator. Your account is currently unavailable for normal access.
              </p>
              {reason_html}
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                If you believe this suspension was made in error or you would like to request account restoration, please contact our Support team.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="{support_url}"
                   style="display:inline-block;padding:14px 36px;background:#dc2626;
                          color:#ffffff;border-radius:10px;font-size:14px;
                          font-weight:700;text-decoration:none;box-shadow:0 4px 12px rgba(220,38,38,0.25);">
                  Contact Support
                </a>
              </div>
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;text-align:center;">
                Or copy and paste this URL into your browser:<br/>
                <a href="{support_url}" style="color:#dc2626;word-break:break-all;">{support_url}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
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