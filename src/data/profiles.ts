import { Card } from './challenges'

export const PROFILES_STORAGE_KEY = 'berlin-game-profiles'
export const ACTIVE_PROFILE_STORAGE_KEY = 'berlin-active-profile'
const LEGACY_STORAGE_KEY = 'berlin-game-state'

export type HistoryCard = Card & {
  completedAt: string
  timeLeftWhenCompleted: number
  isCurse: boolean
  status?: 'completed' | 'expired'
}

export interface Fahrkarte {
  id: string
  cost: number
  stops: number
  durationSeconds: number
  purchasedAt: string
  expiresAt: number
}

export interface GameState {
  drawnCards: Card[] | null
  cardTimestamps: Record<number, number>
  history: HistoryCard[]
  coinEdits: { timestamp: string; previousAmount: number; newAmount: number; comment: string }[]
  activeCurse: Card | null
  curseTimestamp: number | null
  gameStartTime: number | null
  lastCurseTime: number | null
  coins: number
  activeFahrkarte: Fahrkarte | null
  fahrkartenHistory: Fahrkarte[]
}

export interface GameProfile {
  id: string
  createdAt: string
  updatedAt: string
  state: GameState
}

const isObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
)

const parseStorageValue = (key: string): unknown => {
  const saved = localStorage.getItem(key)
  if (!saved) return null

  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

const isGameState = (value: unknown): value is GameState => (
  isObject(value) && 'drawnCards' in value && 'cardTimestamps' in value && 'history' in value
)

const createProfileId = (): string => {
  const randomPart = Math.random().toString(36).slice(2, 8)
  return `profile-${Date.now()}-${randomPart}`
}

const writeProfiles = (profiles: GameProfile[]): void => {
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles))
}

const migrateLegacyState = (): GameProfile[] => {
  const legacyState = parseStorageValue(LEGACY_STORAGE_KEY)
  if (!isGameState(legacyState)) return []

  const now = new Date().toISOString()
  const profile: GameProfile = {
    id: createProfileId(),
    createdAt: now,
    updatedAt: now,
    state: legacyState,
  }

  writeProfiles([profile])
  localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profile.id)
  return [profile]
}

export const getProfiles = (): GameProfile[] => {
  const storedProfiles = parseStorageValue(PROFILES_STORAGE_KEY)
  if (Array.isArray(storedProfiles)) {
    const profiles = storedProfiles.filter((profile): profile is GameProfile => (
      isObject(profile) && typeof profile.id === 'string' && isGameState(profile.state)
    ))
    if (profiles.length > 0) return profiles
  }

  return migrateLegacyState()
}

export const getActiveProfile = (): GameProfile | null => {
  const profiles = getProfiles()
  if (profiles.length === 0) return null

  const activeId = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)
  const activeProfile = profiles.find((profile) => profile.id === activeId) || profiles[0]
  if (activeProfile.id !== activeId) {
    localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, activeProfile.id)
  }

  return activeProfile
}

export const saveActiveGameState = (state: GameState): void => {
  const profiles = getProfiles()
  const activeProfile = getActiveProfile()
  const now = new Date().toISOString()

  if (!activeProfile) {
    const profile: GameProfile = {
      id: createProfileId(),
      createdAt: now,
      updatedAt: now,
      state,
    }
    writeProfiles([profile])
    localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profile.id)
    return
  }

  const updatedProfiles = profiles.map((profile) => (
    profile.id === activeProfile.id ? { ...profile, state, updatedAt: now } : profile
  ))
  writeProfiles(updatedProfiles)
}

export const createGameProfile = (state: GameState): GameProfile => {
  const profiles = getProfiles()
  const now = new Date().toISOString()
  const profile: GameProfile = {
    id: createProfileId(),
    createdAt: now,
    updatedAt: now,
    state,
  }

  writeProfiles([...profiles, profile])
  localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profile.id)
  return profile
}

export const setActiveProfile = (profileId: string): boolean => {
  const profile = getProfiles().find((candidate) => candidate.id === profileId)
  if (!profile) return false

  localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profile.id)
  return true
}
