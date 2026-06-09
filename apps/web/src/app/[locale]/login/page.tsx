import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LoginPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.login;

  const previewItems = [
    { id: 'identity', messages: messages.preview.identity },
    { id: 'session', messages: messages.preview.session },
    { id: 'boundary', messages: messages.preview.boundary },
  ] as const;

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-12 md:py-16 lg:grid-cols-[1fr_0.85fr] lg:items-start">
      <section aria-labelledby="login-title" className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.eyebrow}
        </p>
        <h1
          id="login-title"
          className="mt-4 text-4xl font-semibold tracking-normal text-white md:text-5xl"
        >
          {messages.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-300">{messages.description}</p>
      </section>

      <section
        aria-label={messages.preview.ariaLabel}
        className="rounded-lg border border-emerald-500/20 bg-neutral-900/80 p-6 shadow-2xl shadow-emerald-950/30"
      >
        <div className="rounded-lg border border-stone-800 bg-neutral-950/80 p-5">
          <p className="text-sm font-semibold uppercase tracking-normal text-amber-200">
            {messages.preview.eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
            {messages.preview.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-stone-300">{messages.preview.body}</p>
        </div>

        <div className="mt-5 grid gap-3">
          {previewItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-stone-800 bg-neutral-950/50 p-4">
              <h3 className="text-sm font-semibold tracking-normal text-white">
                {item.messages.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">{item.messages.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-stone-700 p-4">
          <p className="text-sm leading-6 text-stone-300">{messages.preview.note}</p>
        </div>
      </section>
    </div>
  );
}
