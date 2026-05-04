# SMGO Admin Notifications Feature - Complete Guide

## ✅ Feature Overview

**The Advanced Notification feature is fully implemented.** Admins can send broadcast notifications to all users with automatic email reminders.

### What Happens When Admin Sends a Notification:

1. **Immediate Display** → Notification appears in user's inbox on the site
2. **20 Seconds Timer** → System waits to see if user clicks/reads it
3. **Email Reminder** → If not read after 20 seconds, user gets an email reminder
4. **Optional Firebase Push** → Push notification to user's device (if configured)

---

## 🔧 Configuration

### Environment Variables Required

Create a `.env` file in the project root with:

```bash
# SMTP Configuration (required for email reminders)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_AUTH=true
SMTP_STARTTLS=true

# Email Notification Settings
EMAIL_FALLBACK_DELAY_SECONDS=20
EMAIL_SCHEDULER_ENABLED=true
EMAIL_SCHEDULER_INTERVAL_MS=10000

# Firebase Configuration (optional - for push notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-credentials.json
FIREBASE_MESSAGING_ENABLED=true
```

---

## 🔐 Firebase Setup (Optional)

If you want **push notifications in addition to in-app + email**, configure Firebase:

### Steps:

1. **Go to Firebase Console:**
   - Visit https://console.firebase.google.com
   - Create a new project or select existing one

2. **Get Service Account Credentials:**
   - Go to **Project Settings** (gear icon top-left)
   - Click **Service Accounts** tab
   - Click **Generate New Private Key**
   - Download the JSON file

3. **Save the JSON file:**
   ```bash
   # Place it in your project:
   cp ~/Downloads/firebase-adminsdk-*.json ./backend/src/main/resources/firebase-credentials.json
   ```

4. **Update `.env` file:**
   ```bash
   FIREBASE_SERVICE_ACCOUNT_PATH=backend/src/main/resources/firebase-credentials.json
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_MESSAGING_ENABLED=true
   ```

### Firebase Fields in Service Account JSON:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",        // ← Copy this to FIREBASE_PROJECT_ID
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "firebase-adminsdk-...@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "..."
}
```

---

## 📧 SMTP Configuration (Gmail Example)

### For Gmail:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password
   - Use as `SMTP_PASSWORD` in `.env`

### For Other Email Providers:

| Provider | Host | Port | Auth |
|----------|------|------|------|
| Gmail | smtp.gmail.com | 587 | TLS |
| Office365 | smtp.office365.com | 587 | TLS |
| SendGrid | smtp.sendgrid.net | 587 | TLS |
| AWS SES | email-smtp.region.amazonaws.com | 587 | TLS |

---

## 🎯 How to Send a Notification

### Option 1: Via Admin Dashboard UI

1. Go to **Admin Panel** → **Notification Hub**
2. Click **Send Notification** button
3. Fill in:
   - **Title:** Brief notification title
   - **Message:** Full notification message
4. Click **Send**
   - ✅ All users receive it in their inbox
   - ⏱️ 20-second timer starts
   - 📧 If not read, email sent automatically

### Option 2: Via API

**Endpoint:** `POST http://localhost:8090/api/notifications`

**Request:**
```bash
curl -X POST http://localhost:8090/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "System Maintenance",
    "message": "The platform will be under maintenance tomorrow from 2-4 AM UTC.",
    "type": "INFO",
    "userId": null
  }'
```

**Key:** `"userId": null` triggers broadcast to ALL users

**Response:**
```json
{
  "id": "notification-123",
  "title": "System Maintenance",
  "message": "...",
  "type": "INFO",
  "isRead": false,
  "createdAt": "2024-05-04T18:30:00"
}
```

---

## 📊 Notification Flow

```
Admin sends notification
        ↓
[IN-APP] → Appears in user's notification inbox
        ↓
[TIMER] → System checks: "Did user read it?"
        ↓
    Yes → Mark as read, done ✅
    No  → After 20 seconds...
        ↓
[EMAIL] → Send reminder email to user's inbox
        ↓
[FIREBASE] → Optional push notification to device
```

---

## 🧪 Testing

### Test 1: Send Test Email (Admin Dashboard)

1. **Admin Panel** → **Notification Hub**
2. Scroll to **"Send Custom Test Email"** section
3. Enter your email address
4. Click **Send test email**
5. Check your inbox for the test message

