import { useEffect, useState } from 'react'
import { NotebookPen, Plus, Send, Clock, User } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { Card, Button, Input, PageSpinner, BackButton } from '../../components/common'
import { fetchNotes, createNote } from '../../services/dashboardService'
import { useAuth } from '../../context/AuthContext'
import { getRoleLabel } from '../../lib/roles'
import { ROUTES } from '../../lib/constants'

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await fetchNotes()
        setNotes(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    try {
      const newNote = await createNote({
        title: title.trim(),
        content: content.trim(),
        author: user?.name || 'Practitioner',
        role: getRoleLabel(user?.role),
        date: new Date().toLocaleDateString(),
      })
      setNotes((prev) => [newNote, ...prev])
      setTitle('')
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <BackButton fallback={ROUTES.dashboard} />
      <PageHeader
        icon={NotebookPen}
        title="Observation & Clinical Notes"
        subtitle="Log behavioral observations, care notes, and clinical assessment impressions."
      />

      {/* New Note Form */}
      <Card>
        <h3 className="font-display text-base font-bold text-surface-900 mb-4">Add Observation Note</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Note Title"
            placeholder="e.g. Afternoon play observation / Follow-up notes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
          />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1.5">
              Note Details
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-surface-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="Record observation details, behavioral cues, or recommendations..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              <Send className="mr-1.5 size-4" /> Save Note
            </Button>
          </div>
        </form>
      </Card>

      {/* Notes List */}
      <Card>
        <h3 className="font-display text-base font-bold text-surface-900 pb-3 border-b border-border mb-4">
          Logged Notes & Observations
        </h3>
        <div className="space-y-4 divide-y divide-border">
          {notes.map((item) => (
            <div key={item.id} className="pt-4 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display text-sm font-bold text-surface-900">{item.title}</h4>
                <div className="flex items-center gap-2 text-xs text-surface-400">
                  <span className="flex items-center gap-1">
                    <User className="size-3" /> {item.author} ({item.role})
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" /> {item.date}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-surface-600 bg-surface-50/60 p-3 rounded-xl border border-border">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
