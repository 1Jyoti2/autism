export function uid(prefix = 'id') {
  const rand = Math.random().toString(36).slice(2, 9)
  return `${prefix}_${Date.now().toString(36)}${rand}`
}

export function initialsOf(name) {
  return (name ?? '')
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function getAgeFromDOB(dateOfBirth) {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  const monthDiff = now.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    years -= 1
  }
  if (years >= 1) {
    return { label: `${years} yr${years === 1 ? '' : 's'}`, years }
  }
  const months = Math.max(
    0,
    (now.getFullYear() - dob.getFullYear()) * 12 + now.getMonth() - dob.getMonth(),
  )
  return { label: `${months} mo${months === 1 ? '' : 's'}`, years: 0 }
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function readImageAsDataUrl(file, maxDimension = 720, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Could not decode image'))
      image.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
        const width = Math.max(1, Math.round(image.naturalWidth * scale))
        const height = Math.max(1, Math.round(image.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}