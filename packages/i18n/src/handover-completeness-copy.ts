import type { SupportedLocale } from '@buildtrace/shared';

export type HandoverCompletenessCopy = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly completedLabel: string;
  readonly requiredLabel: string;
  readonly missingTitle: string;
  readonly completeMessage: string;
};

export const handoverCompletenessCopy = {
  en: {
    eyebrow: 'Customer handover',
    title: 'Handover completeness',
    description:
      'Completeness counts only required documents that are explicitly customer visible.',
    completedLabel: 'completed',
    requiredLabel: 'required',
    missingTitle: 'Missing required documents',
    completeMessage: 'All required customer handover documents are present.',
  },
  cs: {
    eyebrow: 'P\u0159ed\u00e1n\u00ed z\u00e1kazn\u00edkovi',
    title: '\u00daplnost p\u0159ed\u00e1n\u00ed',
    description:
      '\u00daplnost zahrnuje pouze po\u017eadovan\u00e9 dokumenty v\u00fdslovn\u011b viditeln\u00e9 pro z\u00e1kazn\u00edka.',
    completedLabel: 'spln\u011bno',
    requiredLabel: 'po\u017eadov\u00e1no',
    missingTitle: 'Chyb\u011bj\u00edc\u00ed po\u017eadovan\u00e9 dokumenty',
    completeMessage:
      'V\u0161echny po\u017eadovan\u00e9 dokumenty pro p\u0159ed\u00e1n\u00ed z\u00e1kazn\u00edkovi jsou k dispozici.',
  },
  sk: {
    eyebrow: 'Odovzdanie z\u00e1kazn\u00edkovi',
    title: '\u00daplnos\u0165 odovzdania',
    description:
      '\u00daplnos\u0165 zah\u0155\u0148a iba po\u017eadovan\u00e9 dokumenty v\u00fdslovne vidite\u013en\u00e9 pre z\u00e1kazn\u00edka.',
    completedLabel: 'splnen\u00e9',
    requiredLabel: 'po\u017eadovan\u00e9',
    missingTitle: 'Ch\u00fdbaj\u00face po\u017eadovan\u00e9 dokumenty',
    completeMessage:
      'V\u0161etky po\u017eadovan\u00e9 dokumenty na odovzdanie z\u00e1kazn\u00edkovi s\u00fa k dispoz\u00edcii.',
  },
  pl: {
    eyebrow: 'Przekazanie klientowi',
    title: 'Kompletno\u015b\u0107 przekazania',
    description:
      'Kompletno\u015b\u0107 obejmuje wy\u0142\u0105cznie wymagane dokumenty wyra\u017anie widoczne dla klienta.',
    completedLabel: 'uko\u0144czone',
    requiredLabel: 'wymagane',
    missingTitle: 'Brakuj\u0105ce wymagane dokumenty',
    completeMessage: 'Wszystkie wymagane dokumenty przekazania klientowi s\u0105 dost\u0119pne.',
  },
  de: {
    eyebrow: 'Kunden\u00fcbergabe',
    title: 'Vollst\u00e4ndigkeit der \u00dcbergabe',
    description:
      'Die Vollst\u00e4ndigkeit ber\u00fccksichtigt nur erforderliche Dokumente, die ausdr\u00fccklich f\u00fcr Kunden sichtbar sind.',
    completedLabel: 'erf\u00fcllt',
    requiredLabel: 'erforderlich',
    missingTitle: 'Fehlende erforderliche Dokumente',
    completeMessage:
      'Alle erforderlichen Dokumente f\u00fcr die Kunden\u00fcbergabe sind vorhanden.',
  },
  fr: {
    eyebrow: 'Remise au client',
    title: 'Compl\u00e9tude de la remise',
    description:
      'La compl\u00e9tude compte uniquement les documents requis explicitement visibles par le client.',
    completedLabel: 'termin\u00e9s',
    requiredLabel: 'requis',
    missingTitle: 'Documents requis manquants',
    completeMessage: 'Tous les documents requis pour la remise au client sont pr\u00e9sents.',
  },
  es: {
    eyebrow: 'Entrega al cliente',
    title: 'Integridad de la entrega',
    description:
      'La integridad solo cuenta los documentos requeridos que son expl\u00edcitamente visibles para el cliente.',
    completedLabel: 'completados',
    requiredLabel: 'requeridos',
    missingTitle: 'Documentos requeridos pendientes',
    completeMessage:
      'Todos los documentos requeridos para la entrega al cliente est\u00e1n disponibles.',
  },
} as const satisfies Record<SupportedLocale, HandoverCompletenessCopy>;
