export const ANSWER_OPTIONS = [
  { value: 0, label: 'Always' },
  { value: 1, label: 'Often' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Never' },
]

export const SCREENING_DOMAINS = [
  {
    key: 'socialInteraction',
    label: 'Social Interaction',
    description: 'How your child engages, connects, and reciprocates with parents and peers.',
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'Verbal communication, gestures, and responding to instructions.',
  },
  {
    key: 'repetitiveBehavior',
    label: 'Restricted & Repetitive Behaviors',
    description: 'Flexibility with routines and repetitive motor behaviors.',
  },
  {
    key: 'sensory',
    label: 'Sensory Sensitivity',
    description: 'Reactions to everyday ambient sounds, touch, and textures.',
  },
]

export const screeningQuestions = [
  // --- Social Interaction (3 Questions) ---
  {
    id: 'q_si_01',
    domain: 'socialInteraction',
    text: 'My child responds promptly when their name is called by turning, looking, or vocalizing.',
  },
  {
    id: 'q_si_02',
    domain: 'socialInteraction',
    text: 'My child makes warm, natural eye contact and smiles back during face-to-face interactions.',
  },
  {
    id: 'q_si_03',
    domain: 'socialInteraction',
    text: 'My child shows shared enjoyment by pointing to show interesting toys or events to others.',
  },

  // --- Communication (3 Questions) ---
  {
    id: 'q_co_01',
    domain: 'communication',
    text: 'My child uses gestures like waving goodbye, nodding, or pointing to communicate what they want.',
  },
  {
    id: 'q_co_02',
    domain: 'communication',
    text: 'My child uses spoken words, word approximations, or intentional sounds to communicate with family members.',
  },
  {
    id: 'q_co_03',
    domain: 'communication',
    text: 'My child understands and follows simple verbal instructions (such as "come here" or "give me the toy").',
  },

  // --- Restricted & Repetitive Behaviors (2 Questions) ---
  {
    id: 'q_rb_01',
    domain: 'repetitiveBehavior',
    text: 'My child adapts comfortably to transitions and small changes in routine without severe distress.',
  },
  {
    id: 'q_rb_02',
    domain: 'repetitiveBehavior',
    text: 'My child plays flexibly with toys rather than repeating motor movements like hand-flapping, spinning, or rigid lining up.',
  },

  // --- Sensory Sensitivity (2 Questions) ---
  {
    id: 'q_se_01',
    domain: 'sensory',
    text: 'My child tolerates everyday ambient sounds (such as vacuum cleaners, blenders, or hair dryers) without extreme distress.',
  },
  {
    id: 'q_se_02',
    domain: 'sensory',
    text: 'My child comfortably tolerates everyday tactile sensations such as clothing tags, socks, or getting hands messy during play.',
  },
]

export function getQuestionsForDomain(domainKey) {
  return screeningQuestions.filter((question) => question.domain === domainKey)
}

export function getDomainLabel(domainKey) {
  return SCREENING_DOMAINS.find((domain) => domain.key === domainKey)?.label ?? domainKey
}