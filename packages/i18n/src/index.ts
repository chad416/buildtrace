import { supportedLocales } from '@buildtrace/shared';

import csMessages from '../messages/cs.json';
import deMessages from '../messages/de.json';
import enMessages from '../messages/en.json';
import esMessages from '../messages/es.json';
import frMessages from '../messages/fr.json';
import plMessages from '../messages/pl.json';
import skMessages from '../messages/sk.json';

export { documentLabels } from './document-labels';
export type { DocumentLabels } from './document-labels';

export const locales = supportedLocales;

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
    shell: enMessages.shell,
    landing: enMessages.landing,
    pages: enMessages.pages,
  },
  cs: {
    appName: csMessages.app.name,
    phaseName: csMessages.app.phase,
    languageSwitcher: csMessages.languageSwitcher,
    shell: csMessages.shell,
    landing: csMessages.landing,
    pages: csMessages.pages,
  },
  sk: {
    appName: skMessages.app.name,
    phaseName: skMessages.app.phase,
    languageSwitcher: skMessages.languageSwitcher,
    shell: skMessages.shell,
    landing: skMessages.landing,
    pages: skMessages.pages,
  },
  pl: {
    appName: plMessages.app.name,
    phaseName: plMessages.app.phase,
    languageSwitcher: plMessages.languageSwitcher,
    shell: plMessages.shell,
    landing: plMessages.landing,
    pages: plMessages.pages,
  },
  de: {
    appName: deMessages.app.name,
    phaseName: deMessages.app.phase,
    languageSwitcher: deMessages.languageSwitcher,
    shell: deMessages.shell,
    landing: deMessages.landing,
    pages: deMessages.pages,
  },
  fr: {
    appName: frMessages.app.name,
    phaseName: frMessages.app.phase,
    languageSwitcher: frMessages.languageSwitcher,
    shell: frMessages.shell,
    landing: frMessages.landing,
    pages: frMessages.pages,
  },
  es: {
    appName: esMessages.app.name,
    phaseName: esMessages.app.phase,
    languageSwitcher: esMessages.languageSwitcher,
    shell: esMessages.shell,
    landing: esMessages.landing,
    pages: esMessages.pages,
  },
} as const;
