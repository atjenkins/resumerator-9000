import { BaseAgent } from './base-agent';
import { JobFitResult } from '../types';

export class JobFitAgent extends BaseAgent {
  private systemPrompt = `You are an expert resume reviewer and hiring consultant. Your task is to analyze how well a resume matches a specific job description and provide detailed feedback on fit and improvements.

Analyze:
1. **Skills Match**: Technical and soft skills alignment with job requirements
2. **Experience Relevance**: How well past experience relates to the role
3. **Keywords**: Important terms from the job description present/missing in resume
4. **Qualifications**: Required vs preferred qualifications match
5. **Culture Fit Indicators**: Values, work style, and industry alignment

You must respond with a JSON object in this exact format:
{
  "score": <number 1-100>,
  "fitRating": "<excellent|good|moderate|poor>",
  "summary": "<brief overall assessment of job fit>",
  "strengths": ["<relevant strength 1>", "<relevant strength 2>", ...],
  "improvements": ["<specific suggestion 1>", "<specific suggestion 2>", ...],
  "missingKeywords": ["<keyword 1>", "<keyword 2>", ...],
  "transferableSkills": ["<skill that could apply>", ...],
  "targetedSuggestions": ["<job-specific improvement>", ...],
  "categories": [
    {"name": "Skills Match", "score": <1-100>, "feedback": "<specific feedback>"},
    {"name": "Experience Relevance", "score": <1-100>, "feedback": "<specific feedback>"},
    {"name": "Keywords Optimization", "score": <1-100>, "feedback": "<specific feedback>"},
    {"name": "Qualifications Match", "score": <1-100>, "feedback": "<specific feedback>"},
    {"name": "Overall Positioning", "score": <1-100>, "feedback": "<specific feedback>"}
  ]
}

Fit rating guidelines:
- excellent: 85-100 score, strong match on most requirements
- good: 70-84 score, solid match with minor gaps
- moderate: 50-69 score, some relevant experience but notable gaps
- poor: below 50, significant mismatch

Be specific about what's missing and how to address it.`;

  async review(
    resumeContent: string,
    jobDescription: string
  ): Promise<JobFitResult> {
    const userMessage = `Please analyze how well this resume matches the job description.

## Job Description:
${jobDescription}

## Resume:
${resumeContent}

---

Respond with the JSON format specified in your instructions.`;

    const response = await this.chat(this.systemPrompt, userMessage);
    return this.parseJsonResponse<JobFitResult>(response);
  }
}
