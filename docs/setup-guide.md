# Setup Guide

Step-by-step guide to set up Resumerator 9000 from scratch.

## Phase 1: Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/login
3. Click "New Project"
4. Choose organization, name your project, set database password
5. Wait for project to provision (~2 minutes)

### 2. Get API Keys

1. Go to **Settings** → **API**
2. Make sure you're on the **"Publishable and secret API keys"** tab (NOT the legacy tab)
3. Copy these values:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **Publishable** key (for frontend - safe to use in browser)
   - **Secret** key (for backend - keep secret!)

### 3. Create Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Open `backend/database/migrations/001_initial_schema.sql` from your local project
4. Copy the entire migration SQL and paste it into Supabase SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify tables created in **Table Editor**:
   - `profiles` - with `display_name` and `content` fields
   - `companies` - with `name`, `slug`, `content`
   - `jobs` - with `title`, `slug`, `content`, optional `company_id`
   - `resumes` - with `title`, `content`, optional `company_id`/`job_id`, `is_primary` flag
   - `results` - with proper foreign keys to resumes/companies/jobs

**Note:** The migration includes:

- Full schema with all tables
- Row Level Security (RLS) policies
- Auto-updating timestamp triggers
- Optimized indexes

See `backend/database/README.md` for more details on the migration system.

### 4. Enable Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (already enabled by default)
3. (Optional) Configure email templates in **Email Templates**

---

## Phase 2: Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install @supabase/supabase-js cors
npm install --save-dev @types/cors
```

### 2. Create Environment File

Create `backend/.env`:

```env
PORT=3000
NODE_ENV=development

# Anthropic API
ANTHROPIC_API_KEY=your-anthropic-key-here

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-secret-key-here
```

### 3. Test Backend

```bash
npm run dev
```

Should see: `🚀 Resume Reviewer server running at http://localhost:3000`

---

## Phase 3: Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install @tanstack/react-query @supabase/supabase-js
```

### 2. Create Environment File

Create `frontend/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Supabase Configuration
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
```

### 3. Test Frontend

```bash
npm run dev
```

Should open at: `http://localhost:5173`

---

## Phase 4: Git & GitHub

### 1. Create Initial Commit

```bash
# From root directory
git add .
git commit -m "Initial commit: Decoupled architecture setup"
```

### 2. Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it `resumerator-9000`
4. Don't initialize with README (we have one)
5. Create repository

### 3. Push to GitHub

```bash
git remote add origin https://github.com/your-username/resumerator-9000.git
git branch -M main
git push -u origin main
```

---

## Phase 5: Railway Deployment (Backend)

### 1. Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway

### 2. Deploy Backend

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `resumerator-9000` repository
4. Railway will create a service and attempt initial deploy

5. **Configure Service Settings:**

   - Click on your service card (appears after project creation)
   - Go to **Settings** tab (within the service, not project settings)
   - Scroll down and find:
     - **Root Directory** → Enter `backend`
     - **Start Command** → Enter `npm start`
     - **Build Command** → Enter `npm install && npm run build`

6. **Add Environment Variables:**

   - In the same service view, go to **Variables** tab
   - Click "New Variable" and add each one:

   ```
   PORT=3000
   NODE_ENV=production
   ANTHROPIC_API_KEY=your-key
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=your-secret-key
   ```

7. Railway will automatically redeploy after you save the settings

### 3. Get Railway URL

1. Once deployed successfully, stay in your service view
2. Go to **Settings** tab → **Networking** section
3. Click "Generate Domain"
4. **Set the port to 3000** (Railway may default to 8080, change it!)
5. Click "Generate Domain"
6. Copy the public URL (e.g., `resumerator-9000-production.up.railway.app`)
7. **Save this URL** - you'll need it for:
   - Frontend environment variable (`VITE_API_URL`)
   - Testing the backend API

### 4. Test Railway Backend

Test your Railway backend is working:

1. Visit your Railway URL in a browser (e.g., `https://[your-app].railway.app`)
2. You should see a redirect or API response
3. Check the Railway deployment logs if there are errors

### 5. (Optional) Update Local Frontend to Use Railway Backend

If you want to test with the production backend locally:

Update `frontend/.env`:

```env
VITE_API_URL=https://your-app.railway.app
```

