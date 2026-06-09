type PageShellMessages = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly emptyState: {
    readonly ariaLabel: string;
    readonly title: string;
    readonly body: string;
  };
};

type PageShellProps = {
  readonly messages: PageShellMessages;
};

export function PageShell({ messages }: PageShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12 md:py-16">
      <section aria-labelledby="page-shell-title" className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.eyebrow}
        </p>
        <h1
          id="page-shell-title"
          className="mt-4 text-4xl font-semibold tracking-normal text-white md:text-5xl"
        >
          {messages.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-300">{messages.description}</p>
      </section>

      <section
        aria-label={messages.emptyState.ariaLabel}
        className="rounded-lg border border-stone-800 bg-neutral-900/70 p-6"
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
