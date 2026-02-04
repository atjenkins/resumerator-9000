import * as fs from 'fs';
import * as path from 'path';
import { ParsedDocument } from '../types';

export async function parsePdf(filePath: string): Promise<ParsedDocument> {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const dataBuffer = fs.readFileSync(absolutePath);

  // Dynamic import for pdf-parse (CommonJS module)
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(dataBuffer);

  return {
    content: data.text,
    metadata: {
      pageCount: data.numpages,
      title: data.info?.Title || undefined,
    },
  };
}

export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedDocument> {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);

  return {
    content: data.text,
    metadata: {
      pageCount: data.numpages,
      title: data.info?.Title || undefined,
    },
  };
}
