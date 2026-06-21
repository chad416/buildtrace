import type { SupportedLocale } from '@buildtrace/shared';

export type QrPortalCopy = {
  readonly title: string;
  readonly serialLabel: string;
  readonly portalDescription: string;
  readonly documentsTitle: string;
  readonly noDocumentsMessage: string;
  readonly ticketButtonLabel: string;
  readonly feedbackButtonLabel: string;
  readonly loadingMessage: string;
  readonly notFoundMessage: string;
  readonly errorMessage: string;
  readonly languageSwitcherLabel: string;
  readonly downloadButtonLabel: string;
};

export const qrPortalCopy = {
  en: {
    title: 'Machine portal',
    serialLabel: 'Serial number',
    portalDescription:
      'Scan this QR code to access machine documents, raise a service ticket, or request a spare part quote.',
    documentsTitle: 'Documents',
    noDocumentsMessage: 'No documents are available for this machine.',
    ticketButtonLabel: 'Raise a service ticket',
    feedbackButtonLabel: 'Leave feedback',
    loadingMessage: 'Loading machine information...',
    notFoundMessage: 'This portal link is not valid or has been disabled.',
    errorMessage: 'Portal could not be loaded.',
    languageSwitcherLabel: 'Language',
    downloadButtonLabel: 'Download',
  },
  cs: {
    title: 'Portál stroje',
    serialLabel: 'Sériové číslo',
    portalDescription:
      'Naskenujte tento QR kód pro přístup k dokumentům stroje, vytvoření servisního požadavku nebo žádost o nabídku náhradních dílů.',
    documentsTitle: 'Dokumenty',
    noDocumentsMessage: 'Pro tento stroj nejsou k dispozici žádné dokumenty.',
    ticketButtonLabel: 'Vytvořit servisní požadavek',
    feedbackButtonLabel: 'Zanechat zpětnou vazbu',
    loadingMessage: 'Načítají se informace o stroji...',
    notFoundMessage: 'Tento odkaz na portál není platný nebo byl deaktivován.',
    errorMessage: 'Portál se nepodařilo načíst.',
    languageSwitcherLabel: 'Jazyk',
    downloadButtonLabel: 'Stáhnout',
  },
  sk: {
    title: 'Portál stroja',
    serialLabel: 'Sériové číslo',
    portalDescription:
      'Naskenujte tento QR kód na prístup k dokumentom stroja, vytvorenie servisnej požiadavky alebo žiadosť o cenovú ponuku náhradných dielov.',
    documentsTitle: 'Dokumenty',
    noDocumentsMessage: 'Pre tento stroj nie sú k dispozícii žiadne dokumenty.',
    ticketButtonLabel: 'Vytvoriť servisnú požiadavku',
    feedbackButtonLabel: 'Zanechať spätnú väzbu',
    loadingMessage: 'Načítavajú sa informácie o stroji...',
    notFoundMessage: 'Tento odkaz na portál nie je platný alebo bol deaktivovaný.',
    errorMessage: 'Portál sa nepodarilo načítať.',
    languageSwitcherLabel: 'Jazyk',
    downloadButtonLabel: 'Stiahnuť',
  },
  pl: {
    title: 'Portal maszyny',
    serialLabel: 'Numer seryjny',
    portalDescription:
      'Zeskanuj ten kod QR, aby uzyskać dostęp do dokumentów maszyny, zgłosić potrzebę serwisu lub poprosić o wycenę części zamiennych.',
    documentsTitle: 'Dokumenty',
    noDocumentsMessage: 'Dla tej maszyny nie są dostępne żadne dokumenty.',
    ticketButtonLabel: 'Zgłoś potrzebę serwisu',
    feedbackButtonLabel: 'Przekaż opinię',
    loadingMessage: 'Ładowanie informacji o maszynie...',
    notFoundMessage: 'Ten link do portalu jest nieprawidłowy lub został wyłączony.',
    errorMessage: 'Nie udało się załadować portalu.',
    languageSwitcherLabel: 'Język',
    downloadButtonLabel: 'Pobierz',
  },
  de: {
    title: 'Maschinenportal',
    serialLabel: 'Seriennummer',
    portalDescription:
      'Scannen Sie diesen QR-Code, um auf Maschinendokumente zuzugreifen, eine Serviceanfrage zu stellen oder ein Ersatzteilangebot anzufordern.',
    documentsTitle: 'Dokumente',
    noDocumentsMessage: 'Für diese Maschine sind keine Dokumente verfügbar.',
    ticketButtonLabel: 'Serviceanfrage stellen',
    feedbackButtonLabel: 'Feedback geben',
    loadingMessage: 'Maschineninformationen werden geladen...',
    notFoundMessage: 'Dieser Portal-Link ist ungültig oder wurde deaktiviert.',
    errorMessage: 'Das Portal konnte nicht geladen werden.',
    languageSwitcherLabel: 'Sprache',
    downloadButtonLabel: 'Herunterladen',
  },
  fr: {
    title: 'Portail de la machine',
    serialLabel: 'Numéro de série',
    portalDescription:
      'Scannez ce code QR pour accéder aux documents de la machine, créer une demande de service ou demander un devis de pièces de rechange.',
    documentsTitle: 'Documents',
    noDocumentsMessage: 'Aucun document n’est disponible pour cette machine.',
    ticketButtonLabel: 'Créer une demande de service',
    feedbackButtonLabel: 'Donner votre avis',
    loadingMessage: 'Chargement des informations de la machine...',
    notFoundMessage: 'Ce lien de portail n’est pas valide ou a été désactivé.',
    errorMessage: 'Le portail n’a pas pu être chargé.',
    languageSwitcherLabel: 'Langue',
    downloadButtonLabel: 'Télécharger',
  },
  es: {
    title: 'Portal de la máquina',
    serialLabel: 'Número de serie',
    portalDescription:
      'Escanee este código QR para acceder a los documentos de la máquina, crear una solicitud de servicio o pedir un presupuesto de repuestos.',
    documentsTitle: 'Documentos',
    noDocumentsMessage: 'No hay documentos disponibles para esta máquina.',
    ticketButtonLabel: 'Crear una solicitud de servicio',
    feedbackButtonLabel: 'Dejar comentarios',
    loadingMessage: 'Cargando información de la máquina...',
    notFoundMessage: 'Este enlace del portal no es válido o ha sido desactivado.',
    errorMessage: 'No se pudo cargar el portal.',
    languageSwitcherLabel: 'Idioma',
    downloadButtonLabel: 'Descargar',
  },
} as const satisfies Record<SupportedLocale, QrPortalCopy>;
