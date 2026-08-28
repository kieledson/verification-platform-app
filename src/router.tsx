import { createHashRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/app/AppShell'
import { AssessmentListPage } from '@/features/assessment-list/AssessmentListPage'
import { WorkspacePage } from '@/features/workspace/WorkspacePage'
import { ReviewPage } from '@/features/review-finalise/ReviewPage'
import { UsersListPage } from '@/features/security/UsersListPage'
import { UserEditorPage } from '@/features/security/UserEditorPage'
import { InvitationsListPage } from '@/features/security/InvitationsListPage'
import { RolesListPage } from '@/features/security/RolesListPage'
import { RolePermissionsPage } from '@/features/security/RolePermissionsPage'
import { ExportTemplatesListPage } from '@/features/admin/ExportTemplatesListPage'
import { ExportTemplateEditorPage } from '@/features/admin/ExportTemplateEditorPage'
import { DataExportPage } from '@/features/admin/DataExportPage'
import { ProjectsListPage } from '@/features/projects/ProjectsListPage'
import { ProjectEditorPage } from '@/features/projects/ProjectEditorPage'
import { GroupEditorPage } from '@/features/projects/GroupEditorPage'
import { SiteEditorPage } from '@/features/projects/SiteEditorPage'
import { StandardsListPage } from '@/features/projects/StandardsListPage'
import { StandardEditorPage } from '@/features/projects/StandardEditorPage'
import { AssessmentHistoryPage } from '@/features/reports/AssessmentHistoryPage'
import { InternalGroupReportPage } from '@/features/reports/InternalGroupReportPage'

export const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/assessments" replace /> },
      { path: '/assessments', element: <AssessmentListPage /> },
      { path: '/assessments/:assessmentId', element: <WorkspacePage /> },
      { path: '/assessments/:assessmentId/review', element: <ReviewPage /> },

      // Security
      { path: '/security', element: <Navigate to="/security/users" replace /> },
      { path: '/security/users', element: <UsersListPage /> },
      { path: '/security/users/:userId', element: <UserEditorPage /> },
      { path: '/security/invitations', element: <InvitationsListPage /> },
      { path: '/security/roles', element: <RolesListPage /> },
      { path: '/security/roles/:roleId', element: <RolePermissionsPage /> },

      // Administration
      { path: '/admin', element: <Navigate to="/admin/export-templates" replace /> },
      { path: '/admin/export-templates', element: <ExportTemplatesListPage /> },
      { path: '/admin/export-templates/:templateId', element: <ExportTemplateEditorPage /> },
      { path: '/admin/data-export', element: <DataExportPage /> },

      // Project Preparation
      { path: '/projects', element: <ProjectsListPage /> },
      { path: '/projects/:projectId', element: <ProjectEditorPage /> },
      { path: '/projects/:projectId/groups/:groupId', element: <GroupEditorPage /> },
      { path: '/projects/:projectId/groups/:groupId/sites/:siteId', element: <SiteEditorPage /> },
      { path: '/standard', element: <StandardsListPage /> },
      { path: '/standard/:standardId', element: <StandardEditorPage /> },

      // Reports
      { path: '/reports', element: <Navigate to="/reports/assessment-history" replace /> },
      { path: '/reports/assessment-history', element: <AssessmentHistoryPage /> },
      { path: '/reports/internal-group-report', element: <InternalGroupReportPage /> },
    ],
  },
])
