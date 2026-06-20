import type { DocumentLabels, HandoverCompletenessCopy } from '@buildtrace/i18n';
import type {
  CustomerHandoverCompleteness,
  DocumentCategory,
  DocumentVisibilityLevel,
  SupportedLocale,
} from '@buildtrace/shared';
import { chromium } from 'playwright';

type PdfPage = {
  readonly setContent: (
    html: string,
    options: {
      readonly waitUntil: 'networkidle';
    },
  ) => Promise<unknown>;
  readonly pdf: (options: {
    readonly format: 'A4';
    readonly margin: {
      readonly top: '15mm';
      readonly right: '15mm';
      readonly bottom: '15mm';
      readonly left: '15mm';
    };
    readonly printBackground: true;
  }) => Promise<Uint8Array>;
  readonly close: () => Promise<unknown>;
};

type PdfBrowser = {
  readonly newPage: () => Promise<PdfPage>;
  readonly close: () => Promise<unknown>;
};

export type CustomerHandoverPdfPlaywrightLauncher = {
  readonly launch: (options: { readonly headless: true }) => Promise<PdfBrowser>;
};

export type BuildCustomerHandoverPdfSummaryInput = {
  readonly machineName: string;
  readonly serialNumber: string;
  readonly locale: SupportedLocale;
  readonly completeness: CustomerHandoverCompleteness;
  readonly documents: readonly {
    readonly fileName: string;
    readonly category: DocumentCategory;
    readonly visibilityLevel: DocumentVisibilityLevel;
  }[];
  readonly exportId: string;
  readonly createdAt: Date;
  readonly sensitiveCategories: readonly string[];
  readonly labels: DocumentLabels;
  readonly copy: HandoverCompletenessCopy;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function categoryLabel(category: string, labels: DocumentLabels): string {
  return Object.hasOwn(labels.categories, category)
    ? labels.categories[category as DocumentCategory]
    : category;
}

function renderCategoryList(categories: readonly string[], labels: DocumentLabels): string {
  return categories
    .map(
      (category) =>
        `<li style="margin:0 0 6px;color:#e5e5e5;">${escapeHtml(categoryLabel(category, labels))}</li>`,
    )
    .join('');
}

function renderDocuments(
  documents: BuildCustomerHandoverPdfSummaryInput['documents'],
  labels: DocumentLabels,
): string {
  const grouped = new Map<DocumentCategory, string[]>();

  for (const document of documents) {
    const current = grouped.get(document.category) ?? [];
    current.push(document.fileName);
    grouped.set(document.category, current);
  }

  return Array.from(grouped.entries())
    .map(
      ([category, fileNames]) => `
        <section style="margin:0 0 18px;break-inside:avoid;">
          <h3 style="margin:0 0 8px;color:#34d399;font-size:15px;font-weight:700;">
            ${escapeHtml(labels.categories[category])}
          </h3>
          <ul style="margin:0;padding-left:20px;">
            ${fileNames
              .map(
                (fileName) =>
                  `<li style="margin:0 0 6px;color:#e5e5e5;">${escapeHtml(fileName)}</li>`,
              )
              .join('')}
          </ul>
        </section>
      `,
    )
    .join('');
}

function buildHtml(input: BuildCustomerHandoverPdfSummaryInput): string {
  const formattedDate = new Intl.DateTimeFormat(input.locale, {
    dateStyle: 'medium',
  }).format(input.createdAt);
  const missingCategories =
    input.completeness.missingCategories.length > 0
      ? `
        <section style="margin:28px 0 0;">
          <h2 style="margin:0 0 12px;color:#e5e5e5;font-size:18px;font-weight:700;">
            ${escapeHtml(input.copy.missingTitle)}
          </h2>
          <ul style="margin:0;padding-left:20px;">
            ${renderCategoryList(input.completeness.missingCategories, input.labels)}
          </ul>
        </section>
      `
      : '';
  const sensitiveWarning =
    input.sensitiveCategories.length > 0
      ? `
        <section style="margin:28px 0 0;padding:16px;border:1px solid #34d399;border-radius:8px;break-inside:avoid;">
          <p style="margin:0 0 10px;color:#34d399;font-size:14px;font-weight:700;">
            ${escapeHtml(input.copy.export.sensitiveWarning)}
          </p>
          <ul style="margin:0;padding-left:20px;">
            ${renderCategoryList(input.sensitiveCategories, input.labels)}
          </ul>
        </section>
      `
      : '';

  return `<!doctype html>
<html lang="${escapeHtml(input.locale)}">
  <head>
    <meta charset="utf-8">
  </head>
  <body style="margin:0;background:#0a0a0a;color:#e5e5e5;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;">
    <main style="min-height:100vh;background:#0a0a0a;color:#e5e5e5;">
      <header style="padding:0 0 22px;border-bottom:1px solid #2a2a2a;">
        <p style="margin:0 0 8px;color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
          ${escapeHtml(input.copy.eyebrow)}
        </p>
        <h1 style="margin:0;color:#e5e5e5;font-size:28px;line-height:1.2;">
          ${escapeHtml(input.machineName)}
        </h1>
        <p style="margin:8px 0 0;color:#bdbdbd;font-size:14px;">
          ${escapeHtml(input.serialNumber)} · ${escapeHtml(formattedDate)}
        </p>
      </header>

      <section style="margin:28px 0 0;padding:20px;border:1px solid #2a2a2a;border-radius:10px;break-inside:avoid;">
        <h2 style="margin:0;color:#e5e5e5;font-size:18px;font-weight:700;">
          ${escapeHtml(input.copy.title)}
        </h2>
        <p style="margin:12px 0 0;color:#34d399;font-size:36px;font-weight:800;line-height:1;">
          ${input.completeness.percentage}%
        </p>
        <p style="margin:10px 0 0;color:#bdbdbd;font-size:14px;">
          ${input.completeness.completedCount} ${escapeHtml(input.copy.completedLabel)} ·
          ${input.completeness.requiredCount} ${escapeHtml(input.copy.requiredLabel)}
        </p>
      </section>

      ${missingCategories}

      <section style="margin:28px 0 0;">
        <h2 style="margin:0 0 16px;color:#e5e5e5;font-size:18px;font-weight:700;">
          ${escapeHtml(input.copy.export.documentsLabel)}
        </h2>
        ${renderDocuments(input.documents, input.labels)}
      </section>

      ${sensitiveWarning}

      <footer style="margin:32px 0 0;padding:16px 0 0;border-top:1px solid #2a2a2a;color:#8d8d8d;font-size:11px;">
        ${escapeHtml(input.completeness.checklistVersion)} · ${escapeHtml(input.exportId)}
      </footer>
    </main>
  </body>
</html>`;
}

export async function buildCustomerHandoverPdfSummary(
  input: BuildCustomerHandoverPdfSummaryInput,
  playwrightLauncher: CustomerHandoverPdfPlaywrightLauncher = chromium,
): Promise<ArrayBuffer> {
  const browser = await playwrightLauncher.launch({ headless: true });
  let page: PdfPage | undefined;

  try {
    page = await browser.newPage();
    await page.setContent(buildHtml(input), { waitUntil: 'networkidle' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
      printBackground: true,
    });

    return Uint8Array.from(pdf).buffer;
  } finally {
    try {
      await page?.close();
    } finally {
      await browser.close();
    }
  }
}
