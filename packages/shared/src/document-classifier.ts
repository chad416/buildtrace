import type {
  DocumentCategory,
  DocumentClassificationSource,
  DocumentClassificationStatus,
  documentClassificationNeedsReviewThreshold,
} from './index';

const classificationNeedsReviewThreshold =
  70 satisfies typeof documentClassificationNeedsReviewThreshold;

export type ClassifyDocumentFromFilenameInput = {
  readonly fileName: string;
  readonly fileType?: string | null;
};

export type DocumentClassificationSuggestion = {
  readonly suggestedCategory: DocumentCategory | null;
  readonly classificationConfidence: number | null;
  readonly classificationStatus: Exclude<DocumentClassificationStatus, 'manually-confirmed'>;
  readonly classificationSource: DocumentClassificationSource | null;
  readonly matchedSignals: readonly string[];
};

type CategoryRule = {
  readonly category: DocumentCategory;
  readonly keywords: readonly string[];
  readonly extensions?: readonly string[];
  readonly confidence: number;
};

const categoryRules: readonly CategoryRule[] = [
  {
    category: 'plc',
    keywords: ['plc', 's7', 'simatic', 'step7', 'tia portal', 'cpu', 'logic', 'program block'],
    extensions: ['zap13', 'zap14', 'zap15', 'zap16', 'zap17', 'zap18', 'zap19', 'ap15', 'ap16'],
    confidence: 88,
  },
  {
    category: 'hmi',
    keywords: ['hmi', 'panel', 'wincc', 'comfort panel', 'operator panel', 'touch panel'],
    confidence: 88,
  },
  {
    category: 'electrical-drawings',
    keywords: [
      'electrical',
      'electric',
      'schema',
      'schematic',
      'wiring',
      'eplan',
      'elektro',
      'elektricke',
      'elektricky',
      'zapojeni',
      'rozvadec',
    ],
    extensions: ['edz'],
    confidence: 86,
  },
  {
    category: 'mechanical-drawings',
    keywords: ['mechanical', 'drawing', 'vykres', 'vykresy', 'assembly drawing', 'layout'],
    confidence: 82,
  },
  {
    category: 'cad',
    keywords: ['cad', '3d', 'step', 'stp', 'iges', 'dwg', 'dxf', 'model'],
    extensions: ['step', 'stp', 'igs', 'iges', 'dwg', 'dxf'],
    confidence: 90,
  },
  {
    category: 'machine-photos',
    keywords: ['photo', 'image', 'screenshot', 'picture', 'foto', 'fotka', 'obrazek'],
    extensions: ['png', 'jpg', 'jpeg', 'webp'],
    confidence: 74,
  },
  {
    category: 'fat',
    keywords: ['fat', 'factory acceptance', 'factory-acceptance'],
    confidence: 92,
  },
  {
    category: 'sat',
    keywords: ['sat', 'site acceptance', 'site-acceptance'],
    confidence: 92,
  },
  {
    category: 'manuals',
    keywords: ['manual', 'navod', 'instruction manual', 'user guide', 'prirucka'],
    confidence: 82,
  },
  {
    category: 'safety-instructions',
    keywords: ['safety', 'bezpecnost', 'safety instruction', 'risk assessment', 'ce safety'],
    confidence: 90,
  },
  {
    category: 'supplier-documents',
    keywords: ['supplier', 'vendor', 'datasheet', 'data sheet', 'technical sheet', 'dodavatel'],
    confidence: 78,
  },
  {
    category: 'spare-parts-bom',
    keywords: [
      'bom',
      'bill of material',
      'bill of materials',
      'spare',
      'spare parts',
      'nahradni dily',
    ],
    confidence: 92,
  },
  {
    category: 'certificates',
    keywords: ['certificate', 'certifikat', 'declaration', 'prohlaseni'],
    confidence: 88,
  },
  {
    category: 'service-notes',
    keywords: ['service', 'servis', 'maintenance', 'udrzba', 'note', 'report'],
    confidence: 76,
  },
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[_\-./\\()[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getExtension(fileName: string): string | null {
  const normalizedFileName = fileName.trim().toLowerCase();
  const dotIndex = normalizedFileName.lastIndexOf('.');

  if (dotIndex < 0 || dotIndex === normalizedFileName.length - 1) {
    return null;
  }

  return normalizedFileName.slice(dotIndex + 1);
}

export function classifyDocumentFromFilename({
  fileName,
  fileType,
}: ClassifyDocumentFromFilenameInput): DocumentClassificationSuggestion {
  const normalizedFileName = normalizeText(fileName);
  const normalizedFileType = normalizeText(fileType ?? '');
  const extension = getExtension(fileName);
  const signalsText = `${normalizedFileName} ${normalizedFileType}`.trim();

  if (!signalsText) {
    return {
      suggestedCategory: null,
      classificationConfidence: null,
      classificationStatus: 'unclassified',
      classificationSource: null,
      matchedSignals: [],
    };
  }

  const matches = categoryRules
    .map((rule) => {
      const matchedKeywords = rule.keywords.filter((keyword) =>
        signalsText.includes(normalizeText(keyword)),
      );
      const extensionMatched = Boolean(extension && rule.extensions?.includes(extension));
      const matchedSignals = [
        ...matchedKeywords,
        ...(extensionMatched ? [`extension:${extension}`] : []),
      ];

      return {
        category: rule.category,
        confidence: Math.min(100, rule.confidence + Math.max(0, matchedSignals.length - 1) * 3),
        matchedSignals,
      };
    })
    .filter((match) => match.matchedSignals.length > 0)
    .sort((left, right) => right.confidence - left.confidence);

  const [bestMatch, secondBestMatch] = matches;

  if (!bestMatch) {
    return {
      suggestedCategory: null,
      classificationConfidence: null,
      classificationStatus: 'unclassified',
      classificationSource: null,
      matchedSignals: [],
    };
  }

  const isAmbiguous = secondBestMatch
    ? bestMatch.confidence - secondBestMatch.confidence < 8
    : false;

  return {
    suggestedCategory: bestMatch.category,
    classificationConfidence: bestMatch.confidence,
    classificationStatus:
      isAmbiguous || bestMatch.confidence < classificationNeedsReviewThreshold
        ? 'needs-review'
        : 'classified',
    classificationSource: 'filename-type',
    matchedSignals: bestMatch.matchedSignals,
  };
}
