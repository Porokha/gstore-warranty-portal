import * as fs from 'fs';
import * as path from 'path';
import PDFDocument = require('pdfkit');

export type AgreementDetails = {
  terms_hash: string;
  seller_name: string;
  personal_id: string;
  phone: string;
  address: string;
  brand_model: string;
  storage: string;
  color: string;
  imei: string;
  serial: string;
  included_items: string;
  defects: string;
  settlement_method: 'cash' | 'bank' | 'gstore_credit';
  final_price: number;
  credit_bonus: number;
  gstore_product: string;
  representative_name: string;
};

export const agreementTerms = [
  'გამყიდველი ადასტურებს, რომ მოწყობილობა მისი კანონიერი საკუთრებაა.',
  'მოწყობილობა არ არის მოპარული, დაკარგული, ძებნაში, დაგირავებული, დაყადაღებული ან მესამე პირის უფლებით დატვირთული.',
  'გამყიდველი მყიდველს აწვდის მისთვის ცნობილ ინფორმაციას დაზიანებების, შეკეთებებისა და არსებითი დეფექტების შესახებ.',
  'გამყიდველი გადაცემამდე ვალდებულია მოხსნას პირადი ანგარიშები, პაროლები და სხვა წვდომის შეზღუდვები.',
  'ფაქტობრივი ჩაბარება და ხელმოწერა ადასტურებს მოწყობილობის მიღება-ჩაბარებას.',
  'თუ დადასტურდა, რომ მოწყობილობა გამყიდველს არ ეკუთვნოდა, იყო მოპარული/დაკარგული ან არსებობდა მესამე პირის კანონიერი მოთხოვნა, გამყიდველი აბრუნებს მიღებულ თანხას და პასუხს აგებს კანონმდებლობის შესაბამისად.',
  'პერსონალური მონაცემები მუშავდება ხელშეკრულების შესრულების, აღრიცხვისა და სამართლებრივი ინტერესების დაცვის მიზნით, საქართველოს კანონმდებლობის შესაბამისად.',
  'დავები გადაწყდება საქართველოს კანონმდებლობის შესაბამისად.',
  'ხელშეკრულება შედგენილია ორ თანაბარი იურიდიული ძალის მქონე ეგზემპლარად.',
];

