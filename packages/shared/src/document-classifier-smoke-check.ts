import {
  classifyDocumentFromFilename,
  documentClassificationNeedsReviewThreshold,
} from './index.js';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runDocumentClassifierSmokeCheck(): void {
  const plc = classifyDocumentFromFilename({
    fileName: 'Line 7 TIA Portal PLC backup.zap17',
    fileType: 'application/octet-stream',
  });

  assert(plc.suggestedCategory === 'plc', 'PLC backup should be suggested as plc.');
  assert(plc.classificationStatus === 'classified', 'PLC backup should be classified.');
  assert(
    plc.classificationSource === 'filename-type',
    'PLC backup source should be filename-type.',
  );
  assert(
    plc.classificationConfidence !== null &&
      plc.classificationConfidence >= documentClassificationNeedsReviewThreshold,
    'PLC backup confidence should meet threshold.',
  );

  const safety = classifyDocumentFromFilename({
    fileName: 'Bezpe\u010dnostn\u00ed pokyny pro obsluhu.pdf',
    fileType: 'application/pdf',
  });

  assert(
    safety.suggestedCategory === 'safety-instructions',
    'Diacritic-normalized safety document should be suggested as safety-instructions.',
  );

  const bom = classifyDocumentFromFilename({
    fileName: 'Spare parts BOM.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  assert(bom.suggestedCategory === 'spare-parts-bom', 'BOM document should be suggested as BOM.');

  const ambiguous = classifyDocumentFromFilename({
    fileName: 'PLC HMI backup.zip',
    fileType: 'application/zip',
  });

  assert(
    ambiguous.classificationStatus === 'needs-review',
    'Ambiguous PLC/HMI backup should need review.',
  );

  const unknown = classifyDocumentFromFilename({
    fileName: 'archive.bin',
    fileType: 'application/octet-stream',
  });

  assert(unknown.suggestedCategory === null, 'Unknown document should not suggest a category.');
  assert(
    unknown.classificationStatus === 'unclassified',
    'Unknown document should stay unclassified.',
  );
}

runDocumentClassifierSmokeCheck();

console.info('Shared document classifier smoke check passed.');
