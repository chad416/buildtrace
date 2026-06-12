import type { Locale } from '@buildtrace/i18n';

import type { MachineRecordApiModel } from './machine-records-api';

type MachineStatusValue = MachineRecordApiModel['status'];

type MachineRecordsPageCopy = {
  readonly session: {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
    readonly loginLabel: string;
    readonly missingFieldsLabel: string;
    readonly missingFieldLabels: {
      readonly organizationId: string;
      readonly accessToken: string;
    };
  };
  readonly error: {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
  };
  readonly prerequisites: {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
    readonly missingLabel: string;
    readonly customerMissingLabel: string;
    readonly modelMissingLabel: string;
  };
  readonly records: {
    readonly contextEyebrow: string;
    readonly contextTitle: string;
    readonly contextBody: string;
    readonly customersCountLabel: string;
    readonly modelsCountLabel: string;
    readonly machinesCountLabel: string;
    readonly eyebrow: string;
    readonly countLabel: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly customerLabel: string;
    readonly modelLabel: string;
    readonly serialLabel: string;
    readonly statusLabel: string;
    readonly deliveryDateLabel: string;
    readonly updatedAtLabel: string;
    readonly plcLabel: string;
    readonly hmiLabel: string;
    readonly unavailableLabel: string;
    readonly detailsLabel: string;
  };
  readonly statusLabels: Record<MachineStatusValue, string>;
};

