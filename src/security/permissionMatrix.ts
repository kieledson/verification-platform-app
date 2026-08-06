import type { PermissionScope } from '@/db/schema'

/**
 * The full 191-claim × 3-role permission matrix, transcribed verbatim from
 * Document 2 §7.3 (the only authoritative source — nothing here is
 * invented). Grouped into the same 25 permission groups the production
 * system uses. Seeded into `rolePermissions` at boot and editable from the
 * Role Permissions screen; nothing in this app actually reads it back to
 * enforce access (see the "management screens only" scope decision) — it
 * exists so the Security area is real, browsable data rather than a stub.
 */
export interface PermissionDef {
  group: string
  claimCode: string
  description: string
  admin: PermissionScope
  assessor: PermissionScope
  manager: PermissionScope
}

export const PERMISSION_GROUPS = [
  'Global',
  'Check Items',
  'Localization',
  'Countries',
  'Supervision',
  'Activities',
  'Ref Data',
  'Data Export',
  'Settings',
  'Logs',
  'Administrative Regions & Sub-Regions',
  'Clients',
  'Sites',
  'Projects',
  'RAM Matrix',
  'Security',
  'Groups',
  'Reporting',
  'PilotRounds',
  'Feed Companies',
  'Feed Mills',
  'Feed Profiles',
  'Feed Profile Versions',
  'Marine Ingredients',
  'Non Non-Marine Ingredients',
] as const

