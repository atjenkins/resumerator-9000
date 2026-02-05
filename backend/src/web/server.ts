import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GeneralResumeAgent } from "../agents/general-agent";
import { JobFitAgent } from "../agents/job-fit-agent";
import { ResumeBuilderAgent } from "../agents/builder-agent";
import { ImportAgent } from "../agents/import-agent";
import { parsePdfBuffer } from "../parsers/pdf-parser";
import { parseDocxBuffer } from "../parsers/docx-parser";
import { loadConfig, ProjectManager, ResultManager } from "../project";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173", // Local Vite dev server
  "http://localhost:3000", // Local Express server
  process.env.FRONTEND_URL, // Vercel production URL
].filter(Boolean); // Remove undefined values

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list or matches vercel.app domain
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Get project managers
function getManagers() {
  const config = loadConfig();
  return {
    config,
    project: new ProjectManager(config),
    results: new ResultManager(config),
  };
}

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve React build (Vite outputs to dist/web/public)
const clientBuildPath = path.join(__dirname, "public");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ];
    const allowedExtensions = [".pdf", ".docx", ".txt", ".md"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      allowedTypes.includes(file.mimetype) ||
      allowedExtensions.includes(ext)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Please upload PDF, DOCX, TXT, or MD files."
        )
      );
    }
  },
});

// Helper to parse uploaded file
async function parseUploadedFile(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname).toLowerCase();

  switch (ext) {
    case ".pdf":
      const pdfResult = await parsePdfBuffer(file.buffer);
      return pdfResult.content;
    case ".docx":
      const docxResult = await parseDocxBuffer(file.buffer);
      return docxResult.content;
    case ".txt":
    case ".md":
      return file.buffer.toString("utf-8");
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}

// ============================================================
// Project Management API
// ============================================================

// Initialize project
app.post(
  "/api/project/init",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const result = project.init();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// List people
app.get(
  "/api/project/people",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const people = project.listPeople();
      res.json(people);
    } catch (error) {
      next(error);
    }
  }
);

// List companies
app.get(
  "/api/project/companies",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const companies = project.listCompanies();
      res.json(companies);
    } catch (error) {
      next(error);
    }
  }
);

// List jobs for a company
app.get(
  "/api/project/jobs/:company",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const jobs = project.listJobs(req.params.company as string);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  }
);

// Get person content
app.get(
  "/api/project/person/:name",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const content = project.getPersonContent(req.params.name as string);
      res.json({ content });
    } catch (error) {
      next(error);
    }
  }
);

// Get company content
app.get(
  "/api/project/company/:name",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const content = project.getCompanyContent(req.params.name as string);
      res.json({ content });
    } catch (error) {
      next(error);
    }
  }
);

// Get job content
app.get(
  "/api/project/job/:company/:job",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const content = project.getJobContent(
        req.params.company as string,
        req.params.job as string
      );
      res.json({ content });
    } catch (error) {
      next(error);
    }
  }
);

// Add person
app.post(
  "/api/project/person",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: "Name is required" });
        return;
      }
      const { project } = getManagers();
      const person = project.addPerson(name);
      res.json(person);
    } catch (error) {
      next(error);
    }
  }
);

// Add company
app.post(
  "/api/project/company",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: "Name is required" });
        return;
      }
      const { project } = getManagers();
      const company = project.addCompany(name);
      res.json(company);
    } catch (error) {
      next(error);
    }
  }
);

// Add job
app.post(
  "/api/project/job",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { company, title } = req.body;
      if (!company || !title) {
        res.status(400).json({ error: "Company and title are required" });
        return;
      }
      const { project } = getManagers();
      const job = project.addJob(company, title);
      res.json(job);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// Results API
// ============================================================

// List results
app.get(
  "/api/results",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { results } = getManagers();
      const list = results.listResults({
        type: req.query.type as any,
        person: req.query.person as string,
        company: req.query.company as string,
      });
      res.json(list);
    } catch (error) {
      next(error);
    }
  }
);

