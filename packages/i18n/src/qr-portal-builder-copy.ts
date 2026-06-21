import type { SupportedLocale } from '@buildtrace/shared';

export type QrPortalBuilderCopy = {
  readonly sectionTitle: string;
  readonly sectionDescription: string;
  readonly assignButtonLabel: string;
  readonly rotateButtonLabel: string;
  readonly disableButtonLabel: string;
  readonly qrTokenLabel: string;
  readonly portalLinkLabel: string;
  readonly noTokenMessage: string;
  readonly assignedMessage: string;
  readonly rotatedMessage: string;
  readonly disabledMessage: string;
  readonly errorTitle: string;
};

export const qrPortalBuilderCopy = {
  en: {
    sectionTitle: 'QR Portal',
    sectionDescription: 'Generate a QR token to give machine buyers access to the customer portal.',
    assignButtonLabel: 'Generate QR token',
    rotateButtonLabel: 'Rotate QR token',
    disableButtonLabel: 'Disable portal',
    qrTokenLabel: 'Portal token',
    portalLinkLabel: 'Portal link',
    noTokenMessage: 'No QR token has been generated yet.',
    assignedMessage: 'QR token generated successfully.',
    rotatedMessage: 'QR token rotated. Previous token is now invalid.',
    disabledMessage: 'QR portal has been disabled.',
    errorTitle: 'QR portal action failed',
  },
  cs: {
    sectionTitle: 'QR portál',
    sectionDescription:
      'Vygenerujte QR token pro přístup kupujících stroje ke zákaznickému portálu.',
    assignButtonLabel: 'Vygenerovat QR token',
    rotateButtonLabel: 'Obnovit QR token',
    disableButtonLabel: 'Deaktivovat portál',
    qrTokenLabel: 'Token portálu',
    portalLinkLabel: 'Odkaz na portál',
    noTokenMessage: 'QR token zatím nebyl vygenerován.',
    assignedMessage: 'QR token byl úspěšně vygenerován.',
    rotatedMessage: 'QR token byl obnoven. Předchozí token je nyní neplatný.',
    disabledMessage: 'QR portál byl deaktivován.',
    errorTitle: 'Akce QR portálu se nezdařila',
  },
  sk: {
    sectionTitle: 'QR portál',
    sectionDescription:
      'Vygenerujte QR token pre prístup kupujúcich stroja k zákazníckemu portálu.',
    assignButtonLabel: 'Vygenerovať QR token',
    rotateButtonLabel: 'Obnoviť QR token',
    disableButtonLabel: 'Deaktivovať portál',
    qrTokenLabel: 'Token portálu',
    portalLinkLabel: 'Odkaz na portál',
    noTokenMessage: 'QR token zatiaľ nebol vygenerovaný.',
    assignedMessage: 'QR token bol úspešne vygenerovaný.',
    rotatedMessage: 'QR token bol obnovený. Predchádzajúci token je teraz neplatný.',
    disabledMessage: 'QR portál bol deaktivovaný.',
    errorTitle: 'Akcia QR portálu zlyhala',
  },
  pl: {
    sectionTitle: 'Portal QR',
    sectionDescription: 'Wygeneruj token QR, aby nabywcy maszyny mieli dostęp do portalu klienta.',
    assignButtonLabel: 'Generuj token QR',
    rotateButtonLabel: 'Obróć token QR',
    disableButtonLabel: 'Wyłącz portal',
    qrTokenLabel: 'Token portalu',
    portalLinkLabel: 'Link do portalu',
    noTokenMessage: 'Token QR nie został jeszcze wygenerowany.',
    assignedMessage: 'Token QR został pomyślnie wygenerowany.',
    rotatedMessage: 'Token QR został obrócony. Poprzedni token jest teraz nieważny.',
    disabledMessage: 'Portal QR został wyłączony.',
    errorTitle: 'Akcja portalu QR nie powiodła się',
  },
  de: {
    sectionTitle: 'QR-Portal',
    sectionDescription:
      'Generieren Sie ein QR-Token, um Maschinenkäufern Zugang zum Kundenportal zu geben.',
    assignButtonLabel: 'QR-Token generieren',
    rotateButtonLabel: 'QR-Token rotieren',
    disableButtonLabel: 'Portal deaktivieren',
    qrTokenLabel: 'Portal-Token',
    portalLinkLabel: 'Portal-Link',
    noTokenMessage: 'Es wurde noch kein QR-Token generiert.',
    assignedMessage: 'QR-Token wurde erfolgreich generiert.',
    rotatedMessage: 'QR-Token wurde rotiert. Das vorherige Token ist jetzt ungültig.',
    disabledMessage: 'QR-Portal wurde deaktiviert.',
    errorTitle: 'QR-Portal-Aktion fehlgeschlagen',
  },
  fr: {
    sectionTitle: 'Portail QR',
    sectionDescription:
      "Générez un jeton QR pour donner aux acheteurs de la machine l'accès au portail client.",
    assignButtonLabel: 'Générer le jeton QR',
    rotateButtonLabel: 'Renouveler le jeton QR',
    disableButtonLabel: 'Désactiver le portail',
    qrTokenLabel: 'Jeton du portail',
    portalLinkLabel: 'Lien du portail',
    noTokenMessage: "Aucun jeton QR n'a encore été généré.",
    assignedMessage: 'Jeton QR généré avec succès.',
    rotatedMessage: "Jeton QR renouvelé. L'ancien jeton est maintenant invalide.",
    disabledMessage: 'Le portail QR a été désactivé.',
    errorTitle: "Échec de l'action du portail QR",
  },
  es: {
    sectionTitle: 'Portal QR',
    sectionDescription:
      'Genere un token QR para dar a los compradores de la máquina acceso al portal del cliente.',
    assignButtonLabel: 'Generar token QR',
    rotateButtonLabel: 'Rotar token QR',
    disableButtonLabel: 'Desactivar portal',
    qrTokenLabel: 'Token del portal',
    portalLinkLabel: 'Enlace del portal',
    noTokenMessage: 'Aún no se ha generado un token QR.',
    assignedMessage: 'Token QR generado correctamente.',
    rotatedMessage: 'Token QR rotado. El token anterior ya no es válido.',
    disabledMessage: 'El portal QR ha sido desactivado.',
    errorTitle: 'Error en la acción del portal QR',
  },
} as const satisfies Record<SupportedLocale, QrPortalBuilderCopy>;
