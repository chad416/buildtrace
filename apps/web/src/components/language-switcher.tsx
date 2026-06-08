import { locales, type Locale } from '@buildtrace/i18n';
import Link from 'next/link';

type LanguageSwitcherMessages = {
  readonly label: string;
  readonly localeLabels: Readonly<Record<Locale, string>>;
};

type LanguageSwitcherProps = {
  readonly currentLocale: Locale;
  readonly messages: LanguageSwitcherMessages;
};

export function LanguageSwitcher({ currentLocale, messages }: LanguageSwitcherProps) {
  return (
    <nav aria-label={messages.label}>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {locales.map((locale) => (
          <li key={locale}>
            <Link
              aria-current={locale === currentLocale ? 'page' : undefined}
              href={`/${locale}`}
              hrefLang={locale}
              lang={locale}
            >
              {messages.localeLabels[locale]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