// Get result content
app.get(
  "/api/results/:filename",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { results } = getManagers();
      const result = results.loadResult(req.params.filename as string);
      if (!result) {
        res.status(404).json({ error: "Result not found" });
        return;
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// Import & Processing API
// ============================================================

// Import resume endpoint
app.post(
  "/api/import/resume",
  upload.single("resumeFile"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mode, personName, newPersonName, resumeText } = req.body;
      const { project } = getManagers();

      // Get resume content
      let content: string;
      if (req.file) {
        content = await parseUploadedFile(req.file);
      } else if (resumeText) {
        content = resumeText;
      } else {
        res.status(400).json({ error: "No resume content provided" });
        return;
      }

      const agent = new ImportAgent();

      if (mode === "create") {
        // Create new person
        if (!newPersonName) {
          res
            .status(400)
            .json({ error: "New person name is required for create mode" });
          return;
        }

        const parsed = await agent.parseResume(content);
        const person = project.addPerson(newPersonName);
        project.updatePersonContent(person.name, parsed);

        res.json({
          success: true,
          personName: person.name,
          filePath: person.personPath,
          preview: parsed,
        });
      } else if (mode === "merge") {
        // Merge with existing person
        if (!personName) {
          res
            .status(400)
            .json({ error: "Person name is required for merge mode" });
          return;
        }

        const existingContent = project.getPersonContent(personName);
        const parsedResume = await agent.parseResume(content);
        const merged = await agent.mergeProfiles(existingContent, parsedResume);
        project.updatePersonContent(personName, merged);

        res.json({
          success: true,
          personName,
          filePath: `people/${personName}/person.md`,
          preview: merged,
        });
      } else {
        res
          .status(400)
          .json({ error: 'Mode must be either "create" or "merge"' });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Import job description endpoint
app.post(
  "/api/import/job",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mode, company, jobName, jobText } = req.body;
      const { project } = getManagers();

      if (!company || !jobName || !jobText) {
        res
          .status(400)
          .json({ error: "Company, job name, and job text are required" });
        return;
      }

      const agent = new ImportAgent();

      if (mode === "create") {
        // Create new job
        const processed = await agent.processJobDescription(jobText);
        const job = project.addJob(company, jobName);
        project.updateJobContent(company, job.name, processed);

        res.json({
          success: true,
          jobName: job.name,
          filePath: job.path,
          preview: processed,
        });
      } else if (mode === "append") {
        // Append to existing job
        const existingContent = project.getJobContent(company, jobName);
        const appended = await agent.appendJobDescription(
          existingContent,
          jobText
        );
        project.updateJobContent(company, jobName, appended);

        res.json({
          success: true,
          jobName,
          filePath: `companies/${company}/jobs/${jobName}.md`,
          preview: appended,
        });
      } else {
        res
          .status(400)
          .json({ error: 'Mode must be either "create" or "append"' });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Import company information endpoint
app.post(
  "/api/import/company",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mode, companyName, companyText } = req.body;
      const { project } = getManagers();

      if (!companyName || !companyText) {
        res
          .status(400)
          .json({ error: "Company name and company text are required" });
        return;
      }

      const agent = new ImportAgent();

      if (mode === "create") {
        // Create new company
        const processed = await agent.processCompanyInfo(companyText);
        const company = project.addCompany(companyName);
        project.updateCompanyContent(company.name, processed);

        res.json({
          success: true,
          companyName: company.name,
          filePath: company.companyPath,
          preview: processed,
        });
      } else if (mode === "append") {
        // Append to existing company
        const existingContent = project.getCompanyContent(companyName);
        const appended = await agent.appendCompanyInfo(
          existingContent,
          companyText
        );
        project.updateCompanyContent(companyName, appended);

        res.json({
          success: true,
          companyName,
          filePath: `companies/${companyName}/company.md`,
          preview: appended,
        });
      } else {
        res
          .status(400)
          .json({ error: 'Mode must be either "create" or "append"' });
      }
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// File Editing API
// ============================================================

// Get person file
app.get(
  "/api/files/person/:name",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const name = Array.isArray(req.params.name)
        ? req.params.name[0]
        : req.params.name;
      const content = project.getPersonContent(name);
      res.json({ content });
    } catch (error) {
      next(error);
    }
  }
);

// Update person file
app.put(
  "/api/files/person/:name",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { content } = req.body;
      if (!content) {
        res.status(400).json({ error: "Content is required" });
        return;
      }
      const { project } = getManagers();
      const name = Array.isArray(req.params.name)
        ? req.params.name[0]
        : req.params.name;
      project.updatePersonContent(name, content);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Get company file
app.get(
  "/api/files/company/:name",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const name = Array.isArray(req.params.name)
        ? req.params.name[0]
        : req.params.name;
      const content = project.getCompanyContent(name);
      res.json({ content });
    } catch (error) {
      next(error);
    }
  }
);

// Update company file
app.put(
  "/api/files/company/:name",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { content } = req.body;
      if (!content) {
        res.status(400).json({ error: "Content is required" });
        return;
      }
      const { project } = getManagers();
      const name = Array.isArray(req.params.name)
        ? req.params.name[0]
        : req.params.name;
      project.updateCompanyContent(name, content);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Get job file
app.get(
  "/api/files/job/:company/:job",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const company = Array.isArray(req.params.company)
        ? req.params.company[0]
        : req.params.company;
      const job = Array.isArray(req.params.job)
        ? req.params.job[0]
        : req.params.job;
      const content = project.getJobContent(company, job);
      res.json({ content });
    } catch (error) {
      next(error);
    }
  }
);

// Update job file
app.put(
  "/api/files/job/:company/:job",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { content } = req.body;
      if (!content) {
        res.status(400).json({ error: "Content is required" });
        return;
      }
      const { project } = getManagers();
      const company = Array.isArray(req.params.company)
        ? req.params.company[0]
        : req.params.company;
      const job = Array.isArray(req.params.job)
        ? req.params.job[0]
        : req.params.job;
      project.updateJobContent(company, job, content);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// List resumes for a person
app.get(
  "/api/files/person/:name/resumes",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const name = Array.isArray(req.params.name)
        ? req.params.name[0]
        : req.params.name;
      const resumes = project.listResumes(name);
      res.json({ resumes });
    } catch (error) {
      next(error);
    }
  }
);

