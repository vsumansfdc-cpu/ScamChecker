# Scam Check

Paste a suspicious text or email and get a plain-language verdict (Likely Scam / Suspicious / Likely Safe), red flags, and what to do next. Powered by Claude.

## Files

- `public/index.html`: the web page
- `api/check.js`: serverless function that calls the Anthropic API
- `package.json`: tells Vercel to use ES modules and Node 18+

## Deploy on Vercel

1. Get an API key at https://console.anthropic.com and set a monthly spend limit.
2. Push this folder to a new GitHub repository.
3. On https://vercel.com, click **Add New → Project** and import the repo (Framework Preset: **Other**, leave build settings blank).
4. Under **Environment Variables**, add `ANTHROPIC_API_KEY` = your key.
5. Click **Deploy**. Open the URL you get and try a message.

Never commit your API key to GitHub. It belongs only in Vercel's environment variables.

## Customize

- Change the model or prompt at the top of `api/check.js`.
- Push to GitHub and Vercel redeploys automatically.
