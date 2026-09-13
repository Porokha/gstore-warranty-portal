import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowForwardRounded as ArrowForwardIcon,
  AutorenewRounded as TradeIcon,
  BuildRounded as ServiceIcon,
  CheckCircleRounded as CheckIcon,
  Inventory2Rounded as PartsIcon,
  LocalShippingRounded as ShippingIcon,
  SearchRounded as SearchIcon,
  ShieldRounded as WarrantyIcon,
  ShoppingBagRounded as ShopIcon,
  StarRounded as StarIcon,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const processSteps = [
  ['01', SearchIcon, 'select', 'აირჩიე მოწყობილობა', 'მიუთითე მოდელი, მეხსიერება და მდგომარეობა.'],
  ['02', PartsIcon, 'diagnose', 'მიიღე ზუსტი შეფასება', 'სერვისი, გარანტია და დეტალები ერთ სივრცეშია.'],
  ['03', ShippingIcon, 'complete', 'დაასრულე სწრაფად', 'შეკვეთას ან ქეისს სტატუსით ადევნებ თვალს.'],
];

const serviceCards = [
  [
    ShopIcon,
    '/shop',
    'shop',
    'მაღაზია',
    'სმარტფონებისა და ლეპტოპების ნაწილები, სერვისთან ერთად შეკვეთის შესაძლებლობით.',
  ],
  [
    WarrantyIcon,
    '/warranty-service?tab=warranty',
    'warranty',
    'გარანტია',
    'შეამოწმე მოწყობილობის გარანტია ნომრით, ტელეფონით ან პირადი მონაცემებით.',
  ],
  [
    ServiceIcon,
    '/warranty-service?tab=case',
    'service',
    'სერვისი',
    'აკონტროლე სერვის ქეისის სტატუსი და მიიღე განახლებები გამჭვირვალედ.',
  ],
  [
    TradeIcon,
    '/trade-in',
    'tradeIn',
    'Trade-in',
    'აირჩიე მოწყობილობა, უპასუხე კითხვებს და მიიღე სავარაუდო შეთავაზება.',
  ],
];

const faqItems = [
  ['0', 'როგორ შევამოწმო გარანტია?', 'გადადით Warranty | Service გვერდზე და აირჩიეთ გარანტიის ძებნის ჩანართი.'],
  ['1', 'შემიძლია ნაწილების შეძენა სერვისთან ერთად?', 'დიახ, მაღაზიაში პროდუქტის შეკვეთისას შეგიძლიათ აირჩიოთ სერვისთან ერთად ყიდვა.'],
  ['2', 'Trade-in შეთავაზება საბოლოოა?', 'ონლაინ მიღებული შეთავაზება სავარაუდოა და საბოლოოდ დასტურდება მოწყობილობის შემოწმების შემდეგ.'],
];

const useCopy = () => {
  const { t } = useTranslation();
  return (key, fallback) => t(key, { defaultValue: fallback });
};

