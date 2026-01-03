# Privacy Policy for OneNote Clipper

Last Updated: January 1, 2026

## Overview

OneNote Clipper ("the Extension") is a Visual Studio Code extension that allows users to send code snippets and files to Microsoft OneNote. This Privacy Policy describes how the Extension handles your data.

## Data Collection

### What We Collect

The Extension **does not collect** any personal data or usage information. Specifically:

- ❌ No user analytics
- ❌ No usage tracking
- ❌ No telemetry data
- ❌ No personal information
- ❌ No IP addresses
- ❌ No device information
- ❌ No code content
- ❌ No OneNote data

### What We Don't Collect

The Extension is designed to be privacy-focused:

- We do not track which files you send to OneNote
- We do not track how often you use the Extension
- We do not track your OneNote account information
- We do not track your code content
- We do not access your Microsoft account
- We do not access your OneNote data

## Data Storage

### Local Storage

The Extension stores the following data locally on your device:

- **OAuth2 Access Tokens**: Used to authenticate with Microsoft OneNote
- **OAuth2 Refresh Tokens**: Used to refresh access tokens
- **User Preferences**: Default notebook, section, and other settings

This data is stored in VSCode's secure storage mechanism and is never transmitted to any third-party server.

### Remote Storage

The Extension does not use any remote storage. All data is stored locally on your device.

## Data Transmission

### What is Transmitted

The Extension only transmits data to Microsoft's services:

- **Code Content**: The code snippets or files you choose to send to OneNote
- **Authentication Tokens**: OAuth2 tokens for Microsoft authentication

### How Data is Transmitted

All data is transmitted directly between your device and Microsoft's servers:

- **No intermediary servers**: Your data does not pass through any third-party servers
- **End-to-end encryption**: All communications use HTTPS/TLS encryption
- **Direct connection**: The Extension connects directly to Microsoft Graph API
- **User account isolation**: Each user uses their own Microsoft account

## Authentication

### How Authentication Works

The Extension uses OAuth 2.0 with PKCE (Proof Key for Code Exchange):

1. Extension generates a temporary code_verifier and code_challenge
2. User is redirected to Microsoft's login page
3. User logs in with their Microsoft account
4. User authorizes the Extension to access OneNote
5. Extension receives an authorization code
6. Extension uses the code and code_verifier to get access tokens
7. Access tokens are used to access OneNote API

### Security of Authentication

- **No Client Secret**: The Extension uses PKCE, which doesn't require a client secret
- **Public Client**: The Extension is configured as a public client
- **Token Storage**: Tokens are stored securely in VSCode's storage
- **Token Refresh**: Tokens are automatically refreshed when needed

### What This Means

- You authenticate directly with Microsoft
- The Extension developers never see your credentials
- The Extension developers cannot access your account
- The Extension developers cannot access your data

## Third-Party Services

### Microsoft Services

The Extension uses the following Microsoft services:

- **Microsoft Azure Active Directory**: For OAuth2 authentication
- **Microsoft Graph API**: For accessing OneNote
- **Microsoft OneNote**: For storing your content

These services are governed by Microsoft's privacy policies. Please review:

- [Microsoft Privacy Statement](https://privacy.microsoft.com/)
- [Microsoft Azure Data Protection](https://azure.microsoft.com/support/trust-center/privacy/)
- [Microsoft OneNote Privacy](https://www.microsoft.com/trust-center/privacy/onenote-privacy)

### No Other Third Parties

The Extension does not use any other third-party services.

## Data Security

### Security Measures

We implement the following security measures:

- **PKCE (Proof Key for Code Exchange)**: For secure OAuth2 authentication
- **HTTPS/TLS Encryption**: All network communications are encrypted
- **Token Storage**: Tokens are stored securely using VSCode's storage API
- **No Hardcoded Credentials**: No credentials are hardcoded in the Extension
- **Minimal Permissions**: Only requests necessary API permissions
- **Public Client**: No client secret required

### Your Responsibilities

To protect your data:

- Keep your Microsoft account secure
- Use strong passwords and enable MFA
- Keep your VSCode and operating system updated
- Don't share your access tokens

## User Control

### Your Rights

You have the following rights:

- **Access**: You can view and modify your configuration settings
- **Delete**: You can delete your configuration at any time
- **Revoke**: You can revoke access by removing the Extension's permissions

### How to Exercise Your Rights

To delete your data:

1. Open VSCode settings
2. Search for "OneNote"
3. Delete your configuration settings
4. Clear your tokens by logging out

To revoke access:

1. Go to [Microsoft Account](https://account.microsoft.com/)
2. Navigate to Privacy & security
3. Manage app permissions
4. Remove OneNote Clipper

## Children's Privacy

The Extension is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.

## International Data Transfers

The Extension may transmit data to Microsoft servers located outside your country. Microsoft's data centers comply with applicable data protection laws.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify users of any material changes by:

- Updating the "Last Updated" date
- Posting a notice in the Extension

## Contact Us

If you have questions about this Privacy Policy or our data practices, please contact us:

- **Email**: your-email@example.com
- **GitHub Issues**: https://github.com/your-repo/vscode-onenote-clipper/issues

## Disclaimer

This Extension is provided "as is" without any warranties. We are not responsible for any data loss or security breaches resulting from:

- Misuse of the Extension
- Compromise of your Microsoft account
- Third-party security vulnerabilities
- Network attacks

---

**Last Updated**: January 1, 2026