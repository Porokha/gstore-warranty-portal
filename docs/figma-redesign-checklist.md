# Figma Redesign Implementation Checklist

Source file: `jLRWPUwbpBi7Bsb8J4qCvf`

This checklist tracks the Figma-driven staging redesign. Implement from exact Figma nodes, including desktop, mobile, modal, empty, error, selected, and menu states. Do not treat a single screenshot as the full design source.

## Current Staging Progress

- Staff login `SD-00.1` and error state `SD-00.1a`: implemented; default state visually checked at desktop and 390px mobile widths.
- Shop-admin login `SA-00.1` and error state `SA-00.1a`: implemented; default state visually checked at desktop and 390px mobile widths.
- Shared staff shell and dashboard `SD-01.1`: initial Figma layout implemented; desktop/mobile and role visibility checked with controlled data. Real account and live-data validation remain.
- Dashboard recent-case quick view `SD-01.M1`: on-demand case details modal with grouped read-only fields, loading/error states, and navigation to the full case page implemented on staging. Real-account data validation remains.
- Service-case list `SD-02.1` and its empty, no-results, and selected states: initial Figma layout implemented with existing filters, pagination, CSV export, and case actions. The CSV Import action now reaches the admin import page; admin-only delete is guarded in the UI and uses the staff confirmation dialog with partial-failure handling. Real account/live-data validation remains.
- Service-case list eye action now reuses the `SD-01.M1` quick view; row navigation remains direct and the modal's Details action carries list filters into the full page. Controlled desktop/mobile interaction checked; real case data remains to validate.
- Service-case detail `SD-02.2`: full-page shell, header actions, tabs, grouped Details form, status timeline, result choices, file drop area, and history cards implemented on staging; live-data validation remains.
- Partners `SD-03.1`, create `SD-03.M1`, and edit `SD-03.M3`: list, metrics, search, status toggle, and create/edit dialog implemented on staging. Archive-with-linked-cases, hard-delete-without-cases, restore, and the confirmation dialog are implemented locally with a migration and tests; not deployed because staging still shares the production API.
- Warranties list `SD-04.1`: compact Figma table, filters, selection, pagination, and row actions implemented on staging; desktop/mobile layout checked with controlled data. History counts are unavailable in the current list API; real account/live-data validation remains.
- Warranty detail `SD-04.2`: Figma section layout, dates, status, POS import notes, SMS resend, edit, and new-case actions implemented on staging; desktop/mobile layout checked with controlled data. Live-data and mutation validation remain.
- Warranty create `SD-04.M1` and edit `SD-04.M1a`: routed modal forms over the list implemented on staging, with Figma field groups, shared controls, optional additional details, and fixed mobile footer; edit prefill and payload checked with controlled data. Live mutation validation remains.
- Warranty delete `SD-04.M2` and device history `SD-04.M3`: Figma-sized dialogs implemented on staging. Delete checks linked service cases before enabling a single-record action; history loads case events on demand rather than per table row. Desktop/mobile states checked with controlled data; live mutation and data validation remain.
- Service-case Status & Result `SD-02.2a/b`: refined stage selector and payment-record section styling, localized visible payment/status messages, and removed the unsupported combined payment-method choice. Figma's split-payment and payment-date states need backend support before they can be faithfully implemented; live mutation validation remains.
- Status timeline now distinguishes the persisted current stage from an unsaved selected stage in EN/KA, without marking future work as complete. Desktop/mobile draft-selection layouts checked with controlled case data; live mutation validation remains.
- Status timeline stages are now directly selectable, including non-adjacent jumps for managers, so the extra stage dropdown no longer crowds the Figma action card. Technician choices remain forward-only; selection still requires an explicit save. The completed-state card no longer labels completion as a future stage. Moving a case back before Pending now clears the saved result. Live role and mutation validation remain.
- Shop Admin Zezva catalog `SA-01.1/1a`: compact Figma-style table, search and stock/device/part filters, selected-product actions, empty states, and responsive horizontal table access implemented on staging. Desktop and 390px mobile layouts, low-stock filtering, and row selection checked with controlled data. Filters currently apply to the loaded page because the products API has no catalog-wide search/filter parameters; server-side filtering remains necessary for whole-catalog results. Real account and mutation validation remain.
- Shop Admin MobileSentrix catalog `SA-01.2/1.2a/b/c`: Figma-style supplier table, sync menu, catalog/stock/sync filters, selected actions, deleted state, read-only product preview, sample-mapping result, and live job progress implemented on staging. Desktop and 390px mobile catalog/result/progress layouts, low-stock filter, and preview checked with controlled data. Supplier filters remain page-local; the preview API does not provide full-catalog match counts, and the backend does not support cancelling a running sync. Live mutation validation remains.
- Staff Finance, Statistics, Audit, Settings, and Import: brought into the SD shell's typography, compact card, filter, tab, and table language on staging. Finance, Statistics, and Audit mobile layouts checked with controlled API data; Settings and Import behavior, real-account data, and all mutations still need validation. These pages have no dedicated Figma frames, so this is a consistent design-system adaptation, not a 1:1 Figma implementation.
- Staff My Service Cases and legacy Closed Cases route: aligned heading, metric/filter cards, and table overflow with the same Staff language. Real technician-account data and interactions remain to validate.
- Shop Admin Orders `SA-02.1/02.2`: compact inbox/detail split, order/customer/phone search, status chips, selected-order sheet, exact empty-state icon, and bilingual labels implemented on staging. Controlled desktop data checked; mobile, trash, and live mutations still need validation.
- Shop Admin Settings `SA-04.1/04.1a`: Figma single-row maintenance control with immediate save, rollback on API error, and status badge implemented on staging. Live toggle behavior remains to validate with an admin account.
- Shop Admin Trade-in `SA-03.1/03.2/03.3/03.4`: compact quotes and products tables, page-scoped search and pagination, three-state category availability, and a Figma-inspired pricing editor with a section rail, compact price rows, advanced rule disclosure, and raw JSON access implemented on staging. Quotes navigation and Products/pricing desktop and mobile layouts checked with controlled data. Live data and mutations remain unvalidated; pricing editor still exposes extra controls absent from the static Figma frame to preserve existing editing capabilities.
- Trade-in product edit `SA-M.6`: grouped Figma modal with image slot, basic fields, classification, and price/visibility section implemented on staging. Address and maximum offer are read-only because the existing update API does not change the slug and derives the offer from pricing rules; the Figma delete action is omitted because no product-delete endpoint exists. Live save validation remains.
- Trade-in quote edit `SA-M.5`: compact grouped customer and offer fields, read-only submission date, status selection, confirmation-backed delete, and responsive dialog implemented on staging. Existing product-name, email, and notes editing remain available. Live save/delete validation remains.
- Zezva product create `SA-M.4`: grouped Figma modal with image upload/drop zone, classification, price/stock, and fixed footer implemented on staging; desktop and 390px mobile layout checked with controlled data. Extra existing fields remain under Additional Details. Figma's model-code/specification controls are not in the current create DTO, so the existing issue label and sort order are shown instead; live creation and image-upload validation remain.
- Shared Shop Admin shell: Figma brand mark, compact navigation, surfaces, and radii are on staging; navigation labels now follow EN/KA. This affects all Shop Admin routes and needs a final full-tab visual regression pass.
- Next: validate case and warranty mutations with a staff test account; verify Settings and Import flows with a real admin account; continue remaining Shop Admin screens.
- Production deployment remains separate and unchanged.