const LandingPage = () => {
  const copy = useCopy();

  return (
    <Box component="main" className="zzv-redesign-shell" sx={{ overflow: 'hidden' }}>
      <Box
        component="section"
        sx={{
          position: 'relative',
          minHeight: { xs: 'calc(100svh - 64px)', md: 'calc(100svh - 72px)' },
          display: 'flex',
          alignItems: 'center',
          py: { xs: 8, md: 10 },
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.34,
            backgroundImage:
              'linear-gradient(rgba(165,118,254,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(165,118,254,0.14) 1px, transparent 1px)',
            backgroundSize: { xs: '34px 34px', md: '52px 52px' },
            maskImage: 'linear-gradient(90deg, transparent, #000 18%, #000 76%, transparent)',
          }}
        />
        <Box className="zzv-container" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 420px' },
              alignItems: 'center',
              gap: { xs: 5, lg: 8 },
            }}
          >
            <Box sx={{ maxWidth: 760 }}>
              <Typography className="zzv-kicker" sx={{ mb: 2 }}>
                {copy('public.landing.hero.kicker', 'ZEZVA SERVICE ECOSYSTEM')}
              </Typography>
              <Typography component="h1" className="zzv-title-xl">
                {copy('public.landing.hero.title', 'სერვისი, გარანტია და ნაწილები ერთ გამართულ სივრცეში')}
              </Typography>
              <Typography
                className="zzv-text"
                sx={{ maxWidth: 620, mt: { xs: 2.5, md: 3 }, fontSize: { xs: 15, md: 18 } }}
              >
                {copy(
                  'public.landing.hero.text',
                  'შეამოწმე გარანტია, მოძებნე სერვის ქეისი, შეუკვეთე ნაწილი ან დაიწყე Trade-in შეფასება სწრაფად და გამჭვირვალედ.'
                )}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: { xs: 3, md: 4 } }}>
                <Box component={Link} to="/trade-in" className="zzv-button">
                  {copy('public.landing.hero.primary', 'შეფასების დაწყება')}
                  <ArrowForwardIcon sx={{ fontSize: 18 }} />
                </Box>
                <Box
                  component={Link}
                  to="/warranty-service"
                  className="zzv-button"
                  sx={{
                    color: 'var(--zzv-color-ink)',
                    background: 'rgba(255,255,255,0.86)',
                    border: '1px solid var(--zzv-color-border)',
                    boxShadow: 'none',
                  }}
                >
                  {copy('public.landing.hero.secondary', 'სტატუსის შემოწმება')}
                </Box>
              </Box>
            </Box>

            <Box className="zzv-card" sx={{ p: { xs: 2.5, sm: 3 }, display: 'grid', gap: 1.5 }}>
              {serviceCards.map(([Icon, to, key, fallbackTitle, fallbackText]) => (
                <Box
                  key={key}
                  component={Link}
                  to={to}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '44px 1fr auto',
                    gap: 1.5,
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: '18px',
                    border: '1px solid rgba(165,118,254,0.16)',
                    color: 'inherit',
                    textDecoration: 'none',
                    background: 'rgba(255,255,255,0.74)',
                    transition: 'transform 160ms ease, border-color 160ms ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      borderColor: 'rgba(165,118,254,0.42)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '14px',
                      background: 'var(--zzv-color-primary-soft)',
                      color: 'var(--zzv-color-primary-deep)',
                    }}
                  >
                    <Icon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontFamily: 'var(--zzv-font-caps)', fontSize: 15, lineHeight: 1.15 }}>
                      {copy(`public.landing.services.${key}.title`, fallbackTitle)}
                    </Typography>
                    <Typography sx={{ color: 'var(--zzv-color-muted)', fontSize: 11, mt: 0.35, lineHeight: 1.35 }}>
                      {copy(`public.landing.services.${key}.text`, fallbackText)}
                    </Typography>
                  </Box>
                  <ArrowForwardIcon sx={{ fontSize: 18, color: 'var(--zzv-color-primary)' }} />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 }, background: '#ffffff' }}>
        <Box className="zzv-container">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, alignItems: 'end', mb: 4 }}>
            <Typography component="h2" className="zzv-title-lg">
              {copy('public.landing.process.title', 'როგორ ვმუშაობთ')}
            </Typography>
            <Box component={Link} to="/trade-in" className="zzv-button" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
              {copy('public.landing.process.cta', 'დაიწყე შეფასება')}
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {processSteps.map(([number, Icon, key, fallbackTitle, fallbackText]) => (
              <Box
                key={number}
                className="zzv-card"
                sx={{
                  minHeight: 300,
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'none',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8f4ff 100%)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Typography sx={{ fontFamily: 'var(--zzv-font-caps)', fontSize: 34, color: 'var(--zzv-color-primary)' }}>
                    {number}
                  </Typography>
                  <Box sx={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 16, bgcolor: '#fff' }}>
                    <Icon sx={{ color: 'var(--zzv-color-primary-deep)' }} />
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: 'var(--zzv-font-caps)', fontSize: 20, mb: 1 }}>
                    {copy(`public.landing.process.${key}.title`, fallbackTitle)}
                  </Typography>
                  <Typography className="zzv-text" sx={{ fontSize: 14 }}>
                    {copy(`public.landing.process.${key}.text`, fallbackText)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Box className="zzv-container">
          <Typography component="h2" className="zzv-title-lg" sx={{ mb: 4 }}>
            {copy('public.landing.services.title', 'ჩვენი სერვისები')}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
            {serviceCards.map(([Icon, to, key, fallbackTitle, fallbackText]) => (
              <Box
                key={key}
                component={Link}
                to={to}
                className="zzv-card"
                sx={{
                  minHeight: 220,
                  p: 2.5,
                  color: 'inherit',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'none',
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 'var(--zzv-shadow-card)',
                  },
                }}
              >
                <Icon sx={{ fontSize: 32, color: 'var(--zzv-color-primary)' }} />
                <Box>
                  <Typography sx={{ fontFamily: 'var(--zzv-font-caps)', fontSize: 22, mb: 1 }}>
                    {copy(`public.landing.services.${key}.title`, fallbackTitle)}
                  </Typography>
                  <Typography className="zzv-text" sx={{ fontSize: 13 }}>
                    {copy(`public.landing.services.${key}.text`, fallbackText)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 }, background: '#ffffff' }}>
        <Box className="zzv-container">
          <Box
            className="zzv-card"
            sx={{
              p: { xs: 3, md: 5 },
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 360px' },
              gap: 4,
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography className="zzv-kicker" sx={{ mb: 1.5 }}>
                {copy('public.landing.status.kicker', 'STATUS CHECK')}
              </Typography>
              <Typography component="h2" className="zzv-title-lg">
                {copy('public.landing.status.title', 'შეამოწმე გარანტია ან სერვის ქეისი')}
              </Typography>
              <Typography className="zzv-text" sx={{ mt: 2 }}>
                {copy('public.landing.status.text', 'ერთი გვერდიდან მოძებნე გარანტიის ჩანაწერი ან სერვისის მიმდინარე სტატუსი.')}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Box component={Link} to="/warranty-service?tab=warranty" className="zzv-button">
                {copy('public.landing.status.warranty', 'გარანტიის ძებნა')}
              </Box>
              <Box component={Link} to="/warranty-service?tab=case" className="zzv-button" sx={{ background: 'var(--zzv-color-ink)', boxShadow: 'none' }}>
                {copy('public.landing.status.case', 'ქეისის ძებნა')}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Box className="zzv-container">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            <Box className="zzv-card" sx={{ p: { xs: 3, md: 4 }, minHeight: 330 }}>
              <ShopIcon sx={{ color: 'var(--zzv-color-primary)', fontSize: 34, mb: 3 }} />
              <Typography component="h2" className="zzv-title-lg">
                {copy('public.landing.shop.title', 'მაღაზია სერვისთან ერთად')}
              </Typography>
              <Typography className="zzv-text" sx={{ mt: 2, mb: 3 }}>
                {copy('public.landing.shop.text', 'შეუკვეთე ნაწილი, დაამატე კალათაში და დაგეგმე სერვისი პირდაპირ შეკვეთის პროცესში.')}
              </Typography>
              <Box component={Link} to="/shop" className="zzv-button">
                {copy('public.menuShop', 'მაღაზია')}
              </Box>
            </Box>
            <Box className="zzv-card" sx={{ p: { xs: 3, md: 4 }, minHeight: 330, background: '#202020', color: '#fff' }}>
              <StarIcon sx={{ color: '#f8d56b', fontSize: 34, mb: 3 }} />
              <Typography component="h2" className="zzv-title-lg" sx={{ color: '#fff' }}>
                {copy('public.landing.reviews.title', 'რას ამბობენ მომხმარებლები')}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.72)', mt: 2, mb: 3, lineHeight: 1.55 }}>
                {copy('public.landing.reviews.text', 'დატოვე შეფასება ან ნახე მომხმარებლების გამოცდილება სერვისზე, გარანტიასა და Trade-in-ზე.')}
              </Typography>
              <Box component={Link} to="/reviews" className="zzv-button">
                {copy('public.menuReviews', 'შეფასება')}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 }, background: '#ffffff' }}>
        <Box className="zzv-container">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.8fr 1.2fr' }, gap: 4 }}>
            <Box>
              <Typography className="zzv-kicker" sx={{ mb: 1.5 }}>
                {copy('public.landing.gstore.kicker', 'PARTNER NETWORK')}
              </Typography>
              <Typography component="h2" className="zzv-title-lg">
                {copy('public.landing.gstore.title', 'GStore-ის პარტნიორი სერვის ეკოსისტემა')}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {[
                copy('public.landing.gstore.points.0', 'გარანტიის ჩანაწერები და სერვის ქეისები ერთ სისტემაშია.'),
                copy('public.landing.gstore.points.1', 'მომხმარებელი სტატუსს თვითონ ამოწმებს.'),
                copy('public.landing.gstore.points.2', 'სერვის ცენტრი იღებს საჭირო კონტექსტს და სწრაფად რეაგირებს.'),
              ].map((point) => (
                <Box key={point} sx={{ display: 'flex', gap: 1.25, alignItems: 'start' }}>
                  <CheckIcon sx={{ color: 'var(--zzv-color-success)', fontSize: 22, mt: 0.1 }} />
                  <Typography className="zzv-text">{point}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Box className="zzv-container">
          <Typography component="h2" className="zzv-title-lg" sx={{ mb: 3 }}>
            {copy('public.landing.faq.title', 'ხშირი კითხვები')}
          </Typography>
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {faqItems.map(([key, fallbackQuestion, fallbackAnswer]) => (
              <Box key={key} className="zzv-card" sx={{ p: { xs: 2.25, md: 3 }, boxShadow: 'none' }}>
                <Typography sx={{ fontFamily: 'var(--zzv-font-caps)', fontSize: 18, mb: 1 }}>
                  {copy(`public.landing.faq.${key}.question`, fallbackQuestion)}
                </Typography>
                <Typography className="zzv-text" sx={{ fontSize: 14 }}>
                  {copy(`public.landing.faq.${key}.answer`, fallbackAnswer)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