export const PERMISSION_MATRIX: PermissionDef[] = [
  // --- Global (2) ---
  { group: 'Global', claimCode: 'CanAccessFieldApp', description: 'Can Access Field App', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Global', claimCode: 'CanAccessAuditHistory', description: 'Can Access Audit History', admin: 'Global', assessor: 'None', manager: 'Global' },

  // --- Check Items (19) ---
  { group: 'Check Items', claimCode: 'CanAccessCheckItem', description: 'Can access Check Items management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanAccessCheckItemGroup', description: 'Can access Check Item Groups management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanAccessCheckItemControlType', description: 'Can Access Check Item Control Types management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanReadCheckItem', description: 'Can Read CheckItem', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Check Items', claimCode: 'CanCreateCheckItem', description: 'Can Create CheckItem', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanWriteCheckItem', description: 'Can Write CheckItem', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanDeleteCheckItem', description: 'Can Delete CheckItem', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanReadCheckItemControlType', description: 'Can Read CheckItemControlType', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Check Items', claimCode: 'CanCreateCheckItemControlType', description: 'Can Create CheckItemControlType', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanWriteCheckItemControlType', description: 'Can Write CheckItemControlType', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanDeleteCheckItemControlType', description: 'Can Delete CheckItemControlType', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanReadCheckItemValue', description: 'Can Read CheckItemValue', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Check Items', claimCode: 'CanCreateCheckItemValue', description: 'Can Create CheckItemValue', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanWriteCheckItemValue', description: 'Can Write CheckItemValue', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanDeleteCheckItemValue', description: 'Can Delete CheckItemValue', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanReadCheckItemGroup', description: 'Can Read CheckItemGroup', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Check Items', claimCode: 'CanCreateCheckItemGroup', description: 'Can Create CheckItemGroup', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanWriteCheckItemGroup', description: 'Can Write CheckItemGroup', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Check Items', claimCode: 'CanDeleteCheckItemGroup', description: 'Can Delete CheckItemGroup', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Localization (10) ---
  { group: 'Localization', claimCode: 'CanAccessL10NString', description: 'Can access localized strings management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Localization', claimCode: 'CanReadL10NString', description: 'Can Read L10NString', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Localization', claimCode: 'CanCreateL10NString', description: 'Can Create L10NString', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Localization', claimCode: 'CanWriteL10NString', description: 'Can Write L10NString', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Localization', claimCode: 'CanDeleteL10NString', description: 'Can Delete L10NString', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Localization', claimCode: 'CanAccessL10NStringGroup', description: 'Can access localized string groups management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Localization', claimCode: 'CanReadL10NStringGroup', description: 'Can Read L10NStringGroup', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Localization', claimCode: 'CanCreateL10NStringGroup', description: 'Can Create L10NStringGroup', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Localization', claimCode: 'CanWriteL10NStringGroup', description: 'Can Write L10NStringGroup', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Localization', claimCode: 'CanDeleteL10NStringGroup', description: 'Can Delete L10NStringGroup', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Countries (5) ---
  { group: 'Countries', claimCode: 'CanAccessCountry', description: 'Can access Countries management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Countries', claimCode: 'CanReadCountry', description: 'Can Read Country', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Countries', claimCode: 'CanCreateCountry', description: 'Can Create Country', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Countries', claimCode: 'CanWriteCountry', description: 'Can Write Country', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Countries', claimCode: 'CanDeleteCountry', description: 'Can Delete Country', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Supervision (17) ---
  { group: 'Supervision', claimCode: 'CanAccessSupervision', description: 'Can Access Activity Supervision (Reviews)', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanReadActivityReviewCheck', description: 'Can Read ActivityReviewCheck', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanCreateActivityReviewCheck', description: 'Can Create ActivityReviewCheck', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanWriteActivityReviewCheck', description: 'Can Write ActivityReviewCheck', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanDeleteActivityReviewCheck', description: 'Can Delete ActivityReviewCheck', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanReadActivityReview', description: 'Can Read ActivityReview', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanCreateActivityReview', description: 'Can Create ActivityReview', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanWriteActivityReview', description: 'Can Write ActivityReview', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanDeleteActivityReview', description: 'Can Delete ActivityReview', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanReadActivityReviewOutcome', description: 'Can Read ActivityReviewOutcome', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanCreateActivityReviewOutcome', description: 'Can Create ActivityReviewOutcome', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanWriteActivityReviewOutcome', description: 'Can Write ActivityReviewOutcome', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanDeleteActivityReviewOutcome', description: 'Can Delete ActivityReviewOutcome', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanReadActivityReviewState', description: 'Can Read ActivityReviewState', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanCreateActivityReviewState', description: 'Can Create ActivityReviewState', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanWriteActivityReviewState', description: 'Can Write ActivityReviewState', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Supervision', claimCode: 'CanDeleteActivityReviewState', description: 'Can Delete ActivityReviewState', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Activities (25) ---
  { group: 'Activities', claimCode: 'CanAccessActivityHistory', description: 'Can Access Activity History', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanReadActivity', description: 'Can Read Activity', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanCreateActivity', description: 'Can Create Activity', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanWriteActivity', description: 'Can Write Activity', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanDeleteActivity', description: 'Can Delete Activity', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanReadActivityStatus', description: 'Can Read ActivityStatus', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanCreateActivityStatus', description: 'Can Create ActivityStatus', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanWriteActivityStatus', description: 'Can Write ActivityStatus', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanDeleteActivityStatus', description: 'Can Delete ActivityStatus', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanReadActivityType', description: 'Can Read ActivityType', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanCreateActivityType', description: 'Can Create ActivityType', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanWriteActivityType', description: 'Can Write ActivityType', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Activities', claimCode: 'CanDeleteActivityType', description: 'Can Delete ActivityType', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Activities', claimCode: 'CanReadActivityTypeVersion', description: 'Can Read ActivityTypeVersion', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanCreateActivityTypeVersion', description: 'Can Create ActivityTypeVersion', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Activities', claimCode: 'CanWriteActivityTypeVersion', description: 'Can Write ActivityTypeVersion', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Activities', claimCode: 'CanDeleteActivityTypeVersion', description: 'Can Delete ActivityTypeVersion', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Activities', claimCode: 'CanAccessActivityType', description: 'Maintain Activity Types', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Activities', claimCode: 'CanAccessActivityStatus', description: 'Maintain Activity Statuses', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Activities', claimCode: 'CanReadOutcomeType', description: 'Can Read OutcomeType', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Activities', claimCode: 'CanCreateOutcomeType', description: 'Can Create OutcomeType', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Activities', claimCode: 'CanWriteOutcomeType', description: 'Can Write OutcomeType', admin: 'Global', assessor: 'Global', manager: 'None' },
  { group: 'Activities', claimCode: 'CanDeleteOutcomeType', description: 'Can Delete OutcomeType', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Activities', claimCode: 'CanAccessOutcomeType', description: 'Can access Outcome Types management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Activities', claimCode: 'CanAccessActivityTypeVersion', description: 'Maintain Activity Type Versions', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Ref Data (10) ---
  { group: 'Ref Data', claimCode: 'CanAccessRefDataType', description: 'Maintain Ref Data Types', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Ref Data', claimCode: 'CanReadRefDataType', description: 'Can Read RefDataType', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Ref Data', claimCode: 'CanCreateRefDataType', description: 'Can Create RefDataType', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Ref Data', claimCode: 'CanWriteRefDataType', description: 'Can Write RefDataType', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Ref Data', claimCode: 'CanDeleteRefDataType', description: 'Can Delete RefDataType', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Ref Data', claimCode: 'CanAccessRefDataItem', description: 'Maintain Ref Data Type Items', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Ref Data', claimCode: 'CanReadRefDataItem', description: 'Can Read RefDataItem', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Ref Data', claimCode: 'CanCreateRefDataItem', description: 'Can Create RefDataItem', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Ref Data', claimCode: 'CanWriteRefDataItem', description: 'Can Write RefDataItem', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Ref Data', claimCode: 'CanDeleteRefDataItem', description: 'Can Delete RefDataItem', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Data Export (11) ---
  { group: 'Data Export', claimCode: 'CanAccessDataExport', description: 'Can access Data Export management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Data Export', claimCode: 'CanAccessExportTemplate', description: 'Can access Export Template management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Data Export', claimCode: 'CanReadExportTemplate', description: 'Can Read ExportTemplate', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Data Export', claimCode: 'CanCreateExportTemplate', description: 'Can Create ExportTemplate', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Data Export', claimCode: 'CanWriteExportTemplate', description: 'Can Write ExportTemplate', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Data Export', claimCode: 'CanDeleteExportTemplate', description: 'Can Delete ExportTemplate', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Data Export', claimCode: 'CanAccessExportTemplateFieldFormat', description: 'Can access Export template field format management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Data Export', claimCode: 'CanReadExportTemplateFieldFormat', description: 'Can Read ExportTemplateFieldFormat', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Data Export', claimCode: 'CanCreateExportTemplateFieldFormat', description: 'Can Create ExportTemplateFieldFormat', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Data Export', claimCode: 'CanWriteExportTemplateFieldFormat', description: 'Can Write ExportTemplateFieldFormat', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Data Export', claimCode: 'CanDeleteExportTemplateFieldFormat', description: 'Can Delete ExportTemplateFieldFormat', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Settings (4) ---
  { group: 'Settings', claimCode: 'CanReadSettingValue', description: 'Can Read SettingValue', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Settings', claimCode: 'CanCreateSettingValue', description: 'Can Create SettingValue', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Settings', claimCode: 'CanWriteSettingValue', description: 'Can Write SettingValue', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Settings', claimCode: 'CanDeleteSettingValue', description: 'Can Delete SettingValue', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Logs (4) ---
  { group: 'Logs', claimCode: 'CanReadLog', description: 'Can Read Log', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Logs', claimCode: 'CanCreateLog', description: 'Can Create Log', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Logs', claimCode: 'CanWriteLog', description: 'Can Write Log', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Logs', claimCode: 'CanDeleteLog', description: 'Can Delete Log', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Administrative Regions & Sub-Regions (10) ---
  { group: 'Administrative Regions & Sub-Regions', claimCode: 'CanAccessAdminRegion', description: 'Can access Administrative Regions management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Administrative Regions & Sub-Regions', claimCode: 'CanReadAdminRegion', description: 'Can Read AdminRegion', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Administrative Regions & Sub-Regions', claimCode: 'CanCreateAdminRegion', description: 'Can Create AdminRegion', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Administrative Regions & Sub-Regions', claimCode: 'CanWriteAdminRegion', description: 'Can Write AdminRegion', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Administrative Regions & Sub-Regions', claimCode: 'CanDeleteAdminRegion', description: 'Can Delete AdminRegion', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Administrative Regions & Sub-Regions', claimCode: 'CanAccessAdminSubRegion', description: 'Can access Administrative Sub Regions management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Administrative Regions & Sub-Regions', claimCode: 'CanReadAdminSubRegion', description: 'Can Read AdminSubRegion', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Administrative Regions & Sub-Regions', claimCode: 'CanCreateAdminSubRegion', description: 'Can Create AdminSubRegion', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Administrative Regions & Sub-Regions', claimCode: 'CanWriteAdminSubRegion', description: 'Can Write AdminSubRegion', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Administrative Regions & Sub-Regions', claimCode: 'CanDeleteAdminSubRegion', description: 'Can Delete AdminSubRegion', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Clients (5) ---
  { group: 'Clients', claimCode: 'CanAccessClient', description: 'Can Access Clients management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Clients', claimCode: 'CanReadClient', description: 'Can Read Client', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Clients', claimCode: 'CanCreateClient', description: 'Can Create Client', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Clients', claimCode: 'CanWriteClient', description: 'Can Write Client', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Clients', claimCode: 'CanDeleteClient', description: 'Can Delete Client', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Sites (5) ---
  { group: 'Sites', claimCode: 'CanAccessSite', description: 'Can access Sites management', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Sites', claimCode: 'CanReadSite', description: 'Can Read Site', admin: 'Global', assessor: 'Filtered[PGS]', manager: 'Filtered[PGS]' },
  { group: 'Sites', claimCode: 'CanCreateSite', description: 'Can Create Site', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Sites', claimCode: 'CanWriteSite', description: 'Can Write Site', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Sites', claimCode: 'CanDeleteSite', description: 'Can Delete Site', admin: 'Global', assessor: 'None', manager: 'Global' },

  // --- Projects (5) ---
  { group: 'Projects', claimCode: 'CanAccessProject', description: 'Can access Projects management', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Projects', claimCode: 'CanReadProject', description: 'Can Read Project', admin: 'Global', assessor: 'Filtered[PGS]', manager: 'Filtered[PGS]' },
  { group: 'Projects', claimCode: 'CanCreateProject', description: 'Can Create Project', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Projects', claimCode: 'CanWriteProject', description: 'Can Write Project', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Projects', claimCode: 'CanDeleteProject', description: 'Can Delete Project', admin: 'Global', assessor: 'None', manager: 'Global' },

  // --- RAM Matrix (5) ---
  { group: 'RAM Matrix', claimCode: 'CanAccessRamMatrix', description: 'Can Access Ram Matrix management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'RAM Matrix', claimCode: 'CanReadRamMatrix', description: 'Can Read RamMatrix', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'RAM Matrix', claimCode: 'CanCreateRamMatrix', description: 'Can Create RamMatrix', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'RAM Matrix', claimCode: 'CanWriteRamMatrix', description: 'Can Write RamMatrix', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'RAM Matrix', claimCode: 'CanDeleteRamMatrix', description: 'Can Delete RamMatrix', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Security (15) ---
  { group: 'Security', claimCode: 'CanAccessUser', description: 'Can Access Users management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanReadUser', description: 'Can Read User', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanCreateUser', description: 'Can Create User', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanWriteUser', description: 'Can Write User', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanDeleteUser', description: 'Can Delete User', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanAccessUserInvitation', description: 'Can Access User Invitations management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanReadUserInvitation', description: 'Can Read UserInvitation', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanCreateUserInvitation', description: 'Can Create UserInvitation', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanWriteUserInvitation', description: 'Can Write UserInvitation', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanDeleteUserInvitation', description: 'Can Delete UserInvitation', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanAccessRole', description: 'Can Access Roles management', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanReadRole', description: 'Can Read Role', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanCreateRole', description: 'Can Create Role', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanWriteRole', description: 'Can Write Role', admin: 'Global', assessor: 'None', manager: 'None' },
  { group: 'Security', claimCode: 'CanDeleteRole', description: 'Can Delete Role', admin: 'Global', assessor: 'None', manager: 'None' },

  // --- Groups (4) ---
  { group: 'Groups', claimCode: 'CanReadSiteGroup', description: 'Can Read Group', admin: 'Global', assessor: 'Filtered[PGS]', manager: 'Filtered[PGS]' },
  { group: 'Groups', claimCode: 'CanCreateSiteGroup', description: 'Can Create Group', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Groups', claimCode: 'CanWriteSiteGroup', description: 'Can Write Group', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Groups', claimCode: 'CanDeleteSiteGroup', description: 'Can Delete Group', admin: 'Global', assessor: 'None', manager: 'Global' },

  // --- Reporting (1) ---
  { group: 'Reporting', claimCode: 'CanAccessInternalGroupReport', description: 'Can Access Internal Group Dashboard (Report)', admin: 'Global', assessor: 'None', manager: 'Global' },

  // --- PilotRounds (4) ---
  { group: 'PilotRounds', claimCode: 'CanReadPilotRound', description: 'Can Read Pilot Round', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'PilotRounds', claimCode: 'CanCreatePilotRound', description: 'Can Create Pilot Round', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'PilotRounds', claimCode: 'CanWritePilotRound', description: 'Can Write Pilot Round', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'PilotRounds', claimCode: 'CanDeletePilotRound', description: 'Can Delete Pilot Round', admin: 'Global', assessor: 'None', manager: 'Global' },

  // --- Feed Companies (5) ---
  { group: 'Feed Companies', claimCode: 'CanAccessFeedCompany', description: 'Can Access Feed Comapany', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Companies', claimCode: 'CanReadFeedCompany', description: 'Can Read Feed Comapany', admin: 'Global', assessor: 'Global', manager: 'Filtered[CTRY]' },
  { group: 'Feed Companies', claimCode: 'CanCreateFeedCompany', description: 'Can Create Feed Comapany', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Companies', claimCode: 'CanWriteFeedCompany', description: 'Can Write Feed Comapany', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Companies', claimCode: 'CanDeleteFeedCompany', description: 'Can Delete Feed Comapany', admin: 'Global', assessor: 'None', manager: 'Global' },

  // --- Feed Mills (5) ---
  { group: 'Feed Mills', claimCode: 'CanAccessFeedMill', description: 'Can Access Feed Mill', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Mills', claimCode: 'CanReadFeedMill', description: 'Can Read Feed Mill', admin: 'Global', assessor: 'Filtered[CTRY]', manager: 'Filtered[CTRY]' },
  { group: 'Feed Mills', claimCode: 'CanCreateFeedMill', description: 'Can Create Feed Mill', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Mills', claimCode: 'CanWriteFeedMill', description: 'Can Write Feed Mill', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Mills', claimCode: 'CanDeleteFeedMill', description: 'Can Delete Feed Mill', admin: 'Global', assessor: 'None', manager: 'Global' },

  // --- Feed Profiles (5) ---
  { group: 'Feed Profiles', claimCode: 'CanAccessFeedProfile', description: 'Can Access Feed Profile', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Profiles', claimCode: 'CanReadFeedProfile', description: 'Can Read Feed Profile', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Feed Profiles', claimCode: 'CanCreateFeedProfile', description: 'Can Create Feed Profile', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Profiles', claimCode: 'CanWriteFeedProfile', description: 'Can Write Feed Profile', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Profiles', claimCode: 'CanDeleteFeedProfile', description: 'Can Delete Feed Profile', admin: 'Global', assessor: 'None', manager: 'Global' },

  // --- Feed Profile Versions (5) ---
  { group: 'Feed Profile Versions', claimCode: 'CanAccessFeedProfileVersion', description: 'Can Access Feed Profile Version', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Profile Versions', claimCode: 'CanReadFeedProfileVersion', description: 'Can Read Feed Profile Version', admin: 'Global', assessor: 'Global', manager: 'Global' },
  { group: 'Feed Profile Versions', claimCode: 'CanCreateFeedProfileVersion', description: 'Can Create Feed Profile Version', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Profile Versions', claimCode: 'CanWriteFeedProfileVersion', description: 'Can Write Feed Profile Version', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Feed Profile Versions', claimCode: 'CanDeleteFeedProfileVersion', description: 'Can Delete Feed Profile Version', admin: 'Global', assessor: 'None', manager: 'Global' },

  // --- Marine Ingredients (5) ---
  { group: 'Marine Ingredients', claimCode: 'CanAccessMarineIngredient', description: 'Can Access Marine Ingredients', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Marine Ingredients', claimCode: 'CanReadMarineIngredient', description: 'Can Read Marine Ingredients', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Marine Ingredients', claimCode: 'CanCreateMarineIngredient', description: 'Can Create Marine Ingredients', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Marine Ingredients', claimCode: 'CanWriteMarineIngredient', description: 'Can Write Marine Ingredients', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Marine Ingredients', claimCode: 'CanDeleteMarineIngredient', description: 'Can Delete Marine Ingredients', admin: 'Global', assessor: 'None', manager: 'Global' },

  // --- Non Non-Marine Ingredients (5) --- (sic — label typo preserved verbatim from production, Document 2 §18.5)
  { group: 'Non Non-Marine Ingredients', claimCode: 'CanAccessNonMarineIngredient', description: 'Can Access Non-Marine Ingredients', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Non Non-Marine Ingredients', claimCode: 'CanReadNonMarineIngredient', description: 'Can Read Non-Marine Ingredients', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Non Non-Marine Ingredients', claimCode: 'CanCreateNonMarineIngredient', description: 'Can Create Non-Marine Ingredients', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Non Non-Marine Ingredients', claimCode: 'CanWriteNonMarineIngredient', description: 'Can Write Non-Marine Ingredients', admin: 'Global', assessor: 'None', manager: 'Global' },
  { group: 'Non Non-Marine Ingredients', claimCode: 'CanDeleteNonMarineIngredient', description: 'Can Delete Non-Marine Ingredients', admin: 'Global', assessor: 'None', manager: 'Global' },
]
