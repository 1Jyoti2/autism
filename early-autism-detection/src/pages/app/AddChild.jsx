import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ShieldCheck, Sparkles, ClipboardCheck } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { Card, CardHeader, BackButton } from '../../components/common'
import { ChildForm } from '../../components/children'
import { useChildren } from '../../context/ChildContext'
import { childDetailPath, ROUTES } from '../../lib/constants'

const STEPS = [
  {
    icon: ClipboardCheck,
    title: 'Profile first',
    text: 'Register the child\u2019s details so screenings are tied to the right record.',
  },
  {
    icon: Sparkles,
    title: 'Screen in minutes',
    text: 'A science-backed questionnaire surfaces an immediate likelihood signal.',
  },
  {
    icon: ShieldCheck,
    title: 'Follow through',
    text: 'Review progress over time and share reports with your pediatrician.',
  },
]

export default function AddChild() {
  const { addChild } = useChildren()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const submit = async (values) => {
    setSaving(true)
    try {
      const child = await addChild({
        ...values,
        notes: values.notes || '',
        caregiverName: values.caregiverName || '',
      })
      navigate(childDetailPath(child.id))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton fallback={ROUTES.children} />

      <PageHeader
        icon={UserPlus}
        title="Add a child"
        subtitle="Create a profile to start tracking developmental milestones and screenings."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Child details"
            subtitle="Age is calculated automatically from the date of birth."
          />
          <ChildForm
            onSubmit={submit}
            submitLabel="Add child"
            loading={saving}
            onCancel={() => navigate(ROUTES.children)}
          />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="What happens next" subtitle="Three simple steps after adding a child." />
            <ol className="space-y-5">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <step.icon className="size-5" />
                    <span className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-surface-800">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-surface-500">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  )
}