# Deployment Guide

Deploy the Investment Research Dashboard to Vercel with a managed Turso database backend.

## Prerequisites

- Vercel account (free tier works; create at vercel.com)
- Turso account (free tier works; create at turso.tech)
- API keys for all providers (FRED, NewsAPI, Finnhub, Alpha Vantage, Anthropic, CoinGecko)
- GitHub repo connected to Vercel (optional but recommended for CI/CD)
- Local Node.js 20+ and npm

## Step 1: Create Turso Database

1. Sign up at [turso.tech](https://turso.tech)
2. Create a new organization or use the default
3. Create a new database:
   ```bash
   turso db create investment-research
   ```
4. Copy the database URL (shows on dashboard or via `turso db list`)
5. Generate an auth token:
   ```bash
   turso auth tokens create
   ```
   Copy the token (you'll need both URL and token)

## Step 2: Prepare Local Testing

Test the production build locally with Turso before deploying:

```bash
# Set environment variables
export DATABASE_URL="libsql://..."  # Your Turso DB URL
export TURSO_AUTH_TOKEN="..."        # Your Turso token
export CRON_SECRET="$(openssl rand -hex 32)"  # Generate random secret
export FRED_API_KEY="..."
export NEWS_API_KEY="..."
export FINNHUB_API_KEY="..."
export ALPHAVANTAGE_API_KEY="..."
export ANTHROPIC_API_KEY="..."

# Build and start
npm run build
npm run start

# Test at http://localhost:3000
# Verify all pages load and data appears
```

The Turso database will be initialized automatically on first request via Drizzle migrations.

## Step 3: Create Vercel Project

### Option A: GitHub Integration (Recommended)

1. Push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Select your GitHub repo
4. Configure project:
   - **Framework**: Next.js (auto-detected)
   - **Build command**: `npm run build` (auto-detected)
   - **Output directory**: `.next` (auto-detected)
   - Leave other settings default
5. Click **Create**
6. Proceed to Step 4 (Environment Variables)

### Option B: Direct CLI

```bash
npm i -g vercel  # or pnpm add -g vercel
vercel login      # Sign in with Vercel account
cd /path/to/project
vercel           # Deploy; answer prompts
```

## Step 4: Configure Environment Variables on Vercel

In Vercel project dashboard → Settings → Environment Variables, add all variables:

| Variable | Value | Notes |
|----------|-------|-------|
| DATABASE_URL | `libsql://...` | Your Turso DB URL (from Step 1) |
| TURSO_AUTH_TOKEN | `...` | Your Turso auth token (from Step 1) |
| CRON_SECRET | Generate 32-char random hex | `openssl rand -hex 32` locally; use same on all deployments |
| FRED_API_KEY | From [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/) | Env var name used by FredMacroProvider |
| NEWS_API_KEY | From [newsapi.org](https://newsapi.org) | Env var name used by NewsAPI provider |
| FINNHUB_API_KEY | From [finnhub.io](https://finnhub.io) | Env var name used by FinnhubProvider |
| ALPHAVANTAGE_API_KEY | From [alphavantage.co](https://www.alphavantage.co/api/) | Env var name used by AlphaVantage provider |
| ANTHROPIC_API_KEY | From [console.anthropic.com](https://console.anthropic.com/api_keys) | For narrative generation in Oracle/Portfolio |

**Important:** Mark DATABASE_URL and TURSO_AUTH_TOKEN as "Sensitive" if available (Vercel hides them in logs).

## Step 5: Deploy

1. **Trigger deployment** — any push to your main branch triggers auto-deploy (if GitHub integration is enabled)
2. **Manual deployment** — run `vercel --prod` from CLI
3. **Check build** — dashboard shows build progress; look for:
   - ✓ npm run build
   - ✓ Build output: 0 errors, 0 warnings
   - ✓ Deployment successful

## Step 6: Verify Production

1. Open your Vercel deployment URL (e.g., `https://investment-research-abc123.vercel.app`)
2. Navigate all pages:
   - Dashboard, Watchlist, Screener, Markets, News, Oracle, Portfolio, Settings
   - Data should load (may take ~10 seconds on cold start)
   - Admin page should display cache stats
3. **Seed test data:** Visit `/admin/analytics` → click "Seed Mag 7"
4. **Test refresh:** Click "Trigger Manual Refresh" and watch logs
5. **Check logs:** Dashboard → Deployments → Logs; look for:
   ```
   GET / 200  (homepage loads)
   POST /api/refresh 200  (refresh endpoint works)
   ```

## Step 7: Cron Job Scheduling

Vercel automatically runs the cron job defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/refresh",
      "schedule": "0 3 * * *"  // 3:00 AM UTC daily
    }
  ]
}
```

**Verify the job is running:**
1. Dashboard → Settings → Cron Jobs
2. Should show: `POST /api/refresh` scheduled daily at 03:00 UTC
3. Check execution logs under Deployments

To modify the schedule (e.g., 6:00 AM instead of 3 AM):
```json
{
  "schedule": "0 6 * * *"  // 6:00 AM UTC
}
```
Then push to GitHub or run `vercel --prod` to redeploy.

## Troubleshooting

### Build fails with "no such table"

The Turso database hasn't been initialized yet. This happens on first deploy. Solution:
1. Wait 30 seconds and redeploy (Vercel will retry)
2. Or: manually migrate Turso database by running the migration script locally:
   ```bash
   DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:migrate
   ```

### "Unauthorized" on /api/refresh

CRON_SECRET is missing or mismatched. Verify in Vercel dashboard:
- Environment Variables includes CRON_SECRET
- Value matches what you set locally
- No extra spaces or quotes

### Data not appearing on pages

Check:
1. API keys are correct (look for 403/401 in Admin → API Calls logs)
2. Provider isn't rate-limited (check logs for 429 responses)
3. Cache is not stale (Admin → Provider Cache should show fresh entries)
4. Watchlist has items (use "Seed Mag 7" button on Admin page)

### Turso connection timeout

If you get "Failed to connect to Turso database":
1. Verify DATABASE_URL and TURSO_AUTH_TOKEN are set correctly
2. Check Turso dashboard that your database still exists
3. Try `vercel env pull` to re-sync environment variables locally
4. Restart the deployment

## Production Checklist

- [ ] Turso database created and token obtained
- [ ] All environment variables set in Vercel
- [ ] CRON_SECRET generated and matches locally + Vercel
- [ ] Build passes locally with production env vars
- [ ] All pages load on production deployment
- [ ] Data appears after seeding and refresh
- [ ] Cron job shows as scheduled (Settings → Cron Jobs)
- [ ] Logs are healthy (no 50x errors)
- [ ] Admin page displays cache stats
- [ ] Manual refresh works (Admin → Trigger Manual Refresh)

## Scaling (if needed later)

**Turso free tier limits:**
- 3 databases max
- 25 GB storage per database
- Unlimited API calls

**Vercel free tier limits:**
- 100 Deployments per day
- 12 serverless function invocations/sec
- Build runtime 45 minutes

If you exceed these, upgrade to Pro ($20/mo Vercel, $29/mo Turso).

## Support

- **Vercel issues:** [vercel.com/support](https://vercel.com/support)
- **Turso issues:** [turso.tech/docs](https://turso.tech/docs)
- **API key issues:** Check individual provider docs
- **Build fails:** Check Vercel deployment logs for exact error
