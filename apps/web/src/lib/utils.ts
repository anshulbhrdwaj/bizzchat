/** Smart timestamp formatting per CLAUDE.md */
export function formatTimestamp(dateStr: string | Date): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth()) {
    return 'Yesterday'
  }

  if (diffMs < 7 * 24 * 3600000) {
    return date.toLocaleDateString('en-IN', { weekday: 'short' })
  }

  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

/** Format timestamp for message bubbles — always show time */
export function formatMessageTime(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/** Format date separator */
export function formatDateSeparator(dateStr: string | Date): string {
  const date = new Date(dateStr)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === now.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 7 * 24 * 3600000) {
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Generate initials from name */
export function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

/** Format last seen (WhatsApp style) */
export function formatLastSeen(dateStr: string | Date): string {
  const date = new Date(dateStr)
  const now = new Date()
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === now.toDateString()) {
    return `today at ${timeStr}`
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `yesterday at ${timeStr}`
  }

  const dateForm = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${dateForm} at ${timeStr}`
}

/** Classname merge helper */
export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
