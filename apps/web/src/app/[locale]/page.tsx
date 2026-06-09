import { appMessages, isSupportedLocale, locales } from '@buildtrace/i18n';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].landing;

  const boundaryHighlights = [
    {
      id: 'customer-visible-files',
      messages: messages.boundaries.customerVisibleFiles,
    },
    {
      id: 'private-engineering-docs',
      messages: messages.boundaries.privateEngineeringDocs,
    },
    {
      id: 'handover-readiness',
      messages: messages.boundaries.handoverReadiness,
    },
  ] as const;

  const featureSections = [
    {
      id: 'evidence-readiness',
      titleId: 'landing-evidence-readiness-title',
      messages: messages.sections.evidence,
    },
    {
      id: 'documentation',
      titleId: 'landing-documentation-title',
      messages: messages.sections.documentation,
    },
  ] as const;

  const trustSections = [
    {
      id: 'privacy',
      titleId: 'landing-privacy-title',
      messages: messages.trust.privacy,
    },
    {
      id: 'security',
      titleId: 'landing-security-title',
      messages: messages.trust.security,
    },
    {
      id: 'data-protection',
      titleId: 'landing-data-protection-title',
      messages: messages.trust.dataProtection,
    },
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-5 py-10 sm:px-6 md:py-14 lg:px-8">
      <section
        id="overview"
        aria-labelledby="landing-title"
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] lg:items-start"
      >
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
            {messages.hero.eyebrow}
          </p>
          <h1
            id="landing-title"
            className="mt-4 max-w-3xl text-3xl font-semibold tracking-normal text-white sm:text-4xl md:text-5xl"
          >
            {messages.hero.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
            {messages.hero.description}
          </p>
        </div>

        <aside
          aria-label={messages.hero.asideAriaLabel}
          className="rounded-lg border border-emerald-500/25 bg-neutral-900/70 p-5 shadow-2xl shadow-emerald-950/20 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-amber-200">
            {messages.hero.asideEyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
            {messages.hero.asideTitle}
          </h2>
          <p className="mt-3 text-sm leading-6 text-stone-300">{messages.hero.asideBody}</p>
        </aside>
      </section>

      <section aria-label={messages.boundariesAriaLabel} className="grid gap-4 md:grid-cols-3">
        {boundaryHighlights.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-stone-800 bg-neutral-900/50 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
              {item.messages.eyebrow}
            </p>
            <h2 className="mt-3 text-lg font-semibold tracking-normal text-white">
              {item.messages.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{item.messages.body}</p>
          </article>
        ))}
      </section>

      <section aria-label={messages.sectionsAriaLabel} className="grid gap-4 lg:grid-cols-2">
        {featureSections.map((section) => (
          <article
            key={section.id}
            id={section.id}
            aria-labelledby={section.titleId}
            className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-normal text-amber-200">
              {section.messages.eyebrow}
            </p>
            <h2
              id={section.titleId}
              className="mt-3 text-xl font-semibold tracking-normal text-white"
            >
              {section.messages.heading}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{section.messages.body}</p>
          </article>
        ))}
      </section>

      <section aria-label={messages.trustAriaLabel} className="grid gap-4 md:grid-cols-3">
        {trustSections.map((section) => (
          <article
            key={section.id}
            id={section.id}
            aria-labelledby={section.titleId}
            className="rounded-lg border border-stone-800 bg-neutral-950 p-5"
          >
            <h2 id={section.titleId} className="text-lg font-semibold tracking-normal text-white">
              {section.messages.heading}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{section.messages.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
