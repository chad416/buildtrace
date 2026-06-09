import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{
    locale: string;
    machineId: string;
  }>;
};

export default async function MachineDetailPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.machineDetail;

  const sections = [
    {
      id: 'machine-overview',
      titleId: 'machine-overview-title',
      messages: messages.sections.overview,
    },
    {
      id: 'handover-readiness',
      titleId: 'machine-handover-readiness-title',
      messages: messages.sections.handoverReadiness,
    },
    {
      id: 'documents',
      titleId: 'machine-documents-title',
      messages: messages.sections.documents,
    },
    {
      id: 'tickets',
      titleId: 'machine-tickets-title',
      messages: messages.sections.tickets,
    },
    {
      id: 'software-timeline',
      titleId: 'machine-software-timeline-title',
      messages: messages.sections.softwareTimeline,
    },
    {
      id: 'spare-parts',
      titleId: 'machine-spare-parts-title',
      messages: messages.sections.spareParts,
    },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-10 sm:px-6 md:py-14 lg:px-8">
      <section
        aria-labelledby="machine-detail-title"
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] lg:items-start"
      >
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
            {messages.eyebrow}
          </p>
          <h1
            id="machine-detail-title"
            className="mt-4 text-3xl font-semibold tracking-normal text-white sm:text-4xl md:text-5xl"
          >
            {messages.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
            {messages.description}
          </p>
        </div>

        <aside
          aria-label={messages.placeholder.ariaLabel}
          className="rounded-lg border border-dashed border-emerald-500/40 bg-emerald-950/10 p-5 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-amber-200">
            {messages.placeholder.eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
            {messages.placeholder.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-stone-300">{messages.placeholder.body}</p>
        </aside>
      </section>

      <section aria-label={messages.sectionsAriaLabel} className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.id}
            id={section.id}
            aria-labelledby={section.titleId}
            className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
              {section.messages.eyebrow}
            </p>
            <h2
              id={section.titleId}
              className="mt-3 text-xl font-semibold tracking-normal text-white"
            >
              {section.messages.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{section.messages.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
