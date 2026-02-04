# Plan 03: Data Import & Markdown Editing

## Overview
Expand the resume builder app to support intelligent data import and in-app markdown editing. Users provide all context (resumes, job descriptions, company info), and AI helps structure it into clean markdown files. This creates a complete workflow from raw text inputs to structured markdown files to tailored resume generation.

## Goals
1. **Resume Import**: Convert existing PDF/DOCX resumes into person.md files with AI-powered parsing
2. **Job Description Processing**: Paste raw JD text and have AI organize it into structured markdown
3. **Company Info Processing**: Paste company information and have AI organize it into company.md
4. **Markdown Editing**: Edit person/company/job markdown files directly in the app with live preview
5. **File Naming Consistency**: Migrate from `global.md` to `person.md` and `company.md`

## Philosophy
**User provides context, AI structures it.** The app doesn't do web scraping or external research. Users gather their own information (from company websites, job postings, their research) and paste it in. The AI's job is to organize that information into well-structured markdown files.

> **Tip for Users**: You can do your research externally and even use other AI tools (ChatGPT, Claude, etc.) with our templates to pre-structure information before pasting it into the app. The app will help refine and organize it further.

## User Workflow
```
┌─────────────────────────────────────────────────────────────┐
│  SECTION 1: Data Management & Editing                       │
│  - Import resume → AI parses → person.md (new or merge)     │
│  - Paste JD text → AI structures → job.md (new or append)   │
│  - Paste company info → AI structures → company.md (new or append) │
│  - Edit markdown files (split view: editor | preview)       │
│  - Save changes                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  SECTION 2: Resume Review & Builder (existing)              │
│  - Select person/company/job from project                   │
│  - Run review or build tailored resume                      │
│  - View results                                             │
└─────────────────────────────────────────────────────────────┘
```

## UI Architecture

### New Tab: "Data Manager" or "Setup"
This tab appears before the Review/Build tabs and contains:

