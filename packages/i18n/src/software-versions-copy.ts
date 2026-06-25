import type { SoftwareType, SupportedLocale } from '@buildtrace/shared';

export type SoftwareVersionsCopy = {
  readonly sectionTitle: string;
  readonly sectionDescription: string;
  readonly noVersionsMessage: string;
  readonly newVersionTitle: string;
  readonly versionNameLabel: string;
  readonly softwareTypeLabel: string;
  readonly notesLabel: string;
  readonly isDeliveredVersionLabel: string;
  readonly isCurrentKnownVersionLabel: string;
  readonly submitButtonLabel: string;
  readonly typeLabels: Record<SoftwareType, string>;
  readonly deliveredBadgeLabel: string;
  readonly currentBadgeLabel: string;
  readonly downloadFileLabel: string;
  readonly hasFileLabel: string;
  readonly markAsCurrentLabel: string;
  readonly markAsDeliveredLabel: string;
  readonly uploadedLabel: string;
  readonly changedSinceDeliveryLabel: string;
  readonly errorTitle: string;
};

export const softwareVersionsCopy = {
  en: {
    sectionTitle: 'Software version timeline',
    sectionDescription:
      'Track PLC, HMI, and other software versions delivered with and updated on this machine.',
    noVersionsMessage: 'No software versions have been recorded yet.',
    newVersionTitle: 'Add version',
    versionNameLabel: 'Version name',
    softwareTypeLabel: 'Software type',
    notesLabel: 'Notes',
    isDeliveredVersionLabel: 'Delivered version',
    isCurrentKnownVersionLabel: 'Current known version',
    submitButtonLabel: 'Add version',
    typeLabels: {
      plc: 'PLC',
      hmi: 'HMI',
      robot: 'Robot',
      drive: 'Drive',
      other: 'Other',
    },
    deliveredBadgeLabel: 'Delivered',
    currentBadgeLabel: 'Current',
    downloadFileLabel: 'Download version file',
    hasFileLabel: 'File attached',
    markAsCurrentLabel: 'Mark as current',
    markAsDeliveredLabel: 'Mark as delivered',
    uploadedLabel: 'Added',
    changedSinceDeliveryLabel: 'Changed since delivery',
    errorTitle: 'Version action failed',
  },
  cs: {
    sectionTitle: 'Časová osa verzí softwaru',
    sectionDescription:
      'Sledujte verze PLC, HMI a dalšího softwaru dodané se strojem a aktualizované na něm.',
    noVersionsMessage: 'Zatím nebyly zaznamenány žádné verze softwaru.',
    newVersionTitle: 'Přidat verzi',
    versionNameLabel: 'Název verze',
    softwareTypeLabel: 'Typ softwaru',
    notesLabel: 'Poznámky',
    isDeliveredVersionLabel: 'Dodaná verze',
    isCurrentKnownVersionLabel: 'Aktuální známá verze',
    submitButtonLabel: 'Přidat verzi',
    typeLabels: {
      plc: 'PLC',
      hmi: 'HMI',
      robot: 'Robot',
      drive: 'Pohon',
      other: 'Jiné',
    },
    deliveredBadgeLabel: 'Dodáno',
    currentBadgeLabel: 'Aktuální',
    downloadFileLabel: 'Stáhnout soubor verze',
    hasFileLabel: 'Soubor přiložen',
    markAsCurrentLabel: 'Označit jako aktuální',
    markAsDeliveredLabel: 'Označit jako dodané',
    uploadedLabel: 'Přidáno',
    changedSinceDeliveryLabel: 'Změněno od dodání',
    errorTitle: 'Akce verze selhala',
  },
  sk: {
    sectionTitle: 'Časová os verzií softvéru',
    sectionDescription:
      'Sledujte verzie PLC, HMI a ďalšieho softvéru dodané so strojom a aktualizované na ňom.',
    noVersionsMessage: 'Zatiaľ neboli zaznamenané žiadne verzie softvéru.',
    newVersionTitle: 'Pridať verziu',
    versionNameLabel: 'Názov verzie',
    softwareTypeLabel: 'Typ softvéru',
    notesLabel: 'Poznámky',
    isDeliveredVersionLabel: 'Dodaná verzia',
    isCurrentKnownVersionLabel: 'Aktuálna známa verzia',
    submitButtonLabel: 'Pridať verziu',
    typeLabels: {
      plc: 'PLC',
      hmi: 'HMI',
      robot: 'Robot',
      drive: 'Pohon',
      other: 'Iné',
    },
    deliveredBadgeLabel: 'Dodané',
    currentBadgeLabel: 'Aktuálne',
    downloadFileLabel: 'Stiahnuť súbor verzie',
    hasFileLabel: 'Súbor priložený',
    markAsCurrentLabel: 'Označiť ako aktuálne',
    markAsDeliveredLabel: 'Označiť ako dodané',
    uploadedLabel: 'Pridané',
    changedSinceDeliveryLabel: 'Zmenené od dodania',
    errorTitle: 'Akcia verzie zlyhala',
  },
  pl: {
    sectionTitle: 'Oś czasu wersji oprogramowania',
    sectionDescription:
      'Śledź wersje PLC, HMI i innego oprogramowania dostarczonego z maszyną oraz aktualizowanego na niej.',
    noVersionsMessage: 'Nie zarejestrowano jeszcze żadnych wersji oprogramowania.',
    newVersionTitle: 'Dodaj wersję',
    versionNameLabel: 'Nazwa wersji',
    softwareTypeLabel: 'Typ oprogramowania',
    notesLabel: 'Notatki',
    isDeliveredVersionLabel: 'Wersja dostarczona',
    isCurrentKnownVersionLabel: 'Aktualnie znana wersja',
    submitButtonLabel: 'Dodaj wersję',
    typeLabels: {
      plc: 'PLC',
      hmi: 'HMI',
      robot: 'Robot',
      drive: 'Napęd',
      other: 'Inne',
    },
    deliveredBadgeLabel: 'Dostarczona',
    currentBadgeLabel: 'Aktualna',
    downloadFileLabel: 'Pobierz plik wersji',
    hasFileLabel: 'Plik załączony',
    markAsCurrentLabel: 'Oznacz jako aktualną',
    markAsDeliveredLabel: 'Oznacz jako dostarczoną',
    uploadedLabel: 'Dodano',
    changedSinceDeliveryLabel: 'Zmieniono od dostawy',
    errorTitle: 'Akcja wersji nie powiodła się',
  },
  de: {
    sectionTitle: 'Zeitachse der Softwareversionen',
    sectionDescription:
      'Verfolgen Sie PLC-, HMI- und weitere Softwareversionen, die mit dieser Maschine geliefert und darauf aktualisiert wurden.',
    noVersionsMessage: 'Es wurden noch keine Softwareversionen erfasst.',
    newVersionTitle: 'Version hinzufügen',
    versionNameLabel: 'Versionsname',
    softwareTypeLabel: 'Softwaretyp',
    notesLabel: 'Notizen',
    isDeliveredVersionLabel: 'Gelieferte Version',
    isCurrentKnownVersionLabel: 'Aktuell bekannte Version',
    submitButtonLabel: 'Version hinzufügen',
    typeLabels: {
      plc: 'PLC',
      hmi: 'HMI',
      robot: 'Roboter',
      drive: 'Antrieb',
      other: 'Sonstige',
    },
    deliveredBadgeLabel: 'Geliefert',
    currentBadgeLabel: 'Aktuell',
    downloadFileLabel: 'Versionsdatei herunterladen',
    hasFileLabel: 'Datei angehängt',
    markAsCurrentLabel: 'Als aktuell markieren',
    markAsDeliveredLabel: 'Als geliefert markieren',
    uploadedLabel: 'Hinzugefügt',
    changedSinceDeliveryLabel: 'Seit Lieferung geändert',
    errorTitle: 'Versionsaktion fehlgeschlagen',
  },
  fr: {
    sectionTitle: 'Chronologie des versions logicielles',
    sectionDescription:
      'Suivez les versions PLC, HMI et autres logiciels livrés avec cette machine et mis à jour dessus.',
    noVersionsMessage: "Aucune version logicielle n'a encore été enregistrée.",
    newVersionTitle: 'Ajouter une version',
    versionNameLabel: 'Nom de version',
    softwareTypeLabel: 'Type de logiciel',
    notesLabel: 'Notes',
    isDeliveredVersionLabel: 'Version livrée',
    isCurrentKnownVersionLabel: 'Version actuelle connue',
    submitButtonLabel: 'Ajouter une version',
    typeLabels: {
      plc: 'PLC',
      hmi: 'HMI',
      robot: 'Robot',
      drive: 'Variateur',
      other: 'Autre',
    },
    deliveredBadgeLabel: 'Livrée',
    currentBadgeLabel: 'Actuelle',
    downloadFileLabel: 'Télécharger le fichier de version',
    hasFileLabel: 'Fichier joint',
    markAsCurrentLabel: 'Marquer comme actuelle',
    markAsDeliveredLabel: 'Marquer comme livrée',
    uploadedLabel: 'Ajoutée',
    changedSinceDeliveryLabel: 'Modifiée depuis la livraison',
    errorTitle: "Échec de l'action sur la version",
  },
  es: {
    sectionTitle: 'Cronología de versiones de software',
    sectionDescription:
      'Controle las versiones de PLC, HMI y otro software entregadas con esta máquina y actualizadas en ella.',
    noVersionsMessage: 'Aún no se han registrado versiones de software.',
    newVersionTitle: 'Añadir versión',
    versionNameLabel: 'Nombre de versión',
    softwareTypeLabel: 'Tipo de software',
    notesLabel: 'Notas',
    isDeliveredVersionLabel: 'Versión entregada',
    isCurrentKnownVersionLabel: 'Versión actual conocida',
    submitButtonLabel: 'Añadir versión',
    typeLabels: {
      plc: 'PLC',
      hmi: 'HMI',
      robot: 'Robot',
      drive: 'Accionamiento',
      other: 'Otro',
    },
    deliveredBadgeLabel: 'Entregada',
    currentBadgeLabel: 'Actual',
    downloadFileLabel: 'Descargar archivo de versión',
    hasFileLabel: 'Archivo adjunto',
    markAsCurrentLabel: 'Marcar como actual',
    markAsDeliveredLabel: 'Marcar como entregada',
    uploadedLabel: 'Añadida',
    changedSinceDeliveryLabel: 'Cambiada desde la entrega',
    errorTitle: 'Error en la acción de versión',
  },
} as const satisfies Record<SupportedLocale, SoftwareVersionsCopy>;
