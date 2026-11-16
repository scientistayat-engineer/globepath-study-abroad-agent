# Complete commands

Follow the sections in order: local test, GitHub, Vercel, Firebase.

## 1. Run locally
```bash
cd globepath-study-abroad-agent

python -m venv .venv
.venv\Scripts\activate            # Windows
source .venv/bin/activate         # macOS / Linux

pip install -r requirements.txt
```
Optional Groq key:
```bash
$env:GROQ_API_KEY="your_key"      # Windows PowerShell
set GROQ_API_KEY=your_key         # Windows CMD
export GROQ_API_KEY=your_key      # macOS / Linux
```
Start and test:
```bash
python run.py                                         # open http://127.0.0.1:5000
python -m unittest backend.tests.test_agent -v        # 25 tests
```

## 2. GitHub
Repo name: `globepath-study-abroad-agent`

Description:
> AI study abroad planner: a single-agent, single-task Flask app that turns country, degree, field and budget into a full plan with universities under budget, scholarships, activities and cost estimates. Groq LLM, LangSmith tracing, deployed on Vercel and Firebase.

Topics: `study-abroad` `ai-agent` `single-agent` `flask` `python` `javascript` `groq` `gpt-oss` `langsmith` `vercel` `firebase-hosting` `education` `scholarships` `university` `cost-estimator` `responsive-design` `dark-mode`

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

git init
git add .
git status                  # .env must NOT be listed
git commit -m "feat: Globepath study abroad agent"
git branch -M main
git remote add origin https://github.com/<your-username>/globepath-study-abroad-agent.git
git push -u origin main
```
Create the empty repository on github.com first (do not add a README there). Add the description and topics with the gear icon next to **About**, or use the GitHub CLI:
```bash
gh auth login
gh repo create globepath-study-abroad-agent --public --source=. --remote=origin --push \
  --description "AI study abroad planner: single-agent Flask app. Groq LLM, LangSmith tracing, Vercel and Firebase."
gh repo edit --add-topic study-abroad,ai-agent,single-agent,flask,python,javascript,groq,gpt-oss,langsmith,vercel,firebase-hosting,education,scholarships,university,cost-estimator,responsive-design,dark-mode
```

## 3. Vercel (site and API)
Dashboard: <https://vercel.com/new>, import the repo, framework **Other**, add environment variables, Deploy.

| Variable | Value |
|---|---|
| `GROQ_API_KEY` | your Groq key |
| `GROQ_MODEL` | `openai/gpt-oss-120b` |
| `LANGSMITH_TRACING` | `true` (optional) |
| `LANGSMITH_API_KEY` | your LangSmith key (optional) |
| `LANGSMITH_PROJECT` | `globepath-study-abroad` (optional) |
| `LANGSMITH_TRACING_BACKGROUND` | `false` (with LangSmith) |

CLI:
```bash
npm i -g vercel
vercel login
vercel                       # preview
vercel env add GROQ_API_KEY
vercel env add GROQ_MODEL
vercel --prod
```
Check `https://<app>.vercel.app/api/health`. Environment variable changes need a new deployment.

## 4. Firebase Hosting (frontend only)
```bash
npm i -g firebase-tools
firebase login
firebase use --add                                           # or edit .firebaserc
python scripts/set_api_base.py https://<app>.vercel.app
firebase deploy --only hosting
```
Then set this on Vercel and redeploy:
```
ALLOWED_ORIGINS=https://<project>.web.app,https://<project>.firebaseapp.com
```
Afterwards: `python scripts/set_api_base.py --reset`.

## 5. After deployment
Replace the link placeholders in the README, report and presentation, then:
```bash
git add .
git commit -m "docs: add live links"
git push
```

Never commit API keys. If a key was ever pasted into a file or chat, create a new one.
