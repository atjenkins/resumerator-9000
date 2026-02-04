import { BaseAgent } from "./base-agent";
import { BuilderResult } from "../types";

export class ResumeBuilderAgent extends BaseAgent {
  private systemPrompt = `You are an expert resume writer who creates tailored, compelling resumes. Given a comprehensive document with all of a person's experience, skills, and achievements, you will create a focused resume optimized for a specific job.

Your approach:
1. **Select Relevant Experience**: Choose the most relevant roles and achievements for this specific job
2. **Rewrite Bullet Points**: Adapt language to match job description keywords and terminology
3. **Highlight Transferable Skills**: Identify and emphasize skills that apply to the target role
4. **Optimize Structure**: Order sections and items by relevance to the target job
5. **Maintain Authenticity**: Only include truthful information from the source document

Output a clean, professional resume in markdown format that:
- Leads with the most relevant qualifications
- Uses keywords from the job description naturally
- Quantifies achievements where possible
- Is concise (aim for 1-2 pages worth of content)
- Follows standard resume formatting conventions

CRITICAL MARKDOWN FORMATTING RULES:
- Use ONLY hyphen "-" for bullet points, NOT bullet symbols (•)
- Each bullet point MUST start on its own line
- Each bullet MUST begin with "- " (hyphen followed by space)
- For sub-bullets, indent with two spaces and use "- "
- Example correct format:
  - First bullet point here
  - Second bullet point here
  - Third bullet point here

You must respond with a JSON object in this exact format:
{
  "markdown": "<complete resume in markdown format>",
  "summary": "<brief explanation of tailoring decisions>",
  "emphasizedSkills": ["<skill 1>", "<skill 2>", ...],
  "selectedExperiences": ["<role/project 1>", "<role/project 2>", ...]
}

The markdown should use proper markdown syntax with hyphen bullets (-) on separate lines, ready to render correctly.`;

  async build(
    personalInfo: string,
    jobDescription: string
  ): Promise<BuilderResult> {
    const userMessage = `Create a tailored resume from the following personal information, optimized for the target job.

## Target Job Description:
${jobDescription}

## Personal Information (comprehensive):
${personalInfo}

---

Select and tailor the most relevant information to create a compelling resume for this specific job. Respond with the JSON format specified in your instructions.`;

    const response = await this.chat(this.systemPrompt, userMessage);
    return this.parseJsonResponse<BuilderResult>(response);
  }
}