## Public Web

### 01 · მთავარი გვერდი

- `4375:10930` `D-01.1 · მთავარი` `1440x5228`

### 02 · Trade-in ვიზარდი

- `1425:964` `D-02.1 · ბრენდი` `1440x899`
- `1426:1301` `D-02.2 · მოდელი — ფილტრით` `1440x899`
- `1426:1504` `D-02.2a · მოდელი — სქროლი` `1440x1063`
- `1426:1736` `D-02.2b · ძებნა აკრეფისას` `1440x899`
- `1426:1903` `D-02.2c · ვერ მოიძებნა` `1440x899`
- `1425:1230` `D-02.3 · მეხსიერება` `1440x899`
- `1426:2047` `D-02.4 · გრეიდი არჩეული` `1440x1102`
- `1426:2291` `D-02.4a · არ ვიცი არჩეული` `1440x1102`
- `1426:2524` `D-02.5 · ნული არჩეული` `1440x902`
- `1426:2714` `D-02.5a · რამდენიმე არჩეული` `1440x902`
- `1449:2356` `D-02.6 · შეთავაზება` `1440x972`
- `1552:3340` `D-02.6a · საკონტაქტო` `1440x899`
- `1552:3508` `D-02.6b · მოთხოვნა მიღებულია` `1440x899`
- `1449:2448` `D-02.7 · თვითდიაგნოსტიკა` `1440x969`
- `1449:2572` `D-02.8 · დიაპაზონი` `1440x899`

