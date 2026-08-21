import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GameProfile, getActiveProfile, getProfiles, setActiveProfile } from '../data/profiles'

const formatDate = (value: string): string => new Date(value).toLocaleString()

export default function Profiles() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<GameProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)

  useEffect(() => {
    const loadedProfiles = getProfiles()
    setProfiles(loadedProfiles)
    setActiveProfileId(getActiveProfile()?.id || null)
  }, [])

  const handleSelect = (profileId: string): void => {
    if (!setActiveProfile(profileId)) return
    setActiveProfileId(profileId)
    navigate('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Profiles</h1>
        <p className="mt-2 text-gray-600">Every profile keeps its own cards, curses, coins, and history.</p>
      </div>

      <div className="space-y-3">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId
          return (
            <div key={profile.id} className={`rounded-lg border p-4 ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{profile.id} {isActive && <span className="text-blue-600">(active)</span>}</div>
                  <div className="mt-1 text-sm text-gray-600">Created {formatDate(profile.createdAt)} · Saved {formatDate(profile.updatedAt)}</div>
                  <div className="mt-1 text-sm text-gray-600">💰 {profile.state.coins} coins · {profile.state.history.length} history entries</div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Switch to ${profile.id}?`)) handleSelect(profile.id)
                  }}
                  disabled={isActive}
                  className={`rounded-lg px-4 py-2 font-bold transition ${isActive ? 'cursor-default bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {isActive ? 'Current Profile' : 'Use Profile'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Link to="/" className="inline-block text-blue-600 hover:text-blue-800">
        ← Back to game
      </Link>
    </div>
  )
}
