// Builds the local backup file path for a document and writes the PDF.
// Folder structure: <BackupRoot>/<Client Name>/<Customer Name>/<Job Number - Appliance>/<DocType>_<DocNumber>.pdf
const fs = require('fs');
const path = require('path');

function sanitize(segment) {
  return String(segment || 'Unknown')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || 'Unknown';
}

function buildDocPath(backupRoot, meta) {
  const { clientName, customerName, jobNumber, applianceType, docType, docNumber } = meta;

  const jobFolder = `${sanitize(jobNumber)} - ${sanitize(applianceType)}`;
  const dir = path.join(
    backupRoot,
    sanitize(clientName),
    sanitize(customerName),
    jobFolder
  );
  const fileName = `${sanitize(docType)}_${sanitize(docNumber)}.pdf`;

  return { dir, filePath: path.join(dir, fileName) };
}

async function saveDocumentPdf(webContents, backupRoot, meta) {
  const { dir, filePath } = buildDocPath(backupRoot, meta);
  fs.mkdirSync(dir, { recursive: true });

  const pdfBuffer = await webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
    margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
  });

  fs.writeFileSync(filePath, pdfBuffer);
  return filePath;
}

module.exports = { buildDocPath, saveDocumentPdf, sanitize };
