import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function SettingsPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.settings;

  const sections = [
    { id: 'user-role', messages: messages.sections.userRole },
    { id: 'preferred-language', messages: messages.sections.preferredLanguage },
    { id: 'future-mfa', messages: messages.sections.futureMfa },
    { id: 'data-export', messages: messages.sections.dataExport },
    { id: 'security-logs', messages: messages.sections.securityLogs },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12 md:py-16">
      <section aria-labelledby="settings-title" className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.eyebrow}
        </p>
        <h1
          id="settings-title"
          className="mt-4 text-4xl font-semibold tracking-normal text-white md:text-5xl"
        >
          {messages.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-300">{messages.description}</p>
      </section>

      <section aria-label={messages.sectionsAriaLabel} className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.id}
            className="rounded-lg border border-stone-800 bg-neutral-900/70 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-normal text-amber-200">
              {section.messages.eyebrow}
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-normal text-white">
              {section.messages.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{section.messages.body}</p>
          </article>
        ))}
      </section>

      <section
        aria-label={messages.emptyState.ariaLabel}
        className="rounded-lg border border-dashed border-stone-700 bg-neutral-900/50 p-6"
      >
        <h2 className="text-xl font-semibold tracking-normal text-white">
          {messages.emptyState.title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
          {messages.emptyState.body}
        </p>
      </section>
    </div>
  );
}
