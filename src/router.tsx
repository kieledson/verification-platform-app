import { createHashRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/app/AppShell'
import { AssessmentListPage } from '@/features/assessment-list/AssessmentListPage'
import { WorkspacePage } from '@/features/workspace/WorkspacePage'
import { ReviewPage } from '@/features/review-finalise/ReviewPage'

export const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/assessments" replace /> },
      { path: '/assessments', element: <AssessmentListPage /> },
      { path: '/assessments/:assessmentId', element: <WorkspacePage /> },
      { path: '/assessments/:assessmentId/review', element: <ReviewPage /> },
    ],
  },
])
