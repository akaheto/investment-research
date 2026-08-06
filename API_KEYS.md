# API Keys Setup

Add these environment variables to Vercel for full financial + political data integration.

## Setup Steps

### 1. FRED (Federal Reserve Economic Data)
- Go to https://fred.stlouisfed.org/
- Click "Sign Up" in top right
- Create account and verify email
- Visit https://fred.stlouisfed.org/user/settings/keys
- Copy your API key
- Add to Vercel:
  ```bash
  vercel env add FRED_API_KEY
  ```

### 2. NewsAPI (Financial + Political Headlines)
- Go to https://newsapi.org/
- Click "Get API Key"
- Choose "Developer" plan (free: 100 requests/day)
- Copy API key
- Add to Vercel:
  ```bash
  vercel env add NEWS_API_KEY
  ```

### 3. Finnhub (Company Fundamentals & Sentiment)
- Go to https://finnhub.io/
- Click "Get Free API Key"
- Complete registration
- Copy API key from dashboard
- Add to Vercel:
  ```bash
  vercel env add FINNHUB_API_KEY
  ```

### 4. Alpha Vantage (Technical Indicators & Market Sentiment)
- Go to https://www.alphavantage.co/
- Click "Get Free API Key"
- Complete registration with email
- Copy API key from dashboard
- Add to Vercel:
  ```bash
  vercel env add ALPHAVANTAGE_API_KEY
  ```

### 5. Anthropic (LLM Narratives)
- Go to https://console.anthropic.com/account/keys
- Create or copy your API key
- Add to Vercel:
  ```bash
  vercel env add ANTHROPIC_API_KEY
  ```

### 6. Interactive Brokers (Live Account Data)
- **Prerequisites:** IBKR account with TOTP 2FA enabled (see plan for details)
- First: Deploy Fly.io container with IBeam + auth shim (instructions in Epic H plan)
- Once Fly.io is live, add these to Vercel:
  ```bash
  vercel env add IBKR_GATEWAY_URL      # e.g., https://my-app.fly.dev/gateway
  vercel env add IBKR_GATEWAY_SECRET   # Shared Bearer token with Fly.io instance
  vercel env add BROKERAGE_PROVIDER    # Set to "ibkr"
  ```
- Secrets (username, password, TOTP) stored **only on Fly.io**, never in Vercel

## Full Setup Command

```bash
vercel env add FRED_API_KEY
vercel env add NEWS_API_KEY
vercel env add FINNHUB_API_KEY
vercel env add ALPHAVANTAGE_API_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add IBKR_GATEWAY_URL
vercel env add IBKR_GATEWAY_SECRET
vercel env add BROKERAGE_PROVIDER
```

Then redeploy:
```bash
vercel deploy --prod
```

## Rate Limits & Free Tier

| Source | Free Tier | Limit |
|--------|-----------|-------|
| FRED | ✅ | 1,200 req/min |
| NewsAPI | ✅ | 100 req/day |
| Finnhub | ✅ | 60 req/min |
| Alpha Vantage | ✅ | 5 req/min |
| Anthropic | Pay-as-you-go | ~$0.01/1000 tokens |
| IBKR Web API | Your account | 10 req/sec per session |

