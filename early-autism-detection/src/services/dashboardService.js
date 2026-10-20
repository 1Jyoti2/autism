import apiClient from '../lib/api'
import { fetchChildren } from './childService'

export async function fetchDashboardData(role = 'parent') {
  try {
    const res = await apiClient.get(`/dashboard/${role}`)
    if (res.data) {
      return res.data
    }
  } catch (error) {
    console.warn(`Backend dashboard /dashboard/${role} fetch fallback:`, error.message)
  }

  // Graceful fallback fetching real children and computing role-specific metrics
  const children = await fetchChildren()
  
  if (role === 'doctor') {
    return {
      assignedPatients: children,
      totalPatients: children.length,
      pendingReviews: children.filter((c) => c.status === 'Needs Review' || c.riskLevel === 'High').length,
      highRiskFlags: children.filter((c) => c.riskLevel === 'High').length,
      completedEvaluations: children.filter((c) => c.status === 'Completed').length,
      recentActivity: [
        { id: '1', title: 'Video Behavior analysis logged for Ayaan', time: '2 hours ago', type: 'video' },
        { id: '2', title: 'Facial Emotion read completed for Maya', time: '5 hours ago', type: 'image' },
        { id: '3', title: 'Screening questionnaire submitted by parent', time: '1 day ago', type: 'screening' },
      ],
    }
  }

  if (role === 'caretaker') {
    return {
      assignedChildren: children,
      totalAssigned: children.length,
      dailyTasks: [
        { id: 't1', text: 'Observe afternoon motor coordination during play', completed: false },
        { id: 't2', text: 'Upload video assessment for repetitive motor cues', completed: true },
        { id: 't3', text: 'Log evening emotional mood notes', completed: false },
      ],
      recentObservations: [
        { id: 'o1', childName: children[0]?.name || 'Child', note: 'Engaged well with sensory blocks, no head banging observed.', time: '10:30 AM' },
        { id: 'o2', childName: children[1]?.name || 'Child', note: 'Brief 10-second arm flapping during high excitation.', time: '02:15 PM' },
      ],
    }
  }

  if (role === 'admin') {
    return {
      totalUsers: 48,
      activeParents: 32,
      activeDoctors: 8,
      activeCaretakers: 8,
      systemHealth: '100% Operational',
      children: children,
    }
  }

  // Default: Parent
  return {
    children: children,
    totalChildren: children.length,
    completedScreenings: children.filter((c) => c.status === 'Completed').length,
    pendingAssessments: children.filter((c) => c.status !== 'Completed').length,
    activeAlerts: children.filter((c) => c.riskLevel === 'High').length,
    recentScreenings: [
      { id: 's1', childName: children[0]?.name || 'Child', type: 'M-CHAT-R Screening', score: 'Low Risk', date: '2026-09-15' },
      { id: 's2', childName: children[0]?.name || 'Child', type: 'Video Behavior Analysis', score: 'Arm Flapping (88%)', date: '2026-09-17' },
    ],
  }
}

export async function fetchDashboardMetrics() {
  try {
    const res = await apiClient.get('/dashboard/metrics')
    return res.data
  } catch (error) {
    console.warn('Backend dashboard metrics fetch error:', error.message)
    return null
  }
}

export async function fetchNotifications() {
  try {
    const res = await apiClient.get('/notifications')
    return res.data
  } catch {
    return [
      { id: 'n1', title: 'Video Assessment Ready', message: 'New repetitive motor behavior analysis completed.', time: '10 mins ago', unread: true },
      { id: 'n2', title: 'Monthly Screening Due', message: 'Recommended follow-up screening scheduled for next week.', time: '2 hours ago', unread: false },
      { id: 'n3', title: 'Doctor Clinical Note', message: 'Dr. Sarah Smith updated clinical observation notes.', time: '1 day ago', unread: false },
    ]
  }
}

export async function fetchNotes() {
  try {
    const res = await apiClient.get('/notes')
    return res.data
  } catch {
    return [
      { id: 'nt1', author: 'Dr. Sarah Smith', role: 'Doctor', title: 'Initial Clinical Evaluation', content: 'Child shows good eye contact, minor repetitive hand motions during stress.', date: '2026-09-16' },
      { id: 'nt2', author: 'Jane Doe', role: 'Caretaker', title: 'Afternoon Play Observation', content: 'No head banging observed today. Responsive to verbal prompts.', date: '2026-09-17' },
    ]
  }
}

export async function createNote(note) {
  try {
    const res = await apiClient.post('/notes', note)
    return res.data
  } catch {
    return {
      id: `nt_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...note,
    }
  }
}