### Test 2: Trigger Email Fallback Manually

**Endpoint:** `POST http://localhost:8090/api/notifications/test/trigger-email-fallback`

```bash
curl -X POST http://localhost:8090/api/notifications/test/trigger-email-fallback \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "message": "Email fallback trigger executed. Processed notifications: 5"
}
```

### Test 3: Send Test Notification

1. Go to Admin Dashboard
2. Click **Send Notification**
3. Enter title and message
4. Click **Send**
5. Open the site in user browser (or with different user account)
6. Check notification inbox - should appear immediately
7. Wait 20 seconds without clicking it
8. Check that user's email receives reminder

---

## 🔍 Monitoring & Logs

### Check Notification Status

**Get all notifications:**
```bash
curl http://localhost:8090/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get user's notifications:**
```bash
curl http://localhost:8090/api/notifications/user/{userId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### View Server Logs

```bash
# On Windows (backend terminal)
# Logs show when notifications are sent and emails triggered

# Look for messages like:
# [INFO] Creating broadcast notification for all users
# [INFO] Broadcasting to 10 users
# [INFO] Email sent successfully to user@example.com
```

---

## 🛠️ Configuration Properties Reference

All settings in `backend/src/main/resources/application.properties`:

| Property | Default | Description |
|----------|---------|-------------|
| `app.notifications.email-fallback-enabled` | `true` | Enable/disable email reminders |
| `app.notifications.email-fallback-delay-seconds` | `20` | Wait time before sending email (seconds) |
| `app.notifications.email-fallback-check-interval-ms` | `10000` | How often to check for unread notifications (ms) |
| `app.notifications.email-from` | `no-reply@smgo.local` | Sender email address |
| `firebase.messaging.enabled` | `true` | Enable Firebase push notifications |
| `spring.mail.host` | `smtp.gmail.com` | SMTP server |
| `spring.mail.port` | `587` | SMTP port |

---

## ✨ Advanced Features

### Change Email Delay

To change from 20 seconds to a different delay:

**In `.env`:**
```bash
EMAIL_FALLBACK_DELAY_SECONDS=30
```

### Disable Email Reminders

**In `.env`:**
```bash
app.notifications.email-fallback-enabled=false
```

### Customize Email Template

The email is currently plain text. To customize:

1. Edit `NotificationServiceImpl.java`
2. Modify the `sendEmail()` method
3. Change subject and body as needed

### Filter Notifications by Type

The system supports notification types (currently all are "INFO"):
- `INFO` - General information
- `WARNING` - Important warnings
- `ERROR` - Critical errors
- `PROMOTION` - Promotional messages

---

## 🚨 Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials:**
   ```bash
   # Test SMTP connection
   telnet smtp.gmail.com 587
   ```

2. **Check .env file is loaded:**
   - Restart backend
   - Look for "SMGO environment loaded" in logs

3. **Check logs for errors:**
   - Failed to send email messages
   - Connection timeout errors

### Firebase Not Working

1. **Verify service account JSON path:**
   ```bash
   ls -la backend/src/main/resources/firebase-credentials.json
   ```

2. **Check Firebase project ID:**
   - Must match in both JSON file and `.env`

3. **Verify Firebase project has Cloud Messaging enabled:**
   - https://console.firebase.google.com
   - Project Settings → APIs

### Notifications Not Appearing in User Inbox

1. **Check user email is configured:**
   - User must have a valid email address
   - Not ending in `@system.local`

2. **Check MongoDB is running:**
   - Notifications stored in MongoDB
   - Verify connection: `localhost:27017`

---

## 📞 Support

For issues or questions:

1. Check backend logs: `ERROR` messages
2. Verify all environment variables are set
3. Test SMTP connection separately
4. Test Firebase credentials separately

---

## Summary

| Component | Status | Config |
|-----------|--------|--------|
| In-App Notifications | ✅ Working | Automatic |
| Email Reminders | ✅ Working | `EMAIL_FALLBACK_DELAY_SECONDS=20` |
| Firebase Push | ⚠️ Optional | Need credentials + `.env` |
| Admin UI | ✅ Working | Automatic |
| API Endpoint | ✅ Working | `POST /api/notifications` |
