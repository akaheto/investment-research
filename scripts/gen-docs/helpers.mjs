/**
 * Shared docx-js building blocks for the project's Word documents.
 * All five .docx deliverables are GENERATED — edit the module for the
 * doc, re-run `npm run gen:docs`, never hand-edit the .docx output.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { writeFileSync } from "node:fs";

const INK = "1a1a19";
const ACCENT = "2a78d6";
const MUTED = "52514e";

export const h1 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true, color: INK })] });

export const h2 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, children: [new TextRun({ text, bold: true, color: ACCENT })] });

export const h3 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 }, children: [new TextRun({ text, bold: true, color: INK })] });

/** Body paragraph. Accepts a string or an array of TextRun options. */
export const p = (content, opts = {}) =>
  new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: (Array.isArray(content) ? content : [{ text: content }]).map(
      (r) => new TextRun({ size: 22, ...r }),
    ),
  });

export const bullet = (content, level = 0) =>
  new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: (Array.isArray(content) ? content : [{ text: content }]).map(
      (r) => new TextRun({ size: 22, ...r }),
    ),
  });

export const note = (text) =>
  p([{ text, italics: true, color: MUTED, size: 20 }]);

// Usable page width in DXA (US Letter, 1" margins): 8.5" − 2" = 6.5" × 1440.
const PAGE_DXA = 9360;

const cell = (content, { header = false, fill, dxa } = {}) =>
  new TableCell({
    shading: fill ? { type: ShadingType.CLEAR, fill } : header ? { type: ShadingType.CLEAR, fill: "f0efec" } : undefined,
    width: dxa ? { size: dxa, type: WidthType.DXA } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: (Array.isArray(content) ? content : [content]).map((c) =>
      typeof c === "string"
        ? new Paragraph({ children: [new TextRun({ text: c, bold: header, size: 20 })] })
        : c,
    ),
  });

/**
 * table(["Col A", "Col B"], [["a1","b1"], ...], { widths: [30,70] })
 * `widths` are percentages of the printable page width; converted to
 * absolute DXA with a fixed layout, because percentage cell widths
 * (OOXML "pct" = fiftieths of a percent) render collapsed in some
 * viewers (caught via QuickLook verification, 2026-08-03).
 * A row cell may be a string or { text, fill } for a shaded cell.
 */
export const table = (headerRow, rows, { widths } = {}) => {
  const pct = widths ?? headerRow.map(() => 100 / headerRow.length);
  const dxas = pct.map((w) => Math.round((w / 100) * PAGE_DXA));
  return new Table({
    width: { size: PAGE_DXA, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: dxas,
    borders: Object.fromEntries(
      ["top", "bottom", "left", "right", "insideHorizontal", "insideVertical"].map((s) => [
        s,
        { style: BorderStyle.SINGLE, size: 4, color: "c3c2b7" },
      ]),
    ),
    rows: [
      new TableRow({
        tableHeader: true,
        children: headerRow.map((t, i) => cell(t, { header: true, dxa: dxas[i] })),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c, i) =>
              typeof c === "object" && c !== null && "text" in c
                ? cell(c.text, { fill: c.fill, dxa: dxas[i] })
                : cell(c, { dxa: dxas[i] }),
            ),
          }),
      ),
    ],
  });
};

export const titlePage = (title, subtitle, updated) => [
  new Paragraph({
    spacing: { before: 400, after: 80 },
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: title, bold: true, size: 56, color: INK })],
  }),
  p([{ text: subtitle, size: 26, color: MUTED }]),
  p([{ text: `Last updated: ${updated}`, size: 20, color: MUTED, italics: true }]),
];

/** Build and write a .docx from an array of children. */
export async function writeDoc(path, children) {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
        heading1: { run: { font: "Calibri", size: 34 } },
        heading2: { run: { font: "Calibri", size: 28 } },
        heading3: { run: { font: "Calibri", size: 24 } },
      },
    },
    sections: [{ children }],
  });
  writeFileSync(path, await Packer.toBuffer(doc));
  console.log(`wrote ${path}`);
}

export const TODAY = new Date().toISOString().slice(0, 10);