export const makeAgreementPdf = (input: {
  number: string;
  date: Date;
  details: AgreementDetails;
  customerSignature?: Buffer | null;
  representativeSignature?: Buffer | null;
  preview?: boolean;
}): Promise<Buffer> => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 0, right: 0, bottom: 0, left: 0 }, autoFirstPage: true });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);
  const fontDirectory = path.join(process.cwd(), 'assets/fonts');
  const fontPath = path.join(fontDirectory, 'DejaVuSans.ttf');
  const lariFontPath = path.join(fontDirectory, 'NotoSansGeorgian-Regular.ttf');
  if (!fs.existsSync(fontPath) || !fs.existsSync(lariFontPath)) return reject(new Error('Agreement font is missing.'));
  doc.registerFont('agreement', fontPath).registerFont('lari', lariFontPath).font('agreement');
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const left = 40;
  const width = pageWidth - left * 2;
  const gap = 10;
  const columnWidth = (width - gap) / 2;
  const colors = {
    navy: '#18324f', blue: '#156cd9', ink: '#26364a', muted: '#64758a',
    border: '#dce5ef', panel: '#f5f8fc', pale: '#eaf3fe', white: '#ffffff',
  };
  let y = 0;
  const textHeight = (value: string, textWidth: number, size: number, lineGap = 1) =>
    doc.font('agreement').fontSize(size).heightOfString(value || '—', { width: textWidth, lineGap });
  const continuationHeader = () => {
    doc.rect(0, 0, pageWidth, 56).fill(colors.navy);
    doc.rect(0, 0, 5, 56).fill(colors.blue);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(colors.white).text('GSTORE', left, 16);
    doc.font('agreement').fontSize(8).fillColor('#d8e7f8').text(`ხელშეკრულება № ${input.number}  ·  გაგრძელება`, 295, 23, { width: 260, align: 'right' });
    y = 77;
  };
  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - 39) return;
    doc.addPage();
    continuationHeader();
  };
  const section = (number: string, title: string, height: number) => {
    ensureSpace(28 + height);
    doc.roundedRect(left, y + 1, 18, 18, 4).fill(colors.blue);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.white).text(number, left, y + 4, { width: 18, align: 'center' });
    doc.font('agreement').fontSize(9.5).fillColor(colors.navy).text(title, left + 27, y + 3, { width: width - 27 });
    doc.moveTo(left, y + 21).lineTo(left + width, y + 21).strokeColor(colors.border).lineWidth(0.7).stroke();
    y += 25;
  };
  const cell = (x: number, top: number, cellWidth: number, height: number, label: string, value: string) => {
    doc.roundedRect(x, top, cellWidth, height, 5).fill(colors.panel);
    doc.font('agreement').fontSize(6.8).fillColor(colors.muted).text(label, x + 10, top + 5, { width: cellWidth - 20 });
    doc.fontSize(8.8).fillColor(colors.ink).text(value || '—', x + 10, top + 16, { width: cellWidth - 20, lineGap: 0.5 });
  };
  const row = (first: [string, string], second?: [string, string]) => {
    const firstWidth = second ? columnWidth : width;
    const firstHeight = textHeight(first[1], firstWidth - 20, 8.8, 0.5);
    const secondHeight = second ? textHeight(second[1], columnWidth - 20, 8.8, 0.5) : 0;
    const height = Math.max(30, 19 + Math.max(firstHeight, secondHeight));
    ensureSpace(height + 5);
    cell(left, y, firstWidth, height, first[0], first[1]);
    if (second) cell(left + columnWidth + gap, y, columnWidth, height, second[0], second[1]);
    y += height + 4;
  };
  const date = new Intl.DateTimeFormat('ka-GE', { timeZone: 'Asia/Tbilisi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(input.date);
  doc.rect(0, 0, pageWidth, 72).fill(colors.navy);
  doc.rect(0, 0, 6, 72).fill(colors.blue);
  doc.font('Helvetica-Bold').fontSize(19).fillColor(colors.white).text('GSTORE', left, 11);
  doc.font('agreement').fontSize(7.4).fillColor('#d8e7f8')
    .text('შპს „ჯისთორ ლლტ“  ·  ს/კ 405566463', left, 39)
    .text('ცოტნე დადიანის ქ. N7, სავაჭრო ცენტრი „ქარვასლა“  ·  gstore.ge', left, 54, { width: 360 });
  doc.font('agreement').fontSize(7.5).fillColor('#b8d7f7').text('TRADE-IN  /  ხელშეკრულება', 361, 14, { width: 194, align: 'right' });
  doc.fontSize(9).fillColor(colors.white).text(`№ ${input.number}`, 361, 36, { width: 194, align: 'right' });
  doc.fontSize(7.5).fillColor('#b8d7f7').text(date, 361, 56, { width: 194, align: 'right' });
  y = 84;
  if (input.preview) {
    doc.roundedRect(left, y, width, 20, 5).fill(colors.pale);
    doc.font('agreement').fontSize(7.6).fillColor(colors.blue).text('მონახაზი  ·  წინასწარი ნახვა  ·  არ არის საბოლოო ხელშეკრულება', left + 10, y + 5, { width: width - 20, align: 'center' });
    y += 25;
  }
  doc.font('agreement').fontSize(12).fillColor(colors.navy).text(
    'მეორადი/დაზიანებული მობილური მოწყობილობის\nნასყიდობისა და მიღება-ჩაბარების ხელშეკრულება',
    left, y, { width, align: 'center', lineGap: 2 },
  );
  y += 37;
  section('1', 'მხარეები', 97);
  row(['გამყიდველი · სახელი და გვარი', input.details.seller_name], ['პირადი ნომერი', input.details.personal_id]);
  row(['ტელეფონის ნომერი', input.details.phone], ['მისამართი', input.details.address]);
  doc.font('agreement').fontSize(7.7).fillColor(colors.muted).text('მყიდველი', left + 2, y + 1);
  doc.fontSize(8.3).fillColor(colors.ink).text('შპს „ჯისთორ ლლტ“ (ს/კ 405566463)', left + 57, y + 1);
  y += 18;
  section('2', 'მოწყობილობის მონაცემები', 137);
  row(['ბრენდი და მოდელი', input.details.brand_model], ['მეხსიერება', input.details.storage]);
  row(['ფერი', input.details.color], ['IMEI', input.details.imei]);
  row(['Serial Number', input.details.serial], ['კომპლექტაცია', input.details.included_items]);
  row(['ცნობილი/ხილული დაზიანებები, შეკეთებები ან არსებითი დეფექტები', input.details.defects]);
  const settlement = input.details.settlement_method === 'bank' ? 'საბანკო გადარიცხვა'
    : input.details.settlement_method === 'gstore_credit' ? 'Gstore კრედიტი' : 'ნაღდი';
  const hasCredit = input.details.settlement_method === 'gstore_credit';
  const creditProduct = `არჩეული Gstore პროდუქტი: ${input.details.gstore_product || '—'}`;
  const creditProductHeight = hasCredit ? textHeight(creditProduct, width - 24, 7.1, 0.5) : 0;
  const settlementHeight = hasCredit ? Math.max(70, 55 + creditProductHeight) : 47;
  section('3', 'ფასი და ანგარიშსწორება', settlementHeight + 2);
  doc.roundedRect(left, y, width, settlementHeight, 6).fill(colors.pale);
  doc.font('agreement').fontSize(7.2).fillColor(colors.muted).text('შეთანხმებული ნასყიდობის ფასი', left + 12, y + 8);
  const price = input.details.final_price.toFixed(2);
  doc.font('agreement').fontSize(15).fillColor(colors.navy).text(price, left + 12, y + 20, { continued: true });
  doc.font('lari').fontSize(15).text(' ₾');
  doc.font('agreement').fontSize(7.2).fillColor(colors.muted).text('ანგარიშსწორების ფორმა', left + 275, y + 8);
  doc.fontSize(9.5).fillColor(colors.ink).text(settlement, left + 275, y + 25, { width: width - 287 });
  if (hasCredit) {
    doc.moveTo(left + 12, y + 45).lineTo(left + width - 12, y + 45).strokeColor('#cbdff5').lineWidth(0.7).stroke();
    doc.font('agreement').fontSize(7.1).fillColor(colors.ink).text(creditProduct, left + 12, y + 50, { width: width - 24 });
    doc.text(`Gstore ბონუსი: ${input.details.credit_bonus.toFixed(2)} GEL   ·   ჯამური კრედიტი: ${(input.details.final_price + input.details.credit_bonus).toFixed(2)} GEL`, left + 12, y + 51 + creditProductHeight, { width: width - 24 });
  }
  y += settlementHeight + 6;
  const termColumns = [agreementTerms.slice(0, 5), agreementTerms.slice(5)];
  const termHeight = (term: string) => textHeight(term, columnWidth - 23, 7.1, 0.6) + 3;
  const termsHeight = Math.max(...termColumns.map((terms) => terms.reduce((height, term) => height + termHeight(term), 0)));
  section('4', 'მხარეთა განცხადებები და პირობები', termsHeight + 4);
  const termTop = y + 2;
  termColumns.forEach((terms, column) => {
    const x = left + column * (columnWidth + gap);
    let termY = termTop;
    terms.forEach((term, index) => {
      const number = column === 0 ? index + 1 : index + 6;
      doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.blue).text(`${number}.`, x, termY + 1, { width: 18 });
      doc.font('agreement').fontSize(7.1).fillColor(colors.ink).text(term, x + 19, termY, { width: columnWidth - 23, lineGap: 0.6 });
      termY += termHeight(term);
    });
  });
  y += termsHeight + 5;
  section('5', 'ხელმოწერები', 81);
  const signatureY = y;
  const signatureWidth = columnWidth;
  const signature = (x: number, title: string, name: string, image?: Buffer | null) => {
    doc.roundedRect(x, signatureY, signatureWidth, 78, 5).strokeColor(colors.border).lineWidth(0.7).stroke();
    doc.font('agreement').fontSize(7.4).fillColor(colors.blue).text(title, x + 10, signatureY + 8, { width: signatureWidth - 20 });
    doc.fontSize(8.5).fillColor(colors.ink).text(name || '—', x + 10, signatureY + 23, { width: signatureWidth - 20 });
    if (image) doc.image(image, x + 10, signatureY + 34, { fit: [signatureWidth - 20, 28] });
    doc.moveTo(x + 10, signatureY + 64).lineTo(x + signatureWidth - 10, signatureY + 64).strokeColor('#9aadc1').lineWidth(0.7).stroke();
    doc.font('agreement').fontSize(6.6).fillColor(colors.muted).text(image ? 'ელექტრონული ხელმოწერა' : 'ხელმოწერის ადგილი', x + 10, signatureY + 67);
  };
  signature(left, 'გამყიდველი', input.details.seller_name, input.customerSignature);
  signature(left + columnWidth + gap, 'მყიდველი · შპს „ჯისთორ ლლტ“', input.details.representative_name, input.representativeSignature);
  doc.font('agreement').fontSize(6.7).fillColor(colors.muted).text('შპს „ჯისთორ ლლტ“  ·  gstore.ge  ·  თბილისი, ცოტნე დადიანის ქ. N7, სავაჭრო ცენტრი „ქარვასლა“', left, pageHeight - 25, { width, align: 'center' });
  doc.end();
});
