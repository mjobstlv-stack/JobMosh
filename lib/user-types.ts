export type UserProfile = {
  id: string
  title: string
  name: string
  phone: string
  cvPath?: string
  cvFileName?: string
}

export type UserApplication = {
  jobId: string
  jobTitle: string
  company: string
  appliedAt: string
  profileId: string
}

export type User = {
  id: string
  email: string
  passwordHash: string
  createdAt: string
  profiles: UserProfile[]
  applications: UserApplication[]
}

export type PublicUser = Omit<User, "passwordHash">
