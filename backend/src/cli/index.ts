#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { GeneralResumeAgent } from '../agents/general-agent';
import { JobFitAgent } from '../agents/job-fit-agent';
import { ResumeBuilderAgent } from '../agents/builder-agent';
import { parsePdf } from '../parsers/pdf-parser';
import { parseDocx } from '../parsers/docx-parser';
import { ReviewResult, JobFitResult, BuilderResult } from '../types';
import { loadConfig, ProjectManager, ResultManager } from '../project';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('resume-review')
  .description('AI-powered resume review and generation tool')
  .version('1.0.0');

// Get project manager and result manager
function getManagers() {
  const config = loadConfig();
  return {
    config,
    project: new ProjectManager(config),
    results: new ResultManager(config),
  };
}

async function loadResumeContent(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);
  const ext = path.extname(absolutePath).toLowerCase();

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  switch (ext) {
    case '.pdf':
      const pdfResult = await parsePdf(absolutePath);
      return pdfResult.content;
    case '.docx':
      const docxResult = await parseDocx(absolutePath);
      return docxResult.content;
    case '.md':
    case '.txt':
      return fs.readFileSync(absolutePath, 'utf-8');
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}

function loadTextFile(filePath: string): string {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf-8');
}

function formatReviewResult(result: ReviewResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('RESUME REVIEW RESULTS');
  console.log('='.repeat(60));

  console.log(`\n📊 Overall Score: ${result.score}/100`);
  console.log(`\n📝 Summary: ${result.summary}`);

  console.log('\n✅ Strengths:');
  result.strengths.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

  console.log('\n🔧 Improvements:');
  result.improvements.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

  console.log('\n📈 Category Breakdown:');
  result.categories.forEach((cat) => {
    console.log(`\n   ${cat.name}: ${cat.score}/100`);
    console.log(`   ${cat.feedback}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');
}

function formatJobFitResult(result: JobFitResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('JOB FIT ANALYSIS RESULTS');
  console.log('='.repeat(60));

  console.log(`\n📊 Overall Score: ${result.score}/100`);
  console.log(`🎯 Fit Rating: ${result.fitRating.toUpperCase()}`);
  console.log(`\n📝 Summary: ${result.summary}`);

  console.log('\n✅ Relevant Strengths:');
  result.strengths.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

  console.log('\n🔧 Improvements:');
  result.improvements.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

  if (result.missingKeywords.length > 0) {
    console.log('\n🔑 Missing Keywords:');
    console.log(`   ${result.missingKeywords.join(', ')}`);
  }

  if (result.transferableSkills.length > 0) {
    console.log('\n🔄 Transferable Skills:');
    result.transferableSkills.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
  }

  console.log('\n🎯 Targeted Suggestions:');
  result.targetedSuggestions.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

  console.log('\n📈 Category Breakdown:');
  result.categories.forEach((cat) => {
    console.log(`\n   ${cat.name}: ${cat.score}/100`);
    console.log(`   ${cat.feedback}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');
}

function formatBuilderResult(result: BuilderResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('TAILORED RESUME GENERATED');
  console.log('='.repeat(60));

  console.log(`\n📝 Tailoring Summary: ${result.summary}`);

  console.log('\n✨ Emphasized Skills:');
  console.log(`   ${result.emphasizedSkills.join(', ')}`);

  console.log('\n📋 Selected Experiences:');
  result.selectedExperiences.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

  console.log('\n' + '-'.repeat(60));
  console.log('GENERATED RESUME:');
  console.log('-'.repeat(60) + '\n');
  console.log(result.markdown);
  console.log('\n' + '='.repeat(60) + '\n');
}

// ============================================================
// Project Management Commands
// ============================================================

// Init command
program
  .command('init')
  .description('Initialize project directory structure')
  .option('-p, --path <path>', 'Project root path (default: current directory)')
  .action((options: { path?: string }) => {
    try {
      const projectRoot = options.path ? path.resolve(options.path) : process.cwd();
      const config = { projectRoot };
      const project = new ProjectManager(config);

      const { created, existed } = project.init();

      console.log('📁 Project initialized!\n');

      if (created.length > 0) {
        console.log('Created:');
        created.forEach((p) => console.log(`  ✅ ${p}`));
      }

      if (existed.length > 0) {
        console.log('\nAlready existed:');
        existed.forEach((p) => console.log(`  📂 ${p}`));
      }

      console.log(`\nProject root: ${projectRoot}`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// List command
const listCmd = program.command('list').description('List project resources');

listCmd
  .command('people')
  .description('List all people in the project')
  .action(() => {
    try {
      const { project } = getManagers();
      const people = project.listPeople();

      if (people.length === 0) {
        console.log('No people found. Add one with: resume-review add person <name>');
        return;
      }

      console.log('👥 People:\n');
      people.forEach((p) => {
        console.log(`  • ${p.name}`);
        console.log(`    ${p.personPath}`);
      });
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

listCmd
  .command('companies')
  .description('List all companies in the project')
  .action(() => {
    try {
      const { project } = getManagers();
      const companies = project.listCompanies();

      if (companies.length === 0) {
        console.log('No companies found. Add one with: resume-review add company <name>');
        return;
      }

      console.log('🏢 Companies:\n');
      companies.forEach((c) => {
        console.log(`  • ${c.name}`);
        if (c.jobs.length > 0) {
          console.log(`    Jobs: ${c.jobs.join(', ')}`);
        }
      });
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

listCmd
  .command('jobs <company>')
  .description('List all jobs for a company')
  .action((company: string) => {
    try {
      const { project } = getManagers();
      const jobs = project.listJobs(company);

      if (jobs.length === 0) {
        console.log(`No jobs found for ${company}. Add one with: resume-review add job ${company} <title>`);
        return;
      }

      console.log(`💼 Jobs at ${company}:\n`);
      jobs.forEach((j) => {
        console.log(`  • ${j.name}`);
        console.log(`    ${j.path}`);
      });
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Add command
const addCmd = program.command('add').description('Add new resources to project');

addCmd
  .command('person <name>')
  .description('Add a new person')
  .action((name: string) => {
    try {
      const { project } = getManagers();
      const person = project.addPerson(name);

      console.log(`✅ Created person: ${person.name}`);
      console.log(`\nEdit your info at:\n  ${person.personPath}`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

addCmd
  .command('company <name>')
  .description('Add a new company')
  .action((name: string) => {
    try {
      const { project } = getManagers();
      const company = project.addCompany(name);

      console.log(`✅ Created company: ${company.name}`);
      console.log(`\nEdit company info at:\n  ${company.companyPath}`);
      console.log(`\nAdd jobs with:\n  resume-review add job ${company.name} <job-title>`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

addCmd
  .command('job <company> <title>')
  .description('Add a new job to a company')
  .action((company: string, title: string) => {
    try {
      const { project } = getManagers();
      const job = project.addJob(company, title);

      console.log(`✅ Created job: ${job.name} at ${job.company}`);
      console.log(`\nEdit job description at:\n  ${job.path}`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Results command
program
  .command('results')
  .description('List past review results')
  .option('-p, --person <name>', 'Filter by person')
  .option('-c, --company <name>', 'Filter by company')
  .option('-t, --type <type>', 'Filter by type (general, company, job, full, build)')
  .action((options: { person?: string; company?: string; type?: string }) => {
    try {
      const { results } = getManagers();
      const list = results.listResults({
        person: options.person,
        company: options.company,
        type: options.type as any,
      });

      if (list.length === 0) {
        console.log('No results found.');
        return;
      }

      console.log('📋 Results:\n');
      list.forEach((r) => {
        const meta = r.metadata;
        const parts = [meta.type.toUpperCase()];
        if (meta.person) parts.push(`person:${meta.person}`);
        if (meta.company) parts.push(`company:${meta.company}`);
        if (meta.job) parts.push(`job:${meta.job}`);

        console.log(`  ${r.filename}`);
        console.log(`    ${parts.join(' | ')}`);
        console.log(`    ${new Date(meta.timestamp).toLocaleString()}\n`);
      });
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// ============================================================
// Review Command (unified with flexible context)
// ============================================================

program
  .command('review')
  .description('Review a resume with optional company/job context')
  .option('-p, --person <name>', 'Person from project')
  .option('-f, --file <path>', 'Resume file path (alternative to --person)')
  .option('-c, --company <name>', 'Include company context')
  .option('-j, --job <name>', 'Include job context (format: company/job or just job if --company set)')
  .option('--save', 'Save result to results folder')
  .action(
    async (options: {
      person?: string;
      file?: string;
      company?: string;
      job?: string;
      save?: boolean;
    }) => {
      try {
        const { project, results, config } = getManagers();

        // Get resume content
        let resumeContent: string;
        let personName: string | undefined;

        if (options.person) {
          personName = options.person;
          resumeContent = project.getPersonContent(options.person);
          console.log(`📄 Loaded person: ${options.person}`);
        } else if (options.file) {
          resumeContent = await loadResumeContent(options.file);
          console.log(`📄 Loaded file: ${options.file}`);
        } else {
          console.error('❌ Error: Provide --person or --file');
          process.exit(1);
        }

        // Get company context if specified
        let companyContent: string | undefined;
        let companyName: string | undefined;

        if (options.company) {
          companyName = options.company;
          companyContent = project.getCompanyContent(options.company);
          console.log(`🏢 Loaded company: ${options.company}`);
        }

        // Get job context if specified
        let jobContent: string | undefined;
        let jobName: string | undefined;

        if (options.job) {
          // Parse job option - could be "company/job" or just "job"
          let jobCompany = companyName;
          let jobTitle = options.job;

          if (options.job.includes('/')) {
            const parts = options.job.split('/');
            jobCompany = parts[0];
            jobTitle = parts[1];
          }

          if (!jobCompany) {
            console.error('❌ Error: Specify company with --company or use --job company/job format');
            process.exit(1);
          }

          jobName = jobTitle;
          jobContent = project.getJobContent(jobCompany, jobTitle);
          console.log(`💼 Loaded job: ${jobTitle}`);

          // Also load company if not already loaded
          if (!companyName) {
            companyName = jobCompany;
            companyContent = project.getCompanyContent(jobCompany);
            console.log(`🏢 Loaded company: ${jobCompany}`);
          }
        }

        // Determine review type and run appropriate agent
        const hasCompany = !!companyContent;
        const hasJob = !!jobContent;

        let result: ReviewResult | JobFitResult;

        if (hasJob || hasCompany) {
          // Build combined context
          let context = '';
          if (companyContent) {
            context += `## Company Context\n\n${companyContent}\n\n`;
          }
          if (jobContent) {
            context += `## Job Description\n\n${jobContent}`;
          }

          console.log('\n🤖 Analyzing job fit with AI...');
          const agent = new JobFitAgent();
          const jobFitResult = await agent.review(resumeContent, context);
          result = jobFitResult;
          formatJobFitResult(jobFitResult);
        } else {
          console.log('\n🤖 Analyzing resume with AI...');
          const agent = new GeneralResumeAgent();
          const generalResult = await agent.review(resumeContent);
          result = generalResult;
          formatReviewResult(generalResult);
        }

        // Save result if requested
        if (options.save) {
          const resultType = results.getResultType(hasCompany, hasJob, false);
          const savedPath = results.saveResult(
            {
              type: resultType,
              timestamp: new Date().toISOString(),
              person: personName,
              personFile: personName ? `people/${personName}/global.md` : undefined,
              company: companyName,
              companyFile: companyName ? `companies/${companyName}/global.md` : undefined,
              job: jobName,
              jobFile: jobName && companyName ? `companies/${companyName}/jobs/${jobName}.md` : undefined,
            },
            result
          );
          console.log(`\n💾 Result saved to: ${savedPath}`);
        }
      } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    }
  );

// ============================================================
// Build Command (with project support)
// ============================================================

program
  .command('build')
  .description('Generate a tailored resume from personal info')
  .option('-p, --person <name>', 'Person from project')
  .option('-f, --file <path>', 'Personal info file path (alternative to --person)')
  .option('-c, --company <name>', 'Include company context')
  .option('-j, --job <name>', 'Job to target (format: company/job or just job if --company set)')
  .option('--job-file <path>', 'Job description file path (alternative to project)')
  .option('-o, --output <file>', 'Output file path for generated resume')
  .option('--save', 'Save result to results folder and person\'s resumes folder')
  .action(
    async (options: {
      person?: string;
      file?: string;
      company?: string;
      job?: string;
      jobFile?: string;
      output?: string;
      save?: boolean;
    }) => {
      try {
        const { project, results } = getManagers();

        // Get personal info content
        let personalInfo: string;
        let personName: string | undefined;

        if (options.person) {
          personName = options.person;
          personalInfo = project.getPersonContent(options.person);
          console.log(`📄 Loaded person: ${options.person}`);
        } else if (options.file) {
          personalInfo = loadTextFile(options.file);
          console.log(`📄 Loaded file: ${options.file}`);
        } else {
          console.error('❌ Error: Provide --person or --file');
          process.exit(1);
        }

        // Get company context if specified
        let companyContent: string | undefined;
        let companyName: string | undefined;

        if (options.company) {
          companyName = options.company;
          companyContent = project.getCompanyContent(options.company);
          console.log(`🏢 Loaded company: ${options.company}`);
        }

        // Get job description
        let jobContent: string;
        let jobName: string | undefined;

        if (options.job) {
          // Parse job option
          let jobCompany = companyName;
          let jobTitle = options.job;

          if (options.job.includes('/')) {
            const parts = options.job.split('/');
            jobCompany = parts[0];
            jobTitle = parts[1];
          }

          if (!jobCompany) {
            console.error('❌ Error: Specify company with --company or use --job company/job format');
            process.exit(1);
          }

          jobName = jobTitle;
          jobContent = project.getJobContent(jobCompany, jobTitle);
          console.log(`💼 Loaded job: ${jobTitle}`);

          // Also load company if not already loaded
          if (!companyName) {
            companyName = jobCompany;
            companyContent = project.getCompanyContent(jobCompany);
            console.log(`🏢 Loaded company: ${jobCompany}`);
          }
        } else if (options.jobFile) {
          jobContent = loadTextFile(options.jobFile);
          console.log(`📋 Loaded job file: ${options.jobFile}`);
        } else {
          console.error('❌ Error: Provide --job or --job-file for build command');
          process.exit(1);
        }

        // Build combined job context
        let fullJobContext = '';
        if (companyContent) {
          fullJobContext += `## Company Context\n\n${companyContent}\n\n`;
        }
        fullJobContext += `## Job Description\n\n${jobContent}`;

        console.log('\n🤖 Building tailored resume with AI...');
        const agent = new ResumeBuilderAgent();
        const result = await agent.build(personalInfo, fullJobContext);

        // Output
        if (options.output) {
          const outputPath = path.resolve(options.output);
          fs.writeFileSync(outputPath, result.markdown, 'utf-8');
          console.log(`\n✅ Resume saved to: ${outputPath}`);
        }

        // Save to project if requested
        if (options.save && personName && companyName && jobName) {
          // Save to person's resumes folder
          const resumePath = project.saveResume(personName, companyName, jobName, result.markdown);
          console.log(`\n📄 Resume saved to: ${resumePath}`);

          // Save result to results folder
          const savedPath = results.saveResult(
            {
              type: 'build',
              timestamp: new Date().toISOString(),
              person: personName,
              personFile: `people/${personName}/global.md`,
              company: companyName,
              companyFile: `companies/${companyName}/global.md`,
              job: jobName,
              jobFile: `companies/${companyName}/jobs/${jobName}.md`,
            },
            result
          );
          console.log(`💾 Result saved to: ${savedPath}`);
        }

        formatBuilderResult(result);
      } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    }
  );

// ============================================================
// Legacy Commands (backward compatibility)
// ============================================================

// General review command (legacy)
program
  .command('general')
  .description('Review a resume for general best practices (legacy)')
  .argument('<resume>', 'Path to resume file (PDF, DOCX, or MD)')
  .action(async (resumePath: string) => {
    try {
      console.log('📄 Loading resume...');
      const content = await loadResumeContent(resumePath);

      console.log('🤖 Analyzing resume with AI...');
      const agent = new GeneralResumeAgent();
      const result = await agent.review(content);

      formatReviewResult(result);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Job-fit review command (legacy)
program
  .command('job-fit')
  .description('Analyze how well a resume matches a job description (legacy)')
  .argument('<resume>', 'Path to resume file (PDF, DOCX, or MD)')
  .option('-j, --job <file>', 'Path to job description file')
  .option('-t, --job-text <text>', 'Job description text (inline)')
  .action(
    async (
      resumePath: string,
      options: { job?: string; jobText?: string }
    ) => {
      try {
        if (!options.job && !options.jobText) {
          console.error('❌ Error: Please provide a job description with --job or --job-text');
          process.exit(1);
        }

        console.log('📄 Loading resume...');
        const resumeContent = await loadResumeContent(resumePath);

        const jobDescription = options.job
          ? loadTextFile(options.job)
          : options.jobText!;

        console.log('🤖 Analyzing job fit with AI...');
        const agent = new JobFitAgent();
        const result = await agent.review(resumeContent, jobDescription);

        formatJobFitResult(result);
      } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    }
  );

program.parse();
