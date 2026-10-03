import { lazy, Suspense, type ReactElement } from 'react';
import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Login from '../login/Login';

const MainLayout = lazy(() => import('../main-layout/MainLayout'));
const AuthGuard = lazy(() => import('../auth-guard/AuthGuard'));
const SidebarProvider = lazy(() =>
  import('../context/SidebarContext').then((m) => ({ default: m.SidebarProvider }))
);
const BillingLayout = lazy(() => import('../billing/BillingLayout'));
const ModuleAccessGuard = lazy(() => import('../billing/components/ModuleAccessGuard'));
const DefaultAppRedirect = lazy(() =>
  import('../billing/components/ModuleAccessGuard').then((m) => ({ default: m.DefaultAppRedirect }))
);
const CreateUserPage = lazy(() => import('../billing/pages/users/CreateUserPage'));
const ModulePermissionPage = lazy(() => import('../billing/pages/users/PermissionPage'));
const ChangePasswordPage = lazy(() => import('../billing/pages/users/ChangePasswordPage'));
const CompanyDetailsPage = lazy(() => import('../billing/pages/admin/CompanyDetailsPage'));
const MedicineTypePage = lazy(() =>
  import('../billing/pages/master/NamedMasterPage').then((m) => ({ default: m.MedicineTypePage }))
);
const UnitPage = lazy(() =>
  import('../billing/pages/master/NamedMasterPage').then((m) => ({ default: m.UnitPage }))
);
const GenericNamePage = lazy(() =>
  import('../billing/pages/master/NamedMasterPage').then((m) => ({ default: m.GenericNamePage }))
);
const MedicinePage = lazy(() => import('../billing/pages/master/MedicinePage'));
const BatchPage = lazy(() => import('../billing/pages/master/BatchPage'));
const SupplierPage = lazy(() => import('../billing/pages/master/SupplierPage'));
const PurchaseOrderPage = lazy(() => import('../billing/pages/purchase/PurchaseOrderPage'));
const ApprovePage = lazy(() => import('../billing/pages/purchase/ApprovePage'));
const PurchaseEntryPage = lazy(() => import('../billing/pages/purchase/PurchaseEntryPage'));
const PurchaseReturnPage = lazy(() => import('../billing/pages/purchase/PurchaseReturnPage'));
const PurchaseReportPage = lazy(() => import('../billing/pages/purchase/PurchaseReportPage'));
const PurchaseReturnReportPage = lazy(() => import('../billing/pages/purchase/PurchaseReturnReportPage'));
const SupplierPurchasePage = lazy(() => import('../billing/pages/purchase/SupplierPurchasePage'));
const StockPage = lazy(() => import('../billing/pages/purchase/StockPage'));
const StockTxnPage = lazy(() => import('../billing/pages/purchase/StockTxnPage'));

const guard = (element: ReactElement) => <AuthGuard component={element} />;

const AppRouter = () => {
  return (
    <Router>
      <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            element={guard(
              <SidebarProvider>
                <MainLayout />
              </SidebarProvider>
            )}
          >
            <Route path="/app" element={<BillingLayout />}>
              <Route path="users/change-password" element={<ChangePasswordPage />} />
              <Route element={<ModuleAccessGuard />}>
                <Route path="users/create" element={<CreateUserPage />} />
                <Route path="users/permission" element={<ModulePermissionPage />} />
                <Route path="admin/company-details" element={<CompanyDetailsPage />} />
                <Route path="master/medicine-type" element={<MedicineTypePage />} />
                <Route path="master/unit" element={<UnitPage />} />
                <Route path="master/generic" element={<GenericNamePage />} />
                <Route path="master/medicine" element={<MedicinePage />} />
                <Route path="master/batch" element={<BatchPage />} />
                <Route path="master/supplier" element={<SupplierPage />} />
                <Route path="purchase/order" element={<PurchaseOrderPage />} />
                <Route path="purchase/approve" element={<ApprovePage />} />
                <Route path="purchase/entry" element={<PurchaseEntryPage />} />
                <Route path="purchase/return" element={<PurchaseReturnPage />} />
                <Route path="purchase/purchase-report" element={<PurchaseReportPage />} />
                <Route path="purchase/return-report" element={<PurchaseReturnReportPage />} />
                <Route path="purchase/supplier-wise" element={<SupplierPurchasePage />} />
                <Route path="stock-report/stock" element={<StockPage />} />
                <Route path="stock-report/stock-transaction" element={<StockTxnPage />} />
              </Route>
              <Route index element={<DefaultAppRedirect />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;