```
┌──────────────────────────────────────────────────────────────┐
│  [Data Manager] [Review] [Build] [Results]                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  DATA IMPORT & RESEARCH                                  ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │ Import Resume                                        │││
│  │  │ ○ Create New Person  ○ Merge with Existing         │││
│  │  │ [If merge: ▼ Select Person]                         │││
│  │  │ [Upload PDF/DOCX] or [Paste Resume Text]            │││
│  │  │ [Import & Process with AI]                          │││
│  │  └─────────────────────────────────────────────────────┘││
│  │                                                          ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │ Process Job Description                             │││
│  │  │ Company: [▼ Select Company] Job Name: [_______]     │││
│  │  │ [Paste JD Text - textarea]                          │││
│  │  │ [Process with AI]                                   │││
│  │  └─────────────────────────────────────────────────────┘││
│  │                                                          ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │ Process Company Information                          │││
│  │  │ ○ Create New Company  ○ Add to Existing             │││
│  │  │ [If add: ▼ Select Company]                           │││
│  │  │ Company Name: [_________]                            │││
│  │  │ [Paste Company Info - textarea]                      │││
│  │  │ (Research externally, paste info here)               │││
│  │  │ [Process with AI]                                    │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  MARKDOWN EDITOR                                         ││
│  │  View/Edit: ○ Person  ○ Company  ○ Job                  ││
│  │  [▼ Select File to Edit]                                ││
│  │                                                          ││
│  │  ┌──────────────────────┬──────────────────────────────┐││
│  │  │ # Arik               │ Arik                          │││
│  │  │ email | phone        │ email | phone                 │││
│  │  │                      │                               │││
│  │  │ ## Summary           │ Summary                       │││
│  │  │ ...                  │ ...                           │││
│  │  │                      │                               │││
│  │  │ [Markdown Editor]    │ [Live Preview]                │││
│  │  │                      │                               │││
│  │  └──────────────────────┴──────────────────────────────┘││
│  │                                                          ││
│  │  [Save Changes] [Discard Changes]                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Feature Details

### 1. Resume Import with AI Parsing

**API Endpoint**: `POST /api/import/resume`

**Request Body**:
```typescript
{
  mode: 'create' | 'merge',
  personName?: string,  // Required if mode is 'merge'
  newPersonName?: string,  // Required if mode is 'create'
  resumeFile?: File,    // PDF or DOCX
  resumeText?: string   // Or pasted text
}
```

**Process**:
1. Parse PDF/DOCX to text (use existing parsers)
2. Send to AI agent with prompt:
   ```
   Parse this resume and structure it into the following markdown format:
   
   # [Name]
   contact info
   
   ## Summary
   ...
   
   ## Experience
   ### Job Title @ Company (YYYY - YYYY)
   - accomplishment
   
   ## Education
   ...
   
   ## Skills
   ...
   
   ## Projects
   ...
   ```
3. If mode is 'create': Save as new `person.md`
4. If mode is 'merge': 
   - Load existing `person.md`
   - Send both to AI agent with merge prompt:
     ```
     Intelligently merge these two profiles:
     
     EXISTING PROFILE:
     [current person.md]
     
     NEW RESUME:
     [parsed resume]
     
     Rules for merging:
     - Add any new experiences, skills, or projects not in existing profile
     - Deduplicate similar entries (same company/role but maybe different dates)
     - Preserve more detailed information when there's overlap
     - Maintain chronological order
     - If conflicting information, prefer the NEW resume data
     - Keep the same markdown structure
     ```
   - Save merged result

**Response**:
```typescript
{
  success: boolean,
  personName: string,
  filePath: string,
  preview: string  // First 500 chars of result
}
```

### 2. Job Description Processing

**API Endpoint**: `POST /api/import/job`

**Request Body**:
```typescript
{
  mode: 'create' | 'append',
  company: string,      // Company slug
  jobName: string,      // Will be slugified (for create) or existing (for append)
  jobText: string       // Raw JD text (pasted)
}
```

**Process**:
1. If mode is 'create': Send to AI agent with prompt:
   ```
   Structure this job description into well-organized markdown:
   
   # [Job Title]
   
   ## Overview
   Brief role summary
   
   ## Responsibilities
   - Key duties
   
   ## Requirements
   - Must-have qualifications
   
   ## Nice to Have
   - Preferred qualifications
   
   ## Compensation & Benefits
   Salary, benefits, perks if mentioned
   
   ## Additional Details
   Remote policy, location, team size, etc.
   
   Rules:
   - Extract the job title from the content
   - Organize requirements vs nice-to-have clearly
   - Pull out any specific technologies, tools, or skills mentioned
   - Preserve important details like years of experience required
   - Keep the tone and language from the original JD
   - If a section has no content, include it but leave it empty
   ```

2. If mode is 'append': 
   - Load existing job.md
   - Send both to AI agent with append prompt:
     ```
     Add this new information to the existing job description:
     
     EXISTING JOB DESCRIPTION:
     [current job.md]
     
     NEW INFORMATION:
     [pasted text]
     
     Rules:
     - Integrate new information into appropriate sections
     - Don't duplicate information already present
     - Maintain the existing structure and formatting
     - If new info contradicts existing, prefer the new info
     - Add new sections if needed
     ```

3. Save as `companies/{company}/jobs/{job-slug}.md`

**Response**:
```typescript
{
  success: boolean,
  jobName: string,
  filePath: string,
  preview: string
}
```

### 3. Company Information Processing

**API Endpoint**: `POST /api/import/company`

**Request Body**:
```typescript
{
  mode: 'create' | 'append',
  companyName: string,  // Will be slugified (for create) or existing (for append)
  companyText: string   // Pasted company information
}
```

**Process**:
1. If mode is 'create': Send to AI agent with prompt:
   ```
   Structure this company information into well-organized markdown:
   
   # [Company Name]
   
   ## About
   Industry, size, stage, mission statement
   
   ## Tech Stack
   Known technologies, frameworks, tools, platforms
   
   ## Culture & Values
   Work environment, what they emphasize in hiring
   
   ## Interview Process
   Known interview stages, question types (if available)
   
   ## Recent News
   Recent achievements, funding, product launches, etc.
   
   ## Notes
   Any other relevant context for job applicants
   
   Rules:
   - Be concise but informative
   - Focus on information useful for tailoring a resume
   - Include specific technologies and tools mentioned
   - Note company size, stage (startup/established), industry
   - Highlight cultural values if mentioned
   - If information is not available for a section, leave it empty with a comment
   - Organize information logically within each section
   ```

2. If mode is 'append':
   - Load existing company.md
   - Send both to AI agent with append prompt:
     ```
     Add this new information to the existing company profile:
     
     EXISTING COMPANY PROFILE:
     [current company.md]
     
     NEW INFORMATION:
     [pasted text]
     
     Rules:
     - Integrate new information into appropriate sections
     - Don't duplicate information already present
     - Maintain the existing structure and formatting
     - If new info contradicts existing, prefer the new info
     - Add new sections if the information warrants it
     - Keep it focused on resume-building context
     ```

3. Save as `companies/{company-slug}/company.md`

**Response**:
```typescript
{
  success: boolean,
  companyName: string,
  filePath: string,
  preview: string
}
```

> **Note to Users**: Do your research externally (company website, Glassdoor, LinkedIn, news articles, etc.) and paste the information here. You can even copy our company.md template and ask ChatGPT or Claude to fill it out based on your research, then paste the result here for final processing.

### 4. Markdown Editor with Live Preview

**API Endpoints**:
- `GET /api/files/person/:name` - Load person.md content
- `GET /api/files/company/:name` - Load company.md content  
- `GET /api/files/job/:company/:job` - Load job.md content
- `PUT /api/files/person/:name` - Save person.md content
- `PUT /api/files/company/:name` - Save company.md content
- `PUT /api/files/job/:company/:job` - Save job.md content

**Frontend Implementation**:
- Split pane layout (50/50 or adjustable)
- Left pane: Textarea with markdown content
  - Syntax highlighting (optional - use a simple lib like `highlight.js`)
  - Auto-growing textarea
- Right pane: Live preview of rendered markdown
  - Update on typing (debounced by 300ms)
  - Basic markdown rendering (headers, lists, bold, italic, links)
- Dirty state tracking: Show warning if navigating away with unsaved changes
- Save button: Sends content to appropriate PUT endpoint

**Markdown Preview**: Use a simple client-side markdown renderer:
- `marked` library (lightweight, fast)
- Or native JavaScript conversion for basic features

## Backend Changes

### New Agent: ImportAgent

**File**: `src/agents/import-agent.ts`

```typescript
export class ImportAgent extends BaseAgent {
  /**
   * Parse resume and structure into person.md format
   */
  async parseResume(resumeText: string): Promise<string> {
    // Prompt with person.md template structure
    // Return formatted markdown
  }

