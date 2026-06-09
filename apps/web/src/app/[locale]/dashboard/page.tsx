import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.dashboard;

  const cards = [
    { id: 'handover-readiness', messages: messages.cards.handoverReadiness },
    { id: 'machine-records', messages: messages.cards.machineRecords },
    { id: 'document-organization', messages: messages.cards.documentOrganization },
    { id: 'ticket-activity', messages: messages.cards.ticketActivity },
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12 md:py-16">
      <section aria-labelledby="dashboard-title" className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.eyebrow}
        </p>
        <h1
          id="dashboard-title"
          className="mt-4 text-4xl font-semibold tracking-normal text-white md:text-5xl"
        >
          {messages.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-300">{messages.description}</p>
      </section>

      <section aria-label={messages.gridAriaLabel} className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.id}
            className="rounded-lg border border-stone-800 bg-neutral-900/70 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-normal text-amber-200">
              {card.messages.eyebrow}
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-normal text-white">
              {card.messages.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{card.messages.body}</p>
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
    </main>
  );
}
