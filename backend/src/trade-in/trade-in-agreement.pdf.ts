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
  const doc = new PDFDocument({ size: 'A4', margins: { top: 35, right: 42, bottom: 35, left: 42 }, autoFirstPage: true });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);
  const fontPath = path.join(process.cwd(), 'assets/fonts/NotoSansGeorgian-Regular.ttf');
  if (!fs.existsSync(fontPath)) return reject(new Error('Agreement font is missing.'));
  doc.registerFont('georgian', fontPath).font('georgian');
  const left = 42;
  const width = 511;
  const section = (title: string) => {
    doc.moveDown(0.55).fontSize(10).fillColor('#17213b').text(title).moveDown(0.15);
    doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor('#dadfea').stroke();
    doc.moveDown(0.35);
  };
  const line = (label: string, value: string) => {
    doc.fontSize(8.5).fillColor('#667085').text(label, left, doc.y, { continued: true })
      .fillColor('#151a2c').text(`  ${value || '—'}`);
    doc.moveDown(0.15);
  };
  doc.fontSize(12).fillColor('#7544dc').text('GSTORE', { align: 'center' });
  doc.fontSize(8).fillColor('#687086').text('შპს „ჯისთორ ლლტ“  |  ს/კ 405566463  |  თბილისი, ცოტნე დადიანის ქ. N7, სავაჭრო ცენტრი „ქარვასლა“  |  gstore.ge', { align: 'center' });
  if (input.preview) doc.moveDown(0.4).fontSize(9).fillColor('#7544dc').text('მონახაზი · წინასწარი ნახვა · არ არის საბოლოო ხელშეკრულება', { align: 'center' });
  doc.moveDown(0.8).fontSize(13).fillColor('#151a2c').text('მეორადი/დაზიანებული მობილური მოწყობილობის\nნასყიდობისა და მიღება-ჩაბარების ხელშეკრულება', { align: 'center' });
  doc.moveDown(0.5);
  line('ხელშეკრულების №', input.number);
  line('თარიღი', new Intl.DateTimeFormat('ka-GE', { timeZone: 'Asia/Tbilisi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(input.date));
  section('1. მხარეები');
  line('გამყიდველი - სახელი და გვარი', input.details.seller_name);
  line('პირადი ნომერი', input.details.personal_id);
  line('ტელეფონის ნომერი', input.details.phone);
  line('მისამართი', input.details.address);
  line('მყიდველი', 'შპს „ჯისთორ ლლტ“ (ს/კ 405566463)');
  section('2. მოწყობილობის მონაცემები');
  line('ბრენდი და მოდელი', input.details.brand_model);
  line('მეხსიერება / ფერი', [input.details.storage, input.details.color].filter(Boolean).join(' / '));
  line('IMEI', input.details.imei);
  line('Serial Number', input.details.serial);
  line('კომპლექტაცია', input.details.included_items);
  line('ცნობილი/ხილული დაზიანებები, შეკეთებები ან არსებითი დეფექტები', input.details.defects);
  section('3. ფასი და ანგარიშსწორება');
  line('შეთანხმებული ნასყიდობის ფასი', `${input.details.final_price.toFixed(2)} ₾`);
  const settlement = input.details.settlement_method === 'bank' ? 'საბანკო გადარიცხვა'
    : input.details.settlement_method === 'gstore_credit' ? 'Gstore კრედიტი' : 'ნაღდი';
  line('ანგარიშსწორების ფორმა', settlement);
  if (input.details.settlement_method === 'gstore_credit') {
    if (input.details.gstore_product) line('არჩეული Gstore პროდუქტი', input.details.gstore_product);
    line('Gstore ბონუსი', `${input.details.credit_bonus.toFixed(2)} ₾`);
    line('ჯამური Gstore კრედიტი', `${(input.details.final_price + input.details.credit_bonus).toFixed(2)} ₾`);
  }
  section('4. მხარეთა განცხადებები და პირობები');
  doc.fontSize(8).fillColor('#222838');
  agreementTerms.forEach((term, index) => {
    doc.text(`${index + 1}. ${term}`, left, doc.y, { width, lineGap: 1.5 });
    doc.moveDown(0.18);
  });
  if (doc.y > 675) doc.addPage();
  section('5. ხელმოწერები');
  const signatureY = doc.y + 5;
  doc.fontSize(8).fillColor('#667085').text('გამყიდველი', left, signatureY).text('მყიდველი - შპს „ჯისთორ ლლტ“', 307, signatureY);
  doc.fontSize(9).fillColor('#151a2c').text(input.details.seller_name, left, signatureY + 18).text(input.details.representative_name, 307, signatureY + 18);
  if (input.customerSignature) doc.image(input.customerSignature, left, signatureY + 35, { fit: [205, 55] });
  if (input.representativeSignature) doc.image(input.representativeSignature, 307, signatureY + 35, { fit: [205, 55] });
  doc.moveTo(left, signatureY + 95).lineTo(260, signatureY + 95).moveTo(307, signatureY + 95).lineTo(525, signatureY + 95).strokeColor('#aab2c2').stroke();
  doc.fontSize(7).fillColor('#687086').text(input.customerSignature ? 'ელექტრონული ხელმოწერა' : 'ხელმოწერის ადგილი', left, signatureY + 99)
    .text(input.representativeSignature ? 'ელექტრონული ხელმოწერა' : 'ხელმოწერის ადგილი', 307, signatureY + 99);
  doc.end();
});
