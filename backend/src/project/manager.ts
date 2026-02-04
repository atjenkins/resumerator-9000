import * as fs from 'fs';
import * as path from 'path';
import { ProjectConfig, getProjectPaths, saveConfig } from './config';

export interface PersonInfo {
  name: string;
  path: string;
  personPath: string;  // Changed from globalPath
  resumesPath: string;
}

export interface CompanyInfo {
  name: string;
  path: string;
  companyPath: string;  // Changed from globalPath
  jobsPath: string;
  jobs: string[];
}

export interface JobInfo {
  company: string;
  name: string;
  path: string;
}

const PERSON_TEMPLATE = `# [Name]
email@example.com | (555) 000-0000 | City, State
linkedin.com/in/profile | github.com/username

## Summary


## Experience

### Job Title @ Company (YYYY - Present)
Location

-
-
-

### Previous Title @ Company (YYYY - YYYY)
Location

-
-

## Education

### Degree - Major
**University** | YYYY

## Skills

### Technical
- **Languages**:
- **Frameworks**:
- **Tools**:

### Soft Skills
-

## Projects

### Project Name
**Technologies**:
-
`;

const COMPANY_TEMPLATE = `# [Company Name]

## About
<!-- Industry, size, stage, mission -->


## Tech Stack
<!-- Known technologies, frameworks, tools -->


## Culture & Values
<!-- What they emphasize, work environment -->


## Interview Process
<!-- Known stages, question types -->


## Notes
<!-- Recent news, team info, anything relevant -->

`;

const JOB_TEMPLATE = `# [Job Title]

## Overview
<!-- Role summary, team context -->


## Responsibilities
-
-
-

## Requirements
-
-
-

## Nice to Have
-
-

## Compensation
<!-- Salary range, equity, benefits if known -->


## Notes
<!-- Remote policy, team size, hiring manager, deadline -->

`;

export class ProjectManager {
  private paths: ReturnType<typeof getProjectPaths>;

  constructor(private config: ProjectConfig) {
    this.paths = getProjectPaths(config);
  }

