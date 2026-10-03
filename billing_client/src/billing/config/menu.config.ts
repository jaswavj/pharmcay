import { routerPathNames } from '../../routes/routerPathNames';

export interface MenuItemConfig {
  id: string;
  name: string;
  url?: string;
  icon: string;
  moduleId?: number;
  submenus?: MenuItemConfig[];
}

/** user_modules IDs — a menu shows only if the user has that module. */
export const MENU_MODULE = {
  users: 1,
  admin: 2,
  master: 3,
  purchase: 4,
  stockReport: 5,
} as const;

export const filterMenuByModules = (items: MenuItemConfig[], moduleIds: number[]): MenuItemConfig[] => {
  const allowed = new Set((moduleIds || []).map(Number));
  return items.filter((item) => item.moduleId == null || allowed.has(item.moduleId));
};

export const hasModuleAccess = (moduleIds: number[] | undefined, moduleId: number): boolean =>
  (moduleIds || []).map(Number).includes(moduleId);

export const defaultAppPath = (moduleIds: number[] | undefined): string => {
  if (hasModuleAccess(moduleIds, MENU_MODULE.admin)) return routerPathNames.admin.companyDetails;
  if (hasModuleAccess(moduleIds, MENU_MODULE.master)) return routerPathNames.master.medicineType;
  if (hasModuleAccess(moduleIds, MENU_MODULE.purchase)) return routerPathNames.purchase.order;
  if (hasModuleAccess(moduleIds, MENU_MODULE.stockReport)) return routerPathNames.stockReport.stock;
  if (hasModuleAccess(moduleIds, MENU_MODULE.users)) return routerPathNames.users.create;
  return routerPathNames.users.changePassword;
};

export const moduleIdForPath = (pathname: string): number | null => {
  if (pathname.includes('/app/users/change-password')) return null;
  if (pathname.includes('/app/users')) return MENU_MODULE.users;
  if (pathname.includes('/app/admin')) return MENU_MODULE.admin;
  if (pathname.includes('/app/master')) return MENU_MODULE.master;
  if (pathname.includes('/app/stock-report')) return MENU_MODULE.stockReport;
  if (pathname.includes('/app/purchase')) return MENU_MODULE.purchase;
  return null;
};

export const billingMenuConfig: MenuItemConfig[] = [
  {
    id: 'master',
    name: 'Master',
    icon: 'fas fa-pills',
    moduleId: MENU_MODULE.master,
    submenus: [
      { id: 'medicine-type', name: 'Medicine Type', url: routerPathNames.master.medicineType, icon: 'fas fa-tags' },
      { id: 'unit', name: 'Unit', url: routerPathNames.master.unit, icon: 'fas fa-balance-scale' },
      { id: 'generic', name: 'Generic Name', url: routerPathNames.master.generic, icon: 'fas fa-font' },
      { id: 'medicine', name: 'Medicine', url: routerPathNames.master.medicine, icon: 'fas fa-capsules' },
      { id: 'batch', name: 'Batch', url: routerPathNames.master.batch, icon: 'fas fa-layer-group' },
      { id: 'supplier', name: 'Supplier', url: routerPathNames.master.supplier, icon: 'fas fa-truck' },
    ],
  },
  {
    id: 'purchase',
    name: 'Purchase',
    icon: 'fas fa-shopping-cart',
    moduleId: MENU_MODULE.purchase,
    submenus: [
      { id: 'purchase-order', name: 'Purchase Order', url: routerPathNames.purchase.order, icon: 'fas fa-file-alt' },
      { id: 'purchase-approve', name: 'Approve', url: routerPathNames.purchase.approve, icon: 'fas fa-check-circle' },
      { id: 'purchase-entry', name: 'Purchase Entry', url: routerPathNames.purchase.entry, icon: 'fas fa-dolly' },
      { id: 'purchase-return', name: 'Purchase Return', url: routerPathNames.purchase.return, icon: 'fas fa-undo' },
      {
        id: 'purchase-report',
        name: 'Purchase Report',
        icon: 'fas fa-file-invoice',
        submenus: [
          { id: 'purchase-report-list', name: 'Purchase Report', url: routerPathNames.purchase.purchaseReport, icon: 'fas fa-file-invoice' },
          { id: 'purchase-return-report', name: 'Purchase Return Report', url: routerPathNames.purchase.returnReport, icon: 'fas fa-file-export' },
          { id: 'supplier-wise', name: 'Supplier Wise Purchase', url: routerPathNames.purchase.supplierPurchase, icon: 'fas fa-truck' },
        ],
      },
    ],
  },
  {
    id: 'stock-report',
    name: 'Stock Report',
    icon: 'fas fa-chart-bar',
    moduleId: MENU_MODULE.stockReport,
    submenus: [
      { id: 'stock', name: 'Stock', url: routerPathNames.stockReport.stock, icon: 'fas fa-boxes' },
      { id: 'stock-transaction', name: 'Stock Transaction', url: routerPathNames.stockReport.stockTxn, icon: 'fas fa-exchange-alt' },
    ],
  },
  {
    id: 'users',
    name: 'User Management',
    icon: 'fas fa-user-shield',
    moduleId: MENU_MODULE.users,
    submenus: [
      { id: 'create-user', name: 'Create User', url: routerPathNames.users.create, icon: 'fas fa-user-plus' },
      { id: 'permission', name: 'Module Permission', url: routerPathNames.users.permission, icon: 'fas fa-key' },
    ],
  },
  {
    id: 'admin',
    name: 'Admin',
    icon: 'fas fa-building',
    moduleId: MENU_MODULE.admin,
    submenus: [
      { id: 'company-details', name: 'Company Details', url: routerPathNames.admin.companyDetails, icon: 'fas fa-building' },
    ],
  },
];
