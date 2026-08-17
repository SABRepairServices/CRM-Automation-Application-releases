import PDFDocument from 'pdfkit';

// Shared brand tokens — kept in sync with Web/src/styles/document-theme.css
// so the PDF that actually reaches the customer over WhatsApp/email looks
// like the branded document the office sees on screen, not a plain
// pdfkit default.
const NAVY = '#0D2137';
const GOLD = '#C9933A';
const MUTED = '#64748b';
const BORDER = '#d7dbe3';
const TEXT = '#0f172a';

const money = (n) => `AED ${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '—');

const buildPdf = (drawFn) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 42, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    drawFn(doc);
    doc.end();
  });

/** Navy banner with the client name, a gold divider, and the document
 * title/number on the right — the PDF equivalent of DocumentHeader.tsx. */
const brandedHeader = (doc, client, title, docNumber) => {
  const top = doc.y;
  doc.rect(doc.page.margins.left, top, doc.page.width - doc.page.margins.left - doc.page.margins.right, 64).fill(NAVY);
  doc.fillColor('#fff').fontSize(15).font('Helvetica-Bold')
    .text(client?.name || 'Your Company', doc.page.margins.left + 16, top + 12, { width: 300 });
  doc.fillColor(GOLD).fontSize(8).font('Helvetica')
    .text([client?.address, client?.phone, client?.email].filter(Boolean).join('  •  '), doc.page.margins.left + 16, top + 32, { width: 320 });
  if (client?.vat_number) {
    doc.fillColor('#c7d2e0').fontSize(7.5).text(`TRN: ${client.vat_number}`, doc.page.margins.left + 16, top + 46);
  }
  doc.fillColor(GOLD).fontSize(14).font('Helvetica-Bold')
    .text(title.toUpperCase(), doc.page.width - doc.page.margins.right - 220, top + 14, { width: 220, align: 'right' });
  doc.fillColor('#fff').fontSize(9).font('Helvetica')
    .text(docNumber, doc.page.width - doc.page.margins.right - 220, top + 34, { width: 220, align: 'right' });
  doc.rect(doc.page.margins.left, top + 64, doc.page.width - doc.page.margins.left - doc.page.margins.right, 3).fill(GOLD);
  doc.fillColor(TEXT).moveDown(3);
  doc.y = top + 82;
};

const sectionLabel = (doc, text) => {
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GOLD).text(text.toUpperCase(), { characterSpacing: 0.5 });
  doc.fillColor(TEXT).font('Helvetica').moveDown(0.3);
};

const customerBlock = (doc, name, phone, extraLines = []) => {
  sectionLabel(doc, 'Bill To');
  doc.fontSize(11).font('Helvetica-Bold').text(name || 'Unknown Customer');
  doc.fontSize(9).font('Helvetica').fillColor(MUTED);
  if (phone) doc.text(phone);
  extraLines.filter(Boolean).forEach((line) => doc.text(line));
  doc.fillColor(TEXT).moveDown(1);
};

/** Bordered items table matching the on-screen doc-theme item grid. */
const itemsTable = (doc, columns, rows) => {
  const startX = doc.page.margins.left;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const widths = columns.map((c) => c.width * tableWidth);
  let y = doc.y;

  doc.rect(startX, y, tableWidth, 20).fill('#f1f3f7');
  let x = startX;
  columns.forEach((c, i) => {
    doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold')
      .text(c.label.toUpperCase(), x + 6, y + 6, { width: widths[i] - 10, align: c.align || 'left' });
    x += widths[i];
  });
  y += 20;
  doc.fillColor(TEXT).font('Helvetica');

  rows.forEach((row) => {
    const rowHeight = 20;
    doc.rect(startX, y, tableWidth, rowHeight).strokeColor(BORDER).lineWidth(0.5).stroke();
    x = startX;
    columns.forEach((c, i) => {
      doc.fontSize(9).text(String(row[c.key] ?? ''), x + 6, y + 6, { width: widths[i] - 10, align: c.align || 'left' });
      x += widths[i];
    });
    y += rowHeight;
  });

  doc.y = y + 10;
};

/** Right-aligned totals box, gold-highlighted grand total — mirrors the
 * .totals-box styling in document-theme.css. */
const totalsBox = (doc, rows) => {
  const boxWidth = 220;
  const startX = doc.page.width - doc.page.margins.right - boxWidth;
  let y = doc.y;

  rows.forEach((r) => {
    const isGrand = r.grand;
    doc.fontSize(isGrand ? 11 : 9).font(isGrand ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(isGrand ? GOLD : MUTED)
      .text(r.label, startX, y, { width: 120 });
    doc.fillColor(isGrand ? GOLD : TEXT)
      .text(r.value, startX + 120, y, { width: 100, align: 'right' });
    y += isGrand ? 18 : 14;
  });

  doc.fillColor(TEXT).y = y + 10;
};

const signatureBlock = (doc, signatures = {}, labels) => {
  const startX = doc.page.margins.left;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const boxWidth = tableWidth / labels.length - 8;
  let y = doc.y + 10;

  labels.forEach(({ key, label }, i) => {
    const x = startX + i * (boxWidth + 8);
    const sig = signatures[key] || {};
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(MUTED).text(label.toUpperCase(), x, y);
    doc.moveTo(x, y + 26).lineTo(x + boxWidth, y + 26).dash(2, { space: 2 }).strokeColor(BORDER).stroke().undash();
    doc.fontSize(9).font('Helvetica').fillColor(TEXT).text(sig.name || '', x, y + 30, { width: boxWidth });
    doc.fontSize(8).fillColor(MUTED).text(sig.date ? fmtDate(sig.date) : '', x, y + 44, { width: boxWidth });
  });

  doc.fillColor(TEXT).y = y + 60;
};

const footer = (doc, client) => {
  doc.fontSize(7.5).fillColor(MUTED).font('Helvetica')
    .text(`${client?.name || 'Shams Al Barakats'} — computer-generated document.`, doc.page.margins.left, doc.page.height - 40, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      align: 'center',
    });
};

const generateInspectionPdf = ({ client, report, customerName, customerPhone }) =>
  buildPdf((doc) => {
    brandedHeader(doc, client, 'Inspection Report', `Ref: ${report.report_number}  •  ${fmtDate(report.inspected_at)}`);
    customerBlock(doc, customerName, customerPhone, [report.appliance_type]);

    sectionLabel(doc, 'Findings');
    itemsTable(
      doc,
      [{ key: 'no', label: '#', width: 0.08 }, { key: 'description', label: 'Description', width: 0.92 }],
      (report.findings || []).map((f, i) => ({ no: i + 1, description: f.description }))
    );

    if (report.root_cause) {
      sectionLabel(doc, 'Root Cause');
      doc.fontSize(9).text(report.root_cause);
      doc.moveDown(0.5);
    }

    totalsBox(doc, [
      { label: 'Taxable Amount', value: money(report.taxable_amount) },
      { label: `VAT (${report.tax_rate}%)`, value: money(report.tax_amount) },
      { label: 'TOTAL', value: money(Number(report.taxable_amount) + Number(report.tax_amount)), grand: true },
    ]);

    signatureBlock(doc, report.signatures, [
      { key: 'technician', label: 'Technician' },
      { key: 'customer', label: 'Customer / Owner' },
      { key: 'office', label: 'Office (Verified By)' },
    ]);

    footer(doc, client);
  });

const generateQuotationPdf = ({ client, quotation, customerName, customerPhone }) =>
  buildPdf((doc) => {
    brandedHeader(doc, client, 'Quotation', `Ref: ${quotation.quotation_number}  •  Valid until ${fmtDate(quotation.valid_until)}`);
    customerBlock(doc, customerName, customerPhone, [quotation.appliance_type]);

    sectionLabel(doc, 'Scope of Work & Cost Breakdown');
    itemsTable(
      doc,
      [
        { key: 'no', label: '#', width: 0.06 },
        { key: 'description', label: 'Description', width: 0.44 },
        { key: 'qty', label: 'Qty', width: 0.1, align: 'right' },
        { key: 'unit', label: 'Unit Price', width: 0.17, align: 'right' },
        { key: 'amount', label: 'Amount', width: 0.23, align: 'right' },
      ],
      (quotation.items || []).map((item, i) => ({
        no: i + 1,
        description: item.description,
        qty: item.quantity,
        unit: money(item.unit_price),
        amount: money(item.line_total),
      }))
    );

    // Derived the same way quotationService.js's computeTotals() derives it
    // (subtotal * vat_percent/100) rather than back-solving from the stored
    // total_amount. labour/parts/discount/total are each independently
    // rounded NUMERIC(12,2) columns, so total - labour - parts + discount
    // can drift a cent from the true VAT once rounding compounds across
    // four separately-rounded values — this recomputes it from the same
    // subtotal the total was originally built from, so it can't disagree.
    const quotationSubtotal = Number(quotation.labour_amount) + Number(quotation.parts_amount) - Number(quotation.discount_amount);
    const quotationVatAmount = quotationSubtotal * (Number(quotation.vat_percent) / 100);

    totalsBox(doc, [
      { label: 'Labour', value: money(quotation.labour_amount) },
      { label: 'Parts', value: money(quotation.parts_amount) },
      ...(Number(quotation.discount_amount) > 0 ? [{ label: 'Discount', value: `-${money(quotation.discount_amount)}` }] : []),
      { label: `VAT (${quotation.vat_percent}%)`, value: money(quotationVatAmount) },
      { label: 'TOTAL DUE', value: money(quotation.total_amount), grand: true },
    ]);

    signatureBlock(doc, quotation.signatures, [
      { key: 'prepared_by', label: 'Prepared By (Office)' },
      { key: 'approved_by', label: 'Approved By (Customer)' },
      { key: 'technician', label: 'Technician' },
    ]);

    footer(doc, client);
  });

const generateInvoicePdf = ({ client, invoice, customerName, customerPhone }) =>
  buildPdf((doc) => {
    brandedHeader(doc, client, 'Tax Invoice', `Invoice: ${invoice.invoice_number}  •  Due ${fmtDate(invoice.due_date)}`);
    customerBlock(doc, customerName, customerPhone);

    sectionLabel(doc, 'Invoice Items');
    itemsTable(
      doc,
      [
        { key: 'no', label: '#', width: 0.08 },
        { key: 'description', label: 'Description', width: 0.62 },
        { key: 'amount', label: 'Amount', width: 0.3, align: 'right' },
      ],
      (invoice.jobs || []).map((j, i) => ({
        no: i + 1,
        description: `${j.appliance_type || 'Appliance'} — ${j.reported_fault || 'Repair service'}`,
        amount: money(j.amount),
      }))
    );

    totalsBox(doc, [
      { label: 'Subtotal', value: money(invoice.subtotal) },
      { label: 'VAT', value: money(invoice.vat_amount) },
      { label: 'TOTAL DUE', value: money(invoice.total_amount), grand: true },
      { label: 'Received', value: money(invoice.paid_amount) },
      { label: 'Balance', value: money(Math.max(0, invoice.total_amount - invoice.paid_amount)) },
    ]);

    signatureBlock(doc, invoice.signatures, [
      { key: 'issued_by', label: 'Issued By (Office)' },
      { key: 'received_by', label: 'Received By (Customer)' },
      { key: 'technician', label: 'Technician' },
    ]);

    footer(doc, client);
  });

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const generateMonthlyInvoicePdf = ({ client, invoice, customerName }) =>
  buildPdf((doc) => {
    const period = `${MONTH_NAMES[invoice.month - 1] || ''} ${invoice.year}`;
    brandedHeader(doc, client, 'Monthly Invoice', `${period}  •  ${invoice.invoice_number}`);
    customerBlock(doc, customerName || invoice.contract_name);

    sectionLabel(doc, 'Monthly Job Log');
    itemsTable(
      doc,
      [
        { key: 'no', label: '#', width: 0.06 },
        { key: 'date', label: 'Date', width: 0.12 },
        { key: 'job', label: 'Job / Appliance', width: 0.32 },
        { key: 'amount', label: 'Amount', width: 0.17, align: 'right' },
        { key: 'received', label: 'Received', width: 0.17, align: 'right' },
        { key: 'pending', label: 'Pending', width: 0.16, align: 'right' },
      ],
      (invoice.jobs || []).map((j, i) => ({
        no: i + 1,
        date: fmtDate(j.completed_at),
        job: `${j.job_number || ''} — ${j.appliance_type || ''}`,
        amount: money(j.amount),
        received: money(j.received_amount),
        pending: money(Math.max(0, j.amount - j.received_amount)),
      }))
    );

    totalsBox(doc, [
      { label: 'Total Jobs', value: String((invoice.jobs || []).length) },
      { label: 'TOTAL AMOUNT', value: money(invoice.subtotal), grand: true },
      { label: 'Total Received', value: money(invoice.total_received) },
      { label: 'Total Pending', value: money(invoice.total_pending) },
    ]);

    signatureBlock(doc, invoice.signatures, [
      { key: 'issued_by', label: 'Issued By (Office)' },
      { key: 'verified_by', label: 'Verified By (Manager)' },
      { key: 'acknowledged_by', label: 'Acknowledged By (Client)' },
    ]);

    footer(doc, client);
  });

export { generateInspectionPdf, generateQuotationPdf, generateInvoicePdf, generateMonthlyInvoicePdf };
