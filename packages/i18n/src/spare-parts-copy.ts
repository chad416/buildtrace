import type { SparePartCriticality, SupportedLocale } from '@buildtrace/shared';

export type SparePartsCopy = {
  readonly sectionTitle: string;
  readonly sectionDescription: string;
  readonly noPartsMessage: string;
  readonly newPartTitle: string;
  readonly partNameLabel: string;
  readonly manufacturerLabel: string;
  readonly partNumberLabel: string;
  readonly quantityLabel: string;
  readonly categoryLabel: string;
  readonly criticalityLabel: string;
  readonly estimatedPriceLabel: string;
  readonly currencyLabel: string;
  readonly customerVisiblePriceLabel: string;
  readonly notesLabel: string;
  readonly submitButtonLabel: string;
  readonly criticalityLabels: Record<SparePartCriticality, string>;
  readonly criticalBadgeLabel: string;
  readonly errorTitle: string;
  readonly updateButtonLabel: string;
};

export const sparePartsCopy = {
  en: {
    sectionTitle: 'Spare parts',
    sectionDescription: 'Track spare parts and components for this machine.',
    noPartsMessage: 'No spare parts have been added yet.',
    newPartTitle: 'Add spare part',
    partNameLabel: 'Part name',
    manufacturerLabel: 'Manufacturer',
    partNumberLabel: 'Part number',
    quantityLabel: 'Quantity',
    categoryLabel: 'Category',
    criticalityLabel: 'Criticality',
    estimatedPriceLabel: 'Estimated price',
    currencyLabel: 'Currency',
    customerVisiblePriceLabel: 'Customer price',
    notesLabel: 'Notes',
    submitButtonLabel: 'Add part',
    criticalityLabels: {
      critical: 'Critical',
      recommended: 'Recommended',
      optional: 'Optional',
    },
    criticalBadgeLabel: 'Critical',
    errorTitle: 'Spare part action failed',
    updateButtonLabel: 'Save changes',
  },
  cs: {
    sectionTitle: 'Náhradní díly',
    sectionDescription: 'Sledujte náhradní díly a komponenty pro tento stroj.',
    noPartsMessage: 'Zatím nebyly přidány žádné náhradní díly.',
    newPartTitle: 'Přidat náhradní díl',
    partNameLabel: 'Název dílu',
    manufacturerLabel: 'Výrobce',
    partNumberLabel: 'Číslo dílu',
    quantityLabel: 'Množství',
    categoryLabel: 'Kategorie',
    criticalityLabel: 'Důležitost',
    estimatedPriceLabel: 'Odhadovaná cena',
    currencyLabel: 'Měna',
    customerVisiblePriceLabel: 'Cena pro zákazníka',
    notesLabel: 'Poznámky',
    submitButtonLabel: 'Přidat díl',
    criticalityLabels: {
      critical: 'Kritické',
      recommended: 'Doporučené',
      optional: 'Volitelné',
    },
    criticalBadgeLabel: 'Kritické',
    errorTitle: 'Akce náhradního dílu selhala',
    updateButtonLabel: 'Uložit změny',
  },
  sk: {
    sectionTitle: 'Náhradné diely',
    sectionDescription: 'Sledujte náhradné diely a komponenty pre tento stroj.',
    noPartsMessage: 'Zatiaľ neboli pridané žiadne náhradné diely.',
    newPartTitle: 'Pridať náhradný diel',
    partNameLabel: 'Názov dielu',
    manufacturerLabel: 'Výrobca',
    partNumberLabel: 'Číslo dielu',
    quantityLabel: 'Množstvo',
    categoryLabel: 'Kategória',
    criticalityLabel: 'Dôležitosť',
    estimatedPriceLabel: 'Odhadovaná cena',
    currencyLabel: 'Mena',
    customerVisiblePriceLabel: 'Cena pre zákazníka',
    notesLabel: 'Poznámky',
    submitButtonLabel: 'Pridať diel',
    criticalityLabels: {
      critical: 'Kritické',
      recommended: 'Odporúčané',
      optional: 'Voliteľné',
    },
    criticalBadgeLabel: 'Kritické',
    errorTitle: 'Akcia náhradného dielu zlyhala',
    updateButtonLabel: 'Uložiť zmeny',
  },
  pl: {
    sectionTitle: 'Części zamienne',
    sectionDescription: 'Śledź części zamienne i komponenty dla tej maszyny.',
    noPartsMessage: 'Nie dodano jeszcze żadnych części zamiennych.',
    newPartTitle: 'Dodaj część zamienną',
    partNameLabel: 'Nazwa części',
    manufacturerLabel: 'Producent',
    partNumberLabel: 'Numer części',
    quantityLabel: 'Ilość',
    categoryLabel: 'Kategoria',
    criticalityLabel: 'Krytyczność',
    estimatedPriceLabel: 'Szacowana cena',
    currencyLabel: 'Waluta',
    customerVisiblePriceLabel: 'Cena dla klienta',
    notesLabel: 'Notatki',
    submitButtonLabel: 'Dodaj część',
    criticalityLabels: {
      critical: 'Krytyczna',
      recommended: 'Zalecana',
      optional: 'Opcjonalna',
    },
    criticalBadgeLabel: 'Krytyczna',
    errorTitle: 'Akcja części zamiennej nie powiodła się',
    updateButtonLabel: 'Zapisz zmiany',
  },
  de: {
    sectionTitle: 'Ersatzteile',
    sectionDescription: 'Verfolgen Sie Ersatzteile und Komponenten für diese Maschine.',
    noPartsMessage: 'Es wurden noch keine Ersatzteile hinzugefügt.',
    newPartTitle: 'Ersatzteil hinzufügen',
    partNameLabel: 'Teilename',
    manufacturerLabel: 'Hersteller',
    partNumberLabel: 'Teilenummer',
    quantityLabel: 'Menge',
    categoryLabel: 'Kategorie',
    criticalityLabel: 'Kritikalität',
    estimatedPriceLabel: 'Geschätzter Preis',
    currencyLabel: 'Währung',
    customerVisiblePriceLabel: 'Kundenpreis',
    notesLabel: 'Notizen',
    submitButtonLabel: 'Teil hinzufügen',
    criticalityLabels: {
      critical: 'Kritisch',
      recommended: 'Empfohlen',
      optional: 'Optional',
    },
    criticalBadgeLabel: 'Kritisch',
    errorTitle: 'Ersatzteilaktion fehlgeschlagen',
    updateButtonLabel: 'Änderungen speichern',
  },
  fr: {
    sectionTitle: 'Pièces détachées',
    sectionDescription: 'Suivez les pièces détachées et composants de cette machine.',
    noPartsMessage: "Aucune pièce détachée n'a encore été ajoutée.",
    newPartTitle: 'Ajouter une pièce détachée',
    partNameLabel: 'Nom de la pièce',
    manufacturerLabel: 'Fabricant',
    partNumberLabel: 'Référence',
    quantityLabel: 'Quantité',
    categoryLabel: 'Catégorie',
    criticalityLabel: 'Criticité',
    estimatedPriceLabel: 'Prix estimé',
    currencyLabel: 'Devise',
    customerVisiblePriceLabel: 'Prix client',
    notesLabel: 'Notes',
    submitButtonLabel: 'Ajouter la pièce',
    criticalityLabels: {
      critical: 'Critique',
      recommended: 'Recommandée',
      optional: 'Optionnelle',
    },
    criticalBadgeLabel: 'Critique',
    errorTitle: "Échec de l'action sur la pièce détachée",
    updateButtonLabel: 'Enregistrer les modifications',
  },
  es: {
    sectionTitle: 'Repuestos',
    sectionDescription: 'Controle los repuestos y componentes de esta máquina.',
    noPartsMessage: 'Todavía no se han añadido repuestos.',
    newPartTitle: 'Añadir repuesto',
    partNameLabel: 'Nombre del repuesto',
    manufacturerLabel: 'Fabricante',
    partNumberLabel: 'Número de pieza',
    quantityLabel: 'Cantidad',
    categoryLabel: 'Categoría',
    criticalityLabel: 'Criticidad',
    estimatedPriceLabel: 'Precio estimado',
    currencyLabel: 'Moneda',
    customerVisiblePriceLabel: 'Precio para el cliente',
    notesLabel: 'Notas',
    submitButtonLabel: 'Añadir repuesto',
    criticalityLabels: {
      critical: 'Crítico',
      recommended: 'Recomendado',
      optional: 'Opcional',
    },
    criticalBadgeLabel: 'Crítico',
    errorTitle: 'Error en la acción del repuesto',
    updateButtonLabel: 'Guardar cambios',
  },
} as const satisfies Record<SupportedLocale, SparePartsCopy>;
