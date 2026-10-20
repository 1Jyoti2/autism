/**
 * Safe, Age-Appropriate Developmental Recommendation Engine.
 *
 * IMPORTANT CLINICAL CONSTRAINT:
 * Provides safe, supportive developmental activities and professional referral pathways.
 * Never claims an autism diagnosis or prescribes medications/treatments.
 */

export function getAgeBracket(ageMonths) {
  if (!ageMonths || isNaN(ageMonths)) return { key: 'toddler', label: 'Toddler (18–36 months)' }
  if (ageMonths <= 24) return { key: 'infant_toddler', label: 'Toddler (12–24 months)' }
  if (ageMonths <= 36) return { key: 'early_preschool', label: 'Early Preschool (25–36 months)' }
  if (ageMonths <= 60) return { key: 'preschool', label: 'Preschool (3–5 years)' }
  return { key: 'school_age', label: 'Early School Age (5+ years)' }
}

export function generatePersonalizedRecommendations({ child, screening, imageResult, videoResult }) {
  const ageMonths = child?.ageMonths || 24
  const bracket = getAgeBracket(ageMonths)

  const domainScores = screening?.domainScores || {}
  const siScore = domainScores.socialInteraction || 0
  const coScore = domainScores.communication || 0
  const rbScore = domainScores.repetitiveBehavior || 0
  const seScore = domainScores.sensory || 0

  const hasHighSocialFlag = siScore >= 7
  const hasHighCommFlag = coScore >= 7
  const hasHighRepFlag = rbScore >= 7 || videoResult?.hasAutismSigns
  const hasHighSensoryFlag = seScore >= 7
  const hasAtypicalAffect = imageResult?.hasAutismSigns

  const strategies = []
  const professionalReferrals = []

  // 1. Social & Joint Attention Strategies
  if (hasHighSocialFlag || hasAtypicalAffect) {
    if (bracket.key === 'infant_toddler') {
      strategies.push({
        domain: 'Social Engagement',
        icon: 'heart',
        title: 'Joint Attention & Eye-Level Play',
        description: 'Sit face-to-face during floor play. Hold favorite toys close to your eyes before handing them over to naturally encourage shared gaze and connection.',
      })
      strategies.push({
        domain: 'Social Engagement',
        icon: 'smile',
        title: 'Turn-Taking Peek-a-Boo & Roll-the-Ball',
        description: 'Use simple, predictable back-and-forth games like rolling a soft ball or hiding behind a blanket with joyful facial expressions.',
      })
    } else {
      strategies.push({
        domain: 'Social Engagement',
        icon: 'users',
        title: 'Shared Focus & Parallel Play',
        description: 'Engage alongside your child in their preferred activity (blocks, puzzles) without directing. Imitate their play actions first, then introduce gentle collaborative turns.',
      })
      strategies.push({
        domain: 'Social Engagement',
        icon: 'heart',
        title: 'Emotion Mirroring & Labeling',
        description: 'Use storybooks with illustrated expressions to playfully label emotions ("The puppy looks excited! Look at his big smile").',
      })
    }
  } else {
    strategies.push({
      domain: 'Social Engagement',
      icon: 'sparkles',
      title: 'Positive Shared Milestone Play',
      description: 'Continue daily interactive floor time with family members, encouraging reciprocal smiling, clapping, and celebratory high-fives.',
    })
  }

  // 2. Communication & Gesture Strategies
  if (hasHighCommFlag) {
    if (bracket.key === 'infant_toddler') {
      strategies.push({
        domain: 'Communication',
        icon: 'message',
        title: 'Pointing & Gesture Modeling',
        description: 'Exaggerate pointing at desired snacks, animals, or objects while naming them clearly ("Look! Ball!"). Model hand-over-hand waving goodbye.',
      })
      strategies.push({
        domain: 'Communication',
        icon: 'volume',
        title: 'Pause & Wait Strategy',
        description: 'When your child reaches for a familiar item, pause for 3–5 seconds with an expectant smile to create space for a sound, gesture, or vocal attempt.',
      })
    } else {
      strategies.push({
        domain: 'Communication',
        icon: 'message',
        title: 'Visual Choice Cards',
        description: 'Offer choices using two visible objects or picture cards (e.g. water cup vs apple) to reinforce intentional communication and reduce frustration.',
      })
      strategies.push({
        domain: 'Communication',
        icon: 'book',
        title: 'Interactive Dialogic Reading',
        description: 'Read familiar picture books, pointing to details and asking simple "Where is the...?" questions with plenty of time to respond.',
      })
    }
  } else {
    strategies.push({
      domain: 'Communication',
      icon: 'message',
      title: 'Rich Language Exposure',
      description: 'Narrate daily routines ("Now we put on the red shoe, then the blue shoe") to build vocabulary and receptive communication.',
    })
  }

  // 3. Repetitive Motion & Motor Regulation
  if (hasHighRepFlag) {
    strategies.push({
      domain: 'Motor Regulation',
      icon: 'activity',
      title: 'Comforting Replacement Motor Outlets',
      description: 'Provide soft squeeze toys, play dough, or rhythm drumming when repetitive hand motions or excitement surges occur, offering comfortable proprioceptive feedback.',
    })
    strategies.push({
      domain: 'Sensory & Motor',
      icon: 'shield',
      title: 'Calming Movement Breaks',
      description: 'Incorporate scheduled gentle movement activities (bear crawls, mini-trampoline bounces, swinging) into daily play routines to support nervous system regulation.',
    })
  }

  // 4. Sensory Comfort & Routine
  if (hasHighSensoryFlag) {
    strategies.push({
      domain: 'Sensory Support',
      icon: 'shield',
      title: 'Sensory Quiet Corner & Routine Buffer',
      description: 'Create a cozy, low-stimulation quiet corner with pillows and dimmable lighting where your child can decompress when sounds or lights become overwhelming.',
    })
    strategies.push({
      domain: 'Sensory Support',
      icon: 'calendar',
      title: 'Predictable Visual Schedule',
      description: 'Use a visual morning and bedtime picture sequence so transitions between activities feel predictable, safe, and calm.',
    })
  }

  // Professional Referral Pathways (Safe, recommended follow-ups)
  professionalReferrals.push({
    role: 'Primary Care Pediatrician',
    timing: 'Next routine visit or within 2–4 weeks',
    purpose: 'Share this unified summary report for an in-person physical milestone checkup and formal developmental surveillance.',
    priority: 'standard',
  })

  if (hasHighCommFlag || coScore >= 5) {
    professionalReferrals.push({
      role: 'Pediatric Speech-Language Pathologist (SLP)',
      timing: 'Recommended for consultation',
      purpose: 'Evaluate expressive and receptive communication milestones, social reciprocity, and functional gesture development.',
      priority: 'high',
    })
  }

  if (hasHighRepFlag || hasHighSensoryFlag || seScore >= 5) {
    professionalReferrals.push({
      role: 'Pediatric Occupational Therapist (OT)',
      timing: 'Recommended for consultation',
      purpose: 'Assess sensory processing patterns, motor coordination, and self-regulation routines.',
      priority: 'high',
    })
  }

  if (screening?.likelihood === 'High' || (hasHighSocialFlag && hasHighCommFlag)) {
    professionalReferrals.push({
      role: 'Developmental-Behavioral Pediatrician or Child Psychologist',
      timing: 'Specialist consultation',
      purpose: 'Conduct comprehensive clinical developmental assessment and individualized early intervention planning.',
      priority: 'high',
    })
  }

  if (hasHighCommFlag) {
    professionalReferrals.push({
      role: 'Pediatric Audiologist',
      timing: 'Initial evaluation',
      purpose: 'Standard screening to confirm normal hearing sensitivity as a foundational step for speech development.',
      priority: 'routine',
    })
  }

  return {
    ageBracket: bracket,
    strategies,
    professionalReferrals,
    disclaimer:
      'These personalized developmental strategies are non-prescriptive, safe home suggestions intended to support parent-child engagement. This platform does not provide a medical autism diagnosis or prescribe clinical treatment. Consult qualified healthcare professionals for formal evaluation.',
  }
}