export const machineRecordsPageCopy = {
  en: {
    session: {
      eyebrow: 'Authentication required',
      title: 'Machine records need a signed-in workspace',
      body: 'The machine list now loads through the API boundary. Add the organization and access-token cookies from the authenticated session before loading records.',
      loginLabel: 'Go to login',
      missingFieldsLabel: 'Missing session values:',
      missingFieldLabels: {
        organizationId: 'organization cookie',
        accessToken: 'access-token cookie',
      },
    },
    error: {
      eyebrow: 'API boundary',
      title: 'Machine records could not be loaded',
      body: 'The page reached the web API client boundary, but the API response failed. Retry after confirming the API, session cookies, and tenant access.',
    },
    prerequisites: {
      eyebrow: 'Record prerequisites',
      title: 'Machine creation needs customer and model records first',
      body: 'The page now checks real customers and machine models through the API boundary before machine creation UI is introduced.',
      missingLabel: 'Missing prerequisites:',
      customerMissingLabel: 'customer record',
      modelMissingLabel: 'machine model record',
    },
    records: {
      contextEyebrow: 'API-backed context',
      contextTitle: 'Machine record readiness',
      contextBody:
        'Customers, machine models, and machines are loaded through the web API client with the current tenant session. No placeholder records are shown.',
      customersCountLabel: 'customers available',
      modelsCountLabel: 'machine models available',
      machinesCountLabel: 'machines loaded',
      eyebrow: 'API-backed records',
      countLabel: 'machine records loaded',
      emptyTitle: 'No machine records found',
      emptyBody:
        'The API returned an empty machine list for this organization. No placeholder machine data is shown.',
      customerLabel: 'Customer',
      modelLabel: 'Model',
      serialLabel: 'Serial number',
      statusLabel: 'Status',
      deliveryDateLabel: 'Delivery date',
      updatedAtLabel: 'Updated',
      plcLabel: 'PLC',
      hmiLabel: 'HMI',
      unavailableLabel: 'Not available',
      detailsLabel: 'View details',
    },
    statusLabels: {
      ACTIVE: 'Active',
      MAINTENANCE: 'Maintenance',
      OUT_OF_SERVICE: 'Out of service',
      ARCHIVED: 'Archived',
    },
  },
  cs: {
    session: {
      eyebrow: 'Vyžadováno přihlášení',
      title: 'Záznamy strojů vyžadují přihlášený workspace',
      body: 'Seznam strojů se nyní načítá přes API hranici. Před načtením záznamů přidejte cookies organizace a access tokenu z ověřené relace.',
      loginLabel: 'Přejít na přihlášení',
      missingFieldsLabel: 'Chybějící hodnoty relace:',
      missingFieldLabels: {
        organizationId: 'cookie organizace',
        accessToken: 'cookie access tokenu',
      },
    },
    error: {
      eyebrow: 'API hranice',
      title: 'Záznamy strojů se nepodařilo načíst',
      body: 'Stránka dosáhla webového API klienta, ale odpověď API selhala. Zkontrolujte API, cookies relace a tenant přístup.',
    },
    prerequisites: {
      eyebrow: 'Předpoklady záznamů',
      title: 'Vytvoření stroje nejprve vyžaduje zákazníka a model',
      body: 'Stránka nyní přes API hranici kontroluje skutečné zákazníky a modely strojů před zavedením UI pro vytvoření stroje.',
      missingLabel: 'Chybějící předpoklady:',
      customerMissingLabel: 'záznam zákazníka',
      modelMissingLabel: 'záznam modelu stroje',
    },
    records: {
      contextEyebrow: 'Kontext z API',
      contextTitle: 'Připravenost záznamů strojů',
      contextBody:
        'Zákazníci, modely strojů a stroje se načítají přes webového API klienta s aktuální tenant relací. Nezobrazují se žádné placeholder záznamy.',
      customersCountLabel: 'dostupní zákazníci',
      modelsCountLabel: 'dostupné modely strojů',
      machinesCountLabel: 'načtené stroje',
      eyebrow: 'Záznamy z API',
      countLabel: 'načtených záznamů strojů',
      emptyTitle: 'Nebyly nalezeny žádné stroje',
      emptyBody:
        'API vrátilo prázdný seznam strojů pro tuto organizaci. Nezobrazují se žádná placeholder data.',
      customerLabel: 'Zákazník',
      modelLabel: 'Model',
      serialLabel: 'Sériové číslo',
      statusLabel: 'Stav',
      deliveryDateLabel: 'Datum dodání',
      updatedAtLabel: 'Aktualizováno',
      plcLabel: 'PLC',
      hmiLabel: 'HMI',
      unavailableLabel: 'Není k dispozici',
      detailsLabel: 'Zobrazit detail',
    },
    statusLabels: {
      ACTIVE: 'Aktivní',
      MAINTENANCE: 'Údržba',
      OUT_OF_SERVICE: 'Mimo provoz',
      ARCHIVED: 'Archivováno',
    },
  },
  sk: {
    session: {
      eyebrow: 'Vyžaduje sa prihlásenie',
      title: 'Záznamy strojov vyžadujú prihlásený workspace',
      body: 'Zoznam strojov sa teraz načítava cez API hranicu. Pred načítaním záznamov pridajte cookies organizácie a access tokenu z overenej relácie.',
      loginLabel: 'Prejsť na prihlásenie',
      missingFieldsLabel: 'Chýbajúce hodnoty relácie:',
      missingFieldLabels: {
        organizationId: 'cookie organizácie',
        accessToken: 'cookie access tokenu',
      },
    },
    error: {
      eyebrow: 'API hranica',
      title: 'Záznamy strojov sa nepodarilo načítať',
      body: 'Stránka dosiahla webového API klienta, ale odpoveď API zlyhala. Skontrolujte API, cookies relácie a tenant prístup.',
    },
    prerequisites: {
      eyebrow: 'Predpoklady záznamov',
      title: 'Vytvorenie stroja najprv vyžaduje zákazníka a model',
      body: 'Stránka teraz cez API hranicu kontroluje skutočných zákazníkov a modely strojov pred zavedením UI na vytvorenie stroja.',
      missingLabel: 'Chýbajúce predpoklady:',
      customerMissingLabel: 'záznam zákazníka',
      modelMissingLabel: 'záznam modelu stroja',
    },
    records: {
      contextEyebrow: 'Kontext z API',
      contextTitle: 'Pripravenosť záznamov strojov',
      contextBody:
        'Zákazníci, modely strojov a stroje sa načítavajú cez webového API klienta s aktuálnou tenant reláciou. Nezobrazujú sa žiadne placeholder záznamy.',
      customersCountLabel: 'dostupní zákazníci',
      modelsCountLabel: 'dostupné modely strojov',
      machinesCountLabel: 'načítané stroje',
      eyebrow: 'Záznamy z API',
      countLabel: 'načítaných záznamov strojov',
      emptyTitle: 'Nenašli sa žiadne stroje',
      emptyBody:
        'API vrátilo prázdny zoznam strojov pre túto organizáciu. Nezobrazujú sa žiadne placeholder dáta.',
      customerLabel: 'Zákazník',
      modelLabel: 'Model',
      serialLabel: 'Sériové číslo',
      statusLabel: 'Stav',
      deliveryDateLabel: 'Dátum dodania',
      updatedAtLabel: 'Aktualizované',
      plcLabel: 'PLC',
      hmiLabel: 'HMI',
      unavailableLabel: 'Nie je k dispozícii',
      detailsLabel: 'Zobraziť detail',
    },
    statusLabels: {
      ACTIVE: 'Aktívny',
      MAINTENANCE: 'Údržba',
      OUT_OF_SERVICE: 'Mimo prevádzky',
      ARCHIVED: 'Archivované',
    },
  },
  pl: {
    session: {
      eyebrow: 'Wymagane logowanie',
      title: 'Rekordy maszyn wymagają zalogowanego workspace',
      body: 'Lista maszyn ładuje się teraz przez granicę API. Przed pobraniem rekordów dodaj cookies organizacji i access tokenu z uwierzytelnionej sesji.',
      loginLabel: 'Przejdź do logowania',
      missingFieldsLabel: 'Brakujące wartości sesji:',
      missingFieldLabels: {
        organizationId: 'cookie organizacji',
        accessToken: 'cookie access tokenu',
      },
    },
    error: {
      eyebrow: 'Granica API',
      title: 'Nie udało się załadować rekordów maszyn',
      body: 'Strona dotarła do webowego klienta API, ale odpowiedź API nie powiodła się. Sprawdź API, cookies sesji i dostęp tenant.',
    },
    prerequisites: {
      eyebrow: 'Warunki rekordów',
      title: 'Utworzenie maszyny wymaga najpierw klienta i modelu',
      body: 'Strona sprawdza teraz rzeczywistych klientów i modele maszyn przez granicę API przed wprowadzeniem UI tworzenia maszyny.',
      missingLabel: 'Brakujące warunki:',
      customerMissingLabel: 'rekord klienta',
      modelMissingLabel: 'rekord modelu maszyny',
    },
    records: {
      contextEyebrow: 'Kontekst z API',
      contextTitle: 'Gotowość rekordów maszyn',
      contextBody:
        'Klienci, modele maszyn i maszyny są ładowane przez webowego klienta API z bieżącą sesją tenant. Nie są pokazywane żadne rekordy placeholder.',
      customersCountLabel: 'dostępni klienci',
      modelsCountLabel: 'dostępne modele maszyn',
      machinesCountLabel: 'załadowane maszyny',
      eyebrow: 'Rekordy z API',
      countLabel: 'załadowanych rekordów maszyn',
      emptyTitle: 'Nie znaleziono maszyn',
      emptyBody:
        'API zwróciło pustą listę maszyn dla tej organizacji. Żadne dane placeholder nie są wyświetlane.',
      customerLabel: 'Klient',
      modelLabel: 'Model',
      serialLabel: 'Numer seryjny',
      statusLabel: 'Status',
      deliveryDateLabel: 'Data dostawy',
      updatedAtLabel: 'Zaktualizowano',
      plcLabel: 'PLC',
      hmiLabel: 'HMI',
      unavailableLabel: 'Niedostępne',
      detailsLabel: 'Zobacz szczegóły',
    },
    statusLabels: {
      ACTIVE: 'Aktywna',
      MAINTENANCE: 'Serwis',
      OUT_OF_SERVICE: 'Poza eksploatacją',
      ARCHIVED: 'Zarchiwizowana',
    },
  },
  de: {
    session: {
      eyebrow: 'Anmeldung erforderlich',
      title: 'Maschinendatensätze benötigen einen angemeldeten Workspace',
      body: 'Die Maschinenliste lädt jetzt über die API-Grenze. Setzen Sie die Organisations- und Access-Token-Cookies aus der authentifizierten Sitzung, bevor Datensätze geladen werden.',
      loginLabel: 'Zur Anmeldung',
      missingFieldsLabel: 'Fehlende Sitzungswerte:',
      missingFieldLabels: {
        organizationId: 'Organisations-Cookie',
        accessToken: 'Access-Token-Cookie',
      },
    },
    error: {
      eyebrow: 'API-Grenze',
      title: 'Maschinendatensätze konnten nicht geladen werden',
      body: 'Die Seite hat den Web-API-Client erreicht, aber die API-Antwort ist fehlgeschlagen. Prüfen Sie API, Sitzungs-Cookies und Tenant-Zugriff.',
    },
    prerequisites: {
      eyebrow: 'Datensatz-Voraussetzungen',
      title: 'Maschinenerstellung benötigt zuerst Kunde und Modell',
      body: 'Die Seite prüft jetzt echte Kunden und Maschinenmodelle über die API-Grenze, bevor das UI zur Maschinenerstellung eingeführt wird.',
      missingLabel: 'Fehlende Voraussetzungen:',
      customerMissingLabel: 'Kundendatensatz',
      modelMissingLabel: 'Maschinenmodelldatensatz',
    },
    records: {
      contextEyebrow: 'API-gestützter Kontext',
      contextTitle: 'Bereitschaft der Maschinendatensätze',
      contextBody:
        'Kunden, Maschinenmodelle und Maschinen werden über den Web-API-Client mit der aktuellen Tenant-Sitzung geladen. Es werden keine Platzhalterdatensätze angezeigt.',
      customersCountLabel: 'verfügbare Kunden',
      modelsCountLabel: 'verfügbare Maschinenmodelle',
      machinesCountLabel: 'geladene Maschinen',
      eyebrow: 'API-gestützte Datensätze',
      countLabel: 'geladene Maschinendatensätze',
      emptyTitle: 'Keine Maschinendatensätze gefunden',
      emptyBody:
        'Die API hat für diese Organisation eine leere Maschinenliste zurückgegeben. Es werden keine Platzhalterdaten angezeigt.',
      customerLabel: 'Kunde',
      modelLabel: 'Modell',
      serialLabel: 'Seriennummer',
      statusLabel: 'Status',
      deliveryDateLabel: 'Lieferdatum',
      updatedAtLabel: 'Aktualisiert',
      plcLabel: 'PLC',
      hmiLabel: 'HMI',
      unavailableLabel: 'Nicht verfügbar',
      detailsLabel: 'Details anzeigen',
    },
    statusLabels: {
      ACTIVE: 'Aktiv',
      MAINTENANCE: 'Wartung',
      OUT_OF_SERVICE: 'Außer Betrieb',
      ARCHIVED: 'Archiviert',
    },
  },
  fr: {
    session: {
      eyebrow: 'Connexion requise',
      title: 'Les dossiers machine nécessitent un workspace connecté',
      body: "La liste des machines se charge maintenant via la limite API. Ajoutez les cookies d'organisation et d'access token de la session authentifiée avant de charger les dossiers.",
      loginLabel: 'Aller à la connexion',
      missingFieldsLabel: 'Valeurs de session manquantes :',
      missingFieldLabels: {
        organizationId: "cookie d'organisation",
        accessToken: "cookie d'access token",
      },
    },
    error: {
      eyebrow: 'Limite API',
      title: 'Les dossiers machine n’ont pas pu être chargés',
      body: "La page a atteint le client API web, mais la réponse API a échoué. Vérifiez l'API, les cookies de session et l'accès tenant.",
    },
    prerequisites: {
      eyebrow: 'Prérequis des dossiers',
      title: 'La création machine nécessite d’abord un client et un modèle',
      body: "La page vérifie maintenant les clients et modèles machine réels via la limite API avant l'introduction de l'interface de création machine.",
      missingLabel: 'Prérequis manquants :',
      customerMissingLabel: 'dossier client',
      modelMissingLabel: 'dossier modèle machine',
    },
    records: {
      contextEyebrow: 'Contexte depuis l’API',
      contextTitle: 'Préparation des dossiers machine',
      contextBody:
        "Les clients, modèles machine et machines sont chargés via le client API web avec la session tenant actuelle. Aucun dossier placeholder n'est affiché.",
      customersCountLabel: 'clients disponibles',
      modelsCountLabel: 'modèles machine disponibles',
      machinesCountLabel: 'machines chargées',
      eyebrow: 'Dossiers depuis l’API',
      countLabel: 'dossiers machine chargés',
      emptyTitle: 'Aucun dossier machine trouvé',
      emptyBody:
        "L'API a renvoyé une liste machine vide pour cette organisation. Aucune donnée placeholder n'est affichée.",
      customerLabel: 'Client',
      modelLabel: 'Modèle',
      serialLabel: 'Numéro de série',
      statusLabel: 'Statut',
      deliveryDateLabel: 'Date de livraison',
      updatedAtLabel: 'Mis à jour',
      plcLabel: 'PLC',
      hmiLabel: 'HMI',
      unavailableLabel: 'Non disponible',
      detailsLabel: 'Voir le détail',
    },
    statusLabels: {
      ACTIVE: 'Active',
      MAINTENANCE: 'Maintenance',
      OUT_OF_SERVICE: 'Hors service',
      ARCHIVED: 'Archivée',
    },
  },
  es: {
    session: {
      eyebrow: 'Autenticación requerida',
      title: 'Los registros de máquinas necesitan un workspace con sesión iniciada',
      body: 'La lista de máquinas ahora carga mediante la frontera API. Añade las cookies de organización y access token de la sesión autenticada antes de cargar registros.',
      loginLabel: 'Ir al acceso',
      missingFieldsLabel: 'Valores de sesión faltantes:',
      missingFieldLabels: {
        organizationId: 'cookie de organización',
        accessToken: 'cookie de access token',
      },
    },
    error: {
      eyebrow: 'Frontera API',
      title: 'No se pudieron cargar los registros de máquinas',
      body: 'La página llegó al cliente API web, pero la respuesta de la API falló. Revisa la API, las cookies de sesión y el acceso tenant.',
    },
    prerequisites: {
      eyebrow: 'Requisitos de registros',
      title: 'Crear una máquina requiere primero cliente y modelo',
      body: 'La página ahora comprueba clientes y modelos de máquina reales mediante la frontera API antes de introducir la UI de creación de máquinas.',
      missingLabel: 'Requisitos faltantes:',
      customerMissingLabel: 'registro de cliente',
      modelMissingLabel: 'registro de modelo de máquina',
    },
    records: {
      contextEyebrow: 'Contexto desde API',
      contextTitle: 'Preparación de registros de máquinas',
      contextBody:
        'Clientes, modelos de máquina y máquinas se cargan mediante el cliente API web con la sesión tenant actual. No se muestran registros placeholder.',
      customersCountLabel: 'clientes disponibles',
      modelsCountLabel: 'modelos de máquina disponibles',
      machinesCountLabel: 'máquinas cargadas',
      eyebrow: 'Registros desde API',
      countLabel: 'registros de máquinas cargados',
      emptyTitle: 'No se encontraron máquinas',
      emptyBody:
        'La API devolvió una lista de máquinas vacía para esta organización. No se muestran datos placeholder.',
      customerLabel: 'Cliente',
      modelLabel: 'Modelo',
      serialLabel: 'Número de serie',
      statusLabel: 'Estado',
      deliveryDateLabel: 'Fecha de entrega',
      updatedAtLabel: 'Actualizado',
      plcLabel: 'PLC',
      hmiLabel: 'HMI',
      unavailableLabel: 'No disponible',
      detailsLabel: 'Ver detalles',
    },
    statusLabels: {
      ACTIVE: 'Activa',
      MAINTENANCE: 'Mantenimiento',
      OUT_OF_SERVICE: 'Fuera de servicio',
      ARCHIVED: 'Archivada',
    },
  },
} satisfies Record<Locale, MachineRecordsPageCopy>;
