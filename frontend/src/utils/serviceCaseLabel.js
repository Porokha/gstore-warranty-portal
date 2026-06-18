const escapeLabelText = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const printServiceCaseLabel = (caseData, fallbackData = {}) => {
  const caseNumber = escapeLabelText(caseData?.case_number || `CASE-${caseData?.id || ''}`);
  const customerName = escapeLabelText(
    [caseData?.customer_name, caseData?.customer_last_name]
      .filter(Boolean)
      .join(' ')
      || fallbackData.customerName
      || '-'
  );
  const customerPhone = escapeLabelText(
    caseData?.customer_phone || fallbackData.customerPhone || '-'
  );
  const initialNote = escapeLabelText(
    caseData?.customer_initial_note
      || fallbackData.initialNote
      || 'No problem description'
  );
  const printFrame = document.createElement('iframe');

  printFrame.setAttribute('title', 'Service case label print frame');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';

  document.body.appendChild(printFrame);

  const printDocument = printFrame.contentWindow?.document;
  if (!printDocument) {
    printFrame.remove();
    return;
  }

  printDocument.open();
  printDocument.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page {
            size: 56mm 20mm;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 56mm;
            height: 20mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: Arial, "Noto Sans Georgian", sans-serif;
            color: #000;
            background: #fff;
          }

          .label {
            width: 56mm;
            height: 20mm;
            padding: 1.2mm 1.8mm;
            display: grid;
            grid-template-rows: auto auto 1fr;
            gap: 0.65mm;
          }

          .case-number {
            font-size: 9pt;
            line-height: 1;
            font-weight: 800;
            letter-spacing: 0.12mm;
            white-space: nowrap;
          }

          .customer {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 2mm;
            font-size: 6.8pt;
            line-height: 1;
            font-weight: 700;
            white-space: nowrap;
          }

          .customer-name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .customer-phone {
            flex: 0 0 auto;
          }

          .problem {
            padding-top: 0.55mm;
            border-top: 0.2mm solid #000;
            font-size: 6.2pt;
            line-height: 1.08;
            font-weight: 600;
            overflow: hidden;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <main class="label">
          <div class="case-number">${caseNumber}</div>
          <div class="customer">
            <span class="customer-name">${customerName}</span>
            <span class="customer-phone">${customerPhone}</span>
          </div>
          <div class="problem">${initialNote}</div>
        </main>
      </body>
    </html>
  `);
  printDocument.close();

  printFrame.onload = () => {
    printFrame.contentWindow?.focus();
    printFrame.contentWindow?.print();
    window.setTimeout(() => printFrame.remove(), 1000);
  };
};
