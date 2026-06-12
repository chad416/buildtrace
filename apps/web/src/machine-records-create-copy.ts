import type { Locale } from '@buildtrace/i18n';

import type { MachineRecordApiModel } from './machine-records-api';

type MachineStatusValue = MachineRecordApiModel['status'];

type MachineRecordsCreateCopy = {
  readonly feedback: {
    readonly successTitle: string;
    readonly successBody: string;
    readonly errorTitle: string;
  };
  readonly form: {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
    readonly customerLabel: string;
    readonly modelLabel: string;
    readonly machineNameLabel: string;
    readonly machineNamePlaceholder: string;
    readonly serialNumberLabel: string;
    readonly serialNumberPlaceholder: string;
    readonly statusLabel: string;
    readonly deliveryDateLabel: string;
    readonly plcLabel: string;
    readonly plcPlaceholder: string;
    readonly hmiLabel: string;
    readonly hmiPlaceholder: string;
    readonly submitLabel: string;
  };
  readonly statusLabels: Record<MachineStatusValue, string>;
};

export const machineRecordsCreateCopy = {
  en: {
    feedback: {
      successTitle: 'Machine record created',
      successBody: 'The machine was created through the API boundary and the list has refreshed.',
      errorTitle: 'Machine record could not be created',
    },
    form: {
      eyebrow: 'Create machine',
      title: 'Add a machine record',
      body: 'This form submits through the web server action, forwards the authenticated session to the API, and only works when customer and model records already exist.',
      customerLabel: 'Customer',
      modelLabel: 'Machine model',
      machineNameLabel: 'Machine name',
      machineNamePlaceholder: 'Press Line 1',
      serialNumberLabel: 'Serial number',
      serialNumberPlaceholder: 'SN-001',
      statusLabel: 'Status',
      deliveryDateLabel: 'Delivery date',
      plcLabel: 'PLC',
      plcPlaceholder: 'Siemens S7',
      hmiLabel: 'HMI',
      hmiPlaceholder: 'KTP700',
      submitLabel: 'Create machine',
    },
    statusLabels: {
      ACTIVE: 'Active',
      MAINTENANCE: 'Maintenance',
      OUT_OF_SERVICE: 'Out of service',
      ARCHIVED: 'Archived',
    },
  },
  cs: {
    feedback: {
      successTitle: 'Záznam stroje vytvořen',
      successBody: 'Stroj byl vytvořen přes API hranici a seznam byl obnoven.',
      errorTitle: 'Záznam stroje se nepodařilo vytvořit',
    },
    form: {
      eyebrow: 'Vytvořit stroj',
      title: 'Přidat záznam stroje',
      body: 'Formulář se odesílá přes server action webu, předává ověřenou relaci do API a funguje pouze tehdy, když už existují záznamy zákazníka a modelu.',
      customerLabel: 'Zákazník',
      modelLabel: 'Model stroje',
      machineNameLabel: 'Název stroje',
      machineNamePlaceholder: 'Lisovací linka 1',
      serialNumberLabel: 'Sériové číslo',
      serialNumberPlaceholder: 'SN-001',
      statusLabel: 'Stav',
      deliveryDateLabel: 'Datum dodání',
      plcLabel: 'PLC',
      plcPlaceholder: 'Siemens S7',
      hmiLabel: 'HMI',
      hmiPlaceholder: 'KTP700',
      submitLabel: 'Vytvořit stroj',
    },
    statusLabels: {
      ACTIVE: 'Aktivní',
      MAINTENANCE: 'Údržba',
      OUT_OF_SERVICE: 'Mimo provoz',
      ARCHIVED: 'Archivováno',
    },
  },
  sk: {
    feedback: {
      successTitle: 'Záznam stroja vytvorený',
      successBody: 'Stroj bol vytvorený cez API hranicu a zoznam bol obnovený.',
      errorTitle: 'Záznam stroja sa nepodarilo vytvoriť',
    },
    form: {
      eyebrow: 'Vytvoriť stroj',
      title: 'Pridať záznam stroja',
      body: 'Formulár sa odosiela cez server action webu, odovzdáva overenú reláciu do API a funguje iba vtedy, keď už existujú záznamy zákazníka a modelu.',
      customerLabel: 'Zákazník',
      modelLabel: 'Model stroja',
      machineNameLabel: 'Názov stroja',
      machineNamePlaceholder: 'Lisovacia linka 1',
      serialNumberLabel: 'Sériové číslo',
      serialNumberPlaceholder: 'SN-001',
      statusLabel: 'Stav',
      deliveryDateLabel: 'Dátum dodania',
      plcLabel: 'PLC',
      plcPlaceholder: 'Siemens S7',
      hmiLabel: 'HMI',
      hmiPlaceholder: 'KTP700',
      submitLabel: 'Vytvoriť stroj',
    },
    statusLabels: {
      ACTIVE: 'Aktívny',
      MAINTENANCE: 'Údržba',
      OUT_OF_SERVICE: 'Mimo prevádzky',
      ARCHIVED: 'Archivované',
    },
  },
  pl: {
    feedback: {
      successTitle: 'Rekord maszyny utworzony',
      successBody: 'Maszyna została utworzona przez granicę API, a lista została odświeżona.',
      errorTitle: 'Nie udało się utworzyć rekordu maszyny',
    },
    form: {
      eyebrow: 'Utwórz maszynę',
      title: 'Dodaj rekord maszyny',
      body: 'Formularz wysyła dane przez server action webu, przekazuje uwierzytelnioną sesję do API i działa tylko wtedy, gdy istnieją już rekordy klienta i modelu.',
      customerLabel: 'Klient',
      modelLabel: 'Model maszyny',
      machineNameLabel: 'Nazwa maszyny',
      machineNamePlaceholder: 'Linia pras 1',
      serialNumberLabel: 'Numer seryjny',
      serialNumberPlaceholder: 'SN-001',
      statusLabel: 'Status',
      deliveryDateLabel: 'Data dostawy',
      plcLabel: 'PLC',
      plcPlaceholder: 'Siemens S7',
      hmiLabel: 'HMI',
      hmiPlaceholder: 'KTP700',
      submitLabel: 'Utwórz maszynę',
    },
    statusLabels: {
      ACTIVE: 'Aktywna',
      MAINTENANCE: 'Serwis',
      OUT_OF_SERVICE: 'Poza eksploatacją',
      ARCHIVED: 'Zarchiwizowana',
    },
  },
  de: {
    feedback: {
      successTitle: 'Maschinendatensatz erstellt',
      successBody:
        'Die Maschine wurde über die API-Grenze erstellt und die Liste wurde aktualisiert.',
      errorTitle: 'Maschinendatensatz konnte nicht erstellt werden',
    },
    form: {
      eyebrow: 'Maschine erstellen',
      title: 'Maschinendatensatz hinzufügen',
      body: 'Dieses Formular sendet über die Web-Server-Action, leitet die authentifizierte Sitzung an die API weiter und funktioniert nur, wenn Kunden- und Modelldatensätze bereits existieren.',
      customerLabel: 'Kunde',
      modelLabel: 'Maschinenmodell',
      machineNameLabel: 'Maschinenname',
      machineNamePlaceholder: 'Presslinie 1',
      serialNumberLabel: 'Seriennummer',
      serialNumberPlaceholder: 'SN-001',
      statusLabel: 'Status',
      deliveryDateLabel: 'Lieferdatum',
      plcLabel: 'PLC',
      plcPlaceholder: 'Siemens S7',
      hmiLabel: 'HMI',
      hmiPlaceholder: 'KTP700',
      submitLabel: 'Maschine erstellen',
    },
    statusLabels: {
      ACTIVE: 'Aktiv',
      MAINTENANCE: 'Wartung',
      OUT_OF_SERVICE: 'Außer Betrieb',
      ARCHIVED: 'Archiviert',
    },
  },
  fr: {
    feedback: {
      successTitle: 'Dossier machine créé',
      successBody: 'La machine a été créée via la limite API et la liste a été actualisée.',
      errorTitle: 'Le dossier machine n’a pas pu être créé',
    },
    form: {
      eyebrow: 'Créer une machine',
      title: 'Ajouter un dossier machine',
      body: "Ce formulaire soumet via la server action web, transmet la session authentifiée à l'API et fonctionne uniquement lorsque les dossiers client et modèle existent déjà.",
      customerLabel: 'Client',
      modelLabel: 'Modèle machine',
      machineNameLabel: 'Nom de la machine',
      machineNamePlaceholder: 'Ligne de presse 1',
      serialNumberLabel: 'Numéro de série',
      serialNumberPlaceholder: 'SN-001',
      statusLabel: 'Statut',
      deliveryDateLabel: 'Date de livraison',
      plcLabel: 'PLC',
      plcPlaceholder: 'Siemens S7',
      hmiLabel: 'HMI',
      hmiPlaceholder: 'KTP700',
      submitLabel: 'Créer la machine',
    },
    statusLabels: {
      ACTIVE: 'Active',
      MAINTENANCE: 'Maintenance',
      OUT_OF_SERVICE: 'Hors service',
      ARCHIVED: 'Archivée',
    },
  },
  es: {
    feedback: {
      successTitle: 'Registro de máquina creado',
      successBody: 'La máquina se creó mediante la frontera API y la lista se actualizó.',
      errorTitle: 'No se pudo crear el registro de máquina',
    },
    form: {
      eyebrow: 'Crear máquina',
      title: 'Agregar registro de máquina',
      body: 'Este formulario envía mediante la server action web, reenvía la sesión autenticada a la API y solo funciona cuando ya existen registros de cliente y modelo.',
      customerLabel: 'Cliente',
      modelLabel: 'Modelo de máquina',
      machineNameLabel: 'Nombre de máquina',
      machineNamePlaceholder: 'Línea de prensa 1',
      serialNumberLabel: 'Número de serie',
      serialNumberPlaceholder: 'SN-001',
      statusLabel: 'Estado',
      deliveryDateLabel: 'Fecha de entrega',
      plcLabel: 'PLC',
      plcPlaceholder: 'Siemens S7',
      hmiLabel: 'HMI',
      hmiPlaceholder: 'KTP700',
      submitLabel: 'Crear máquina',
    },
    statusLabels: {
      ACTIVE: 'Activa',
      MAINTENANCE: 'Mantenimiento',
      OUT_OF_SERVICE: 'Fuera de servicio',
      ARCHIVED: 'Archivada',
    },
  },
} satisfies Record<Locale, MachineRecordsCreateCopy>;
