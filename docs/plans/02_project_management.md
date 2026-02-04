# Plan 02: Project Management & Persistent Context

## Overview
Add project-level management for resume building with persistent files for candidates, companies, and jobs. This enables iterative context building and keeps a history of reviews with clear input traceability.

## Directory Structure

```
C:/code/test-project-claude/
└── resume-data/
    ├── templates/
    │   ├── person.md              # Template for new people
    │   ├── company.md             # Template for new companies
    │   └── job.md                 # Template for new jobs
    │
    ├── people/
    │   └── <person-name>/
    │       ├── global.md          # Comprehensive personal info
    │       └── resumes/
    │           └── <company>_<job>_<timestamp>.md
    │
    ├── companies/
    │   └── <company-name>/
    │       ├── global.md          # Company context (culture, tech stack)
    │       └── jobs/
    │           └── <job-title>.md # Job description
    │
    └── results/
        └── <timestamp>_<type>_<person>_<company>_<job>.md
        # Example: 2024-01-29_143022_jobfit_john-doe_acme-corp_senior-engineer.md
```

## Result File Format
Each result file should include metadata header for traceability:

```markdown
---
type: job-fit | general | build
timestamp: 2024-01-29T14:30:22Z
person: john-doe
person_file: people/john-doe/global.md
company: acme-corp
company_file: companies/acme-corp/global.md
job: senior-engineer
job_file: companies/acme-corp/jobs/senior-engineer.md
---

# Job Fit Review Results

Score: 85/100
...
```

## CLI Changes

### New Commands

```bash
# Initialize project structure
npx resume-review init

# List available people/companies/jobs
npx resume-review list people
npx resume-review list companies
npx resume-review list jobs <company>

# Create new entries
npx resume-review add person <name>
npx resume-review add company <name>
npx resume-review add job <company> <job-title>

# Run reviews with flexible context selection
npx resume-review review --person <name>                                    # General review
npx resume-review review --person <name> --company <company>                # With company context
npx resume-review review --person <name> --job <company>/<job>              # With job context
npx resume-review review --person <name> --company <company> --job <job>    # Full context

# Build tailored resume (requires at least job context)
npx resume-review build --person <name> --job <company>/<job>
npx resume-review build --person <name> --company <company> --job <job>

# View past results
npx resume-review results [--person <name>] [--company <company>] [--type <type>]

# Load result back for re-review or iteration
npx resume-review reload <result-file>
```

### Backward Compatibility
Keep existing file-path based commands working:
```bash
npx resume-review general ./my-resume.pdf
npx resume-review job-fit ./resume.pdf --job ./job.txt
```

## Web Dashboard Changes

### Project Browser (New Tab or Sidebar)
- Tree view of people/companies/jobs
- Create/edit/delete entries
- Quick selection for reviews

### Review Tab Updates
- **Dual input mode for each field**: Select from project OR paste text directly
- **Separate "Run Review" button** (not overloaded on review type buttons)
- **Flexible context selection**: User chooses which context to include:
  - None (pure general review)
  - Company only (review against company culture/values)
  - Job only (review against specific job requirements)
  - Both company and job (full context)

```
┌──────────────────────────────────────────────────────────────┐
│  Resume / Personal Info (required)                           │
│  ○ From Project  ○ Paste Text  ○ Upload File                 │
│  [▼ john-doe          ]  or  [textarea...]  or  [Choose...]  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Company Context (optional)                                  │
│  ☐ Include company context                                   │
│  ○ From Project  ○ Paste Text                                │
│  [▼ acme-corp         ]  or  [textarea...]                   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Job Description (optional)                                  │
│  ☐ Include job description                                   │
│  ○ From Project  ○ Paste Text                                │
│  [▼ acme-corp/senior-engineer]  or  [textarea...]            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Action                                                      │
│  ○ Review (analyze fit)    ○ Build (generate tailored resume)│
│                                                              │
│  [ Run ]                                                     │
└──────────────────────────────────────────────────────────────┘
```

**Input modes per field:**
- **From Project**: Dropdown to select saved person/company/job
- **Paste Text**: Textarea to paste markdown directly (for quick one-off reviews)
- **Upload File**: File picker for PDF/DOCX/MD (resume input only)

**Review behavior based on context selected:**
- No context: General best-practices review
- Company only: Review + company culture/values fit
- Job only: Review + job requirements fit
- Both: Full job-fit analysis with company context

### Build Tab Updates
- Same dual input mode UI (project select OR paste text for each field)
- Job description required for build (need something to tailor against)
- Company context optional but recommended
- Preview pane shows selected/pasted content before running
- Live preview of generated resume with edit capability

### Results Tab (New)
- List past results with filters (person, company, type, date)
- Click to view full result
- "Re-run" button to run same inputs again
- "Load into Editor" to iterate on inputs

## Configuration

Add `resume-reviewer.config.json` or use `.env`:

```json
{
  "projectRoot": "C:/code/test-project-claude",
  "defaultPerson": "john-doe"
}
```

Or environment variable:
```
RESUME_REVIEWER_PROJECT_ROOT=C:/code/test-project-claude
```

## Implementation Order

1. Create project structure utilities (init, list, add commands)
2. Add config file support for project root
3. Update CLI to support `--person`, `--company`, `--job` flags
4. Create result file writer with metadata header
5. Add result listing and filtering
6. Update web dashboard with project browser
7. Add separate "Run Review" button to web UI
8. Add Results tab to web dashboard
9. Add reload/re-run functionality

## File Templates

### Person global.md template
```markdown
# [Your Name]
email | phone | location
linkedin | github | portfolio

## Summary
...

## Experience
...

## Skills
...

## Education
...

## Projects
...
```

### Company global.md template
```markdown
# [Company Name]

## About
Industry, size, stage, mission

## Tech Stack
Known technologies used

## Culture & Values
What they emphasize in hiring

## Notes
Any other relevant context
```

### Job description template
```markdown
# [Job Title]

## Overview
Role summary

## Responsibilities
- ...

## Requirements
- ...

## Nice to Have
- ...

## Notes
Salary range, remote policy, team info, etc.
```

## Decisions Made
- **Single global.md per person**: One comprehensive file; the builder agent selects relevant parts
- **Flexible context selection**: User explicitly chooses whether to include company, job, or both context for any review
- **Keep all results**: No auto-deletion or archiving; manual cleanup only
- **Dual input mode**: Each field (person, company, job) can be sourced from project files OR pasted directly for quick one-off use

## Open Questions
- None currently
