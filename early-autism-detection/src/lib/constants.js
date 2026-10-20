export const APP_NAME = 'Early Autism Detection'

export const APP_TAGLINE =
  'Machine learning powered screening for early autism detection in children'

export const APP_DISCLAIMER =
  'This platform is a screening aid and does not provide a medical diagnosis. Always consult a qualified healthcare professional.'

export const CONTACT_EMAIL = 'support@earlyautismdetection.org'

export const ROUTES = {
  home: '/',
  about: '/about',
  howItWorks: '/how-it-works',
  login: '/login',
  register: '/register',
  terms: '/terms',
  privacy: '/privacy',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  parentDashboard: '/parent-dashboard',
  doctorDashboard: '/doctor-dashboard',
  caretakerDashboard: '/caretaker-dashboard',
  adminDashboard: '/admin-dashboard',
  children: '/children',
  addChild: '/children/new',
  childDetail: '/children/:id',
  childEdit: '/children/:id/edit',
  assessment: '/assessment',
  screening: '/screening',
  screeningResult: '/screening/result',
  emotionAnalysis: '/emotion-analysis',
  videoAnalysis: '/video-analysis',
  progress: '/progress',
  reports: '/reports',
  history: '/history',
  notifications: '/notifications',
  notes: '/notes',
  profile: '/profile',
  settings: '/settings',
  notFound: '/404',
}

export const NAV_LINKS = {
  public: [
    { label: 'Home', to: ROUTES.home },
    { label: 'About', to: ROUTES.about },
    { label: 'How It Works', to: ROUTES.howItWorks },
  ],
  app: [
    { label: 'Dashboard', to: ROUTES.dashboard },
    { label: 'Assessment', to: ROUTES.assessment },
    { label: 'History', to: ROUTES.history },
  ],
}

export const STORAGE_KEYS = {
  token: 'authToken',
  user: 'authUser',
  selectedChild: 'selectedChildId',
  children: 'appChildren',
  screenings: 'appScreenings',
  currentScreening: 'currentScreening',
}

export const childDetailPath = (id) => ROUTES.childDetail.replace(':id', id)

export const childEditPath = (id) => ROUTES.childEdit.replace(':id', id)