(You can switch back to `http://localhost:3000` for local backend development)

---

## Phase 6: Vercel Deployment (Frontend)

### 1. Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel

### 2. Deploy Frontend

1. Click "Add New" → "Project"
2. Import `resumerator-9000` repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables (all must be set for the app to load):
   ```
   VITE_API_URL=https://your-app.railway.app
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```
   **Important:** Use `VITE_SUPABASE_PUBLISHABLE_KEY` (with the `VITE_` prefix). Without these, you'll see "Missing Supabase environment variables" in the browser console.
   **VITE_API_URL** must be the full backend URL including `https://` (e.g. `https://resumerator-9000-production.up.railway.app`). If you omit the scheme, profile and other API calls will 404.
5. Click "Deploy"

### 3. Update Railway Backend with Vercel URL

Now that you have your Vercel URL, add it to Railway:

1. Copy your Vercel URL (e.g., `https://resumerator-9000.vercel.app`)
2. Go to **Railway** → Your Service → **Variables** tab
3. Add new variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Railway will automatically redeploy with CORS configured

**Note:** CORS is+ already set up in your backend code to allow:

- `localhost:5173` (local development)
- Any `.vercel.app` domain (Vercel deployments)
- Your specific `FRONTEND_URL` (production)

---

## Phase 7: Testing

### 1. Test Authentication

1. Open your Vercel URL
2. Try to sign up with email
3. Check email for confirmation
4. Log in

### 2. Test API Connection

1. Open browser console (F12)
2. Check Network tab for API calls
3. Should see calls to Railway backend URL
4. Verify responses are successful

### 3. Test Features

- [ ] Create a resume
- [ ] Create a company
- [ ] Create a job posting
- [ ] Run a review
- [ ] Build a tailored resume
- [ ] View results

---

## Troubleshooting

### Backend won't start

- Check `.env` file exists and has all variables
- Check `node_modules` installed: `npm install`
- Check TypeScript compiles: `npm run build`

### Frontend won't connect to backend / "Failed to load profile" / API 404

- **VITE_API_URL** must be the full URL including `https://` (e.g. `https://your-app.railway.app`). If you set only the hostname (e.g. `resumerator-9000-production.up.railway.app`), the browser will request that as a path on your Vercel domain and get 404. In Vercel → Settings → Environment Variables, set `VITE_API_URL=https://your-railway-host.up.railway.app`, then redeploy.
- Check CORS is configured in backend (Railway `FRONTEND_URL` set to your Vercel URL)
- Check browser console and Network tab for the actual request URL

### Railway deployment fails

- Check root directory is set to `backend`
- Check build logs for errors
- Verify all environment variables are set

### Vercel deployment fails / "Missing Supabase environment variables"

- Check root directory is set to `frontend`
- Check build command is correct
- In Vercel → Project → **Settings** → **Environment Variables**, add:
  - `VITE_SUPABASE_URL` (your Supabase project URL)
  - `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase publishable key)
  - `VITE_API_URL` (your production backend URL, e.g. Railway)
- All frontend env vars must start with `VITE_` to be available in the browser. Redeploy after adding or changing variables.

### Authentication not working

- Check Supabase URL and keys are correct
- Verify email confirmation is enabled
- Check Supabase logs for errors

---

## Next Steps After Setup

1. **Frontend Authentication** - Implement Supabase Auth in frontend with sign up/login
2. **React Query Integration** - Add React Query hooks for API data fetching
3. **Profile Editor** - Build markdown editor for profile content
4. **Resume Management** - UI for creating, viewing, and managing resumes
5. **Company/Job Tracking** - UI for managing companies and jobs
6. **AI Features** - Connect frontend to existing AI endpoints:
   - Profile enrichment from uploaded resume
   - Job/company info parsing
   - Resume analysis and tailoring
7. **Context Tracking** - Show which company/job a resume is tailored for
8. **Test Complete Workflow** - End-to-end testing of all features

## Database Schema Resources

- **Migrations**: `backend/database/migrations/` - All schema change files
- **Migration Guide**: `backend/database/README.md` - How to create and apply migrations
- **Schema Details**: `docs/schema-enhancements-002.md` - Latest schema changes explained
- **API Structure**: `docs/api-refactoring-summary.md` - RESTful API organization