### 03 · სერვისი და გარანტია

- `1738:3455` `D-03.1 · ცარიელი ველი` `1440x899`
- `1738:3535` `D-03.1a · შეცდომა` `1440x899`
- `1738:3615` `D-03.1b · ვერ მოიძებნა` `1440x899`
- `1745:3677` `D-03.2 · ჩანაწერების სია` `1440x899`
- `1752:3780` `D-03.3 · მოქმედებს` `1440x899`
- `1752:3971` `D-03.3a · ვადა ამოიწურა` `1440x918`
- `1752:4159` `D-03.3b · სხვა ტექნიკა` `1440x899`
- `3032:29539` `D-03.4 · ღია` `1440x899`
- `3032:29611` `D-03.4a · კვლევა` `1440x899`
- `1756:4238` `D-03.4b · მიმდინარე` `1440x919`
- `1756:4379` `D-03.4c · დასრულებული` `1440x899`
- `1756:4527` `D-03.4d · გადასახდელი` `1440x922`
- `4043:9082` `D-03.4e · გადახდა` `1440x899`
- `4236:10065` `D-03.4h · ადგილზე არჩეული` `1440x1166`

### 04 · მაღაზია

- `1777:4591` `D-04.1 · კატალოგი` `1440x1596`
- `1784:4813` `D-04.3 · ჩამოშლადი` `1440x1596`
- `1785:5063` `D-04.3a · ძებნის შედეგები` `1440x1596`
- `1785:5409` `D-04.4 · ვერაფერი მოიძებნა` `1440x1596`
- `1787:5413` `D-04.2c · როგორ ვიპოვო მოდელი` `1440x1596`
- `1792:5974` `D-04.6 · კალათა` `1440x1596`
- `1792:6268` `D-04.6a · ცარიელი კალათა` `1440x1596`
- `1799:6357` `D-04.7 · შეკვეთა` `1440x1174`
- `1810:6696` `D-04.7a · პროვაიდერი არჩეული` `1440x1174`
- `1810:6906` `D-04.7c · ტელეფონის ვალიდაცია` `1440x1199`
- `1811:7068` `D-04.7b · გადახდის შეცდომა` `1440x899`
- `1811:7192` `D-04.8 · მიღებულია` `1440x899`
- `1830:14640` `D-04.7d · შეკვეთა — ადგილზე` `1440x1040`

### 05 · შაბლონური გვერდები

- `1849:8919` `D-05.1 · წესები და პირობები` `1440x899`
- `1850:7585` `D-05.1a · წესები — გახსნილი პუნქტი` `1440x899`
- `1850:7698` `D-05.2 · კონფიდენციალურობა` `1440x899`
- `1856:7774` `D-05.3 · ჩვენ შესახებ` `1440x1018`
- `1860:7912` `D-05.4 · შეფასებები` `1440x899`
- `1863:8107` `D-05.6 · კონტაქტი` `1440x899`
- `2014:14704` `D-06.3 · შეფასება — ფორმა` (awaiting real reviews source)
- `2014:14849` `D-06.3a · შეფასება — მადლობა` (awaiting real reviews source)

## Public Mobile

### 01 · მთავარი გვერდი

- `849:1995` `M-01.1 · ნაგულისხმევი` `390x6257`
- `849:2031` `M-01.2 · მენიუ` `390x899`
- `812:1335` `M-01.3 · ბრენდის შიტი` `390x899`
- `849:2139` `M-01.6 · FAQ გახსნილი` `390x1745`

### 02 · Trade-in ვიზარდი

