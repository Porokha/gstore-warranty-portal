import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import StaffLayout from './components/common/StaffLayout';
import PublicLayout from './components/common/PublicLayout';
import LoginPage from './pages/staff/LoginPage';
import DashboardPage from './pages/staff/DashboardPage';
import MyCasesPage from './pages/staff/MyCasesPage';
import CasesPage from './pages/staff/CasesPage';
import ClosedCasesPage from './pages/staff/ClosedCasesPage';
import CaseDetailPage from './pages/staff/CaseDetailPage';
import CreateCasePage from './pages/staff/CreateCasePage';
import WarrantiesPage from './pages/staff/WarrantiesPage';
import WarrantyDetailPage from './pages/staff/WarrantyDetailPage';
import WarrantyEditPage from './pages/staff/WarrantyEditPage';
import CreateWarrantyPage from './pages/staff/CreateWarrantyPage';
import FinancePage from './pages/staff/FinancePage';
import SettingsPage from './pages/staff/SettingsPage';
import AuditPage from './pages/staff/AuditPage';
import StatisticsPage from './pages/staff/StatisticsPage';
import ImportPage from './pages/staff/ImportPage';
import PublicHomePage from './pages/public/PublicHomePage';
import WarrantySearchPage from './pages/public/WarrantySearchPage';
import CaseSearchPage from './pages/public/CaseSearchPage';
import ShopPage from './pages/public/ShopPage';
import TermsPage from './pages/public/TermsPage';
import PrivacyPage from './pages/public/PrivacyPage';
import ReviewsPage from './pages/public/ReviewsPage';
import MaintenancePage from './pages/public/MaintenancePage';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import StaffRoleRoute from './components/common/StaffRoleRoute';
import ShopAdminRoute from './components/common/ShopAdminRoute';
import ShopAdminLayout from './components/common/ShopAdminLayout';
import ShopAdminLoginPage from './pages/shop-admin/ShopAdminLoginPage';
import ShopAdminProductsPage from './pages/shop-admin/ShopAdminProductsPage';
import ShopAdminOrdersPage from './pages/shop-admin/ShopAdminOrdersPage';
import ShopAdminSettingsPage from './pages/shop-admin/ShopAdminSettingsPage';
import { useQuery } from 'react-query';
import { shopService } from './services/shopService';

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
        <Routes>
          {/* Public Routes */}
          {isPublicMaintenanceMode ? (
            <>
              <Route path="/" element={<MaintenancePage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/warranty-service" element={<Navigate to="/maintenance" replace />} />
              <Route path="/terms" element={<Navigate to="/maintenance" replace />} />
              <Route path="/privacy" element={<Navigate to="/maintenance" replace />} />
              <Route path="/reviews" element={<Navigate to="/maintenance" replace />} />
              <Route path="/search/warranty" element={<Navigate to="/maintenance" replace />} />
              <Route path="/search/case" element={<Navigate to="/maintenance" replace />} />
            </>
          ) : (
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<ShopPage />} />
              <Route path="warranty-service" element={<PublicHomePage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="search/warranty" element={<WarrantySearchPage />} />
              <Route path="search/case" element={<CaseSearchPage />} />
            </Route>
          )}

          <Route path="/preview" element={<PrivateRoute />}>
            <Route element={<PublicLayout />}>
              <Route index element={<ShopPage />} />
              <Route path="warranty-service" element={<PublicHomePage />} />
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
              <Route path="warranties" element={<WarrantiesPage />} />
              <Route path="warranties/:id" element={<WarrantyDetailPage />} />
              <Route element={<StaffRoleRoute allowedRoles={['admin']} />}>
                <Route path="warranties/:id/edit" element={<WarrantyEditPage />} />
                <Route path="warranties/new" element={<CreateWarrantyPage />} />
                <Route path="import" element={<ImportPage />} />
                <Route path="finance" element={<FinancePage />} />
                <Route path="statistics" element={<StatisticsPage />} />
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
              <Route path="settings" element={<ShopAdminSettingsPage />} />
            </Route>
          </Route>

          <Route
            path="*"
            element={<Navigate to={isPublicMaintenanceMode ? '/maintenance' : '/'} replace />}
          />
        </Routes>
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
