import React from 'react';
import { useTranslation } from 'react-i18next';
import PolicyPage from './components/PolicyPage';

const sections = {
  ka: [
    ['ვინ გასცემს გარანტიას და ვინ ახორციელებს მომსახურებას?', 'Gstore არის გამყიდველი და კომერციული გარანტიის გამცემი. ზეზვა იღებს მოწყობილობას, ატარებს დიაგნოსტიკას და ასრულებს მომსახურებას. შეცვლის, ფასის შემცირებისა და თანხის დაბრუნების მოთხოვნებს განიხილავს Gstore, ზეზვას ტექნიკური დასკვნის გათვალისწინებით.'],
    ['რამდენ ხანს მოქმედებს გარანტია?', 'დოკუმენტის მიხედვით, მოწყობილობის კომერციული გარანტია მოქმედებს გადაცემიდან 24 თვე, ელემენტის კი 12 თვე. ეს პირობები ვრცელდება ახალ, Open Box და მეორეულ მოწყობილობებზეც, შეძენისას შეთანხმებული მდგომარეობის გათვალისწინებით. ელემენტის 12-თვიანი ვადის გასვლა სხვა კომპონენტების 24-თვიან გარანტიას არ ამცირებს.'],
    ['როგორ დავადასტურო შეძენა?', 'გარანტიის ID და შემოწმების ბმული SMS-ით იგზავნება; ამავე გვერდზე შეგიძლია ჩამოტვირთო ელექტრონული საგარანტიო ბარათი. SMS-ის, ბარათის ან ყუთის არქონა თავისთავად არ აუქმებს გარანტიას. შეძენის დადასტურება შესაძლებელია ჩეკით, ინვოისით, შეკვეთით ან სხვა სანდო ჩანაწერით.'],
    ['რას ფარავს უფასო საგარანტიო მომსახურება?', 'იფარება ნორმალური გამოყენებისას გამოვლენილი შიდა ტექნიკური გაუმართაობა, რომელიც მომხმარებლის, მესამე პირის ან გარე ფაქტორის ზემოქმედებით არ არის გამოწვეული. საგარანტიო შემთხვევისას საჭირო დიაგნოსტიკა, სამუშაო და ნაწილი უფასოა. კონკრეტული მიზეზი დიაგნოსტიკით განისაზღვრება.'],
    ['როგორ ფასდება ელემენტის პრობლემა?', 'პირველი 12 თვის განმავლობაში შეიძლება დაიფაროს ელემენტის დადასტურებული შიდა ტექნიკური გაუმართაობა. ბუნებრივი ტევადობის კლება თავისთავად საგარანტიო ნაკლი არ არის; უჩვეულოდ სწრაფი კლება ან მოულოდნელი გათიშვა დიაგნოსტიკას საჭიროებს. 12 თვის შემდეგ ელემენტის შეცვლა, ჩვეულებრივ, ფასიანია, კანონით დაცული თავდაპირველი ნაკლის მოთხოვნის გათვალისწინებით.'],
    ['როდის შეიძლება იყოს შეკეთება ფასიანი?', 'დოკუმენტი საგარანტიო დაფარვის მიღმა განიხილავს, მათ შორის, დადასტურებულ მექანიკურ ან სითხით დაზიანებას, არასწორი კვებით ან ჩარევით გამოწვეულ ხარვეზს და ჩვეულებრივ ცვეთას. IP რეიტინგი, დაცემისადმი ან ნაკაწრებისადმი გამძლეობა შემთხვევითი დაზიანების დაზღვევა არ არის. მხოლოდ ნაკაწრი, გახსნის კვალი ან წარსულში დაცემა მთელი მოწყობილობის გარანტიას ავტომატურად არ აუქმებს.'],
    ['როგორ მივმართო სერვისცენტრს?', 'მიუთითე საკონტაქტო ინფორმაცია, მოდელი, IMEI ან სერიული ნომერი, გარანტიის ID ან შეძენის სხვა მტკიცებულება და პრობლემის აღწერა. შეძლებისდაგვარად შექმენი მონაცემების სარეზერვო ასლი და ამოიღე SIM/მეხსიერების ბარათი. ორიგინალი ყუთი აუცილებელი არ არის; მიღებისას ფორმდება აქტი, რომლის ასლსაც მიიღებ.'],
    ['ფასიანი სამუშაო ჩემს თანხმობამდე დაიწყება?', 'არა. არასაგარანტიო შემთხვევისას ზეზვა წინასწარ გაწვდის დასაბუთებულ შეთავაზებას სამუშაოს, ნაწილების, საბოლოო ფასისა და სავარაუდო ვადის შესახებ. ფასიანი დიაგნოსტიკაც წინასწარ უნდა შეთანხმდეს. დუმილი თანხმობად არ ითვლება; დამატებითი ხარჯისთვის ახალი შეთანხმებაა საჭირო.'],
    ['რა ვადებია და როგორ გავასაჩივრო დასკვნა?', 'დოკუმენტი საგარანტიო შეცვლისთვის მიუთითებს არაუგვიანეს 10 კალენდარულ დღეს, სტანდარტული შეკეთებისთვის კი არაუგვიანეს 30 კალენდარულ დღეს ნაკლის აღმოჩენიდან. თუ დასკვნას არ ეთანხმები, მიმართე ზეზვას ან Gstore-ს, მოითხოვე დასკვნისა და მტკიცებულებების ასლი ან განმეორებითი განხილვა. შიდა განხილვა კანონით გათვალისწინებულ მიმართვის უფლებებს არ ზღუდავს.'],
    ['დაბრუნება და საგარანტიო მოთხოვნა ერთი და იგივეა?', 'არა. დისტანციური ან სარეწის გარეთ შეძენისას მიზეზის გარეშე დაბრუნების უფლება, კანონით გათვალისწინებული გამონაკლისებით, ცალკე პროცედურაა და ასეთ მოთხოვნაზე Gstore-ს უნდა მიმართო. ზეზვაში დიაგნოსტიკა ამ უფლების გამოყენების აუცილებელი წინაპირობა არ არის.'],
  ],
  en: [
    ['Who provides the warranty and service?', 'Gstore is the seller and provider of the commercial warranty. ZEZVA receives the device, diagnoses it, and performs service. Gstore considers replacement, price reduction, and refund requests, taking ZEZVA’s technical findings into account.'],
    ['How long does the warranty last?', 'The policy states that device coverage lasts 24 months from handover and battery coverage lasts 12 months. It also applies to new, Open Box, and pre-owned devices, taking their agreed condition at purchase into account. Expiry of battery coverage does not shorten coverage for other components.'],
    ['How can I prove my purchase?', 'A warranty ID and lookup link are sent by SMS; you can download an electronic warranty certificate here. Losing the SMS, certificate, or original box does not by itself cancel coverage. A receipt, invoice, order, or another reliable record can also establish the purchase.'],
    ['What does free warranty service cover?', 'It covers internal technical faults arising during normal use that were not caused by the customer, a third party, or an external event. Diagnosis, necessary work, and parts are free for a covered claim. The cause is determined through diagnosis.'],
    ['How are battery problems assessed?', 'During the first 12 months, a confirmed internal battery fault may be covered. Expected capacity loss alone is not a defect; unusually rapid decline or unexpected shutdown requires diagnosis. After 12 months, battery replacement is normally paid, without removing any statutory claim for an original defect.'],
    ['When might repair be paid?', 'The policy excludes certain proven accidental or external damage, including mechanical or liquid damage, faults caused by unsuitable power or third-party intervention, and ordinary wear. Water, drop, or scratch resistance is not accidental-damage insurance. A scratch, prior drop, or sign of opening does not automatically cancel coverage for unrelated faults.'],
    ['How do I request service?', 'Provide your contact details, model, IMEI or serial number, warranty ID or other purchase evidence, and a description of the problem. If possible, back up your data and remove SIM and memory cards. The original box is not required; you receive a copy of the intake record.'],
    ['Can paid work start without my consent?', 'No. For a non-warranty case, ZEZVA provides a reasoned offer showing the work, parts, final price, and estimated time. Paid diagnosis must also be agreed in advance. Silence is not consent, and extra costs require a new agreement.'],
    ['What are the service times and how can I challenge a finding?', 'The policy specifies no later than 10 calendar days for a warranty replacement and 30 calendar days for standard repair from discovery of the fault. If you disagree with a finding, contact ZEZVA or Gstore and request the report, evidence, or another review. Internal review does not limit statutory remedies.'],
    ['Is returning a purchase the same as a warranty claim?', 'No. The policy treats withdrawal from a distance or off-premises purchase as a separate process, subject to legal exceptions. Contact Gstore about that request; a ZEZVA diagnosis is not a prerequisite.'],
  ],
};