- `747:1074` `M-02.1 · ბრენდი` `390x899`
- `849:2175` `M-02.2 · მოდელი — ფილტრით` `390x899`
- `747:1080` `M-02.2a · მოდელი — სქროლი` `390x1105`
- `849:2211` `M-02.2b · ძებნა აკრეფისას` `390x899`
- `747:1086` `M-02.2c · ვერ მოიძებნა` `390x899`
- `747:1092` `M-02.3 · მეხსიერება` `390x899`
- `747:1098` `M-02.4 · გრეიდი არჩეული` `390x1068`
- `849:2247` `M-02.4a · არ ვიცი არჩეული` `390x1068`
- `849:2283` `M-02.5 · ნული არჩეული` `390x899`
- `747:1104` `M-02.5a · რამდენიმე არჩეული` `390x899`
- `747:1110` `M-02.6 · შეთავაზება` `390x969`
- `1550:5707` `M-02.6a · საკონტაქტო` `390x899`
- `1550:5803` `M-02.6b · მოთხოვნა მიღებულია` `390x899`
- `747:1116` `M-02.7 · თვითდიაგნოსტიკა` `390x899`
- `747:1122` `M-02.8 · დიაპაზონი` `390x899`

### 03 · სერვისი და გარანტია

- `923:2154` `M-03.1 · ცარიელი ველი` `390x899`
- `923:2172` `M-03.1a · შეცდომა` `390x899`
- `923:2190` `M-03.1b · ვერ მოიძებნა` `390x899`
- `923:2208` `M-03.2 · ჩანაწერების სია` `390x899`
- `923:2226` `M-03.3 · მოქმედებს` `390x913`
- `923:2244` `M-03.3a · ვადა ამოიწურა` `390x984`
- `978:2329` `M-03.3b · სხვა ტექნიკა` `390x913`
- `3032:28174` `M-03.4 · ღია` `390x899`
- `3032:28194` `M-03.4a · კვლევა` `390x899`
- `923:2262` `M-03.4b · მიმდინარე` `390x982`
- `923:2280` `M-03.4c · დასრულებული` `390x899`
- `928:4316` `M-03.4d · გადასახდელი` `390x972`
- `3936:7012` `M-03.4e · გადახდა` `390x899`
- `4235:10242` `M-03.4h · ადგილზე არჩეული` `390x1237`

### 04 · მაღაზია

- `1189:7061` `M-04.1 · კატალოგი` `390x1014`
- `1189:7085` `M-04.2 · ფილტრი` `390x899`
- `1189:7091` `M-04.2a · ბრენდის შიტი` `390x899`
- `1189:7097` `M-04.2b · მოდელის შიტი` `390x899`
- `1189:7103` `M-04.2c · როგორ ვიპოვო მოდელი` `390x899`
- `1189:7109` `M-04.3 · ძებნა — ცარიელი` `390x899`
- `1189:7115` `M-04.3a · ძებნის შედეგები` `390x937`
- `1189:7067` `M-04.4 · ვერაფერი მოიძებნა` `390x899`
- `1189:7073` `M-04.6a · ცარიელი კალათა` `390x899`
- `1189:7079` `M-04.7b · გადახდის შეცდომა` `390x899`

### 05 · შაბლონური გვერდები

- `1189:7157` `M-05.1 · წესები და პირობები` `390x899`
- `1189:7163` `M-05.1a · წესები — გახსნილი პუნქტი` `390x899`
- `1189:7169` `M-05.2 · კონფიდენციალურობა` `390x899`
- `1189:7175` `M-05.3 · ჩვენ შესახებ` `390x1241`
- `1189:7181` `M-05.4 · შეფასებები` `390x1112`
- `1189:7193` `M-05.6 · კონტაქტი` `390x953`

## Staff Dashboard

