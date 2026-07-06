export type UserProfile = {
  id: string
  title: string       // label for this CV (e.g. "מפתח Full Stack")
  cvPath?: string
  cvFileName?: string
  // legacy: name/phone kept for backward compat with old blob data
  name?: string
  phone?: string
}

export type UserApplication = {
  jobId: string
  jobTitle: string
  company: string
  appliedAt: string   // ISO date YYYY-MM-DD
  profileId: string
}

export type User = {
  id: string
  email: string
  passwordHash: string
  name: string        // full name — set at registration
  phone: string       // phone — set at registration
  createdAt: string
  profiles: UserProfile[]
  applications: UserApplication[]
}

export type PublicUser = Omit<User, "passwordHash">
