import { BaseAgent } from "./base-agent";

export class ImportAgent extends BaseAgent {
  /**
   * Parse resume and structure into person.md format
   */
  async parseResume(resumeText: string): Promise<string> {
    const systemPrompt = `You are a resume parsing assistant. Your job is to take raw resume
    text and structure it into clean, organized markdown format. This markdown file is more of
     an overview of the person than a resume. It should prioritize completeness and accuracy 
     and readability. It does not need to be brief. It will be used to build a resume.`;

    const userMessage = `Parse this resume. Extract all relevant information and organize it clearly.

RESUME TEXT:
${resumeText}

Generate a markdown file and follow this general structure. If the user has extra information adjust the structure to fit the information.

# [Full Name]
email@example.com | (phone) | City, State
linkedin.com/in/profile | github.com/username

## Summary
[Professional summary from resume]

## Experience

### Job Title
Company: [Company Name]
Dates: [YYYY - YYYY]
Location: [City, State]

- [Achievement/responsibility with quantifiable results if possible]
- [Another accomplishment]

[Repeat for each job]

## Education

### Degree - Major
**University** | YYYY
[Any honors, GPA if notable]

## Skills

### Technical
- **Languages**: [programming languages]
- **Frameworks**: [frameworks and libraries]
- **Tools**: [development tools, platforms]

### Soft Skills
- [Communication, leadership, etc.]

## Projects

### Project Name
**Technologies**: [tech stack]
- [Description and impact]

Rules:
- Extract the person's name and use it in the header
- Organize work experience chronologically (most recent first)
- Preserve specific achievements and metrics
- Include all technical skills mentioned
- Keep the exact structure shown above
- If a section has no content from the resume, include the section header but leave it empty
- Use consistent formatting
- CRITICAL: Use ONLY hyphen "-" for bullet points, NOT bullet symbols (•)
- CRITICAL: Each bullet point MUST start on its own line with "- " (hyphen + space)

Return ONLY the markdown content, no explanations.`;

    const response = await this.chat(systemPrompt, userMessage);
    return response;
  }

  /**
   * Merge new resume data with existing person profile
   */
  async mergeProfiles(
    existingProfile: string,
    newResume: string
  ): Promise<string> {
    const systemPrompt = `You are a resume merging assistant. Your job is to intelligently combine information from multiple sources into a single comprehensive profile without duplication.`;

    const userMessage = `Intelligently merge these two profiles into a single comprehensive person.md file.

EXISTING PROFILE:
${existingProfile}

NEW RESUME:
${newResume}

Rules for merging:
1. Add any new experiences, skills, or projects not in the existing profile
2. Deduplicate similar entries (e.g., same company/role but maybe different dates/details)
3. When there's overlap, preserve the more detailed or accurate information
4. Maintain chronological order (most recent first) for experiences
5. If there's conflicting information (like different date ranges), prefer the NEW resume data
6. Combine skill lists without duplication
7. Maintain the same markdown structure as the existing profile
8. Keep the format clean and consistent
9. CRITICAL: Use ONLY hyphen "-" for bullet points, NOT bullet symbols (•)
10. CRITICAL: Each bullet point MUST start on its own line with "- " (hyphen + space)

Generate the merged profile maintaining the general structure:

# [Name]
contact info

## Summary
...

## Experience
...

## Education
...

## Skills
...

## Projects
...

Return ONLY the merged markdown content, no explanations.`;

    const response = await this.chat(systemPrompt, userMessage);
    return response;
  }

