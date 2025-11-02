# Firebase Professional Email Template Setup

## 🎯 Problem: Emails Going to Spam

Firebase emails often go to spam because:
1. Generic sender email (`noreply@...`)
2. No SPF/DKIM authentication
3. Default template looks generic
4. Missing branding and trust signals

## ✅ Solution: Custom Professional Email Template

### Step 1: Configure Firebase Email Templates

1. Go to [Firebase Console](https://console.firebase.google.com/project/dailyquestion-fcbae)
2. Navigate to **Authentication** → **Templates**
3. Click on **Password reset** email
4. Click **Edit template**

### Step 2: Configure Email Settings

**Email Sender Display Name:**
```
Daily Questions
```

**Subject Line:**
```
Reset Your Password - Daily Questions
```

**Action URL (Optional - for custom redirect):**
```
https://dailyquestiionsforreflection.vercel.app/reset-password
```

### Step 3: Copy the HTML Template

Use the HTML template provided in `FIREBASE_EMAIL_TEMPLATE.html` (see below)

### Step 4: Improve Email Deliverability

#### Option A: Use Custom SMTP (Recommended for Best Deliverability)
1. In Firebase Console → **Authentication** → **Settings** → **SMTP Configuration**
2. Set up a custom SMTP server (e.g., SendGrid, Mailgun, AWS SES)
3. This allows you to use your own domain email

#### Option B: Configure Email Domain Authentication (Advanced)
- Set up SPF, DKIM, DMARC records for your domain
- Use a custom domain email address

## 📧 Professional Email Template

See `FIREBASE_EMAIL_TEMPLATE.html` for the complete HTML template.

## 🔧 Additional Tips to Reduce Spam

1. **Use Custom Action URL** - Makes links look more legitimate
2. **Keep email simple** - Avoid too many links or images
3. **Don't use spam trigger words** - Avoid "free", "click here", "urgent"
4. **Add unsubscribe info** - Even for transactional emails
5. **Test email deliverability** - Use tools like Mail-Tester.com

## ✅ Quick Checklist

- [ ] Customized email template in Firebase Console
- [ ] Professional subject line
- [ ] Custom action URL set
- [ ] Display name configured
- [ ] Tested email delivery
- [ ] Checked spam folder (first few emails might still go to spam)
- [ ] Consider custom SMTP for better deliverability