  /**
   * Initialize project directory structure
   */
  init(): { created: string[]; existed: string[] } {
    const created: string[] = [];
    const existed: string[] = [];

    const dirs = [
      this.paths.data,
      this.paths.people,
      this.paths.companies,
      this.paths.results,
      this.paths.templates,
    ];

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        existed.push(dir);
      } else {
        fs.mkdirSync(dir, { recursive: true });
        created.push(dir);
      }
    }

    // Create template files
    const templateFiles = [
      { name: 'person.md', content: PERSON_TEMPLATE },
      { name: 'company.md', content: COMPANY_TEMPLATE },
      { name: 'job.md', content: JOB_TEMPLATE },
    ];

    for (const tmpl of templateFiles) {
      const tmplPath = path.join(this.paths.templates, tmpl.name);
      if (!fs.existsSync(tmplPath)) {
        fs.writeFileSync(tmplPath, tmpl.content, 'utf-8');
        created.push(tmplPath);
      }
    }

    // Save config file in project root
    const configPath = path.join(this.config.projectRoot, 'resume-reviewer.config.json');
    if (!fs.existsSync(configPath)) {
      saveConfig({ projectRoot: '.' }, this.config.projectRoot);
      created.push(configPath);
    }

    return { created, existed };
  }

  /**
   * List all people in the project
   */
  listPeople(): PersonInfo[] {
    if (!fs.existsSync(this.paths.people)) {
      return [];
    }

    const entries = fs.readdirSync(this.paths.people, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => ({
        name: e.name,
        path: path.join(this.paths.people, e.name),
        personPath: path.join(this.paths.people, e.name, 'person.md'),
        resumesPath: path.join(this.paths.people, e.name, 'resumes'),
      }))
      .filter((p) => fs.existsSync(p.personPath));
  }

  /**
   * List all companies in the project
   */
  listCompanies(): CompanyInfo[] {
    if (!fs.existsSync(this.paths.companies)) {
      return [];
    }

    const entries = fs.readdirSync(this.paths.companies, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => {
        const companyPath = path.join(this.paths.companies, e.name);
        const jobsPath = path.join(companyPath, 'jobs');
        let jobs: string[] = [];

        if (fs.existsSync(jobsPath)) {
          jobs = fs
            .readdirSync(jobsPath)
            .filter((f) => f.endsWith('.md'))
            .map((f) => f.replace('.md', ''));
        }

        return {
          name: e.name,
          path: companyPath,
          companyPath: path.join(companyPath, 'company.md'),
          jobsPath,
          jobs,
        };
      });
  }

  /**
   * List jobs for a specific company
   */
  listJobs(companyName: string): JobInfo[] {
    const jobsPath = path.join(this.paths.companies, companyName, 'jobs');
    if (!fs.existsSync(jobsPath)) {
      return [];
    }

    return fs
      .readdirSync(jobsPath)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({
        company: companyName,
        name: f.replace('.md', ''),
        path: path.join(jobsPath, f),
      }));
  }

  /**
   * Add a new person
   */
  addPerson(name: string): PersonInfo {
    const slug = this.slugify(name);
    const personPath = path.join(this.paths.people, slug);

    if (fs.existsSync(personPath)) {
      throw new Error(`Person "${name}" already exists`);
    }

    fs.mkdirSync(personPath, { recursive: true });
    fs.mkdirSync(path.join(personPath, 'resumes'), { recursive: true });

    const personFilePath = path.join(personPath, 'person.md');
    const content = PERSON_TEMPLATE.replace('[Name]', name);
    fs.writeFileSync(personFilePath, content, 'utf-8');

    return {
      name: slug,
      path: personPath,
      personPath: personFilePath,
      resumesPath: path.join(personPath, 'resumes'),
    };
  }

  /**
   * Add a new company
   */
  addCompany(name: string): CompanyInfo {
    const slug = this.slugify(name);
    const companyPath = path.join(this.paths.companies, slug);

    if (fs.existsSync(companyPath)) {
      throw new Error(`Company "${name}" already exists`);
    }

    fs.mkdirSync(companyPath, { recursive: true });
    fs.mkdirSync(path.join(companyPath, 'jobs'), { recursive: true });

    const companyFilePath = path.join(companyPath, 'company.md');
    const content = COMPANY_TEMPLATE.replace('[Company Name]', name);
    fs.writeFileSync(companyFilePath, content, 'utf-8');

    return {
      name: slug,
      path: companyPath,
      companyPath: companyFilePath,
      jobsPath: path.join(companyPath, 'jobs'),
      jobs: [],
    };
  }

  /**
   * Add a new job to a company
   */
  addJob(companyName: string, jobTitle: string): JobInfo {
    const companySlug = this.slugify(companyName);
    const jobSlug = this.slugify(jobTitle);
    const companyPath = path.join(this.paths.companies, companySlug);

    if (!fs.existsSync(companyPath)) {
      throw new Error(`Company "${companyName}" does not exist. Create it first.`);
    }

    const jobsPath = path.join(companyPath, 'jobs');
    if (!fs.existsSync(jobsPath)) {
      fs.mkdirSync(jobsPath, { recursive: true });
    }

    const jobPath = path.join(jobsPath, `${jobSlug}.md`);
    if (fs.existsSync(jobPath)) {
      throw new Error(`Job "${jobTitle}" already exists for company "${companyName}"`);
    }

    const content = JOB_TEMPLATE.replace('[Job Title]', jobTitle);
    fs.writeFileSync(jobPath, content, 'utf-8');

    return {
      company: companySlug,
      name: jobSlug,
      path: jobPath,
    };
  }

  /**
   * Get person's person.md content
   */
  getPersonContent(name: string): string {
    const personPath = path.join(this.paths.people, name, 'person.md');
    if (!fs.existsSync(personPath)) {
      throw new Error(`Person "${name}" not found`);
    }
    return fs.readFileSync(personPath, 'utf-8');
  }

  /**
   * Update person's person.md content
   */
  updatePersonContent(name: string, content: string): void {
    const personPath = path.join(this.paths.people, name, 'person.md');
    if (!fs.existsSync(path.dirname(personPath))) {
      throw new Error(`Person "${name}" not found`);
    }
    fs.writeFileSync(personPath, content, 'utf-8');
  }

  /**
   * Get company's company.md content
   */
  getCompanyContent(name: string): string {
    const companyPath = path.join(this.paths.companies, name, 'company.md');
    if (!fs.existsSync(companyPath)) {
      throw new Error(`Company "${name}" not found`);
    }
    return fs.readFileSync(companyPath, 'utf-8');
  }

  /**
   * Update company's company.md content
   */
  updateCompanyContent(name: string, content: string): void {
    const companyPath = path.join(this.paths.companies, name, 'company.md');
    if (!fs.existsSync(path.dirname(companyPath))) {
      throw new Error(`Company "${name}" not found`);
    }
    fs.writeFileSync(companyPath, content, 'utf-8');
  }

  /**
   * Get job description content
   */
  getJobContent(company: string, job: string): string {
    const jobPath = path.join(this.paths.companies, company, 'jobs', `${job}.md`);
    if (!fs.existsSync(jobPath)) {
      throw new Error(`Job "${job}" not found for company "${company}"`);
    }
    return fs.readFileSync(jobPath, 'utf-8');
  }

  /**
   * Update job description content
   */
  updateJobContent(company: string, job: string, content: string): void {
    const jobPath = path.join(this.paths.companies, company, 'jobs', `${job}.md`);
    if (!fs.existsSync(jobPath)) {
      throw new Error(`Job "${job}" not found for company "${company}"`);
    }
    fs.writeFileSync(jobPath, content, 'utf-8');
  }

  /**
   * Save generated resume to person's resumes folder
   */
  saveResume(person: string, company: string, job: string, content: string): string {
    const resumesPath = path.join(this.paths.people, person, 'resumes');
    if (!fs.existsSync(resumesPath)) {
      fs.mkdirSync(resumesPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${company}_${job}_${timestamp}.md`;
    const filePath = path.join(resumesPath, filename);

    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  }

  /**
   * List all resumes for a person
   */
  listResumes(person: string): string[] {
    const resumesPath = path.join(this.paths.people, person, 'resumes');
    if (!fs.existsSync(resumesPath)) {
      return [];
    }

    return fs
      .readdirSync(resumesPath)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace('.md', ''));
  }

  /**
   * Get a specific resume content
   */
  getResumeContent(person: string, resumeFilename: string): string {
    const resumePath = path.join(this.paths.people, person, 'resumes', `${resumeFilename}.md`);
    if (!fs.existsSync(resumePath)) {
      throw new Error(`Resume "${resumeFilename}" not found for person "${person}"`);
    }
    return fs.readFileSync(resumePath, 'utf-8');
  }

  /**
   * Update a specific resume content
   */
  updateResumeContent(person: string, resumeFilename: string, content: string): void {
    const resumePath = path.join(this.paths.people, person, 'resumes', `${resumeFilename}.md`);
    if (!fs.existsSync(resumePath)) {
      throw new Error(`Resume "${resumeFilename}" not found for person "${person}"`);
    }
    fs.writeFileSync(resumePath, content, 'utf-8');
  }

  /**
   * Convert name to URL-friendly slug
   */
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
