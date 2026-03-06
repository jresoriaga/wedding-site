// [OWASP:A3] Input validation — server + client both call this
// Returns null if valid, or error message string if invalid
export function validateName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Please enter your name.'
  }
  if (name.trim().length > 50) {
    return 'Name must be 50 characters or fewer.'
  }
  return null
}

export function sanitizeName(name: string): string {
  return name.trim()
}
