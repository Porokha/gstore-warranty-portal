import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import StaffRoleRoute from './components/common/StaffRoleRoute';
import ShopAdminRoute from './components/common/ShopAdminRoute';
import { useQuery } from 'react-query';
import { shopService } from './services/shopService';

const StaffLayout = lazy(() => import('./components/common/StaffLayout'));
const PublicLayout = lazy(() => import('./components/common/PublicLayout'));
const LoginPage = lazy(() => import('./pages/staff/LoginPage'));
const DashboardPage = lazy(() => import('./pages/staff/DashboardPage'));
const MyCasesPage = lazy(() => import('./pages/staff/MyCasesPage'));
const CasesPage = lazy(() => import('./pages/staff/CasesPage'));
const ClosedCasesPage = lazy(() => import('./pages/staff/ClosedCasesPage'));
const CaseDetailPage = lazy(() => import('./pages/staff/CaseDetailPage'));
const CreateCasePage = lazy(() => import('./pages/staff/CreateCasePage'));
const PartnersPage = lazy(() => import('./pages/staff/PartnersPage'));
const WarrantiesPage = lazy(() => import('./pages/staff/WarrantiesPage'));
const WarrantyDetailPage = lazy(() => import('./pages/staff/WarrantyDetailPage'));
const WarrantyEditPage = lazy(() => import('./pages/staff/WarrantyEditPage'));
const CreateWarrantyPage = lazy(() => import('./pages/staff/CreateWarrantyPage'));
const FinancePage = lazy(() => import('./pages/staff/FinancePage'));
const SettingsPage = lazy(() => import('./pages/staff/SettingsPage'));
const AuditPage = lazy(() => import('./pages/staff/AuditPage'));
const StatisticsPage = lazy(() => import('./pages/staff/StatisticsPage'));
const ImportPage = lazy(() => import('./pages/staff/ImportPage'));
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const PublicHomePage = lazy(() => import('./pages/public/PublicHomePage'));
const WarrantySearchPage = lazy(() => import('./pages/public/WarrantySearchPage'));
const CaseSearchPage = lazy(() => import('./pages/public/CaseSearchPage'));
const ShopPage = lazy(() => import('./pages/public/ShopPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'));
const ReviewsPage = lazy(() => import('./pages/public/ReviewsPage'));
const TradeInPage = lazy(() => import('./pages/public/TradeInPage'));
const MaintenancePage = lazy(() => import('./pages/public/MaintenancePage'));
const ShopAdminLayout = lazy(() => import('./components/common/ShopAdminLayout'));
const ShopAdminLoginPage = lazy(() => import('./pages/shop-admin/ShopAdminLoginPage'));
const ShopAdminProductsPage = lazy(() => import('./pages/shop-admin/ShopAdminProductsPage'));
const ShopAdminOrdersPage = lazy(() => import('./pages/shop-admin/ShopAdminOrdersPage'));
const ShopAdminSettingsPage = lazy(() => import('./pages/shop-admin/ShopAdminSettingsPage'));
const ShopAdminTradeInPage = lazy(() => import('./pages/shop-admin/ShopAdminTradeInPage'));

const PageFallback = () => null;

const queryClient = new QueryClient();
const buildTimePublicMaintenanceMode = process.env.REACT_APP_PUBLIC_MAINTENANCE_MODE === 'true';

const theme = createTheme({
  palette: {
    primary: {
      main: '#A576FF',
      light: '#D4BEFE',
      dark: '#8F5EF0',
      contrastText: '#111111',
    },
    secondary: {
      main: '#000000',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FBF9FF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#18181B',
      secondary: '#5B5568',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"BPG Banner Quadrosquare", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      fontFamily: '"BPG Banner Quadrosquare Caps", sans-serif',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function AppRoutes() {
  const { data: publicFlags } = useQuery(
    ['public-flags'],
    () => shopService.getPublicFlags(),
    {
      initialData: { public_maintenance_mode: false },
      staleTime: 30000,
      refetchInterval: 60000,
      refetchOnWindowFocus: true,
    }
  );

  const isPublicMaintenanceMode =
    typeof publicFlags?.public_maintenance_mode === 'boolean'
      ? publicFlags.public_maintenance_mode
      : buildTimePublicMaintenanceMode;

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public Routes */}
            {isPublicMaintenanceMode ? (
              <>
                <Route path="/" element={<MaintenancePage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/shop" element={<Navigate to="/maintenance" replace />} />
                <Route path="/warranty-service" element={<Navigate to="/maintenance" replace />} />
                <Route path="/trade-in" element={<Navigate to="/maintenance" replace />} />
                <Route path="/terms" element={<Navigate to="/maintenance" replace />} />
                <Route path="/privacy" element={<Navigate to="/maintenance" replace />} />
                <Route path="/reviews" element={<Navigate to="/maintenance" replace />} />
                <Route path="/search/warranty" element={<Navigate to="/maintenance" replace />} />
                <Route path="/search/case" element={<Navigate to="/maintenance" replace />} />
              </>
            ) : (
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="warranty-service" element={<PublicHomePage />} />
                <Route path="trade-in" element={<TradeInPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="search/warranty" element={<WarrantySearchPage />} />
                <Route path="search/case" element={<CaseSearchPage />} />
              </Route>
            )}

            <Route path="/preview" element={<PrivateRoute />}>
              <Route element={<PublicLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="warranty-service" element={<PublicHomePage />} />
                <Route path="trade-in" element={<TradeInPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="search/warranty" element={<WarrantySearchPage />} />
                <Route path="search/case" element={<CaseSearchPage />} />
              </Route>
            </Route>

            {/* Staff Routes */}
            <Route path="/staff/login" element={<LoginPage />} />
            <Route path="/staff" element={<PrivateRoute />}>
              <Route element={<StaffLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route element={<StaffRoleRoute allowedRoles={['technician']} />}>
                  <Route path="my-cases" element={<MyCasesPage />} />
                </Route>
                <Route path="cases" element={<CasesPage />} />
                <Route path="cases/closed" element={<ClosedCasesPage />} />
                <Route path="cases/new" element={<CreateCasePage />} />
                <Route path="cases/:id" element={<CaseDetailPage />} />
                <Route path="partners" element={<PartnersPage />} />
                <Route path="warranties" element={<WarrantiesPage />} />
                <Route path="warranties/:id" element={<WarrantyDetailPage />} />
                <Route element={<StaffRoleRoute allowedRoles={['admin', 'manager']} />}>
                  <Route path="warranties/:id/edit" element={<WarrantyEditPage />} />
                  <Route path="warranties/new" element={<CreateWarrantyPage />} />
                  <Route path="finance" element={<FinancePage />} />
                  <Route path="statistics" element={<StatisticsPage />} />
                </Route>
                <Route element={<StaffRoleRoute allowedRoles={['admin']} />}>
                  <Route path="import" element={<ImportPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="audit" element={<AuditPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="/shop/admin/login" element={<ShopAdminLoginPage />} />
            <Route path="/shop/admin" element={<ShopAdminRoute />}>
              <Route element={<ShopAdminLayout />}>
                <Route index element={<Navigate to="/shop/admin/products" replace />} />
                <Route path="products" element={<ShopAdminProductsPage />} />
                <Route path="orders" element={<ShopAdminOrdersPage />} />
                <Route path="trade-in" element={<ShopAdminTradeInPage />} />
                <Route path="settings" element={<ShopAdminSettingsPage />} />
              </Route>
            </Route>

            <Route
              path="*"
              element={<Navigate to={isPublicMaintenanceMode ? '/maintenance' : '/'} replace />}
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRoutes />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