  /**
   * Merge new resume data with existing person profile
   */
  async mergeProfiles(existingProfile: string, newResume: string): Promise<string> {
    // Prompt to intelligently combine
    // Return merged markdown
  }

  /**
   * Structure raw JD text into organized markdown
   */
  async processJobDescription(jdText: string): Promise<string> {
    // Prompt with job.md template structure
    // Return formatted markdown
  }
}
```

### Updated ImportAgent Methods

**File**: `src/agents/import-agent.ts`

```typescript
export class ImportAgent extends BaseAgent {
  /**
   * Parse resume and structure into person.md format
   */
  async parseResume(resumeText: string): Promise<string> {
    // Prompt with person.md template structure
    // Return formatted markdown
  }

  /**
   * Merge new resume data with existing person profile
   */
  async mergeProfiles(existingProfile: string, newResume: string): Promise<string> {
    // Prompt to intelligently combine
    // Return merged markdown
  }

  /**
   * Structure raw JD text into organized markdown
   */
  async processJobDescription(jdText: string): Promise<string> {
    // Prompt with job.md template structure
    // Return formatted markdown
  }

  /**
   * Add new JD information to existing job.md
   */
  async appendJobDescription(existingJob: string, newInfo: string): Promise<string> {
    // Prompt to integrate new info
    // Return updated markdown
  }

  /**
   * Structure company information into organized markdown
   */
  async processCompanyInfo(companyText: string): Promise<string> {
    // Prompt with company.md template structure
    // Return formatted markdown
  }

