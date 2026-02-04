import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface ProjectConfig {
  projectRoot: string;
  defaultPerson?: string;
}

const CONFIG_FILENAME = 'resume-reviewer.config.json';

function findConfigFile(): string | null {
  // Check current directory and parents
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    const configPath = path.join(dir, CONFIG_FILENAME);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    dir = path.dirname(dir);
  }
  return null;
}

export function loadConfig(): ProjectConfig {
  // Priority: env var > config file > default
  const envRoot = process.env.RESUME_REVIEWER_PROJECT_ROOT;

  if (envRoot) {
    return {
      projectRoot: path.resolve(envRoot),
      defaultPerson: process.env.RESUME_REVIEWER_DEFAULT_PERSON,
    };
  }

  const configPath = findConfigFile();
  if (configPath) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content) as Partial<ProjectConfig>;
      return {
        projectRoot: config.projectRoot
          ? path.resolve(path.dirname(configPath), config.projectRoot)
          : path.dirname(configPath),
        defaultPerson: config.defaultPerson,
      };
    } catch {
      // Fall through to default
    }
  }

  // Default to parent of resume-reviewer directory
  return {
    projectRoot: path.resolve(__dirname, '..', '..', '..'),
  };
}

export function saveConfig(config: ProjectConfig, targetDir?: string): void {
  const dir = targetDir || process.cwd();
  const configPath = path.join(dir, CONFIG_FILENAME);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function getProjectPaths(config: ProjectConfig) {
  const dataDir = path.join(config.projectRoot, 'resume-data');
  return {
    data: dataDir,
    people: path.join(dataDir, 'people'),
    companies: path.join(dataDir, 'companies'),
    results: path.join(dataDir, 'results'),
    templates: path.join(dataDir, 'templates'),
  };
}
