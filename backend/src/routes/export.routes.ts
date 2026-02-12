import { Router, Response } from "express";
import { marked } from "marked";
import puppeteer from "puppeteer";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { supabase } from "../services/supabase.service";
import { logActivity } from "../services/activity.service";
import { markdownToDocxBuffer } from "../utils/markdown-to-docx";

const router = Router();

router.use(authMiddleware);

const VALID_FORMATS = ["markdown", "pdf", "docx"] as const;
const VALID_ENTITY_TYPES = ["resume", "company", "job"] as const;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "export";
}

function sendMarkdown(
  res: Response,
  content: string,
  filename: string
): void {
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${sanitizeFilename(filename)}.md"`
  );
  res.send(content);
}

async function sendPdf(
  res: Response,
  html: string,
  filename: string
): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #333; }
    h1 { font-size: 1.5rem; margin-top: 1.5rem; }
    h2 { font-size: 1.25rem; margin-top: 1.25rem; }
    h3 { font-size: 1.1rem; margin-top: 1rem; }
    p { margin: 0.5rem 0; }
    ul, ol { margin: 0.5rem 0; padding-left: 1.5rem; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
      printBackground: true,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(filename)}.pdf"`
    );
    res.send(Buffer.from(pdfBuffer));
  } finally {
    await browser.close();
  }
}

async function sendDocx(
  res: Response,
  markdown: string,
  title: string,
  filename: string
): Promise<void> {
  const buffer = await markdownToDocxBuffer(markdown, title);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${sanitizeFilename(filename)}.docx"`
  );
  res.send(buffer);
}

/**
 * GET /api/export/profile?format=markdown|pdf|docx
 */
router.get(
  "/profile",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const format = (req.query.format as string)?.toLowerCase();
    if (!format || !VALID_FORMATS.includes(format as (typeof VALID_FORMATS)[number])) {
      res.status(400).json({ error: "Invalid or missing format. Use: markdown, pdf, or docx" });
      return;
    }

    const userId = req.user.id;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("content, display_name")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const content = profile.content || "";
    const name = (profile.display_name as string) || "profile";

    await logActivity({
      userId,
      action: "export",
      entityType: "profile",
      displayTitle: `Exported profile as ${format}`,
      details: { format },
    });

    if (format === "markdown") {
      sendMarkdown(res, content, name);
      return;
    }
    if (format === "pdf") {
      const html = marked.parse(content) as string;
      await sendPdf(res, html, name);
      return;
    }
    if (format === "docx") {
      await sendDocx(res, content, "", name);
      return;
    }
  })
);

/**
 * GET /api/export/:entityType/:entityId?format=markdown|pdf|docx
 */
router.get(
  "/:entityType/:entityId",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { entityType, entityId } = req.params;
    const format = (req.query.format as string)?.toLowerCase();

    if (!VALID_ENTITY_TYPES.includes(entityType as (typeof VALID_ENTITY_TYPES)[number])) {
      res.status(400).json({ error: "Invalid entityType. Use: resume, company, or job" });
      return;
    }
    if (!format || !VALID_FORMATS.includes(format as (typeof VALID_FORMATS)[number])) {
      res.status(400).json({ error: "Invalid or missing format. Use: markdown, pdf, or docx" });
      return;
    }

    const userId = req.user.id;
    const table =
      entityType === "resume"
        ? "resumes"
        : entityType === "company"
          ? "companies"
          : "jobs";
    const nameColumn = entityType === "resume" ? "title" : entityType === "company" ? "name" : "title";

    const { data: row, error } = await supabase
      .from(table)
      .select("content, " + nameColumn)
      .eq("id", entityId)
      .eq("user_id", userId)
      .single();

    if (error || !row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const content = (row as any).content || "";
    const name = ((row as any)[nameColumn] as string) || entityType;

    await logActivity({
      userId,
      action: "export",
      entityType,
      entityId,
      displayTitle: `Exported ${entityType} as ${format}`,
      details: { format },
    });

    if (format === "markdown") {
      sendMarkdown(res, content, name);
      return;
    }
    if (format === "pdf") {
      const html = marked.parse(content) as string;
      await sendPdf(res, html, name);
      return;
    }
    if (format === "docx") {
      await sendDocx(res, content, "", name);
      return;
    }
  })
);

export default router;
