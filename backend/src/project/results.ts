import * as fs from 'fs';
import * as path from 'path';
import { ProjectConfig, getProjectPaths } from './config';
import { ReviewResult, JobFitResult, BuilderResult } from '../types';

export type ResultType = 'general' | 'company' | 'job' | 'review' | 'build';

export interface ResultMetadata {
  type: ResultType;
  timestamp: string;
  person?: string;
  personFile?: string;
  company?: string;
  companyFile?: string;
  job?: string;
  jobFile?: string;
}

export interface SavedResult {
  filename: string;
  path: string;
  metadata: ResultMetadata;
}

export interface ResultWithContent extends SavedResult {
  content: string;
  data: ReviewResult | JobFitResult | BuilderResult;
}

export class ResultManager {
  private resultsPath: string;

  constructor(config: ProjectConfig) {
    this.resultsPath = getProjectPaths(config).results;
  }

  /**
   * Determine result type based on context provided
   */
  getResultType(hasCompany: boolean, hasJob: boolean, isBuild: boolean): ResultType {
    if (isBuild) return 'build';
    if (hasCompany && hasJob) return 'review';
    if (hasJob) return 'job';
    if (hasCompany) return 'company';
    return 'general';
  }

  /**
   * Generate filename for a result
   */
  generateFilename(metadata: ResultMetadata): string {
    const timestamp = metadata.timestamp.replace(/[:.]/g, '-').slice(0, 19);
    const parts = [timestamp, metadata.type];

    if (metadata.person) parts.push(metadata.person);
    if (metadata.company) parts.push(metadata.company);
    if (metadata.job) parts.push(metadata.job);

    return parts.join('_') + '.md';
  }

  /**
   * Save a review result with metadata
   */
  saveResult(
    metadata: ResultMetadata,
    result: ReviewResult | JobFitResult | BuilderResult
  ): string {
    if (!fs.existsSync(this.resultsPath)) {
      fs.mkdirSync(this.resultsPath, { recursive: true });
    }

    const filename = this.generateFilename(metadata);
    const filePath = path.join(this.resultsPath, filename);

    const content = this.formatResult(metadata, result);
    fs.writeFileSync(filePath, content, 'utf-8');

    return filePath;
  }

  /**
   * Format result as markdown with YAML frontmatter
   */
  private formatResult(
    metadata: ResultMetadata,
    result: ReviewResult | JobFitResult | BuilderResult
  ): string {
    const frontmatter = [
      '---',
      `type: ${metadata.type}`,
      `timestamp: ${metadata.timestamp}`,
    ];

    if (metadata.person) frontmatter.push(`person: ${metadata.person}`);
    if (metadata.personFile) frontmatter.push(`person_file: ${metadata.personFile}`);
    if (metadata.company) frontmatter.push(`company: ${metadata.company}`);
    if (metadata.companyFile) frontmatter.push(`company_file: ${metadata.companyFile}`);
    if (metadata.job) frontmatter.push(`job: ${metadata.job}`);
    if (metadata.jobFile) frontmatter.push(`job_file: ${metadata.jobFile}`);

    frontmatter.push('---', '');

    let body = '';

    if (metadata.type === 'build') {
      const buildResult = result as BuilderResult;
      body = this.formatBuildResult(buildResult);
    } else {
      const reviewResult = result as ReviewResult | JobFitResult;
      body = this.formatReviewResult(reviewResult, metadata.type);
    }

    return frontmatter.join('\n') + body;
  }

