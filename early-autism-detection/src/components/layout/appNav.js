import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  ScanFace,
  Video,
  History,
  TrendingUp,
  FileText,
  UserRound,
  Settings,
  Bell,
  NotebookPen,
  ShieldAlert,
  Stethoscope,
  HeartPulse,
} from 'lucide-react'
import { ROUTES } from '../../lib/constants'
import { normalizeRole, ROLES } from '../../lib/roles'

export function getNavGroupsForRole(role) {
  const normRole = normalizeRole(role)

  if (normRole === ROLES.DOCTOR) {
    return [
      {
        label: 'Clinical Overview',
        items: [
          { label: 'Doctor Dashboard', to: ROUTES.doctorDashboard, icon: Stethoscope, end: true },
        ],
      },
      {
        label: 'Clinical Management',
        items: [
          { label: 'Patients/Children', to: ROUTES.children, icon: Users },
          { label: 'Image Assessments', to: ROUTES.emotionAnalysis, icon: ScanFace },
          { label: 'Video Assessments', to: ROUTES.videoAnalysis, icon: Video },
          { label: 'Results', to: ROUTES.screeningResult, icon: ClipboardList },
          { label: 'History', to: ROUTES.history, icon: History },
          { label: 'Reports', to: ROUTES.reports, icon: FileText },
          { label: 'Notifications', to: ROUTES.notifications, icon: Bell },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'Profile', to: ROUTES.profile, icon: UserRound },
          { label: 'Settings', to: ROUTES.settings, icon: Settings },
        ],
      },
    ]
  }

  if (normRole === ROLES.CARETAKER) {
    return [
      {
        label: 'Care Overview',
        items: [
          { label: 'Caretaker Dashboard', to: ROUTES.caretakerDashboard, icon: HeartPulse, end: true },
        ],
      },
      {
        label: 'Care Management',
        items: [
          { label: 'Assigned Children', to: ROUTES.children, icon: Users },
          { label: 'Child Profiles', to: ROUTES.children, icon: UserPlus },
          { label: 'Image Assessment', to: ROUTES.emotionAnalysis, icon: ScanFace },
          { label: 'Video Assessment', to: ROUTES.videoAnalysis, icon: Video },
          { label: 'History', to: ROUTES.history, icon: History },
          { label: 'Observations', to: ROUTES.notes, icon: NotebookPen },
          { label: 'Progress Tracking', to: ROUTES.progress, icon: TrendingUp },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'Profile', to: ROUTES.profile, icon: UserRound },
          { label: 'Settings', to: ROUTES.settings, icon: Settings },
        ],
      },
    ]
  }

  if (normRole === ROLES.ADMIN) {
    return [
      {
        label: 'Administration',
        items: [
          { label: 'Admin Dashboard', to: ROUTES.adminDashboard, icon: ShieldAlert, end: true },
        ],
      },
      {
        label: 'System Management',
        items: [
          { label: 'Children Registry', to: ROUTES.children, icon: Users },
          { label: 'Assessment History', to: ROUTES.history, icon: History },
          { label: 'System Reports', to: ROUTES.reports, icon: FileText },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'Profile', to: ROUTES.profile, icon: UserRound },
          { label: 'Settings', to: ROUTES.settings, icon: Settings },
        ],
      },
    ]
  }

  // Default: Parent / Guardian Role
  return [
    {
      label: 'Overview',
      items: [
        { label: 'Parent Dashboard', to: ROUTES.parentDashboard, icon: LayoutDashboard, end: true },
      ],
    },
    {
      label: 'Child & Assessments',
      items: [
        { label: 'Child Profile', to: ROUTES.children, icon: Users },
        { label: 'Add Child', to: ROUTES.addChild, icon: UserPlus },
        { label: 'Image Assessment', to: ROUTES.emotionAnalysis, icon: ScanFace },
        { label: 'Video Assessment', to: ROUTES.videoAnalysis, icon: Video },
        { label: 'History', to: ROUTES.history, icon: History },
        { label: 'Reports', to: ROUTES.reports, icon: FileText },
        { label: 'Notifications', to: ROUTES.notifications, icon: Bell },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Profile', to: ROUTES.profile, icon: UserRound },
        { label: 'Settings', to: ROUTES.settings, icon: Settings },
      ],
    },
  ]
}

// Fallback constant for backwards compatibility
export const APP_NAV_GROUPS = getNavGroupsForRole(ROLES.PARENT)

export function findActiveGroup(pathname, role = ROLES.PARENT) {
  const groups = getNavGroupsForRole(role)
  for (let i = 0; i < groups.length; i += 1) {
    const group = groups[i]
    const active = group.items.some(
      (item) =>
        item.to === pathname ||
        (item.end ? false : pathname.startsWith(`${item.to}/`)),
    )
    if (active) return i
  }
  return -1
}