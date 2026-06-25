import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import type { OptimizedResume } from '@/types/cv';

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '555555' },
    },
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    text: `• ${text}`,
    spacing: { after: 40 },
    indent: { left: 360 },
  });
}

function plain(text: string): Paragraph {
  return new Paragraph({ text, spacing: { after: 60 } });
}

export async function buildDocx(
  resume: OptimizedResume,
  candidateName?: string
): Promise<Buffer> {
  const children: Paragraph[] = [];

  if (candidateName) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: candidateName, bold: true, size: 36 })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 120 },
      })
    );
  }

  // Professional Summary
  if (resume.professionalSummary) {
    children.push(sectionHeading('Professional Summary'));
    children.push(plain(resume.professionalSummary));
  }

  // Experience
  if (resume.experience.length > 0) {
    children.push(sectionHeading('Experience'));
    for (const exp of resume.experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.title} — ${exp.company}`, bold: true }),
            new TextRun({ text: `   ${exp.startDate} – ${exp.endDate}`, color: '555555' }),
          ],
          spacing: { before: 120, after: 40 },
        })
      );
      for (const b of exp.bullets) {
        children.push(bullet(b));
      }
    }
  }

  // Skills
  if (resume.skills.length > 0) {
    children.push(sectionHeading('Skills'));
    for (const group of resume.skills) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${group.category}: `, bold: true }),
            new TextRun({ text: group.skills.join(', ') }),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // Education
  if (resume.education.length > 0) {
    children.push(sectionHeading('Education'));
    for (const edu of resume.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.degree} in ${edu.field} — ${edu.institution}`, bold: true }),
            new TextRun({ text: `   ${edu.graduationDate}`, color: '555555' }),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // Certifications
  if (resume.certifications.length > 0) {
    children.push(sectionHeading('Certifications'));
    for (const c of resume.certifications) {
      children.push(bullet(c));
    }
  }

  // Languages
  if (resume.languages.length > 0) {
    children.push(sectionHeading('Languages'));
    for (const l of resume.languages) {
      children.push(plain(`${l.language}: ${l.proficiency}`));
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
