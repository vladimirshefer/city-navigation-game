import { useState, useEffect } from 'react'
import { ALL_CARDS, CHALLENGES, CURSES, SPECIAL_CARDS } from '../data/challenges'

const STORAGE_KEY = 'berlin-game-state'
const TIMER_DURATION = 3600

export default function ChallengeSelector() {
  const [drawnCards, setDrawnCards] = useState(null)
  const [activeCard, setActiveCard] = useState(null)
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
      setActiveCard(state.activeCard)
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
    setActiveCard(drawn[0])
    setDrawnTime(now)
    setTimeLeft(TIMER_DURATION)

    saveToStorage({
      drawnCards: drawn,
      activeCard: drawn[0],
      drawnTime: now,
      history,
    })
  }

  const handleCompleteCard = () => {
    const newHistory = [
      { ...activeCard, completedAt: new Date().toLocaleString(), timeLeftWhenCompleted: timeLeft },
      ...history,
    ]

    const otherCard = drawnCards.find(c => c.id !== activeCard.id)

    if (otherCard) {
      setActiveCard(otherCard)
      saveToStorage({
        drawnCards,
        activeCard: otherCard,
        drawnTime,
        history: newHistory,
      })
    } else {
      setDrawnCards(null)
      setActiveCard(null)
      setDrawnTime(null)
      setTimeLeft(TIMER_DURATION)
      setHistory(newHistory)

      saveToStorage({
        drawnCards: null,
        activeCard: null,
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

  const getWaitingCard = () => {
    if (!drawnCards || !activeCard) return null
    return drawnCards.find(c => c.id !== activeCard.id)
  }

  const waitingCard = getWaitingCard()

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory('all')}
          disabled={!!activeCard}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${activeCard ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          All Cards
        </button>
        <button
          onClick={() => setCategory('challenges')}
          disabled={!!activeCard}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'challenges'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${activeCard ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Challenges
        </button>
        <button
          onClick={() => setCategory('curses')}
          disabled={!!activeCard}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'curses'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${activeCard ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Curses
        </button>
        <button
          onClick={() => setCategory('special')}
          disabled={!!activeCard}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'special'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${activeCard ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Special Cards
        </button>
      </div>

      <div className="space-y-4">
        {activeCard && (
          <div className={`bg-gradient-to-r ${getCategoryColor(activeCard)} rounded-xl p-8 text-white shadow-2xl`}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold opacity-90">{getCategoryLabel(activeCard)} #{activeCard.id}</div>
                  <h2 className="text-4xl font-bold mt-2">{activeCard.title}</h2>
                </div>
                <div className={`text-right text-3xl font-bold ${timeLeft < 300 ? 'animate-pulse' : ''}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
              <p className="text-lg leading-relaxed opacity-95">{activeCard.description}</p>
              {activeCard.points !== null && (
                <div className="pt-4 border-t border-white border-opacity-30">
                  <span className="text-2xl font-bold">+{activeCard.points} pts</span>
                </div>
              )}
            </div>
          </div>
        )}

        {waitingCard && (
          <div className={`bg-gradient-to-r ${getCategoryColor(waitingCard)} rounded-xl p-6 text-white shadow-lg opacity-60`}>
            <div className="space-y-2">
              <div className="text-sm font-bold opacity-90">{getCategoryLabel(waitingCard)} #{waitingCard.id}</div>
              <h3 className="text-2xl font-bold">{waitingCard.title}</h3>
              <p className="text-sm leading-relaxed opacity-95">{waitingCard.description}</p>
              <div className="text-xs pt-2 opacity-75">Waiting - Same timer: {formatTime(timeLeft)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {!activeCard && !drawnCards && (
          <button
            onClick={handleDrawCards}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition"
          >
            Draw 2 Cards
          </button>
        )}

        {activeCard && (
          <button
            onClick={handleCompleteCard}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition"
          >
            ✓ Challenge Complete {waitingCard ? '→ Next Card' : ''}
          </button>
        )}
      </div>

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
