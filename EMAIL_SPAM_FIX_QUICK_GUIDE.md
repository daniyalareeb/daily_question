# Quick Fix: Stop Password Reset Emails Going to Spam

## 🎯 The Problem
Firebase default emails often go to spam because they:
- Use generic `noreply@` sender
- Have minimal branding
- Look like automated spam

## ✅ Quick Solution (5 Minutes)

### Step 1: Customize Firebase Email Template
1. Go to: https://console.firebase.google.com/project/dailyquestion-fcbae/authentication/emails
2. Click **Password reset** template
3. Click **Edit template**

### Step 2: Update Email Settings

**Email Sender Display Name:**
```
Daily Questions
```

**Subject Line:**
```
Reset Your Password - Daily Questions
```

**Action URL:**
```
https://dailyquestiionsforreflection.vercel.app/reset-password
```

### Step 3: Paste HTML Template

1. Copy the entire content from `FIREBASE_EMAIL_TEMPLATE.html`
2. Paste it in the **Email template (HTML)** field
3. Copy content from `FIREBASE_EMAIL_TEMPLATE_PLAINTEXT.txt`
4. Paste it in the **Email template (Plain text)** field
5. Click **Save**

### Step 4: Test It
1. Use forgot password on your app
2. Check inbox (and spam folder initially)
3. Email should look professional and branded

## 🚀 Advanced Solution (Better Deliverability)

For even better results, set up **Custom SMTP**:

1. Firebase Console → **Authentication** → **Settings** → **SMTP Configuration**
2. Use a service like:
   - **SendGrid** (Free tier: 100 emails/day)
   - **Mailgun** (Free tier: 5,000 emails/month)
   - **AWS SES** (Very cheap)
3. Configure with your domain email
4. This gives you:
   - ✅ Better deliverability (less spam)
   - ✅ Custom sender email (yourname@yourdomain.com)
   - ✅ Better tracking

## 📋 Quick Checklist

- [ ] Updated email display name in Firebase
- [ ] Updated subject line
- [ ] Pasted HTML template
- [ ] Pasted plain text template
- [ ] Set action URL
- [ ] Tested email delivery
- [ ] (Optional) Set up custom SMTP for best results

## 🎨 Template Features

The professional template includes:
- ✅ Modern, responsive design
- ✅ Clear branding ("Daily Questions")
- ✅ Security notice
- ✅ Expiry information
- ✅ Alternative link text
- ✅ Professional footer
- ✅ Mobile-friendly

## 💡 Why This Helps

1. **Professional appearance** - Builds trust
2. **Clear branding** - Users recognize it's from your app
3. **Security messaging** - Reduces phishing concerns
4. **Action URL** - Makes links look legitimate
5. **Proper formatting** - Better email client rendering

## 🔍 Still Going to Spam?

If emails still go to spam after customization:
1. **First few emails might** - Email providers learn over time
2. **Use custom SMTP** - Best solution (see Advanced Solution above)
3. **Check email reputation** - Use mail-tester.com
4. **Verify domain** - Set up SPF/DKIM if using custom domain
5. **Ask users to mark as "Not Spam"** - Helps train filters

## 📧 Template Files

- `FIREBASE_EMAIL_TEMPLATE.html` - HTML version (professional design)
- `FIREBASE_EMAIL_TEMPLATE_PLAINTEXT.txt` - Plain text fallback
- `FIREBASE_EMAIL_TEMPLATE_SETUP.md` - Detailed setup instructions

