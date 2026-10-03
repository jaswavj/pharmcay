export const routerPathNames = {
  login: '/login',
  users: {
    create: '/app/users/create',
    permission: '/app/users/permission',
    changePassword: '/app/users/change-password',
  },
  admin: {
    companyDetails: '/app/admin/company-details',
  },
  master: {
    medicineType: '/app/master/medicine-type',
    unit: '/app/master/unit',
    generic: '/app/master/generic',
    medicine: '/app/master/medicine',
    batch: '/app/master/batch',
    supplier: '/app/master/supplier',
  },
  purchase: {
    order: '/app/purchase/order',
    approve: '/app/purchase/approve',
    entry: '/app/purchase/entry',
    return: '/app/purchase/return',
    purchaseReport: '/app/purchase/purchase-report',
    returnReport: '/app/purchase/return-report',
    supplierPurchase: '/app/purchase/supplier-wise',
  },
  stockReport: {
    stock: '/app/stock-report/stock',
    stockTxn: '/app/stock-report/stock-transaction',
  },
};