  /**
   * Add new company information to existing company.md
   */
  async appendCompanyInfo(existingCompany: string, newInfo: string): Promise<string> {
    // Prompt to integrate new info
    // Return updated markdown
  }
}
```

## File Naming Migration

### Migration Strategy
Update all code references from `global.md` to entity-specific names:

**Person**: `people/{name}/global.md` → `people/{name}/person.md`
**Company**: `companies/{name}/global.md` → `companies/{name}/company.md`

**Migration Script**: `src/scripts/migrate-file-names.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

export function migrateFileNames(projectRoot: string) {
  // Migrate people files
  const peopleDir = path.join(projectRoot, 'resume-data', 'people');
  if (fs.existsSync(peopleDir)) {
    const people = fs.readdirSync(peopleDir);
    for (const person of people) {
      const oldPath = path.join(peopleDir, person, 'global.md');
      const newPath = path.join(peopleDir, person, 'person.md');
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Migrated: ${person}/global.md → ${person}/person.md`);
      }
    }
  }

  // Migrate company files
  const companiesDir = path.join(projectRoot, 'resume-data', 'companies');
  if (fs.existsSync(companiesDir)) {
    const companies = fs.readdirSync(companiesDir);
    for (const company of companies) {
      const oldPath = path.join(companiesDir, company, 'global.md');
      const newPath = path.join(companiesDir, company, 'company.md');
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Migrated: ${company}/global.md → ${company}/company.md`);
      }
    }
  }
}
```

**CLI Command**: `npx resume-review migrate-filenames`

**Files to Update**:
- `src/project/manager.ts` - Update all references to `global.md`
- `src/web/server.ts` - Update API paths
- Templates in `resume-data/templates/` - Already correctly named

## API Routes Summary

```typescript
// Import endpoints
POST /api/import/resume        // Import & parse resume (create or merge)
POST /api/import/job            // Process JD text (create or append)
POST /api/import/company        // Process company info (create or append)

// File editing endpoints  
GET  /api/files/person/:name
PUT  /api/files/person/:name
GET  /api/files/company/:name
PUT  /api/files/company/:name
GET  /api/files/job/:company/:job
PUT  /api/files/job/:company/:job

