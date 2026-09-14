export const RouteConfig = {
  DASHBOARD: {
    OVERVIEW: (orgId: string) => `/dashboard/${orgId}/overview`,
  },
  GENERAL: {
    ORG: {
      VIEW: (orgId: string) => `/${orgId}/general/organization`,
    },
    PRODUCT: {
      LIST: (orgId: string) => `/${orgId}/general/products`,
      CREATE: (orgId: string) => `/${orgId}/general/products/create`,
      UPDATE: (orgId: string, productId: string) => `/${orgId}/general/products/${productId}/update`,
      IMAGE: (orgId: string, productId: string) => `/${orgId}/general/products/${productId}/image`,
    },
    CUSTOMER: {
      LIST: (orgId: string) => `/${orgId}/general/customers`,
      CREATE: (orgId: string) => `/${orgId}/general/customers/create`,
      UPDATE: (orgId: string, customerId: string) => `/${orgId}/general/customers/${customerId}/update`,
    },
    JOB: {
      LIST: (orgId: string) => `/${orgId}/general/jobs`,
      CREATE: (orgId: string) => `/${orgId}/general/jobs/create`,
      UPDATE: (orgId: string, jobId: string) => `/${orgId}/general/jobs/${jobId}/update`,
    }
  },
  SCAN_ITEMS: {
    ACTION: {
      LIST: (orgId: string) => `/${orgId}/scan-items/scan-item-actions`,
      CREATE: (orgId: string) => `/${orgId}/scan-items/scan-item-actions/create`,
      UPDATE: (orgId: string, actionId: string) => `/${orgId}/scan-items/scan-item-actions/${actionId}/update`,
    },
    TEMPLATE: {
      LIST: (orgId: string) => `/${orgId}/scan-items/scan-item-templates`,
      CREATE: (orgId: string) => `/${orgId}/scan-items/scan-item-templates/create`,
      UPDATE: (orgId: string, templateId: string) => `/${orgId}/scan-items/scan-item-templates/${templateId}/update`,
      CREATE_JOB: (orgId: string, templateId: string) => `/${orgId}/scan-items/scan-item-templates/jobs/${templateId}/create`,
      LIST_JOBS: (orgId: string, templateId: string) => `/${orgId}/scan-items/scan-item-templates/jobs/${templateId}`,
    },
    FOLDER: {
      LIST: (orgId: string) => `/${orgId}/scan-items/scan-item-folders`,
      CREATE: (orgId: string) => `/${orgId}/scan-items/scan-item-folders/create`,
      UPDATE: (orgId: string, folderId: string) => `/${orgId}/scan-items/scan-item-folders/${folderId}/update`,
    },
    ITEM: {
      LIST: (orgId: string) => `/${orgId}/scan-items/scan-items`,
      CREATE: (orgId: string) => `/${orgId}/scan-items/scan-items/create`,
      UPDATE: (orgId: string, itemId: string) => `/${orgId}/scan-items/scan-items/${itemId}/update`,
      VIEW: (orgId: string, itemId: string) => `/${orgId}/scan-items/scan-items/${itemId}/view`,
    },
    HISTORY: {
      LIST: (orgId: string) => `/${orgId}/scan-items/scan-item-histories`,
    }
  },
  LOYALTY: {
    POINTS_WALLETS: {
      LIST: (orgId: string) => `/${orgId}/loyalty/points-wallets`,
      POINTS: (orgId: string, walletId: string) => `/${orgId}/loyalty/points-wallets/${walletId}/points`,
    },
    POINT_RULE: {
      LIST: (orgId: string) => `/${orgId}/loyalty/point-rules`,
      CREATE: (orgId: string) => `/${orgId}/loyalty/point-rules/create`,
      UPDATE: (orgId: string, pointRuleId: string) => `/${orgId}/loyalty/point-rules/${pointRuleId}/update`,
    },
    POINT_TRIGGER: {
      LIST: (orgId: string) => `/${orgId}/loyalty/point-triggers`,
      VIEW: (orgId: string, pointTriggerId: string) => `/${orgId}/loyalty/point-triggers/${pointTriggerId}/view`,
    },
    PRIVILEGES: {
      LIST: (orgId: string) => `/${orgId}/loyalty/privileges`,
      CREATE: (orgId: string) => `/${orgId}/loyalty/privileges/create`,
      UPDATE: (orgId: string, privilegeId: string) => `/${orgId}/loyalty/privileges/${privilegeId}/update`,
      TX: (orgId: string, privilegeId: string) => `/${orgId}/loyalty/privileges/${privilegeId}/transactions`,
    },
    VOUCHERS: {
      LIST: (orgId: string) => `/${orgId}/loyalty/vouchers`,
      CREATE: (orgId: string) => `/${orgId}/loyalty/vouchers/create`,
      UPDATE: (orgId: string, voucherId: string) => `/${orgId}/loyalty/vouchers/${voucherId}/update`,
      REDEEM: (orgId: string, privilegeId: string) => `/${orgId}/loyalty/vouchers/create?privilegeId=${privilegeId}`,
    },
  },
  ADMIN: {
    ROLE_PERMISSIONS: {
      LIST: (orgId: string) => `/${orgId}/admin/role-permissions`,
      CREATE: (orgId: string) => `/${orgId}/admin/role-permissions/create`,
      UPDATE: (orgId: string, roleId: string) => `/${orgId}/admin/role-permissions/${roleId}/update`,
    },
    APIKEY: {
      LIST: (orgId: string) => `/${orgId}/admin/apikeys`,
      CREATE: (orgId: string) => `/${orgId}/admin/apikeys/create`,
      UPDATE: (orgId: string, apikeyId: string) => `/${orgId}/admin/apikeys/${apikeyId}/update`,
    },
    USER: {
      LIST: (orgId: string) => `/${orgId}/admin/users`,
      CREATE: (orgId: string) => `/${orgId}/admin/users/create`,
      UPDATE: (orgId: string, userId: string) => `/${orgId}/admin/users/${userId}/update`,
    },
    AUDIT_LOG: {
      LIST: (orgId: string) => `/${orgId}/admin/auditlog`,
      FULL_LOG: (orgId: string) => `/${orgId}/admin/auditlog/full-log`,
    }
  },
  LOGIN: "/auth/sign-in",

  // Platform-level admin (NEXT_PUBLIC_WEB_ROLE=ADMIN build only) - ไม่ผูกกับ [orgId]
  // เพราะใช้สำหรับสร้าง org ใหม่ / จัดการ Administrator ข้าม org
  PLATFORM_ADMIN: {
    LOGIN: "/admin/sign-in",
    ORGANIZATION: {
      LIST: "/admin/organizations",
      CREATE: "/admin/organizations/create",
      VIEW: (orgCustomId: string) => `/admin/organizations/${orgCustomId}`,
    },
    // Administrator section - เหมือน please-erp-console: sidebar เดียวกัน 4 แท็บ
    // (Custom Roles, API Keys, Users, Audit Log) อยู่ใต้ path เดียวกันหมด
    ADMINISTRATOR: {
      HOME: "/admin/administrator/users",
      USER: {
        LIST: "/admin/administrator/users",
        CREATE: "/admin/administrator/users/create",
      },
      CUSTOM_ROLE: {
        LIST: "/admin/administrator/custom-roles",
        CREATE: "/admin/administrator/custom-roles/create",
      },
      API_KEY: {
        LIST: "/admin/administrator/api-keys",
        CREATE: "/admin/administrator/api-keys/create",
      },
      AUDIT_LOG: {
        LIST: "/admin/administrator/audit-log",
      },
    },
  },
}
