import { useState, useEffect } from 'react'
import { ALL_CARDS, CHALLENGES, CURSES, SPECIAL_CARDS } from '../data/challenges'

const STORAGE_KEY = 'berlin-game-state'
const TIMER_DURATION = 3600

export default function ChallengeSelector() {
  const [availableCards, setAvailableCards] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedCardTime, setSelectedCardTime] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION)
  const [history, setHistory] = useState([])
  const [category, setCategory] = useState('all')

  useEffect(() => {
    loadFromStorage()
  }, [])

  useEffect(() => {
    if (!selectedCard) return

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
  }, [selectedCard])

  const loadFromStorage = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const state = JSON.parse(saved)
      setAvailableCards(state.availableCards)
      setSelectedCard(state.selectedCard)
      setSelectedCardTime(state.selectedCardTime)
      setHistory(state.history)

      if (state.selectedCard && state.selectedCardTime) {
        const elapsed = Math.floor((Date.now() - state.selectedCardTime) / 1000)
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
    setAvailableCards(drawn)
    setSelectedCard(null)
    setSelectedCardTime(null)
    setTimeLeft(TIMER_DURATION)

    saveToStorage({
      availableCards: drawn,
      selectedCard: null,
      selectedCardTime: null,
      history,
    })
  }

  const handleSelectCard = (card) => {
    const now = Date.now()
    setSelectedCard(card)
    setSelectedCardTime(now)
    setTimeLeft(TIMER_DURATION)
    setAvailableCards(null)

    saveToStorage({
      availableCards: null,
      selectedCard: card,
      selectedCardTime: now,
      history,
    })
  }

  const handleCompleteCard = () => {
    setHistory([
      { ...selectedCard, completedAt: new Date().toLocaleString(), timeLeftWhenCompleted: timeLeft },
      ...history,
    ])
    setSelectedCard(null)
    setSelectedCardTime(null)
    setAvailableCards(null)
    setTimeLeft(TIMER_DURATION)

    saveToStorage({
      availableCards: null,
      selectedCard: null,
      selectedCardTime: null,
      history: [
        { ...selectedCard, completedAt: new Date().toLocaleString(), timeLeftWhenCompleted: timeLeft },
        ...history,
      ],
    })
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
          disabled={!!selectedCard}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${selectedCard ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          All Cards
        </button>
        <button
          onClick={() => setCategory('challenges')}
          disabled={!!selectedCard}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'challenges'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${selectedCard ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Challenges
        </button>
        <button
          onClick={() => setCategory('curses')}
          disabled={!!selectedCard}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'curses'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${selectedCard ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Curses
        </button>
        <button
          onClick={() => setCategory('special')}
          disabled={!!selectedCard}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'special'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${selectedCard ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Special Cards
        </button>
      </div>

      {availableCards && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Choose one:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleSelectCard(card)}
                className={`bg-gradient-to-r ${getCategoryColor(card)} rounded-lg p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition text-left`}
              >
                <div className="text-sm font-bold opacity-90">{getCategoryLabel(card)} #{card.id}</div>
                <h3 className="text-xl font-bold mt-2">{card.title}</h3>
                <p className="text-sm leading-relaxed mt-3 opacity-95">{card.description}</p>
                {card.points !== null && (
                  <div className="pt-3 border-t border-white border-opacity-30 mt-3">
                    <span className="font-bold">+{card.points} pts</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCard && (
        <div className={`bg-gradient-to-r ${getCategoryColor(selectedCard)} rounded-xl p-8 text-white shadow-2xl`}>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-bold opacity-90">{getCategoryLabel(selectedCard)} #{selectedCard.id}</div>
                <h2 className="text-4xl font-bold mt-2">{selectedCard.title}</h2>
              </div>
              <div className={`text-right text-3xl font-bold ${timeLeft < 300 ? 'animate-pulse' : ''}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
            <p className="text-lg leading-relaxed opacity-95">{selectedCard.description}</p>
            {selectedCard.points !== null && (
              <div className="pt-4 border-t border-white border-opacity-30">
                <span className="text-2xl font-bold">+{selectedCard.points} pts</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {!selectedCard && !availableCards && (
          <button
            onClick={handleDrawCards}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition"
          >
            Draw 2 Cards
          </button>
        )}

        {selectedCard && (
          <button
            onClick={handleCompleteCard}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition"
          >
            ✓ Challenge Complete
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
