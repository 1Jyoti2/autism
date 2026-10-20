import { ROUTES } from './constants'

export const ROLES = {
  PARENT: 'parent',
  DOCTOR: 'doctor',
  CARETAKER: 'caretaker',
  ADMIN: 'admin',
}

/**
 * Normalizes user role string returned from backend API into standard role key.
 */
export function normalizeRole(role) {
  if (!role) return ROLES.PARENT
  const r = String(role).trim().toLowerCase()
  if (r === 'doctor' || r === 'physician' || r === 'clinician') return ROLES.DOCTOR
  if (r === 'caretaker' || r === 'caregiver_staff' || r === 'nurse') return ROLES.CARETAKER
  if (r === 'admin' || r === 'administrator') return ROLES.ADMIN
  return ROLES.PARENT // 'parent', 'caregiver', 'family'
}

/**
 * Returns the primary dashboard route for a given user role.
 */
export function getRoleDashboardRoute(role) {
  const norm = normalizeRole(role)
  switch (norm) {
    case ROLES.DOCTOR:
      return ROUTES.doctorDashboard
    case ROLES.CARETAKER:
      return ROUTES.caretakerDashboard
    case ROLES.ADMIN:
      return ROUTES.adminDashboard
    case ROLES.PARENT:
    default:
      return ROUTES.parentDashboard
  }
}

/**
 * Returns user-friendly role title label.
 */
export function getRoleLabel(role) {
  const norm = normalizeRole(role)
  switch (norm) {
    case ROLES.DOCTOR:
      return 'Doctor / Practitioner'
    case ROLES.CARETAKER:
      return 'Caretaker'
    case ROLES.ADMIN:
      return 'Administrator'
    case ROLES.PARENT:
    default:
      return 'Parent / Guardian'
  }
}
