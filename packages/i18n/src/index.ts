export const locales = ['en', 'cs', 'sk', 'pl', 'de', 'fr', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isSupportedLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const phaseZeroMessages = {
  en: {
    appName: 'BuildTrace Beta',
    phaseName: 'Professional project foundation',
  },
  cs: {
    appName: 'BuildTrace Beta',
    phaseName: 'Profesionální základ projektu',
  },
  sk: {
    appName: 'BuildTrace Beta',
    phaseName: 'Profesionálny základ projektu',
  },
  pl: {
    appName: 'BuildTrace Beta',
    phaseName: 'Profesjonalna podstawa projektu',
  },
  de: {
    appName: 'BuildTrace Beta',
    phaseName: 'Professionelle Projektgrundlage',
  },
  fr: {
    appName: 'BuildTrace Beta',
    phaseName: 'Base professionnelle du projet',
  },
  es: {
    appName: 'BuildTrace Beta',
    phaseName: 'Base profesional del proyecto',
  },
} as const;
