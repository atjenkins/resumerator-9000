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
2. Create new query and paste:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resumes table
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

-- Results table
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('review', 'build')),
  person_name TEXT,
  company_name TEXT,
  job_title TEXT,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_results_user_id ON results(user_id);
CREATE INDEX idx_results_type ON results(type);
```

3. Run the query

### 4. Set Up Row Level Security (RLS)

1. In SQL Editor, create new query and paste:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Resumes policies
CREATE POLICY "Users can view own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own resumes"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Companies policies
CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE
  USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Results policies
CREATE POLICY "Users can view own results"
  ON results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own results"
  ON results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own results"
  ON results FOR DELETE
  USING (auth.uid() = user_id);
```

2. Run the query

### 5. Enable Authentication

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

Should see: `Server running on port 3000`

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
VITE_SUPABASE_ANON_KEY=your-publishable-key-here
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
3. Choose `resumerator-9000`
4. Click "Add variables"
5. Add these environment variables:
   ```
   PORT=3000
   NODE_ENV=production
   ANTHROPIC_API_KEY=your-key
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=your-service-key
   ```
6. Go to **Settings** → **Root Directory** → Set to `backend`
7. Go to **Settings** → **Start Command** → Set to `npm start`
8. Click "Deploy"

### 3. Get Railway URL

1. Once deployed, go to **Settings** → **Networking**
2. Click "Generate Domain"
3. Copy the URL (e.g., `your-app.railway.app`)

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
4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-app.railway.app
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-key
   ```
5. Click "Deploy"

### 3. Update CORS

1. Copy your Vercel URL (e.g., `your-app.vercel.app`)
2. Update backend CORS to allow this domain
3. Redeploy backend on Railway

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

### Frontend won't connect to backend

- Check `VITE_API_URL` points to correct backend
- Check CORS is configured in backend
- Check browser console for errors

### Railway deployment fails

- Check root directory is set to `backend`
- Check build logs for errors
- Verify all environment variables are set

### Vercel deployment fails

- Check root directory is set to `frontend`
- Check build command is correct
- Verify environment variables start with `VITE_`

### Authentication not working

- Check Supabase URL and keys are correct
- Verify email confirmation is enabled
- Check Supabase logs for errors

---

## Next Steps After Setup

1. Add auth middleware to backend routes
2. Create Supabase client services
3. Update API routes to use Supabase
4. Add React Query hooks for data fetching
5. Update components to use new auth system
6. Migrate existing `resume-data/` to database
7. Test and iterate!
