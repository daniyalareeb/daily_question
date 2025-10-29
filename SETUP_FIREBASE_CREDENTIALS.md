# Setting Up Firebase Credentials on Render

## Problem
GitHub blocked the commit because Firebase credentials contain secrets that should not be in version control.

## Solution
Use environment variables to securely store Firebase credentials.

## Steps

### 1. Get Your Firebase Credentials JSON

Read the contents of your local Firebase credentials file:

```bash
cat backend/app/dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json
```

Copy the entire JSON content (including all braces and quotes).

### 2. On Render Dashboard

1. Go to your Render service
2. Navigate to **Environment** tab
3. Add a new environment variable:
   - **Key**: `FIREBASE_CREDENTIALS_JSON`
   - **Value**: Paste the entire JSON content (it should be a single line with escaped quotes)

### 3. Format Example

The value should look like this (but with your actual credentials):

```
{"type":"service_account","project_id":"your-project-id",...}
```

### 4. Alternative: Base64 Encoding (Recommended)

For better security, you can Base64 encode the JSON:

```bash
cat backend/app/dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json | base64
```

Then in your Render environment variable:
- **Key**: `FIREBASE_CREDENTIALS_JSON_BASE64`
- **Value**: The base64 encoded string

And update `backend/app/api/auth.py` to decode it:

```python
import base64
if FIREBASE_CREDENTIALS_JSON_BASE64:
    decoded = base64.b64decode(FIREBASE_CREDENTIALS_JSON_BASE64).decode('utf-8')
    cred_dict = json.loads(decoded)
    cred = credentials.Certificate(cred_dict)
```

### 5. Redeploy

After adding the environment variable, Render will automatically redeploy.

## Security Notes

- ✅ Firebase credentials are now stored securely as environment variables
- ✅ No secrets are committed to GitHub
- ✅ Credentials file remains in `.gitignore`
- ✅ Works for both local development (file) and production (env var)

## Local Development

For local development, just keep the credentials file in place:
```
backend/app/dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json
```

The code will automatically use the file path when `FIREBASE_CREDENTIALS_JSON` is not set.

## Verify

After deployment, check that Firebase auth works:
- Try logging in on your frontend
- Check Render logs for any Firebase initialization errors

