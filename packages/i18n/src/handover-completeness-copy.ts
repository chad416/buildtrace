import type { SupportedLocale } from '@buildtrace/shared';

export type HandoverCompletenessCopy = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly completedLabel: string;
  readonly requiredLabel: string;
  readonly missingTitle: string;
  readonly completeMessage: string;
  readonly export: {
    readonly sectionTitle: string;
    readonly sectionDescription: string;
    readonly noDocumentsMessage: string;
    readonly generateButtonLabel: string;
    readonly createdMessage: string;
    readonly errorTitle: string;
    readonly historyTitle: string;
    readonly noHistoryMessage: string;
    readonly downloadButtonLabel: string;
    readonly documentsLabel: string;
    readonly sizeLabel: string;
    readonly sensitiveWarning: string;
  };
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
    export: {
      sectionTitle: 'Generate handover ZIP',
      sectionDescription: 'Select customer-visible documents to include in the handover package.',
      noDocumentsMessage: 'No customer-visible documents are available for export.',
      generateButtonLabel: 'Generate ZIP',
      createdMessage: 'Handover ZIP was generated successfully.',
      errorTitle: 'Export could not be created',
      historyTitle: 'Export history',
      noHistoryMessage: 'No handover exports have been created yet.',
      downloadButtonLabel: 'Download',
      documentsLabel: 'documents',
      sizeLabel: 'archive',
      sensitiveWarning:
        'Warning: the following sensitive engineering categories are included in this export',
    },
  },
  cs: {
    eyebrow: 'Předání zákazníkovi',
    title: 'Úplnost předání',
    description: 'Úplnost zahrnuje pouze požadované dokumenty výslovně viditelné pro zákazníka.',
    completedLabel: 'splněno',
    requiredLabel: 'požadováno',
    missingTitle: 'Chybějící požadované dokumenty',
    completeMessage: 'Všechny požadované dokumenty pro předání zákazníkovi jsou k dispozici.',
    export: {
      sectionTitle: 'Vygenerovat ZIP pro předání',
      sectionDescription:
        'Vyberte dokumenty viditelné pro zákazníka, které chcete zahrnout do balíčku pro předání.',
      noDocumentsMessage: 'Pro export nejsou k dispozici žádné dokumenty viditelné pro zákazníka.',
      generateButtonLabel: 'Vygenerovat ZIP',
      createdMessage: 'ZIP pro předání byl úspěšně vygenerován.',
      errorTitle: 'Export se nepodařilo vytvořit',
      historyTitle: 'Historie exportů',
      noHistoryMessage: 'Zatím nebyly vytvořeny žádné exporty předání.',
      downloadButtonLabel: 'Stáhnout',
      documentsLabel: 'dokumentů',
      sizeLabel: 'archiv',
      sensitiveWarning:
        'Upozornění: následující citlivé technické kategorie jsou zahrnuty v tomto exportu',
    },
  },
  sk: {
    eyebrow: 'Odovzdanie zákazníkovi',
    title: 'Úplnosť odovzdania',
    description: 'Úplnosť zahŕňa iba požadované dokumenty výslovne viditeľné pre zákazníka.',
    completedLabel: 'splnené',
    requiredLabel: 'požadované',
    missingTitle: 'Chýbajúce požadované dokumenty',
    completeMessage: 'Všetky požadované dokumenty na odovzdanie zákazníkovi sú k dispozícii.',
    export: {
      sectionTitle: 'Vygenerovať ZIP pre odovzdanie',
      sectionDescription:
        'Vyberte dokumenty viditeľné pre zákazníka, ktoré chcete zahrnúť do balíčka pre odovzdanie.',
      noDocumentsMessage:
        'Pre export nie sú k dispozícii žiadne dokumenty viditeľné pre zákazníka.',
      generateButtonLabel: 'Vygenerovať ZIP',
      createdMessage: 'ZIP pre odovzdanie bol úspešne vygenerovaný.',
      errorTitle: 'Export sa nepodarilo vytvoriť',
      historyTitle: 'História exportov',
      noHistoryMessage: 'Zatiaľ neboli vytvorené žiadne exporty odovzdania.',
      downloadButtonLabel: 'Stiahnuť',
      documentsLabel: 'dokumentov',
      sizeLabel: 'archív',
      sensitiveWarning:
        'Upozornenie: nasledujúce citlivé technické kategórie sú odovzdané v tomto exporte',
    },
  },
  pl: {
    eyebrow: 'Przekazanie klientowi',
    title: 'Kompletność przekazania',
    description: 'Kompletność obejmuje wyłącznie wymagane dokumenty wyraźnie widoczne dla klienta.',
    completedLabel: 'ukończone',
    requiredLabel: 'wymagane',
    missingTitle: 'Brakujące wymagane dokumenty',
    completeMessage: 'Wszystkie wymagane dokumenty przekazania klientowi są dostępne.',
    export: {
      sectionTitle: 'Generuj ZIP przekazania',
      sectionDescription:
        'Wybierz dokumenty widoczne dla klienta, które mają zostać uwzględnione w pakiecie przekazania.',
      noDocumentsMessage: 'Brak dokumentów widocznych dla klienta dostępnych do eksportu.',
      generateButtonLabel: 'Generuj ZIP',
      createdMessage: 'ZIP przekazania został pomyślnie wygenerowany.',
      errorTitle: 'Nie udało się utworzyć eksportu',
      historyTitle: 'Historia eksportów',
      noHistoryMessage: 'Nie utworzono jeszcze żadnych eksportów przekazania.',
      downloadButtonLabel: 'Pobierz',
      documentsLabel: 'dokumentów',
      sizeLabel: 'archiwum',
      sensitiveWarning:
        'Ostrzeżenie: następujące wrażliwe kategorie inżynieryjne są uwzględnione w tym eksporcie',
    },
  },
  de: {
    eyebrow: 'Kundenübergabe',
    title: 'Vollständigkeit der Übergabe',
    description:
      'Die Vollständigkeit berücksichtigt nur erforderliche Dokumente, die ausdrücklich für Kunden sichtbar sind.',
    completedLabel: 'erfüllt',
    requiredLabel: 'erforderlich',
    missingTitle: 'Fehlende erforderliche Dokumente',
    completeMessage: 'Alle erforderlichen Dokumente für die Kundenübergabe sind vorhanden.',
    export: {
      sectionTitle: 'Übergabe-ZIP erstellen',
      sectionDescription:
        'Wählen Sie kundensichtige Dokumente aus, die in das Übergabepaket aufgenommen werden sollen.',
      noDocumentsMessage: 'Keine kundensichtigen Dokumente für den Export verfügbar.',
      generateButtonLabel: 'ZIP erstellen',
      createdMessage: 'Übergabe-ZIP wurde erfolgreich erstellt.',
      errorTitle: 'Export konnte nicht erstellt werden',
      historyTitle: 'Exportverlauf',
      noHistoryMessage: 'Es wurden noch keine Übergabe-Exporte erstellt.',
      downloadButtonLabel: 'Herunterladen',
      documentsLabel: 'Dokumente',
      sizeLabel: 'Archiv',
      sensitiveWarning:
        'Warnung: Die folgenden sensiblen technischen Kategorien sind in diesem Export enthalten',
    },
  },
  fr: {
    eyebrow: 'Remise au client',
    title: 'Complétude de la remise',
    description:
      'La complétude compte uniquement les documents requis explicitement visibles par le client.',
    completedLabel: 'terminés',
    requiredLabel: 'requis',
    missingTitle: 'Documents requis manquants',
    completeMessage: 'Tous les documents requis pour la remise au client sont présents.',
    export: {
      sectionTitle: 'Générer le ZIP de remise',
      sectionDescription:
        'Sélectionnez les documents visibles par le client à inclure dans le package de remise.',
      noDocumentsMessage: "Aucun document visible par le client n'est disponible pour l'export.",
      generateButtonLabel: 'Générer le ZIP',
      createdMessage: 'Le ZIP de remise a été généré avec succès.',
      errorTitle: "L'export n'a pas pu être créé",
      historyTitle: 'Historique des exports',
      noHistoryMessage: "Aucun export de remise n'a encore été créé.",
      downloadButtonLabel: 'Télécharger',
      documentsLabel: 'documents',
      sizeLabel: 'archive',
      sensitiveWarning:
        'Avertissement : les catégories techniques sensibles suivantes sont incluses dans cet export',
    },
  },
  es: {
    eyebrow: 'Entrega al cliente',
    title: 'Integridad de la entrega',
    description:
      'La integridad solo cuenta los documentos requeridos que son explícitamente visibles para el cliente.',
    completedLabel: 'completados',
    requiredLabel: 'requeridos',
    missingTitle: 'Documentos requeridos pendientes',
    completeMessage:
      'Todos los documentos requeridos para la entrega al cliente están disponibles.',
    export: {
      sectionTitle: 'Generar ZIP de entrega',
      sectionDescription:
        'Seleccione los documentos visibles para el cliente que se incluirán en el paquete de entrega.',
      noDocumentsMessage: 'No hay documentos visibles para el cliente disponibles para exportar.',
      generateButtonLabel: 'Generar ZIP',
      createdMessage: 'El ZIP de entrega se generó correctamente.',
      errorTitle: 'No se pudo crear la exportación',
      historyTitle: 'Historial de exportaciones',
      noHistoryMessage: 'Aún no se han creado exportaciones de entrega.',
      downloadButtonLabel: 'Descargar',
      documentsLabel: 'documentos',
      sizeLabel: 'archivo',
      sensitiveWarning:
        'Advertencia: las siguientes categorías técnicas sensibles se incluyen en esta exportación',
    },
  },
} as const satisfies Record<SupportedLocale, HandoverCompletenessCopy>;