// Existing endpoints remain unchanged
GET  /api/project/people
GET  /api/project/companies
POST /api/project/person
POST /api/project/company
POST /api/project/job
POST /api/review
POST /api/build
```

## Implementation Phases

### Phase 1: File Naming Migration (1-2 hours)
- [ ] Create migration script
- [ ] Update `ProjectManager` class
- [ ] Update server.ts references
- [ ] Test existing functionality still works
- [ ] Add CLI command for migration

### Phase 2: Resume Import (3-4 hours)
- [ ] Create `ImportAgent` class
- [ ] Implement `parseResume` method
- [ ] Implement `mergeProfiles` method
- [ ] Add `/api/import/resume` endpoint
- [ ] Add UI form for resume import
- [ ] Test with sample resumes (PDF, DOCX, text)

### Phase 3: Job Description Processing (2-3 hours)
- [ ] Implement `processJobDescription` in ImportAgent
- [ ] Implement `appendJobDescription` in ImportAgent
- [ ] Add `/api/import/job` endpoint with create/append modes
- [ ] Add UI form for JD processing
- [ ] Test with sample job descriptions (create and append)

### Phase 4: Company Information Processing (2-3 hours)
- [ ] Implement `processCompanyInfo` in ImportAgent
- [ ] Implement `appendCompanyInfo` in ImportAgent
- [ ] Add `/api/import/company` endpoint with create/append modes
- [ ] Add UI form for company processing
- [ ] Test with sample company information (create and append)

### Phase 5: Markdown Editor (4-5 hours)
- [ ] Add file read/write endpoints
- [ ] Implement split-pane editor component
- [ ] Add markdown preview renderer
- [ ] Implement save/discard functionality
- [ ] Add dirty state tracking
- [ ] Test editing all file types

### Phase 6: UI Organization & Polish (3-4 hours)
- [ ] Create new "Data Manager" tab
- [ ] Reorganize existing tabs
- [ ] Add loading states and progress indicators
- [ ] Add success/error notifications
- [ ] Add file selection dropdowns
- [ ] Add helpful tips about external research
- [ ] Test full workflow end-to-end
- [ ] Update documentation

**Total Estimated Time**: 16-20 hours

## Dependencies

**New Packages**:
- `marked` - Add for markdown preview (client-side)

**Add to package.json**:
```json
{
  "dependencies": {
    "marked": "^11.0.0"
  }
}
```

**Note**: `puppeteer` is already installed but won't be needed for this implementation since we're not doing web scraping.

## Testing Checklist

### Resume Import
- [ ] Import PDF resume → creates person.md
- [ ] Import DOCX resume → creates person.md
- [ ] Paste resume text → creates person.md
- [ ] Merge with existing person → combines intelligently
- [ ] Deduplicates similar experiences
- [ ] Preserves detailed information

### Job Description
- [ ] Paste JD → creates structured job.md
- [ ] Paste JD → appends to existing job.md
- [ ] Extracts job title correctly
- [ ] Separates requirements vs nice-to-have
- [ ] Preserves technical terms and tools
- [ ] Doesn't duplicate when appending

### Company Information
- [ ] Paste company info → creates structured company.md
- [ ] Paste company info → appends to existing company.md
- [ ] Organizes into appropriate sections
- [ ] Preserves important details
- [ ] Doesn't duplicate when appending

### Markdown Editor
- [ ] Load person.md → displays in editor
- [ ] Load company.md → displays in editor
- [ ] Load job.md → displays in editor
- [ ] Edit content → live preview updates
- [ ] Save changes → persists to file
- [ ] Discard changes → reverts to original
- [ ] Dirty state warning works

### Integration
- [ ] Import resume → edit in markdown editor → use in review
- [ ] Process JD → edit in markdown editor → use in build
- [ ] Process company info → edit in markdown editor → use in review
- [ ] Full workflow: import/process all → build tailored resume
- [ ] Append workflow: start with create, then append more info later

## Open Questions

1. **Markdown Editor Libraries**: Should we use a pre-built editor component?
   - Simple textarea (easiest, most control)
   - CodeMirror (feature-rich, heavier)
   - Monaco Editor (VSCode-style, very heavy)
   - **Recommendation**: Start with simple textarea + preview, can upgrade later

2. **File Locking**: If editing a file in the editor, should we:
   - Lock it from being used in review/build until saved?
   - Allow simultaneous use (current editor content is independent)
   - **Recommendation**: No locking for v1, keep it simple

3. **Template Access**: Should we provide easy access to copy templates?
   - Add "Copy Template" button that copies company.md or job.md template to clipboard
   - Add tooltip: "Paste this into ChatGPT or Claude with your research for pre-structuring"
   - **Recommendation**: Yes, this would be helpful for users

## Design Decisions

1. **Two-Section UI**: Clear separation between data management (Section 1) and resume processing (Section 2)
2. **AI-Powered Merging**: Trust AI to intelligently combine data rather than complex diff UI
3. **User-Provided Context**: Users do their own research/gathering; app just structures it (no web scraping, no external API keys)
4. **Create vs Append**: Support both starting fresh and incrementally adding to existing files
5. **Explicit Save**: Require save button rather than auto-save (prevents accidental changes)
6. **Entity-Specific File Names**: `person.md` and `company.md` instead of generic `global.md` (clearer, more maintainable)
7. **External AI Integration Encouraged**: Users can leverage ChatGPT, Claude, etc. for initial research and structuring

## Success Criteria

This implementation is successful when:
1. User can upload existing resume and get structured person.md (new or merged)
2. User can paste JD text and get organized job.md (new or appended)
3. User can paste company information and get structured company.md (new or appended)
4. User can edit any markdown file in split-view editor
5. User can seamlessly move from Section 1 (data prep) to Section 2 (resume building)
6. All files consistently use new naming convention (person.md, company.md, job.md)
7. UI clearly guides users to do external research and paste results
8. No external API keys or web scraping required (beyond Anthropic for AI structuring)
