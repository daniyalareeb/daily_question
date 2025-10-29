# Fixing Build Issues on Render

## Problem
The build fails with: `error: failed to create directory - Read-only file system`

This happens because `pydantic-core` is trying to compile Rust code from source.

## Solution
Updated `requirements.txt` to use versions that have pre-built wheels available:

- `pydantic==2.8.2` with `pydantic-core==2.23.4` (pre-built wheels)
- `uvicorn[standard]` includes better performance

## Changes Made
1. Updated `backend/requirements.txt` with compatible versions
2. Updated `render.yaml` build command to upgrade pip first
3. Updated CORS to allow Render domains

## Next Steps

1. **Commit and push the fixes:**
   ```bash
   git add backend/requirements.txt render.yaml backend/render.yaml
   git commit -m "Fix Render build issues with pre-built wheels"
   git push origin main
   ```

2. **Redeploy on Render:**
   - Render will automatically detect the changes and rebuild
   - Check logs in Render dashboard
   - Should complete successfully now

3. **Alternative: If still failing, try these versions:**

If the above still fails, use these even more conservative versions:

```txt
fastapi==0.104.1
uvicorn==0.24.0
motor==3.3.2
pymongo==4.6.0
firebase-admin==6.4.0
python-dotenv==1.0.0
pydantic==2.4.2
python-multipart==0.0.6
nltk==3.8.1
resend==0.8.0
pywebpush==1.14.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
```

These versions (especially pydantic 2.4.2) have definitely pre-built wheels.

## Additional Resources
- Render Python docs: https://render.com/docs/deploy-python-3#requirements-file
- PyPI wheels: https://pypi.org/project/pydantic/#files

