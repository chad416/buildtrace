# BuildTrace — Production Deployment Guide

Everything in this guide is a manual step requiring your credentials.
The agent has prepared all code-side changes. Follow these steps in order.

---

## Step 1 — Supabase

1. Log in to supabase.com
2. Go to your existing project (or create one in an EU region: Frankfurt/Ireland)
3. From **Project Settings → API**, copy:
   - Project URL → used as `SUPABASE_URL` (API) and `NEXT_PUBLIC_SUPABASE_URL` (web)
   - anon/public key → used as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (web)
   - service_role secret key → used as `SUPABASE_SERVICE_ROLE_KEY` (API only — never in browser)
4. From **Project Settings → Database → Connection string → Transaction mode**
   (this is port 6543, not 5432) → copy as `DATABASE_URL` for Railway
5. In **Storage**, create a private bucket named: `buildtrace-documents`
   Set to private (not public)
6. Apply migrations — run this locally, pointed at your production Supabase:
   ```
   DATABASE_URL=<your-prod-url-port-6543> pnpm --filter @buildtrace/db exec prisma migrate deploy
   ```

---

## Step 2 — Railway (API)

1. Go to railway.app → **New Project → Deploy from GitHub repo**
2. Select: `chad416/buildtrace`
3. Railway detects `railway.json` automatically — accept it
4. In the **Variables** tab, add:
   - `NODE_ENV` = `production`
   - `API_PORT` = `4000`
   - `DATABASE_URL` = (from Supabase Step 1, port 6543 with pgbouncer=true)
   - `SUPABASE_URL` = (Project URL from Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` = (service_role key — SECRET)
   - `DOCUMENT_STORAGE_BUCKET` = `buildtrace-documents`
   - `SIGNED_URL_TTL_SECONDS` = `900`
   - `CORS_ORIGIN` = (leave blank for now — fill in after Vercel deploys)
5. Click **Deploy**
6. Watch the build log — confirm the health check passes at `/health`
7. Copy the Railway public URL (e.g. `https://buildtrace-api.up.railway.app`)

---

## Step 3 — Vercel (Frontend)

1. Go to vercel.com → **Add New Project → Import Git Repository**
2. Select: `chad416/buildtrace`
3. Vercel detects `vercel.json` automatically — accept it
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_APP_URL` = (your Vercel URL — fill after first deploy)
   - `NEXT_PUBLIC_API_URL` = (your Railway URL from Step 2)
   - `NEXT_PUBLIC_SUPABASE_URL` = (Project URL from Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (anon key from Supabase — safe for browser)
5. Click **Deploy**
6. Copy the Vercel URL (e.g. `https://buildtrace.vercel.app`)

### 3a. Configure the Supabase confirmation return URL

In Supabase, open **Authentication → URL Configuration** and set:

- **Site URL**: the stable Vercel production URL (for example, `https://buildtrace.vercel.app`)
- **Redirect URLs**: the same production URL with a wildcard path (for example,
  `https://buildtrace.vercel.app/**`)

Use the stable production alias here, not a generated deployment URL. BuildTrace sends this URL with
every signup request, Supabase validates it against the redirect allow-list, and the confirmation page
uses the returned one-time session to open the new workspace automatically.

---

## Step 4 — Wire CORS and finalize URLs

1. **Railway**: update `CORS_ORIGIN` to your Vercel URL
2. **Vercel**: update `NEXT_PUBLIC_APP_URL` to your Vercel URL
3. Trigger a redeploy on both services so the new env vars take effect

---

## Step 5 — Smoke test (DO NOT send the link until all 13 steps pass)

Open the Vercel URL in a **private/incognito** browser window.

- [ ] 1. Sign up with a real email address
- [ ] 2. Confirm the email (check inbox, click the link)
- [ ] 3. Log in successfully
- [ ] 4. Create an organisation
- [ ] 5. Create a customer record
- [ ] 6. Create a machine model
- [ ] 7. Create a machine record (link to customer + model)
- [ ] 8. Upload a document (any PDF)
- [ ] 9. Document appears in the machine record
- [ ] 10. Generate QR code for the machine
- [ ] 11. Open the QR portal URL in a different browser tab or your phone
- [ ] 12. QR portal loads and shows machine documents
- [ ] 13. Raise a service ticket on the machine

All 13 must pass. Fix any failure before sending the URL.