// Get a specific resume file
app.get(
  "/api/files/person/:name/resumes/:resume",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project } = getManagers();
      const name = Array.isArray(req.params.name)
        ? req.params.name[0]
        : req.params.name;
      const resume = Array.isArray(req.params.resume)
        ? req.params.resume[0]
        : req.params.resume;
      const content = project.getResumeContent(name, resume);
      res.json({ content });
    } catch (error) {
      next(error);
    }
  }
);

// Update a specific resume file
app.put(
  "/api/files/person/:name/resumes/:resume",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { content } = req.body;
      if (!content) {
        res.status(400).json({ error: "Content is required" });
        return;
      }
      const { project } = getManagers();
      const name = Array.isArray(req.params.name)
        ? req.params.name[0]
        : req.params.name;
      const resume = Array.isArray(req.params.resume)
        ? req.params.resume[0]
        : req.params.resume;
      project.updateResumeContent(name, resume, content);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// Unified Review API
// ============================================================

// Unified review endpoint with flexible context
app.post(
  "/api/review",
  upload.single("resume"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project, results } = getManagers();

      // Get resume/personal info content
      let resumeContent: string;
      let personName: string | undefined;

      if (req.body.person) {
        // From project
        personName = req.body.person;
        resumeContent = project.getPersonContent(req.body.person);
      } else if (req.body.resumeText) {
        // Pasted text
        resumeContent = req.body.resumeText;
      } else if (req.file) {
        // Uploaded file
        resumeContent = await parseUploadedFile(req.file);
      } else {
        res.status(400).json({ error: "No resume content provided" });
        return;
      }

      // Get company context if specified
      let companyContent: string | undefined;
      let companyName: string | undefined;

      if (req.body.company) {
        companyName = req.body.company;
        companyContent = project.getCompanyContent(req.body.company);
      } else if (req.body.companyText) {
        companyContent = req.body.companyText;
      }

      // Get job context if specified
      let jobContent: string | undefined;
      let jobName: string | undefined;

      if (req.body.job && req.body.jobCompany) {
        jobName = req.body.job;
        jobContent = project.getJobContent(req.body.jobCompany, req.body.job);
        // Also load company if not already loaded
        if (!companyName) {
          companyName = req.body.jobCompany;
          companyContent = project.getCompanyContent(req.body.jobCompany);
        }
      } else if (req.body.jobText) {
        jobContent = req.body.jobText;
      }

      // Determine review type and run appropriate agent
      const hasCompany = !!companyContent;
      const hasJob = !!jobContent;

      let result: any;

      if (hasJob || hasCompany) {
        // Build combined context
        let context = "";
        if (companyContent) {
          context += `## Company Context\n\n${companyContent}\n\n`;
        }
        if (jobContent) {
          context += `## Job Description\n\n${jobContent}`;
        }

        const agent = new JobFitAgent();
        result = await agent.review(resumeContent, context);
      } else {
        const agent = new GeneralResumeAgent();
        result = await agent.review(resumeContent);
      }

      // Save result if requested
      if (req.body.save === "true" || req.body.save === true) {
        const resultType = results.getResultType(hasCompany, hasJob, false);
        const savedPath = results.saveResult(
          {
            type: resultType,
            timestamp: new Date().toISOString(),
            person: personName,
            personFile: personName
              ? `people/${personName}/person.md`
              : undefined,
            company: companyName,
            companyFile: companyName
              ? `companies/${companyName}/company.md`
              : undefined,
            job: jobName,
            jobFile:
              jobName && companyName
                ? `companies/${companyName}/jobs/${jobName}.md`
                : undefined,
          },
          result
        );
        result.savedPath = savedPath;
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// Build API
// ============================================================

// Unified build endpoint
app.post(
  "/api/build",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { project, results } = getManagers();

      // Get personal info content
      let personalInfo: string;
      let personName: string | undefined;

      if (req.body.person) {
        personName = req.body.person;
        personalInfo = project.getPersonContent(req.body.person);
      } else if (req.body.personalInfo) {
        personalInfo = req.body.personalInfo;
      } else {
        res.status(400).json({ error: "No personal info provided" });
        return;
      }

      // Get company context if specified
      let companyContent: string | undefined;
      let companyName: string | undefined;

      if (req.body.company) {
        companyName = req.body.company;
        companyContent = project.getCompanyContent(req.body.company);
      } else if (req.body.companyText) {
        companyContent = req.body.companyText;
      }

      // Get job description
      let jobContent: string;
      let jobName: string | undefined;

      if (req.body.job && req.body.jobCompany) {
        jobName = req.body.job;
        jobContent = project.getJobContent(req.body.jobCompany, req.body.job);
        if (!companyName) {
          companyName = req.body.jobCompany;
          companyContent = project.getCompanyContent(req.body.jobCompany);
        }
      } else if (req.body.jobDescription) {
        jobContent = req.body.jobDescription;
      } else {
        res.status(400).json({ error: "No job description provided" });
        return;
      }

      // Build combined job context
      let fullJobContext = "";
      if (companyContent) {
        fullJobContext += `## Company Context\n\n${companyContent}\n\n`;
      }
      fullJobContext += `## Job Description\n\n${jobContent}`;

      const agent = new ResumeBuilderAgent();
      const result = await agent.build(personalInfo, fullJobContext);

      // Build response with optional save paths
      const response: any = { ...result };

      // Save result if requested
      if (
        (req.body.save === "true" || req.body.save === true) &&
        personName &&
        companyName &&
        jobName
      ) {
        // Save to person's resumes folder
        response.resumePath = project.saveResume(
          personName,
          companyName,
          jobName,
          result.markdown
        );

        // Save result to results folder
        response.savedPath = results.saveResult(
          {
            type: "build",
            timestamp: new Date().toISOString(),
            person: personName,
            personFile: `people/${personName}/person.md`,
            company: companyName,
            companyFile: `companies/${companyName}/company.md`,
            job: jobName,
            jobFile: `companies/${companyName}/jobs/${jobName}.md`,
          },
          result
        );
      }

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// Legacy API Endpoints (backward compatibility)
// ============================================================

// General review endpoint (legacy)
app.post(
  "/api/review/general",
  upload.single("resume"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No resume file uploaded" });
        return;
      }

      const content = await parseUploadedFile(req.file);
      const agent = new GeneralResumeAgent();
      const result = await agent.review(content);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Job-fit review endpoint (legacy)
app.post(
  "/api/review/job-fit",
  upload.single("resume"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No resume file uploaded" });
        return;
      }

      const jobDescription = req.body.jobDescription;
      if (!jobDescription) {
        res.status(400).json({ error: "No job description provided" });
        return;
      }

      const content = await parseUploadedFile(req.file);
      const agent = new JobFitAgent();
      const result = await agent.review(content, jobDescription);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Export to PDF endpoint (using Puppeteer)
app.post(
  "/api/export/pdf",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { markdown } = req.body;

      if (!markdown) {
        res.status(400).json({ error: "No markdown content provided" });
        return;
      }

      // Convert markdown to simple HTML
      const html = markdownToHtml(markdown);

      // Use Puppeteer to generate PDF
      const puppeteer = require("puppeteer");
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
          top: "0.75in",
          right: "0.75in",
          bottom: "0.75in",
          left: "0.75in",
        },
        printBackground: true,
      });

      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="resume.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
);

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  let html = markdown
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Line breaks
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  // Wrap lists
  html = html.replace(/(<li>.*<\/li>)+/g, "<ul>$&</ul>");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Georgia', serif;
      line-height: 1.5;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 5px;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
    }
    h2 {
      font-size: 18px;
      margin-top: 20px;
      margin-bottom: 10px;
      color: #444;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    h3 {
      font-size: 16px;
      margin-top: 15px;
      margin-bottom: 5px;
    }
    ul {
      margin: 5px 0;
      padding-left: 20px;
    }
    li {
      margin: 3px 0;
    }
    p {
      margin: 10px 0;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

// Serve React app for root (or redirect to Vite in dev)
app.get("/", (_req: Request, res: Response) => {
  const indexPath = path.join(clientBuildPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // In development, redirect to Vite dev server
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0; url=http://localhost:5173">
          <title>Redirecting...</title>
        </head>
        <body>
          <p>Redirecting to <a href="http://localhost:5173">http://localhost:5173</a>...</p>
          <p>Run <code>npm run dev</code> to start the development servers.</p>
        </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Resume Reviewer server running at http://localhost:${PORT}`);
});

export default app;