const TermsPage = () => {
  const { i18n } = useTranslation();
  const ka = i18n.language === 'ka';
  return <PolicyPage
    title={ka ? 'წესები და პირობები' : 'Terms and conditions'}
    meta={ka ? 'საგარანტიო პირობები · მოქმედებს 01.01.2026-დან · რედაქცია 03.04.2026 · v1.1' : 'Warranty terms · effective 01.01.2026 · revised 03.04.2026 · v1.1'}
    intro={ka ? 'ქვემოთ მოცემულია Gstore-ში შეძენილი მოწყობილობების საგარანტიო მომსახურების მოკლე მიმოხილვა. სრული პირობები იხილე PDF-ში. შეკვეთის, გადახდისა და მიწოდების პირობები ამ დოკუმენტში არ არის აღწერილი.' : 'Below is a summary of the warranty service terms for devices purchased from Gstore. Read the Georgian PDF for the full policy. This document does not cover order, payment, or delivery terms.'}
    documentLink={{ href: '/Zezva_Warranty_Policy_KA.pdf', filename: 'Zezva_Warranty_Policy_KA.pdf', label: ka ? 'სრული საგარანტიო პირობების ჩამოტვირთვა (PDF)' : 'Download full warranty terms (Georgian PDF)' }}
    sections={sections[ka ? 'ka' : 'en']}
  />;
};

export default TermsPage;