  private formatReviewResult(result: ReviewResult | JobFitResult, type: ResultType): string {
    const lines: string[] = [];
    const title =
      type === 'general'
        ? 'General Review'
        : type === 'company'
          ? 'Company Fit Review'
          : type === 'job'
            ? 'Job Fit Review'
            : 'Job Fit Review';

    lines.push(`# ${title} Results`, '');
    lines.push(`**Overall Score:** ${result.score}/100`, '');

    if ('fitRating' in result) {
      lines.push(`**Fit Rating:** ${result.fitRating.toUpperCase()}`, '');
    }

    lines.push('## Summary', result.summary, '');

    lines.push('## Strengths');
    result.strengths.forEach((s) => lines.push(`- ${s}`));
    lines.push('');

    lines.push('## Suggested Improvements');
    result.improvements.forEach((s) => lines.push(`- ${s}`));
    lines.push('');

    if ('missingKeywords' in result && result.missingKeywords.length > 0) {
      lines.push('## Missing Keywords');
      lines.push(result.missingKeywords.map((k) => `\`${k}\``).join(', '));
      lines.push('');
    }

    if ('transferableSkills' in result && result.transferableSkills.length > 0) {
      lines.push('## Transferable Skills');
      result.transferableSkills.forEach((s) => lines.push(`- ${s}`));
      lines.push('');
    }

    if ('targetedSuggestions' in result && result.targetedSuggestions.length > 0) {
      lines.push('## Targeted Suggestions');
      result.targetedSuggestions.forEach((s) => lines.push(`- ${s}`));
      lines.push('');
    }

    lines.push('## Category Breakdown', '');
    result.categories.forEach((cat) => {
      lines.push(`### ${cat.name}: ${cat.score}/100`);
      lines.push(cat.feedback, '');
    });

    return lines.join('\n');
  }

  private formatBuildResult(result: BuilderResult): string {
    const lines: string[] = [];

    lines.push('# Generated Resume', '');
    lines.push('## Tailoring Summary', result.summary, '');

    lines.push('## Emphasized Skills');
    lines.push(result.emphasizedSkills.map((s) => `\`${s}\``).join(', '));
    lines.push('');

    lines.push('## Selected Experiences');
    result.selectedExperiences.forEach((s) => lines.push(`- ${s}`));
    lines.push('');

    lines.push('---', '');
    lines.push('## Resume Content', '');
    lines.push(result.markdown);

    return lines.join('\n');
  }

  /**
   * List all saved results
   */
  listResults(filters?: {
    type?: ResultType;
    person?: string;
    company?: string;
  }): SavedResult[] {
    if (!fs.existsSync(this.resultsPath)) {
      return [];
    }

    const files = fs.readdirSync(this.resultsPath).filter((f) => f.endsWith('.md'));
    const results: SavedResult[] = [];

    for (const filename of files) {
      const filePath = path.join(this.resultsPath, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const metadata = this.parseMetadata(content);

      if (!metadata) continue;

      // Apply filters
      if (filters?.type && metadata.type !== filters.type) continue;
      if (filters?.person && metadata.person !== filters.person) continue;
      if (filters?.company && metadata.company !== filters.company) continue;

      results.push({ filename, path: filePath, metadata });
    }

    // Sort by timestamp descending (newest first)
    return results.sort((a, b) => b.metadata.timestamp.localeCompare(a.metadata.timestamp));
  }

  /**
   * Load a result file with its content
   */
  loadResult(filename: string): ResultWithContent | null {
    const filePath = path.join(this.resultsPath, filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const metadata = this.parseMetadata(content);

    if (!metadata) return null;

    // Parse the JSON data embedded in the file or reconstruct from markdown
    // For now, return the raw content - the data field is mainly for API responses
    return {
      filename,
      path: filePath,
      metadata,
      content,
      data: {} as ReviewResult, // Placeholder - full parsing would require more work
    };
  }

  /**
   * Parse YAML frontmatter from result file
   */
  private parseMetadata(content: string): ResultMetadata | null {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const yaml = match[1];
    const metadata: Partial<ResultMetadata> = {};

    for (const line of yaml.split('\n')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      if (key && value) {
        const normalizedKey = key.trim().replace(/_([a-z])/g, (_, c) =>
          c.toUpperCase()
        ) as keyof ResultMetadata;
        (metadata as Record<string, string>)[normalizedKey] = value;
      }
    }

    if (!metadata.type || !metadata.timestamp) return null;

    return metadata as ResultMetadata;
  }
}
