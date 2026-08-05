import PDFDocument from 'pdfkit';

const money = (n) => `AED ${Number(n || 0).toFixed(2)}`;

const buildPdf = (drawFn) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    drawFn(doc);
    doc.end();
  });

const header = (doc, client, title, docNumber) => {
  doc.fontSize(18).text(client?.name || 'Imran Pro Services', { align: 'left' });
  if (client?.phone) doc.fontSize(9).fillColor('#666').text(client.phone);
  if (client?.address) doc.fontSize(9).fillColor('#666').text(client.address);
  doc.moveDown(1);
  doc.fillColor('#000').fontSize(16).text(title, { align: 'left' });
  doc.fontSize(10).fillColor('#666').text(docNumber);
  doc.fillColor('#000').moveDown(1);
};

const customerBlock = (doc, customerName, customerPhone) => {
  doc.fontSize(9).fillColor('#666').text('CUSTOMER');
  doc.fontSize(11).fillColor('#000').text(customerName || 'Unknown Customer');
  if (customerPhone) doc.fontSize(9).fillColor('#666').text(customerPhone);
  doc.moveDown(1);
};

const generateInspectionPdf = ({ client, report, customerName, customerPhone }) =>
  buildPdf((doc) => {
    header(doc, client, 'Inspection Report', report.report_number);
    customerBlock(doc, customerName, customerPhone);

    doc.fontSize(9).fillColor('#666').text('FINDINGS');
    doc.fillColor('#000');
    (report.findings || []).forEach((f, i) => {
      doc.fontSize(10).text(`${i + 1}. ${f.description}`);
    });
    doc.moveDown(1);

    doc.fontSize(9).fillColor('#666').text('TAX SUMMARY');
    doc.fillColor('#000').fontSize(10);
    doc.text(`Taxable Amount: ${money(report.taxable_amount)}`);
    doc.text(`Tax Rate: ${report.tax_rate}%`);
    doc.text(`Tax Amount: ${money(report.tax_amount)}`, { underline: false });
    doc.fontSize(12).text(`Total: ${money(Number(report.taxable_amount) + Number(report.tax_amount))}`);
  });

const generateQuotationPdf = ({ client, quotation, customerName, customerPhone }) =>
  buildPdf((doc) => {
    header(doc, client, 'Quotation', quotation.quotation_number);
    customerBlock(doc, customerName, customerPhone);

    doc.fontSize(9).fillColor('#666').text('ITEMS');
    doc.fillColor('#000');
    (quotation.items || []).forEach((item, i) => {
      doc.fontSize(10).text(`${i + 1}. ${item.description} — Qty ${item.quantity} x ${money(item.unit_price)} = ${money(item.line_total)}`);
    });
    doc.moveDown(1);

    doc.fontSize(10);
    doc.text(`Labour: ${money(quotation.labour_amount)}`);
    doc.text(`Parts: ${money(quotation.parts_amount)}`);
    if (Number(quotation.discount_amount) > 0) doc.text(`Discount: -${money(quotation.discount_amount)}`);
    doc.text(`VAT (${quotation.vat_percent}%)`);
    doc.fontSize(12).text(`Total: ${money(quotation.total_amount)}`);
  });

const generateInvoicePdf = ({ client, invoice, customerName, customerPhone }) =>
  buildPdf((doc) => {
    header(doc, client, 'Invoice', invoice.invoice_number);
    customerBlock(doc, customerName, customerPhone);

    doc.fontSize(10);
    doc.text(`Issue Date: ${invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : '—'}`);
    doc.text(`Due Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}`);
    doc.moveDown(1);

    doc.text(`Subtotal: ${money(invoice.subtotal)}`);
    doc.text(`VAT: ${money(invoice.vat_amount)}`);
    doc.fontSize(12).text(`Total: ${money(invoice.total_amount)}`);
  });

export { generateInspectionPdf, generateQuotationPdf, generateInvoicePdf };
