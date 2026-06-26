import type { QuoteRequestStatus, QuoteRequestType, SupportedLocale } from '@buildtrace/shared';

export type QuoteRequestsCopy = {
  readonly sectionTitle: string;
  readonly sectionDescription: string;
  readonly noRequestsMessage: string;
  readonly newRequestTitle: string;
  readonly titleLabel: string;
  readonly descriptionLabel: string;
  readonly typeLabel: string;
  readonly currencyLabel: string;
  readonly quotedPriceLabel: string;
  readonly submitButtonLabel: string;
  readonly statusLabel: string;
  readonly updateStatusLabel: string;
  readonly typeLabels: Record<QuoteRequestType, string>;
  readonly statusLabels: Record<QuoteRequestStatus, string>;
  readonly errorTitle: string;
  readonly portalSectionTitle: string;
  readonly portalSectionDescription: string;
  readonly portalSubmitLabel: string;
  readonly portalCreatedMessage: string;
  readonly portalErrorTitle: string;
};

export const quoteRequestsCopy = {
  en: {
    sectionTitle: 'Quote requests',
    sectionDescription: 'Track spare part and service quote requests for this machine.',
    noRequestsMessage: 'No quote requests yet.',
    newRequestTitle: 'New quote request',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    typeLabel: 'Type',
    currencyLabel: 'Currency',
    quotedPriceLabel: 'Quoted price',
    submitButtonLabel: 'Create request',
    statusLabel: 'Status',
    updateStatusLabel: 'Update status',
    typeLabels: {
      'spare-part': 'Spare part',
      service: 'Service',
    },
    statusLabels: {
      requested: 'Requested',
      'quote-sent': 'Quote sent',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
    },
    errorTitle: 'Quote request action failed',
    portalSectionTitle: 'Request a quote',
    portalSectionDescription: 'Request a spare part or service quote from the machine builder.',
    portalSubmitLabel: 'Submit quote request',
    portalCreatedMessage: 'Your quote request has been submitted. Reference: ',
    portalErrorTitle: 'Quote request could not be submitted',
  },
  cs: {
    sectionTitle: 'Poptávky nabídek',
    sectionDescription: 'Sledujte poptávky náhradních dílů a servisních nabídek pro tento stroj.',
    noRequestsMessage: 'Zatím žádné poptávky nabídek.',
    newRequestTitle: 'Nová poptávka nabídky',
    titleLabel: 'Název',
    descriptionLabel: 'Popis',
    typeLabel: 'Typ',
    currencyLabel: 'Měna',
    quotedPriceLabel: 'Nabídnutá cena',
    submitButtonLabel: 'Vytvořit poptávku',
    statusLabel: 'Stav',
    updateStatusLabel: 'Aktualizovat stav',
    typeLabels: {
      'spare-part': 'Náhradní díl',
      service: 'Servis',
    },
    statusLabels: {
      requested: 'Vyžádáno',
      'quote-sent': 'Nabídka odeslána',
      approved: 'Schváleno',
      rejected: 'Zamítnuto',
      completed: 'Dokončeno',
    },
    errorTitle: 'Akce poptávky nabídky selhala',
    portalSectionTitle: 'Vyžádat nabídku',
    portalSectionDescription:
      'Vyžádejte si nabídku náhradního dílu nebo servisu od výrobce stroje.',
    portalSubmitLabel: 'Odeslat poptávku nabídky',
    portalCreatedMessage: 'Vaše poptávka nabídky byla odeslána. Reference: ',
    portalErrorTitle: 'Poptávku nabídky se nepodařilo odeslat',
  },
  sk: {
    sectionTitle: 'Žiadosti o ponuku',
    sectionDescription: 'Sledujte žiadosti o ponuku náhradných dielov a servisu pre tento stroj.',
    noRequestsMessage: 'Zatiaľ žiadne žiadosti o ponuku.',
    newRequestTitle: 'Nová žiadosť o ponuku',
    titleLabel: 'Názov',
    descriptionLabel: 'Popis',
    typeLabel: 'Typ',
    currencyLabel: 'Mena',
    quotedPriceLabel: 'Ponúknutá cena',
    submitButtonLabel: 'Vytvoriť žiadosť',
    statusLabel: 'Stav',
    updateStatusLabel: 'Aktualizovať stav',
    typeLabels: {
      'spare-part': 'Náhradný diel',
      service: 'Servis',
    },
    statusLabels: {
      requested: 'Vyžiadané',
      'quote-sent': 'Ponuka odoslaná',
      approved: 'Schválené',
      rejected: 'Zamietnuté',
      completed: 'Dokončené',
    },
    errorTitle: 'Akcia žiadosti o ponuku zlyhala',
    portalSectionTitle: 'Vyžiadať ponuku',
    portalSectionDescription:
      'Vyžiadajte si ponuku náhradného dielu alebo servisu od výrobcu stroja.',
    portalSubmitLabel: 'Odoslať žiadosť o ponuku',
    portalCreatedMessage: 'Vaša žiadosť o ponuku bola odoslaná. Referencia: ',
    portalErrorTitle: 'Žiadosť o ponuku sa nepodarilo odoslať',
  },
  pl: {
    sectionTitle: 'Zapytania ofertowe',
    sectionDescription:
      'Śledź zapytania ofertowe dotyczące części zamiennych i serwisu dla tej maszyny.',
    noRequestsMessage: 'Brak zapytań ofertowych.',
    newRequestTitle: 'Nowe zapytanie ofertowe',
    titleLabel: 'Tytuł',
    descriptionLabel: 'Opis',
    typeLabel: 'Typ',
    currencyLabel: 'Waluta',
    quotedPriceLabel: 'Cena ofertowa',
    submitButtonLabel: 'Utwórz zapytanie',
    statusLabel: 'Status',
    updateStatusLabel: 'Aktualizuj status',
    typeLabels: {
      'spare-part': 'Część zamienna',
      service: 'Serwis',
    },
    statusLabels: {
      requested: 'Zażądano',
      'quote-sent': 'Oferta wysłana',
      approved: 'Zatwierdzone',
      rejected: 'Odrzucone',
      completed: 'Zakończone',
    },
    errorTitle: 'Akcja zapytania ofertowego nie powiodła się',
    portalSectionTitle: 'Poproś o ofertę',
    portalSectionDescription: 'Poproś producenta maszyny o ofertę części zamiennej lub serwisu.',
    portalSubmitLabel: 'Wyślij zapytanie ofertowe',
    portalCreatedMessage: 'Twoje zapytanie ofertowe zostało wysłane. Referencja: ',
    portalErrorTitle: 'Nie udało się wysłać zapytania ofertowego',
  },
  de: {
    sectionTitle: 'Angebotsanfragen',
    sectionDescription:
      'Verfolgen Sie Ersatzteil- und Service-Angebotsanfragen für diese Maschine.',
    noRequestsMessage: 'Noch keine Angebotsanfragen.',
    newRequestTitle: 'Neue Angebotsanfrage',
    titleLabel: 'Titel',
    descriptionLabel: 'Beschreibung',
    typeLabel: 'Typ',
    currencyLabel: 'Währung',
    quotedPriceLabel: 'Angebotspreis',
    submitButtonLabel: 'Anfrage erstellen',
    statusLabel: 'Status',
    updateStatusLabel: 'Status aktualisieren',
    typeLabels: {
      'spare-part': 'Ersatzteil',
      service: 'Service',
    },
    statusLabels: {
      requested: 'Angefragt',
      'quote-sent': 'Angebot gesendet',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      completed: 'Abgeschlossen',
    },
    errorTitle: 'Aktion für Angebotsanfrage fehlgeschlagen',
    portalSectionTitle: 'Angebot anfordern',
    portalSectionDescription:
      'Fordern Sie beim Maschinenbauer ein Ersatzteil- oder Serviceangebot an.',
    portalSubmitLabel: 'Angebotsanfrage senden',
    portalCreatedMessage: 'Ihre Angebotsanfrage wurde gesendet. Referenz: ',
    portalErrorTitle: 'Angebotsanfrage konnte nicht gesendet werden',
  },
  fr: {
    sectionTitle: 'Demandes de devis',
    sectionDescription:
      'Suivez les demandes de devis de pièces détachées et de service pour cette machine.',
    noRequestsMessage: 'Aucune demande de devis pour le moment.',
    newRequestTitle: 'Nouvelle demande de devis',
    titleLabel: 'Titre',
    descriptionLabel: 'Description',
    typeLabel: 'Type',
    currencyLabel: 'Devise',
    quotedPriceLabel: 'Prix proposé',
    submitButtonLabel: 'Créer la demande',
    statusLabel: 'Statut',
    updateStatusLabel: 'Mettre à jour le statut',
    typeLabels: {
      'spare-part': 'Pièce détachée',
      service: 'Service',
    },
    statusLabels: {
      requested: 'Demandée',
      'quote-sent': 'Devis envoyé',
      approved: 'Approuvée',
      rejected: 'Rejetée',
      completed: 'Terminée',
    },
    errorTitle: "Échec de l'action sur la demande de devis",
    portalSectionTitle: 'Demander un devis',
    portalSectionDescription:
      'Demandez un devis de pièce détachée ou de service au constructeur de la machine.',
    portalSubmitLabel: 'Envoyer la demande de devis',
    portalCreatedMessage: 'Votre demande de devis a été envoyée. Référence : ',
    portalErrorTitle: "La demande de devis n'a pas pu être envoyée",
  },
  es: {
    sectionTitle: 'Solicitudes de presupuesto',
    sectionDescription:
      'Controle las solicitudes de presupuesto de repuestos y servicio para esta máquina.',
    noRequestsMessage: 'Todavía no hay solicitudes de presupuesto.',
    newRequestTitle: 'Nueva solicitud de presupuesto',
    titleLabel: 'Título',
    descriptionLabel: 'Descripción',
    typeLabel: 'Tipo',
    currencyLabel: 'Moneda',
    quotedPriceLabel: 'Precio presupuestado',
    submitButtonLabel: 'Crear solicitud',
    statusLabel: 'Estado',
    updateStatusLabel: 'Actualizar estado',
    typeLabels: {
      'spare-part': 'Repuesto',
      service: 'Servicio',
    },
    statusLabels: {
      requested: 'Solicitada',
      'quote-sent': 'Presupuesto enviado',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      completed: 'Completada',
    },
    errorTitle: 'Error en la acción de solicitud de presupuesto',
    portalSectionTitle: 'Solicitar presupuesto',
    portalSectionDescription:
      'Solicite al fabricante de la máquina un presupuesto de repuesto o servicio.',
    portalSubmitLabel: 'Enviar solicitud de presupuesto',
    portalCreatedMessage: 'Su solicitud de presupuesto se ha enviado. Referencia: ',
    portalErrorTitle: 'No se pudo enviar la solicitud de presupuesto',
  },
} as const satisfies Record<SupportedLocale, QuoteRequestsCopy>;
