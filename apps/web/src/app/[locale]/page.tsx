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

  const featureSections = [
    {
      id: 'evidence-readiness',
      titleId: 'landing-evidence-readiness-title',
      heading: messages.sections.evidence.heading,
      body: messages.sections.evidence.body,
    },
    {
      id: 'documentation',
      titleId: 'landing-documentation-title',
      heading: messages.sections.documentation.heading,
      body: messages.sections.documentation.body,
    },
  ] as const;

  const trustSections = [
    {
      id: 'privacy',
      titleId: 'landing-privacy-title',
      heading: messages.trust.privacy.heading,
      body: messages.trust.privacy.body,
    },
    {
      id: 'security',
      titleId: 'landing-security-title',
      heading: messages.trust.security.heading,
      body: messages.trust.security.body,
    },
    {
      id: 'data-protection',
      titleId: 'landing-data-protection-title',
      heading: messages.trust.dataProtection.heading,
      body: messages.trust.dataProtection.body,
    },
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12 md:py-16">
      <section id="overview" aria-labelledby="landing-title" className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.hero.eyebrow}
        </p>
        <h1
          id="landing-title"
          className="mt-4 text-4xl font-semibold tracking-normal text-white md:text-5xl"
        >
          {messages.hero.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-300">{messages.hero.description}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {featureSections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={section.titleId}
            className="rounded-lg border border-stone-800 bg-neutral-900/70 p-6"
          >
            <h2 id={section.titleId} className="text-xl font-semibold tracking-normal text-white">
              {section.heading}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {trustSections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={section.titleId}
            className="rounded-lg border border-stone-800 bg-neutral-900/50 p-5"
          >
            <h2 id={section.titleId} className="text-lg font-semibold tracking-normal text-white">
              {section.heading}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
