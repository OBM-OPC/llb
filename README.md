# LLB — Learn Bulgarian

PWA flashcard app for learning Bulgarian from English.

## Features
- 500 most-used Bulgarian words seeded from `500_most_used_bulgarian_words.csv`
- EN→BG and BG→EN flashcard modes
- Bulgarian TTS through browser-native `SpeechSynthesis` (`bg-BG`)
- SM-2 spaced repetition stored locally, with Supabase schema ready for sync/auth
- PWA manifest and CI workflow

## Run
```bash
npm install
npm run dev
```

## Verify
```bash
npm run ci
```

## Deployment secrets for GitHub Actions / Vercel
Add these in GitHub repo Settings → Secrets and variables → Actions:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Supabase SQL is in `supabase/schema.sql`.
