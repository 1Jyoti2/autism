import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { PublicLayout, AuthLayout } from '../layouts'
import { PageSpinner } from '../components/common'
import { ProtectedRoute, RoleProtectedRoute, DashboardLayout } from '../components/layout'
import { ROUTES } from '../lib/constants'
import { ROLES } from '../lib/roles'

const HomePage = lazy(() => import('../pages/public/HomePage'))
const AboutPage = lazy(() => import('../pages/public/AboutPage'))
const HowItWorksPage = lazy(() => import('../pages/public/HowItWorksPage'))
const TermsPage = lazy(() => import('../pages/public/TermsPage'))
const PrivacyPage = lazy(() => import('../pages/public/PrivacyPage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))
const DashboardPage = lazy(() => import('../pages/app/DashboardPage'))
const ParentDashboard = lazy(() => import('../pages/app/dashboards/ParentDashboard'))
const DoctorDashboard = lazy(() => import('../pages/app/dashboards/DoctorDashboard'))
const CaretakerDashboard = lazy(() => import('../pages/app/dashboards/CaretakerDashboard'))
const AdminDashboard = lazy(() => import('../pages/app/dashboards/AdminDashboard'))
const Children = lazy(() => import('../pages/app/Children'))
const AddChild = lazy(() => import('../pages/app/AddChild'))
const ChildDetails = lazy(() => import('../pages/app/ChildDetails'))
const EditChild = lazy(() => import('../pages/app/EditChild'))
const AssessmentPage = lazy(() => import('../pages/app/AssessmentPage'))
const Screening = lazy(() => import('../pages/app/Screening'))
const ScreeningResult = lazy(() => import('../pages/app/ScreeningResult'))
const EmotionAnalysis = lazy(() => import('../pages/app/EmotionAnalysis'))
const VideoAnalysis = lazy(() => import('../pages/app/VideoAnalysis'))
const ScreeningHistory = lazy(() => import('../pages/app/ScreeningHistory'))
const ProgressTracking = lazy(() => import('../pages/app/ProgressTracking'))
const ReportsPage = lazy(() => import('../pages/app/ReportsPage'))
const NotificationsPage = lazy(() => import('../pages/app/NotificationsPage'))
const NotesPage = lazy(() => import('../pages/app/NotesPage'))
const ProfilePage = lazy(() => import('../pages/app/ProfilePage'))
const SettingsPage = lazy(() => import('../pages/app/SettingsPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.about} element={<AboutPage />} />
          <Route path={ROUTES.howItWorks} element={<HowItWorksPage />} />
          <Route path={ROUTES.terms} element={<TermsPage />} />
          <Route path={ROUTES.privacy} element={<PrivacyPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Main Dashboard Route (smart-routes based on user role) */}
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />

            {/* Role-Specific Dashboard Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={[ROLES.PARENT]} />}>
              <Route path={ROUTES.parentDashboard} element={<ParentDashboard />} />
            </Route>

            <Route element={<RoleProtectedRoute allowedRoles={[ROLES.DOCTOR]} />}>
              <Route path={ROUTES.doctorDashboard} element={<DoctorDashboard />} />
            </Route>

            <Route element={<RoleProtectedRoute allowedRoles={[ROLES.CARETAKER]} />}>
              <Route path={ROUTES.caretakerDashboard} element={<CaretakerDashboard />} />
            </Route>

            <Route element={<RoleProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path={ROUTES.adminDashboard} element={<AdminDashboard />} />
            </Route>

            {/* Shared Application Pages */}
            <Route path={ROUTES.children} element={<Children />} />
            <Route path={ROUTES.addChild} element={<AddChild />} />
            <Route path={ROUTES.childDetail} element={<ChildDetails />} />
            <Route path={ROUTES.childEdit} element={<EditChild />} />
            <Route path={ROUTES.assessment} element={<AssessmentPage />} />
            <Route path={ROUTES.screening} element={<Screening />} />
            <Route path={ROUTES.screeningResult} element={<ScreeningResult />} />
            <Route path={ROUTES.emotionAnalysis} element={<EmotionAnalysis />} />
            <Route path={ROUTES.videoAnalysis} element={<VideoAnalysis />} />
            <Route path={ROUTES.history} element={<ScreeningHistory />} />
            <Route path={ROUTES.progress} element={<ProgressTracking />} />
            <Route path={ROUTES.reports} element={<ReportsPage />} />
            <Route path={ROUTES.notifications} element={<NotificationsPage />} />
            <Route path={ROUTES.notes} element={<NotesPage />} />
            <Route path={ROUTES.profile} element={<ProfilePage />} />
            <Route path={ROUTES.settings} element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path={ROUTES.notFound} element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}