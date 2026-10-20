import { useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { Card, CardHeader, BackButton } from '../../components/common'
import { ChildForm } from '../../components/children'
import { useChildren } from '../../context/ChildContext'
import { childDetailPath, ROUTES } from '../../lib/constants'

export default function EditChild() {
  const { id } = useParams()
  const { children, status, updateChild } = useChildren()
  const navigate = useNavigate()

  const child = children.find((record) => record.id === id)
  const [saving, setSaving] = useState(false)

  const submit = async (values) => {
    if (!child) return
    setSaving(true)
    try {
      await updateChild(child.id, {
        ...values,
        notes: values.notes || '',
        caregiverName: values.caregiverName || '',
      })
      navigate(childDetailPath(child.id))
    } finally {
      setSaving(false)
    }
  }

  if (status !== 'loading' && !child) {
    return (
      <Navigate to={ROUTES.children} replace />
    )
  }

  return (
    <div className="space-y-6">
      <BackButton fallback={child ? childDetailPath(child.id) : ROUTES.children} />

      <PageHeader
        icon={Pencil}
        title={child ? `Edit ${child.name}` : 'Edit child'}
        subtitle="Keep the profile details current so screenings stay accurate."
      />

      {status === 'loading' ? (
        <Card className="animate-pulse">
          <div className="space-y-4 p-6">
            <div className="h-10 rounded-lg bg-surface-200" />
            <div className="h-10 rounded-lg bg-surface-200" />
            <div className="h-24 rounded-lg bg-surface-200" />
          </div>
        </Card>
      ) : child ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Profile details"
              subtitle="Changes save instantly to this child's record."
            />
            <ChildForm
              initialValues={child}
              onSubmit={submit}
              submitLabel="Save changes"
              loading={saving}
              onCancel={() => navigate(childDetailPath(child.id))}
            />
          </Card>

          <Card>
            <CardHeader title="Editing tips" />
            <ul className="space-y-2.5 text-sm leading-relaxed text-surface-600">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-500" />
                Age is recalculated automatically from the date of birth.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-500" />
                Caregiver details are optional but help reports stay personal.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-500" />
                Notes carry over into future screenings for context.
              </li>
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  )
}