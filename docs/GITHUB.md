# GitHub setup

## Repository name
`globepath-study-abroad-agent`

## Description (paste into "About")
AI study abroad planner: a single-agent, single-task Flask app that turns country, degree, field and budget into a full plan with universities under budget, scholarships, activities and cost estimates. Groq LLM, LangSmith tracing, deployed on Vercel and Firebase.

## Topics
`study-abroad` `ai-agent` `single-agent` `flask` `python` `javascript` `groq` `gpt-oss` `langsmith` `vercel` `firebase-hosting` `education` `scholarships` `university` `cost-estimator` `responsive-design` `dark-mode`

## Commands

Check that no secrets will be committed (`.env` must not appear):
```bash
git init
git add .
git status
```

Commit and push:
```bash
git commit -m "feat: Globepath study abroad agent"
git branch -M main
git remote add origin https://github.com/<your-username>/globepath-study-abroad-agent.git
git push -u origin main
```

Or do everything with the GitHub CLI:
```bash
gh auth login
gh repo create globepath-study-abroad-agent --public --source=. --remote=origin --push \
  --description "AI study abroad planner: a single-agent, single-task Flask app that turns country, degree, field and budget into a full plan. Groq LLM, LangSmith tracing, Vercel and Firebase."
gh repo edit --add-topic study-abroad,ai-agent,single-agent,flask,python,javascript,groq,gpt-oss,langsmith,vercel,firebase-hosting,education,scholarships,university,cost-estimator,responsive-design,dark-mode
```

Later updates:
```bash
git add .
git commit -m "docs: update README"
git push
```
