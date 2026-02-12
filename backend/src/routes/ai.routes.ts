import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { supabase } from "../services/supabase.service";
import { logActivity } from "../services/activity.service";
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
      res
        .status(400)
        .json({ error: "resumeId is required when source is 'resume'" });
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
    let analysisType: "general" | "job-fit";

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
      analysisType = "job-fit";
    } else {
      const agent = new GeneralResumeAgent();
      result = await agent.review(sourceContent);
      analysisType = "general";
    }

    const duration_ms = Date.now() - startTime;

    // Save analysis if requested
    let analysisId: string | undefined;

    if (save) {
      const { data: savedAnalysis, error: analysisError } = await supabase
        .from("analyses")
        .insert({
          user_id: userId,
          source_type: source,
          source_resume_id: sourceResumeId,
          company_id: companyId || null,
          job_id: jobId || null,
          analysis_type: analysisType,
          score: result.score,
          fit_rating: result.fitRating || null,
          summary: result.summary,
          strengths: result.strengths,
          improvements: result.improvements,
          categories: result.categories,
          missing_keywords: result.missingKeywords || [],
          transferable_skills: result.transferableSkills || [],
          targeted_suggestions: result.targetedSuggestions || [],
          duration_ms,
        })
        .select()
        .single();

      if (analysisError) {
        console.error("Failed to save analysis:", analysisError);
      } else {
        analysisId = savedAnalysis?.id;

        // Log activity
        const jobContext = jobData ? ` for ${jobData.title}` : "";
        const companyContext = companyData ? ` at ${companyData.name}` : "";
        logActivity({
          userId,
          action: "analyze",
          entityType: "analysis",
          entityId: analysisId,
          durationMs: duration_ms,
          sourceType: source,
          relatedJobId: jobId,
          relatedCompanyId: companyId,
          displayTitle: `Analyzed ${source === "resume" ? `resume '${sourceTitle}'` : "profile"}${jobContext}${companyContext}`,
        });
      }
    }

    res.json({
      ...result,
      duration_ms,
      analysisId,
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
      res
        .status(400)
        .json({ error: "resumeId is required when source is 'resume'" });
      return;
    }

    if (!jobId) {
      res.status(400).json({ error: "jobId is required for generation" });
      return;
    }

    // Get source content
    let sourceContent: string;
    let sourceTitle: string;
    let sourceResumeIdForLog: string | null = null;

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
      sourceResumeIdForLog = resume.id;
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
    let tailoredResumeId: string | undefined;

    if (save) {
      // Create new resume with provenance fields
      const { data: tailoredResume, error: resumeError } = await supabase
        .from("resumes")
        .insert({
          user_id: userId,
          title: `${sourceTitle} - ${job.title}`,
          content: result.markdown,
          company_id: job.company_id || null,
          job_id: job.id,
          is_primary: false,
          origin: "generated",
          source_type: source,
          source_resume_id: sourceResumeIdForLog,
          is_edited: false,
          generation_summary: result.summary,
          emphasized_skills: result.emphasizedSkills,
          selected_experiences: result.selectedExperiences,
          generation_duration_ms: duration_ms,
        })
        .select()
        .single();

      if (resumeError) {
        console.error("Failed to save generated resume:", resumeError);
      } else {
        tailoredResumeId = tailoredResume?.id;

        // Log activity
        const companyContext = job.companies?.name
          ? ` at ${job.companies.name}`
          : "";
        logActivity({
          userId,
          action: "generate",
          entityType: "resume",
          entityId: tailoredResumeId,
          durationMs: duration_ms,
          sourceType: source,
          relatedJobId: jobId,
          relatedCompanyId: job.company_id || undefined,
          displayTitle: `Generated resume from ${source === "resume" ? `'${sourceTitle}'` : "profile"} for ${job.title}${companyContext}`,
        });
      }
    }

    res.json({
      ...result,
      duration_ms,
      tailoredResumeId,
    });
  })
);

export default router;
