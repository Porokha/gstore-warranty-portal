// Zezva Trade — translations
// Usage: T('key') returns the string for the current language
// Language is stored in localStorage as 'zt_lang' ('en' or 'ka')

var ZT_TRANSLATIONS = {
  en: {
    nav_sell_device: 'Sell a Device',
    nav_home: 'Home',
    nav_back_to_home: '← Back to home',

    home_heading: 'Selling made simple',
    home_subheading: 'Select a category to get your free quote.',
    badge_coming_soon: 'Coming Soon',

    browse_heading: 'Browse Devices',
    browse_subheading: 'Select a brand to see available models',
    browse_search_placeholder: 'Search for your device…',
    browse_search_clear: 'Clear',
    browse_back_all_brands: 'All brands',
    browse_back_all_series: 'All series',
    browse_breadcrumb_all: 'All Devices',
    browse_price_prefix: 'Up to',
    browse_count_model: 'model',
    browse_count_models: 'models available',
    browse_count_brand: 'brand',
    browse_count_brands: 'brands available',
    browse_count_series: 'series available',
    browse_empty_no_brands: 'No brands found.',
    browse_empty_no_products: 'No products found.',
    browse_empty_no_results_search: 'No products found. Try a different search.',
    browse_error_load: 'Could not load. Please try again.',
    browse_loading: 'Loading…',

    product_loading: 'Loading product…',
    product_not_found: 'Product not found.',
    widget_select_option: 'Please select one of the following options',
    widget_filter_placeholder: 'Type here to filter…',
    btn_back: 'Back',
    btn_next_step: 'Next Step',

    offer_label: 'Your device is worth up to',
    btn_get_offer: 'Get This Offer',
    btn_change_answers: 'Change Answers',
    offer_summary_heading: 'Your Offer',
    offer_step_shipping: 'Free prepaid shipping label provided',
    offer_step_payment: 'Payment processed within 24 hours',
    offer_step_lock: 'Offer locked in for 10 days',
    why_sell_heading: 'Why sell with Zezva Trade?',
    why_sell_shipping: 'Free shipping label — no cost to you',
    why_sell_payment: 'Fast payment within 24 hours of receipt',
    why_sell_secure: 'Secure, encrypted, eco-friendly process',
    why_sell_lock: 'Price lock guarantee for 10 days',

    modal_heading: 'Claim Your Offer',
    modal_price_label: 'guaranteed',
    modal_form_hint: 'Enter your details, we\'ll confirm your offer and send you instructions.',
    form_label_name: 'Your Name',
    form_placeholder_name: 'John Smith',
    form_label_email: 'Email Address',
    form_placeholder_email: 'you@example.com',
    form_label_phone: 'Phone (optional)',
    form_placeholder_phone: '+995 000 000 000',
    btn_confirm_offer: 'Confirm & Send Offer',
    btn_skip: 'Skip',
    btn_sending: 'Sending…',
    err_email_required: 'Please enter your email address.',
    err_email_invalid: 'Please enter a valid email address.',
    modal_success_heading: 'You\'re all set!',
    modal_success_body: 'Your offer has been saved. Check your email for confirmation and shipping instructions.',
    btn_back_to_home: 'Back to Home',

    footer_text: 'Sell electronics with confidence',
  },
  ka: {
    nav_sell_device: 'ნივთის გაყიდვა',
    nav_home: 'მთავარი',
    nav_back_to_home: '← მთავარზე დაბრუნება',

    home_heading: 'გაყიდვა — მარტივად',
    home_subheading: 'აირჩიეთ კატეგორია შეფასებისთვის.',
    badge_coming_soon: 'მალე',

    browse_heading: 'მოწყობილობების არჩევა',
    browse_subheading: 'აირჩიეთ ბრენდი მოდელების სანახავად',
    browse_search_placeholder: 'მოძებნეთ თქვენი მოწყობილობა…',
    browse_search_clear: 'გასუფთავება',
    browse_back_all_brands: 'ყველა ბრენდი',
    browse_back_all_series: 'ყველა სერია',
    browse_breadcrumb_all: 'ყველა მოწყობილობა',
    browse_price_prefix: 'მაქს.',
    browse_count_model: 'მოდელი',
    browse_count_models: 'მოდელი ხელმისაწვდომია',
    browse_count_brand: 'ბრენდი',
    browse_count_brands: 'ბრენდი ხელმისაწვდომია',
    browse_count_series: 'სერია ხელმისაწვდომია',
    browse_empty_no_brands: 'ბრენდები ვერ მოიძებნა.',
    browse_empty_no_products: 'პროდუქტები ვერ მოიძებნა.',
    browse_empty_no_results_search: 'პროდუქტები ვერ მოიძებნა. სცადეთ სხვა საძიებო სიტყვა.',
    browse_error_load: 'ჩატვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ ხელახლა.',
    browse_loading: 'იტვირთება…',

    product_loading: 'პროდუქტი იტვირთება…',
    product_not_found: 'პროდუქტი ვერ მოიძებნა.',
    widget_select_option: 'გთხოვთ, აირჩიოთ ერთ-ერთი ვარიანტი',
    widget_filter_placeholder: 'ჩაწერეთ გასაფილტრად…',
    btn_back: 'უკან',
    btn_next_step: 'შემდეგი',

    offer_label: 'თქვენი მოწყობილობის ღირებულებაა',
    btn_get_offer: 'შეთავაზების მიღება',
    btn_change_answers: 'პასუხების შეცვლა',
    offer_summary_heading: 'თქვენი შეთავაზება',
    offer_step_shipping: 'უფასო ლეიბლი',
    offer_step_payment: 'გადახდა 24 საათში',
    offer_step_lock: 'შეთავაზება ძალაშია 10 დღის განმავლობაში',
    why_sell_heading: 'რატომ უნდა გაყიდოთ Zezva Trade-ით?',
    why_sell_shipping: 'ტრანსპორტირების ლეიბლი — არავითარი ხარჯი',
    why_sell_payment: 'სწრაფი გადახდა მიღებიდან 24 საათში',
    why_sell_secure: 'უსაფრთხო პროცესი',
    why_sell_lock: 'ფასის გარანტია 10 დღის განმავლობაში',

    modal_heading: 'შეთავაზების დადასტურება',
    modal_price_label: 'გარანტირებული',
    modal_form_hint: 'შეიყვანეთ თქვენი მონაცემები, ჩვენ დავადასტურებთ შეთავაზებას და მოგაწვდით შემდგომ ინსტრუქციებს.',
    form_label_name: 'თქვენი სახელი',
    form_placeholder_name: 'გიორგი მამარდაშვილი',
    form_label_email: 'ელ-ფოსტის მისამართი',
    form_placeholder_email: 'თქვენი@მაგალითი.ge',
    form_label_phone: 'ტელეფონი (სურვილისამებრ)',
    form_placeholder_phone: '+995 555 000 000',
    btn_confirm_offer: 'დადასტურება და გაგზავნა',
    btn_skip: 'გამოტოვება',
    btn_sending: 'იგზავნება…',
    err_email_required: 'გთხოვთ, შეიყვანოთ ელ-ფოსტის მისამართი.',
    err_email_invalid: 'გთხოვთ, შეიყვანოთ სწორი ელ-ფოსტის მისამართი.',
    modal_success_heading: 'ყველაფერი მზადაა!',
    modal_success_body: 'თქვენი შეთავაზება შენახულია. შეამოწმეთ ელ-ფოსტა დადასტურებისა და შემდგომი ინსტრუქციებისთვის.',
    btn_back_to_home: 'მთავარზე დაბრუნება',

    footer_text: 'გაყიდეთ თქვენი ნივთი სწრაფად და მარტივად',
  }
};

var ZT_QUERY_LANG = (new URLSearchParams(window.location.search)).get('lang');
var ZT_LANG = ZT_QUERY_LANG === 'ka' || ZT_QUERY_LANG === 'en'
  ? ZT_QUERY_LANG
  : (localStorage.getItem('zt_lang') === 'ka' ? 'ka' : 'en');

function T(key) {
  return (ZT_TRANSLATIONS[ZT_LANG] && ZT_TRANSLATIONS[ZT_LANG][key]) ||
         (ZT_TRANSLATIONS.en[key]) || key;
}

function ztSetLang(lang) {
  ZT_LANG = lang === 'ka' ? 'ka' : 'en';
  localStorage.setItem('zt_lang', ZT_LANG);
  location.reload();
}
