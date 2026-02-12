import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";

const HEADING_LEVELS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
] as const;

/**
 * Parse inline markdown (**bold**, *italic*) into TextRuns with formatting
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Match **bold**, *italic*, or plain text
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|[^*]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const segment = match[0];
    if (segment.startsWith("**") && segment.endsWith("**")) {
      // Bold text
      runs.push(new TextRun({ text: segment.slice(2, -2), bold: true }));
    } else if (segment.startsWith("*") && segment.endsWith("*")) {
      // Italic text
      runs.push(new TextRun({ text: segment.slice(1, -1), italics: true }));
    } else if (segment) {
      // Plain text
      runs.push(new TextRun(segment));
    }
  }

  return runs.length > 0 ? runs : [new TextRun(text)];
}

/**
 * Convert markdown string to a docx Document.
 * Processes line-by-line for proper structure and spacing.
 * Handles headings, bullets, inline bold/italic.
 */
export function markdownToDocx(markdown: string, title?: string): Document {
  const children: Paragraph[] = [];

  if (title && title.trim()) {
    children.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      })
    );
  }

  const lines = markdown.split("\n");
  let skipNextEmpty = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // Empty line -> add spacing paragraph
    if (!line.trim()) {
      if (!skipNextEmpty) {
        children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
      }
      skipNextEmpty = false;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 6);
      const headingText = headingMatch[2].trim();
      children.push(
        new Paragraph({
          children: parseInlineFormatting(headingText),
          heading: HEADING_LEVELS[level - 1],
          spacing: { before: 240, after: 120 },
        })
      );
      skipNextEmpty = true;
      continue;
    }

    // Bullet point
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      children.push(
        new Paragraph({
          children: parseInlineFormatting(bulletMatch[1]),
          bullet: { level: 0 },
          spacing: { after: 50 },
        })
      );
      continue;
    }

    // Regular paragraph
    children.push(
      new Paragraph({
        children: parseInlineFormatting(line),
        spacing: { after: 120 },
      })
    );
  }

  return new Document({
    sections: [{ children }],
  });
}

export async function markdownToDocxBuffer(
  markdown: string,
  title?: string
): Promise<Buffer> {
  const doc = markdownToDocx(markdown, title);
  return Packer.toBuffer(doc);
}