  /**
   * Structure raw JD text into organized markdown
   */
  async processJobDescription(jdText: string): Promise<string> {
    const systemPrompt = `You are a job description structuring assistant. Your job is to take raw job posting text and organize it into clear, scannable markdown format.`;

    const userMessage = `Structure this job description into well-organized markdown. Don't change the content, just organize it clearly.

JOB DESCRIPTION TEXT:
${jdText}

Generate a markdown file with this general structure. If any areas are missing, leave the section header but leave it empty:

# [Job Title]

## About the company
[Industry, company size, stage (startup/established), mission statement, what they do]


## Role Overview
[Brief role summary, team context, what the role is about]

## Responsibilities
- [Key duty 1]
- [Key duty 2]
- [etc.]

## Basic Qualifications
- [Must-have qualification 1]
- [Must-have qualification 2]
- [etc.]

## Preferred Qualifications
- [Preferred qualification 1]
- [Preferred qualification 2]
- [etc.]

## Compensation & Benefits
[Salary range, equity, benefits, perks if mentioned]

## Additional Details
[Remote policy, location, team size, anything else relevant]

Rules:
- Extract the job title from the content
- Clearly separate must-have requirements from nice-to-have
- Pull out all specific technologies, tools, or skills mentioned
- Preserve important details like years of experience required
- Keep the tone and language from the original JD
- If a section has no content, you can omit it or leave it empty
- Make responsibilities and requirements into clear bullet points

Return ONLY the markdown content, no explanations.`;

    const response = await this.chat(systemPrompt, userMessage);
    return response;
  }

  /**
   * Add new JD information to existing job.md
   */
  async appendJobDescription(
    existingJob: string,
    newInfo: string
  ): Promise<string> {
    const systemPrompt = `You are a job description updating assistant. Your job is to intelligently integrate new information into existing job descriptions without duplication.`;

    const userMessage = `Add this new information to the existing job description. Integrate it intelligently without duplication.

EXISTING JOB DESCRIPTION:
${existingJob}

NEW INFORMATION:
${newInfo}

Rules:
- Integrate new information into the appropriate sections
- Don't duplicate information that's already present
- Maintain the existing structure and formatting
- If new info contradicts existing info, prefer the new information
- Add new sections if the information warrants it (e.g., new "Benefits" section if not present)
- Keep it organized and readable
- Combine bullet points logically

Return ONLY the updated markdown content, no explanations.`;

    const response = await this.chat(systemPrompt, userMessage);
    return response;
  }

  /**
   * Structure company information into organized markdown
   */
  async processCompanyInfo(companyText: string): Promise<string> {
    const systemPrompt = `You are a company profile structuring assistant. Your job is to take raw company information and organize it into clear, useful markdown format for resume tailoring.`;

    const userMessage = `Structure this company information into well-organized markdown. Don't change the content, just organize it clearly.

COMPANY INFORMATION:
${companyText}

Generate a markdown file with this general structure:

# [Company Name]

## About
[Industry, company size, stage (startup/established), mission statement, what they do]

## Tech Stack
[Known technologies, frameworks, tools, platforms they use]

## Culture & Values
[Work environment, what they emphasize in hiring, company values]

## Interview Process
[Known interview stages, question types, assessment methods if available]

## Recent News
[Recent achievements, funding rounds, product launches, etc.]

## Notes
[Any other relevant context for job applicants]

Rules:
- Be concise but informative
- Focus on information useful for tailoring a resume
- Include all specific technologies and tools mentioned
- Note company size, stage (startup/established), industry
- Highlight cultural values and what they look for in candidates
- If information is not available for a section, leave it empty with a comment like "<!-- Research needed -->"
- Organize information logically within each section

Return ONLY the markdown content, no explanations.`;

    const response = await this.chat(systemPrompt, userMessage);
    return response;
  }

  /**
   * Add new company information to existing company.md
   */
  async appendCompanyInfo(
    existingCompany: string,
    newInfo: string
  ): Promise<string> {
    const systemPrompt = `You are a company profile updating assistant. Your job is to intelligently integrate new information into existing company profiles without duplication.`;

    const userMessage = `Add this new information to the existing company profile. Integrate it intelligently without duplication.

EXISTING COMPANY PROFILE:
${existingCompany}

NEW INFORMATION:
${newInfo}

Rules:
- Integrate new information into the appropriate sections
- Don't duplicate information that's already present
- Maintain the existing structure and formatting
- If new info contradicts existing info, prefer the new information
- Add new sections if the information warrants it
- Keep it focused on resume-building context (tech stack, culture, interview process, etc.)
- Maintain consistent formatting

Return ONLY the updated markdown content, no explanations.`;

    const response = await this.chat(systemPrompt, userMessage);
    return response;
  }
}
