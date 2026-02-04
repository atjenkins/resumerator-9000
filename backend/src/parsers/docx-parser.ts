import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
import { ParsedDocument } from '../types';

export async function parseDocx(filePath: string): Promise<ParsedDocument> {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const result = await mammoth.extractRawText({ path: absolutePath });

  return {
    content: result.value,
    metadata: {},
  };
}

export async function parseDocxBuffer(buffer: Buffer): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer });

  return {
    content: result.value,
    metadata: {},
  };
}
