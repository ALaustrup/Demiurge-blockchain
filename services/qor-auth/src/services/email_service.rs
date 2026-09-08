//! Email Service for QOR Auth
//!
//! Handles sending verification emails, password reset emails, and other transactional emails.

use lettre::{
    message::{header::ContentType, Mailbox},
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};
use tracing::{error, info, warn};

use anyhow::anyhow;
use crate::error::{AppError, AppResult};

/// Email service configuration
#[derive(Clone, Debug)]
pub struct EmailConfig {
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_username: String,
    pub smtp_password: String,
    pub from_email: String,
    pub from_name: String,
    pub base_url: String,
}

impl Default for EmailConfig {
    fn default() -> Self {
        Self {
            smtp_host: std::env::var("SMTP_HOST").unwrap_or_else(|_| "smtp.gmail.com".to_string()),
            smtp_port: std::env::var("SMTP_PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(587),
            smtp_username: std::env::var("SMTP_USERNAME").unwrap_or_default(),
            smtp_password: std::env::var("SMTP_PASSWORD").unwrap_or_default(),
            from_email: std::env::var("SMTP_FROM_EMAIL")
                .unwrap_or_else(|_| "noreply@demiurge.cloud".to_string()),
            from_name: std::env::var("SMTP_FROM_NAME")
                .unwrap_or_else(|_| "Demiurge Blockchain".to_string()),
            base_url: std::env::var("BASE_URL")
                .unwrap_or_else(|_| "https://demiurge.cloud".to_string()),
        }
    }
}

/// Email service for sending transactional emails
pub struct EmailService {
    config: EmailConfig,
    mailer: Option<AsyncSmtpTransport<Tokio1Executor>>,
}

impl EmailService {
    /// Create a new email service
    pub fn new(config: EmailConfig) -> Self {
        let mailer = if config.smtp_username.is_empty() || config.smtp_password.is_empty() {
            warn!("SMTP credentials not configured - emails will be logged but not sent");
            None
        } else {
            match AsyncSmtpTransport::<Tokio1Executor>::relay(&config.smtp_host) {
                Ok(transport) => {
                    let creds = Credentials::new(
                        config.smtp_username.clone(),
                        config.smtp_password.clone(),
                    );
                    Some(transport.credentials(creds).port(config.smtp_port).build())
                }
                Err(e) => {
                    error!("Failed to create SMTP transport: {}", e);
                    None
                }
            }
        };

        Self { config, mailer }
    }

    /// Send an email
    async fn send_email(&self, to: &str, subject: &str, html_body: &str) -> AppResult<()> {
        let from_mailbox: Mailbox = format!("{} <{}>", self.config.from_name, self.config.from_email)
            .parse()
            .map_err(|e| AppError::InternalError(anyhow!("Invalid from email: {}", e)))?;

        let to_mailbox: Mailbox = to
            .parse()
            .map_err(|e| AppError::InternalError(anyhow!("Invalid to email: {}", e)))?;

        let email = Message::builder()
            .from(from_mailbox)
            .to(to_mailbox)
            .subject(subject)
            .header(ContentType::TEXT_HTML)
            .body(html_body.to_string())
            .map_err(|e| AppError::InternalError(anyhow!("Failed to build email: {}", e)))?;

        match &self.mailer {
            Some(mailer) => {
                mailer
                    .send(email)
                    .await
                    .map_err(|e| AppError::InternalError(anyhow!("Failed to send email: {}", e)))?;
                info!("Email sent successfully to {}", to);
            }
            None => {
                // Log the email content for development
                info!(
                    "EMAIL (not sent - SMTP not configured):\n  To: {}\n  Subject: {}\n  Body: {}",
                    to, subject, html_body
                );
            }
        }

        Ok(())
    }

    /// Send email verification email
    pub async fn send_verification_email(
        &self,
        to: &str,
        username: &str,
        token: &str,
    ) -> AppResult<()> {
        let verification_url = format!("{}/verify-email?token={}", self.config.base_url, token);

        let subject = "Verify Your QOR ID - Demiurge Blockchain";
        let html_body = format!(
            r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(0, 255, 255, 0.2); }}
        .logo {{ text-align: center; font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #00ffff, #ff00ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 30px; }}
        .content {{ color: #e0e0e0; line-height: 1.8; }}
        .button {{ display: inline-block; background: linear-gradient(135deg, #00ffff, #ff00ff); color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }}
        .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #888; text-align: center; }}
        .token {{ background: rgba(0,255,255,0.1); padding: 10px 20px; border-radius: 4px; font-family: monospace; word-break: break-all; margin: 15px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">DEMIURGE</div>
        <div class="content">
            <h2 style="color: #00ffff;">Welcome to the Metaverse, {username}!</h2>
            <p>Your QOR ID has been created. To complete your registration and access the Demiurge ecosystem, please verify your email address.</p>
            <p style="text-align: center;">
                <a href="{verification_url}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <div class="token">{verification_url}</div>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>From the Monad, all emanates. To the Pleroma, all returns.</p>
            <p>&copy; 2026 Demiurge Blockchain. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"#,
            username = username,
            verification_url = verification_url
        );

        self.send_email(to, subject, &html_body).await
    }

    /// Send password reset email
    pub async fn send_password_reset_email(
        &self,
        to: &str,
        username: &str,
        token: &str,
    ) -> AppResult<()> {
        let reset_url = format!("{}/reset-password?token={}", self.config.base_url, token);

        let subject = "Reset Your Password - Demiurge Blockchain";
        let html_body = format!(
            r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255, 0, 255, 0.2); }}
        .logo {{ text-align: center; font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #00ffff, #ff00ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 30px; }}
        .content {{ color: #e0e0e0; line-height: 1.8; }}
        .button {{ display: inline-block; background: linear-gradient(135deg, #ff00ff, #00ffff); color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }}
        .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #888; text-align: center; }}
        .token {{ background: rgba(255,0,255,0.1); padding: 10px 20px; border-radius: 4px; font-family: monospace; word-break: break-all; margin: 15px 0; }}
        .warning {{ background: rgba(255,100,100,0.1); border-left: 4px solid #ff6b6b; padding: 15px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">DEMIURGE</div>
        <div class="content">
            <h2 style="color: #ff00ff;">Password Reset Request</h2>
            <p>Hello {username},</p>
            <p>We received a request to reset your QOR ID password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
                <a href="{reset_url}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <div class="token">{reset_url}</div>
            <div class="warning">
                <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you're concerned about your account security.
            </div>
        </div>
        <div class="footer">
            <p>From the Monad, all emanates. To the Pleroma, all returns.</p>
            <p>&copy; 2026 Demiurge Blockchain. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"#,
            username = username,
            reset_url = reset_url
        );

        self.send_email(to, subject, &html_body).await
    }

    /// Check if email service is configured
    pub fn is_configured(&self) -> bool {
        self.mailer.is_some()
    }
}
