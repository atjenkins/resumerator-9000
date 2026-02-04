# Resume Reviewer Project Plan

## Overview
A Node.js/TypeScript application with three AI agents for resume review and generation, featuring both CLI and web interfaces.

## Agents

### 1. General Resume Agent
- Reviews resume for best practices (formatting, structure, action verbs, quantifiable achievements)
- Checks for common mistakes (typos, inconsistent formatting, missing sections)
- Provides general improvement suggestions
- No job-specific context needed

### 2. Job-Fit Agent
- Configured with job description/requirements before review
- Analyzes resume-to-job alignment
- Rates fit (score + breakdown by category)
- Identifies missing keywords/skills
- Suggests targeted improvements
- Highlights transferable experience

### 3. Resume Builder Agent
- **Input**: Markdown file with all your info (experience, skills, education, projects - everything, unfiltered)
- **Input**: Target job description
- **Output**: Tailored resume markdown selecting and emphasizing relevant experience
- Rewrites bullet points to match job keywords
- Selects most relevant projects/experience
- Outputs standard markdown format compatible with existing resume renderers

## Tech Stack
- **Runtime**: Node.js with TypeScript
- **LLM**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **PDF Parsing**: `pdf-parse`
- **DOCX Parsing**: `mammoth`
- **Web Framework**: Express.js + simple HTML/CSS/JS dashboard (no heavy frontend framework)
- **CLI**: Commander.js

## Project Structure
```
resume-reviewer/
├── src/
│   ├── agents/
│   │   ├── base-agent.ts        # Shared agent logic
│   │   ├── general-agent.ts     # Best practices reviewer
│   │   ├── job-fit-agent.ts     # Job-specific reviewer
│   │   └── builder-agent.ts     # Resume generator from raw info
│   ├── parsers/
│   │   ├── pdf-parser.ts
│   │   └── docx-parser.ts
│   ├── templates/
│   │   └── resume-schema.md     # Example schema for personal info file
│   ├── web/
│   │   ├── server.ts            # Express server
│   │   └── public/              # Dashboard HTML/CSS/JS
│   ├── cli/
│   │   └── index.ts             # CLI entry point
│   └── types/
│       └── index.ts             # Shared TypeScript types
├── package.json
├── tsconfig.json
└── .env.example                 # ANTHROPIC_API_KEY placeholder
```

## Key Features

### CLI Usage
```bash
# General review
npx resume-review general ./resume.pdf

# Job-fit review (with job description file)
npx resume-review job-fit ./resume.pdf --job ./job-description.txt

# Job-fit review (with inline job description)
npx resume-review job-fit ./resume.pdf --job-text "We are looking for..."

# Build tailored resume from personal info
npx resume-review build ./my-info.md --job ./job-description.txt --output ./tailored-resume.md
```

### Personal Info Markdown Format
You create one comprehensive markdown file with ALL your info:
```markdown
# John Doe
email: john@example.com | phone: 555-1234 | linkedin: /in/johndoe

## Summary
10 years of software engineering experience...

## Experience
### Senior Engineer @ Company A (2020-present)
- Led migration of monolith to microservices
- Reduced deployment time by 80%
- Mentored team of 5 junior developers
...all your experience, not just highlights...

## Skills
- Languages: TypeScript, Python, Go, Rust
- Frameworks: React, Node.js, Django
...everything you know...

## Projects
### Side Project 1
- Built a thing that does X
...all projects, even minor ones...
```

The Builder Agent selects and tailors from this comprehensive file.

### Web Dashboard
- **Review Tab**: Upload resume (PDF/DOCX), get general or job-fit review
- **Build Tab**: Paste/upload personal info markdown + job description, generate tailored resume
- View review results with:
  - Overall score/rating
  - Category breakdowns
  - Specific suggestions
- View generated resume with:
  - Live markdown preview
  - Download as MD or PDF
  - Edit and regenerate

## Agent Response Format
Both agents return structured feedback:
```typescript
interface ReviewResult {
  score: number;              // 1-100
  summary: string;            // Brief overall assessment
  strengths: string[];        // What's working well
  improvements: string[];     // Specific suggestions
  categories: {
    name: string;
    score: number;
    feedback: string;
  }[];
}
```

## PDF Rendering (for Builder output)
The Builder Agent outputs markdown. For PDF conversion, we can integrate with:
- **there4/markdown-resume** - CLI tool: `md2resume pdf resume.md`
- **Pandoc** - Universal converter: `pandoc resume.md -o resume.pdf`
- **Puppeteer** - Render HTML to PDF (built-in option)

We'll include Puppeteer-based PDF export as a built-in option, with instructions for using external tools.

## Implementation Order
1. Set up project (package.json, tsconfig, dependencies)
2. Implement file parsers (PDF, DOCX, Markdown)
3. Create base agent class with Claude integration
4. Implement General Resume Agent
5. Implement Job-Fit Agent
6. Implement Resume Builder Agent
7. Build CLI interface
8. Build web server and dashboard
9. Add PDF export option (Puppeteer)

## Verification
- Test CLI with sample PDF and DOCX resumes
- Test web upload and review flow
- Verify review agents return structured feedback
- Test job-fit agent with various job descriptions
- Test builder agent: create sample personal info markdown, generate resume for different job types
- Test PDF export from generated markdown
