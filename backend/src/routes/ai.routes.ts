import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { supabase } from "../services/supabase.service";
import { JobFitAgent } from "../agents/job-fit-agent";
import { GeneralResumeAgent } from "../agents/general-agent";
import { ResumeBuilderAgent } from "../agents/builder-agent";

const router = Router();

// All AI routes require authentication
router.use(authMiddleware);

/**
 * POST /api/ai/analyze
 * Analyze a resume or profile with optional job/company context
 * Body: {
 *   source: 'resume' | 'profile',
 *   resumeId?: string (required if source = 'resume'),
 *   companyId?: string (optional context),
 *   jobId?: string (optional context),
 *   save?: boolean (default true)
 * }
 */
router.post(
  "/analyze",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { source, resumeId, companyId, jobId, save = true } = req.body;

    if (!source || !["resume", "profile"].includes(source)) {
      res.status(400).json({ error: "source must be 'resume' or 'profile'" });
      return;
    }

    if (source === "resume" && !resumeId) {
      res.status(400).json({ error: "resumeId is required when source is 'resume'" });
      return;
    }

    // Get source content
    let sourceContent: string;
    let sourceTitle: string;
    let sourceResumeId: string | null = null;

    if (source === "resume") {
      const { data: resume, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .eq("user_id", userId)
        .single();

      if (resumeError || !resume) {
        res.status(404).json({ error: "Resume not found" });
        return;
      }

      sourceContent = resume.content;
      sourceTitle = resume.title;
      sourceResumeId = resume.id;
    } else {
      // source === 'profile'
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      sourceContent = profile.content || "";
      sourceTitle = profile.display_name;
    }

    // Get optional context
    let companyData = null;
    let jobData = null;

    if (companyId) {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .eq("user_id", userId)
        .single();
      companyData = data;
    }

    if (jobId) {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", userId)
        .single();
      jobData = data;
    }

    // Track duration
    const startTime = Date.now();

    // Run appropriate agent based on context
    let result: any;

    if (jobData || companyData) {
      // Build context string
      let context = "";
      if (companyData) {
        context += `## Company Context\n\n${companyData.content}\n\n`;
      }
      if (jobData) {
        context += `## Job Description\n\n${jobData.content}`;
      }

      const agent = new JobFitAgent();
      result = await agent.review(sourceContent, context);
    } else {
      const agent = new GeneralResumeAgent();
      result = await agent.review(sourceContent);
    }

    const duration_ms = Date.now() - startTime;

    // Save result if requested
    let savedResultId: string | undefined;

    if (save) {
      const { data: savedResult } = await supabase
        .from("results")
        .insert({
          user_id: userId,
          resume_id: sourceResumeId,
          company_id: companyData?.id || null,
          job_id: jobData?.id || null,
          type: "review",
          person_name: sourceTitle,
          company_name: companyData?.name,
          job_title: jobData?.title,
          content: JSON.stringify(result),
          metadata: {
            analysisType: jobData || companyData ? "job-fit" : "general",
            source,
            duration_ms,
          },
        })
        .select()
        .single();

      savedResultId = savedResult?.id;
    }

    res.json({
      ...result,
      duration_ms,
      savedResultId,
    });
  })
);

/**
 * POST /api/ai/generate
 * Generate a tailored resume for a specific job
 * Body: {
 *   source: 'resume' | 'profile',
 *   resumeId?: string (required if source = 'resume'),
 *   jobId: string (required),
 *   companyId?: string (optional, auto-resolved from job if not provided),
 *   save?: boolean (default true)
 * }
 */
router.post(
  "/generate",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { source, resumeId, jobId, companyId, save = true } = req.body;

    if (!source || !["resume", "profile"].includes(source)) {
      res.status(400).json({ error: "source must be 'resume' or 'profile'" });
      return;
    }

    if (source === "resume" && !resumeId) {
      res.status(400).json({ error: "resumeId is required when source is 'resume'" });
      return;
    }

    if (!jobId) {
      res.status(400).json({ error: "jobId is required for generation" });
      return;
    }

    // Get source content
    let sourceContent: string;
    let sourceTitle: string;

    if (source === "resume") {
      const { data: resume, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .eq("user_id", userId)
        .single();

      if (resumeError || !resume) {
        res.status(404).json({ error: "Resume not found" });
        return;
      }

      sourceContent = resume.content;
      sourceTitle = resume.title;
    } else {
      // source === 'profile'
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      sourceContent = profile.content || "";
      sourceTitle = profile.display_name;
    }

    // Get job (with company join)
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*, companies(*)")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (jobError || !job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    // Build context
    let context = "";
    if (job.companies) {
      context += `## Company Context\n\n${job.companies.content}\n\n`;
    }
    context += `## Job Description\n\n${job.content}`;

    // Track duration
    const startTime = Date.now();

    // Generate tailored resume
    const agent = new ResumeBuilderAgent();
    const result = await agent.build(sourceContent, context);

    const duration_ms = Date.now() - startTime;

    // Save result if requested
    let savedResultId: string | undefined;
    let tailoredResumeId: string | undefined;

    if (save) {
      // Create new resume with tailored content
      const { data: tailoredResume } = await supabase
        .from("resumes")
        .insert({
          user_id: userId,
          title: `${sourceTitle} - ${job.title}`,
          content: result.markdown,
          company_id: job.company_id || null,
          job_id: job.id,
          is_primary: false,
        })
        .select()
        .single();

      tailoredResumeId = tailoredResume?.id;

      // Save analysis result
      const { data: savedResult } = await supabase
        .from("results")
        .insert({
          user_id: userId,
          resume_id: tailoredResumeId,
          company_id: job.company_id || null,
          job_id: job.id,
          type: "build",
          person_name: sourceTitle,
          company_name: job.companies?.name,
          job_title: job.title,
          content: JSON.stringify(result),
          metadata: {
            source,
            originalResumeId: source === "resume" ? resumeId : null,
            emphasizedSkills: result.emphasizedSkills,
            selectedExperiences: result.selectedExperiences,
            duration_ms,
          },
        })
        .select()
        .single();

      savedResultId = savedResult?.id;
    }

    res.json({
      ...result,
      duration_ms,
      savedResultId,
      tailoredResumeId,
    });
  })
);

export default router;
