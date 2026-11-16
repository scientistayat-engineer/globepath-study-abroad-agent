# Deployment guide

Globepath has two parts: a **Flask API + agent** (Python) and a **static frontend** (HTML, CSS, JS).

| Option | What runs where | When to use |
|---|---|---|
| **A. Vercel only** | Frontend and API together on Vercel | Simplest. Recommended. |
| **B. Vercel + Firebase Hosting** | API on Vercel, frontend on Firebase Hosting | When you want a Firebase URL as well |

Firebase Hosting only serves static files. Running Python on Firebase needs Cloud Run or Cloud Functions, which require the paid Blaze plan, so the API stays on Vercel.

> Never put your Groq key in the frontend or commit it to GitHub. Keep it only in Vercel environment variables.

---

## A. Deploy on Vercel

### 1. Push the project to GitHub
```bash
git init
git add .
git commit -m "Globepath study abroad agent"
git branch -M main
git remote add origin https://github.com/<you>/globepath-study-abroad-agent.git
git push -u origin main
```
`.env` is already in `.gitignore`.

### 2. Import it on Vercel
1. Open https://vercel.com/new and import the repository.
2. Leave the framework preset as **Other**. Do not change the build settings. `vercel.json` already tells Vercel to run `api/index.py`.
3. Open **Settings, Environment Variables** and add:

| Name | Value |
|---|---|
| `GROQ_API_KEY` | your Groq key |
| `GROQ_MODEL` | `openai/gpt-oss-120b` |
| `ALLOWED_ORIGINS` | leave empty for option A (see option B) |
| `LANGSMITH_TRACING` | `true` (optional, see [LangSmith](../README.md#-observability-with-langsmith)) |
| `LANGSMITH_API_KEY` | your LangSmith key (optional) |
| `LANGSMITH_PROJECT` | `globepath-study-abroad` (optional) |
| `LANGSMITH_TRACING_BACKGROUND` | `false` (recommended on Vercel) |

4. Press **Deploy**. Open the URL Vercel gives you.

### Or use the CLI
```bash
npm i -g vercel
vercel login
vercel                    # preview deployment
vercel env add GROQ_API_KEY
vercel env add GROQ_MODEL
vercel --prod
```

### Check it works
- `https://<your-app>.vercel.app/api/health` should return `{"status":"ok","ai_enhanced_summaries":true}`.
- `true` means the Groq key was found. `false` means the key is missing; the app still works with built-in text.
- `"langsmith_tracing": true` means tracing is on. After you generate one plan, open your project in LangSmith and look for a run called `study_abroad_plan`.

### If something fails
- **404 on every page**: confirm `vercel.json` and `api/index.py` are in the repository root.
- **500 on `/api/plan`**: open Vercel, Deployments, Functions logs.
- **Summary is not AI polished**: check `GROQ_API_KEY`, then redeploy (environment variable changes need a new deployment).
- **Timeouts**: the AI call stops after `LLM_TIMEOUT` seconds (default 8) and the plan is returned without it.

---

## B. Add Firebase Hosting (frontend only)

### 1. Deploy the API on Vercel first (option A)
Note the URL, for example `https://globepath.vercel.app`.

### 2. Point the frontend at that API
```bash
python scripts/set_api_base.py https://globepath.vercel.app
```
This rewrites `frontend/assets/js/config.js`. To go back to same-origin: `python scripts/set_api_base.py --reset`.

### 3. Create the Firebase project and deploy
```bash
npm i -g firebase-tools
firebase login
firebase use --add            # choose or create your project, alias: default
firebase deploy --only hosting
```
(or edit the project id in `.firebaserc`). Firebase prints URLs like `https://<project>.web.app`.

### 4. Allow the Firebase URLs to call the API
In Vercel, set:
```
ALLOWED_ORIGINS=https://<project>.web.app,https://<project>.firebaseapp.com
```
Then **redeploy** the Vercel project. Without this, the browser blocks the requests (CORS).

### Check it works
Open the Firebase URL, generate a plan. If it fails, open the browser console: a CORS error means step 4 is missing or has a typo.

---

## Local run with Groq
```bash
export GROQ_API_KEY=your_key        # Windows PowerShell: $env:GROQ_API_KEY="your_key"
export GROQ_MODEL=openai/gpt-oss-120b
python run.py
```
