import { z } from 'zod'

export const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

export const GENDER_VALUES = GENDERS.map((gender) => gender.value)

export const RELATIONSHIPS = [
  { value: 'parent', label: 'Parent' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
]

export const RELATIONSHIP_VALUES = RELATIONSHIPS.map(
  (relationship) => relationship.value,
)

export const childSchema = z.object({
  name: z.string().trim().min(2, 'Enter the child\u2019s first and last name'),
  dateOfBirth: z.string().min(1, 'Select a date of birth'),
  gender: z.enum(GENDER_VALUES),
  caregiverName: z
    .string()
    .trim()
    .max(100, 'Keep the caregiver name under 100 characters')
    .optional(),
  relationship: z.enum(RELATIONSHIP_VALUES).or(z.literal('')).optional(),
  notes: z.string().trim().max(500, 'Keep notes under 500 characters').optional(),
})

export function defaultChildValues(child) {
  return {
    name: child?.name ?? '',
    dateOfBirth: child?.dateOfBirth ?? '',
    gender:
      child?.gender && GENDER_VALUES.includes(child.gender)
        ? child.gender
        : 'prefer-not-to-say',
    caregiverName: child?.caregiverName ?? '',
    relationship:
      child?.relationship && RELATIONSHIP_VALUES.includes(child.relationship)
        ? child.relationship
        : '',
    notes: child?.notes ?? '',
  }
}