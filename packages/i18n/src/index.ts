import csMessages from '../messages/cs.json';
import deMessages from '../messages/de.json';
import enMessages from '../messages/en.json';
import esMessages from '../messages/es.json';
import frMessages from '../messages/fr.json';
import plMessages from '../messages/pl.json';
import skMessages from '../messages/sk.json';

export const locales = ['en', 'cs', 'sk', 'pl', 'de', 'fr', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isSupportedLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const appMessages = {
  en: {
    appName: enMessages.app.name,
    phaseName: enMessages.app.phase,
    languageSwitcher: enMessages.languageSwitcher,
  },
  cs: {
    appName: csMessages.app.name,
    phaseName: csMessages.app.phase,
    languageSwitcher: csMessages.languageSwitcher,
  },
  sk: {
    appName: skMessages.app.name,
    phaseName: skMessages.app.phase,
    languageSwitcher: skMessages.languageSwitcher,
  },
  pl: {
    appName: plMessages.app.name,
    phaseName: plMessages.app.phase,
    languageSwitcher: plMessages.languageSwitcher,
  },
  de: {
    appName: deMessages.app.name,
    phaseName: deMessages.app.phase,
    languageSwitcher: deMessages.languageSwitcher,
  },
  fr: {
    appName: frMessages.app.name,
    phaseName: frMessages.app.phase,
    languageSwitcher: frMessages.languageSwitcher,
  },
  es: {
    appName: esMessages.app.name,
    phaseName: esMessages.app.phase,
    languageSwitcher: esMessages.languageSwitcher,
  },
} as const;
