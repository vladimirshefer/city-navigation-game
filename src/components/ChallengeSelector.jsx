import { useState, useEffect } from 'react'
import { ALL_CARDS, CHALLENGES, CURSES, SPECIAL_CARDS } from '../data/challenges'

const STORAGE_KEY = 'berlin-game-state'
const TIMER_DURATION = 3600

export default function ChallengeSelector() {
  const [drawnCards, setDrawnCards] = useState(null)
  const [drawnTime, setDrawnTime] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION)
  const [history, setHistory] = useState([])
  const [category, setCategory] = useState('all')

  useEffect(() => {
    loadFromStorage()
  }, [])

  useEffect(() => {
    if (!drawnTime) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [drawnTime])

  const loadFromStorage = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const state = JSON.parse(saved)
      setDrawnCards(state.drawnCards)
      setDrawnTime(state.drawnTime)
      setHistory(state.history)

      if (state.drawnTime) {
        const elapsed = Math.floor((Date.now() - state.drawnTime) / 1000)
        const remaining = Math.max(0, TIMER_DURATION - elapsed)
        setTimeLeft(remaining)
      }
    }
  }

  const saveToStorage = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const getRandomCards = (cards) => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    return [shuffled[0], shuffled[1]]
  }

  const handleDrawCards = () => {
    let cards = ALL_CARDS
    if (category === 'challenges') cards = CHALLENGES
    else if (category === 'curses') cards = CURSES
    else if (category === 'special') cards = SPECIAL_CARDS

    const drawn = getRandomCards(cards)
    const now = Date.now()

    setDrawnCards(drawn)
    setDrawnTime(now)
    setTimeLeft(TIMER_DURATION)

    saveToStorage({
      drawnCards: drawn,
      drawnTime: now,
      history,
    })
  }

  const handleCompleteCard = (cardId) => {
    const completedCard = drawnCards.find(c => c.id === cardId)
    const newHistory = [
      { ...completedCard, completedAt: new Date().toLocaleString(), timeLeftWhenCompleted: timeLeft },
      ...history,
    ]

    const remaining = drawnCards.filter(c => c.id !== cardId)

    if (remaining.length > 0) {
      setDrawnCards(remaining)
      saveToStorage({
        drawnCards: remaining,
        drawnTime,
        history: newHistory,
      })
    } else {
      setDrawnCards(null)
      setDrawnTime(null)
      setTimeLeft(TIMER_DURATION)
      setHistory(newHistory)

      saveToStorage({
        drawnCards: null,
        drawnTime: null,
        history: newHistory,
      })
    }
  }

  const getCategoryColor = (card) => {
    if (card.id >= 1 && card.id <= 4) return 'from-purple-500 to-pink-500'
    if (card.id >= 90 && card.id <= 99) return 'from-red-500 to-orange-500'
    return 'from-blue-500 to-cyan-500'
  }

  const getCategoryLabel = (card) => {
    if (card.id >= 1 && card.id <= 4) return 'SPECIAL CARD'
    if (card.id >= 90 && card.id <= 99) return 'CURSE'
    return 'CHALLENGE'
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory('all')}
          disabled={!!drawnCards}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${drawnCards ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          All Cards
        </button>
        <button
          onClick={() => setCategory('challenges')}
          disabled={!!drawnCards}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'challenges'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${drawnCards ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Challenges
        </button>
        <button
          onClick={() => setCategory('curses')}
          disabled={!!drawnCards}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'curses'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${drawnCards ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Curses
        </button>
        <button
          onClick={() => setCategory('special')}
          disabled={!!drawnCards}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'special'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${drawnCards ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Special Cards
        </button>
      </div>

      {drawnCards && (
        <div className="flex justify-between items-start gap-2">
          <div className={`text-4xl font-bold ${timeLeft < 300 ? 'animate-pulse text-red-600' : 'text-gray-800'}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-gray-600">
            {drawnCards.length} card{drawnCards.length !== 1 ? 's' : ''} remaining
          </div>
        </div>
      )}

      {drawnCards && (
        <div className={`grid gap-6 ${drawnCards.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {drawnCards.map((card) => (
            <div
              key={card.id}
              className={`bg-gradient-to-r ${getCategoryColor(card)} rounded-xl p-8 text-white shadow-2xl flex flex-col`}
            >
              <div className="space-y-4 flex-1">
                <div className="text-sm font-bold opacity-90">{getCategoryLabel(card)} #{card.id}</div>
                <h2 className="text-3xl font-bold">{card.title}</h2>
                <p className="text-lg leading-relaxed opacity-95">{card.description}</p>
                {card.points !== null && (
                  <div className="pt-4 border-t border-white border-opacity-30">
                    <span className="text-2xl font-bold">+{card.points} pts</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCompleteCard(card.id)}
                className="mt-6 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-3 px-4 rounded-lg transition border border-white border-opacity-30"
              >
                ✓ Complete
              </button>
            </div>
          ))}
        </div>
      )}

      {!drawnCards && (
        <button
          onClick={handleDrawCards}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition"
        >
          Draw 2 Cards
        </button>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Completed Challenges</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((card, idx) => (
              <div
                key={idx}
                className="bg-gray-100 p-3 rounded-lg text-sm text-gray-700 border-l-4 border-green-500"
              >
                <div className="font-semibold">#{card.id} - {card.title}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {card.completedAt} · {card.points !== null ? `+${card.points} pts` : 'Variable points'} · {formatTime(card.timeLeftWhenCompleted)} remaining
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