- `3473:6331` `SD-00.1 · შესვლა`
- `3474:6377` `SD-00.1a · შეცდომა`
- `3226:67` `SD-01.1 · დაფა`
- `3900:10690` `SD-01.M1 · შემთხვევის დეტალები`
- `3351:3436` `SD-02.1 · სია`
- `3357:602` `SD-02.1b · ცარიელი სია`
- `3357:32943` `SD-02.1c · ძებნა უშედეგოდ`
- `3365:988` `SD-02.1d · მონიშნული`
- `3385:1277` `SD-02.2 · დეტალები`
- `3387:33915` `SD-02.2a · სტატუსი და შედეგი — ჩაკეტილი`
- `3387:34074` `SD-02.2b · სტატუსი და შედეგი — გახსნილი`
- `3387:34237` `SD-02.2c · ფაილები`
- `3446:3826` `SD-03.1 · პარტნიორები — სია`
- `3452:4246` `SD-03.M1 · ახალი პარტნიორი`
- `3452:4478` `SD-03.M2 · წაშლის დადასტურება`
- `3899:42039` `SD-03.M3 · რედაქტირება`
- `3454:4675` `SD-04.1 · გარანტიები — სია`
- `3458:5366` `SD-04.2 · გარანტია — დეტალი`
- `3460:5435` `SD-04.M1 · ახალი გარანტია`
- `3460:5783` `SD-04.M1a · გარანტიის რედაქტირება`
- `3460:6116` `SD-04.M2 · წაშლის დადასტურება`
- `3893:10086` `SD-04.M3 · მოწყობილობის ისტორია`

## Shop Admin

- `2279:67` `SA-00.1 · შესვლა`
- `2282:108` `SA-00.1a · შესვლა — შეცდომა`
- `2394:1017` `SA-01.1 · Zezva — კატალოგი`
- `2395:1331` `SA-01.1a · Zezva — მონიშნული`
- `2396:1712` `SA-01.1b · Zezva — ცარიელი კატალოგი`
- `2396:2241` `SA-01.1c · Zezva — ფილტრს არაფერი ემთხვევა`
- `2398:1967` `SA-01.2 · MobileSentrix`
- `2399:2339` `SA-01.2a · სინქრონიზაციის მენიუ`
- `2401:2723` `SA-01.2b · შემოწმების შედეგი`
- `2401:3302` `SA-01.2c · სინქრონი მიმდინარეობს`
- `2402:3484` `SA-01.2d · MobileSentrix — მონიშნული`
- `2421:21848` `SA-01.2e · ყველა მონიშნული`
- `2461:4691` `SA-02.1 · შეკვეთები — სია`
- `2466:22333` `SA-02.2 · შეკვეთები — არჩეული`
- `2470:5023` `SA-02.2a · შეკვეთები — სტატუსის მენიუ`
- `2471:5189` `SA-02.3 · შეკვეთები — წაშლილი`
- `2519:8043` `SA-03.1 · Trade-in — განაცხადები`
- `2525:5338` `SA-03.1a · Trade-in — სტატუსის მენიუ`
- `3061:12409` `SA-03.1b · მონიშნული`
- `2526:5692` `SA-03.2 · Trade-in — პროდუქტები`
- `2531:6036` `SA-03.3 · Trade-in — კატეგორიები`
- `2533:6296` `SA-03.4 · Trade-in — ფასების წესები`
- `2536:6666` `SA-03.4a · Trade-in — კორექციები`
- `2555:6967` `SA-04.1 · პარამეტრები — საიტი მუშაობს`
- `2556:7019` `SA-04.1a · პარამეტრები — ტექნიკური რეჟიმი`
- `2631:28450` `SA-04.2 · პროფილის მენიუ`
- `2589:25978` `SA-M.4 · ახალი პროდუქტი`
- `2589:26098` `SA-M.5 · განაცხადის რედაქტირება`
- `2589:26225` `SA-M.6 · Trade-in პროდუქტის რედაქტირება`

## Foundations And Components

- Foundations include colors, typography, spacing, radius, grid, elevation and states.
- Components include Button, Input, Select, Checkbox, Radio, Toggle, Badge, Chip, Section header, Service card, Category card, Timeline step, FAQ row, Footer link, Partner lockup, Tabs, Avatar, Icon button, Selection row, and Grade badge.

## Implementation Order

1. Foundations and reusable shell/components.
2. Public Home desktop and mobile.
3. Public Trade-in wizard desktop and mobile, all states.
4. Public Warranty/Service search desktop and mobile, all states.
5. Public Shop desktop and mobile, all states.
6. Staff Dashboard screens.
7. Shop Admin screens.
