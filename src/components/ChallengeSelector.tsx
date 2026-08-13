import { useState, useEffect } from 'react'
import { CHALLENGES, CURSES, Card } from '../data/challenges'

const STORAGE_KEY = 'berlin-game-state'
const TIMER_DURATION = 3600

type DrawableCard = Card & { drawnAt: number }

interface GameState {
  drawnCards: DrawableCard[]
  history: (Card & { completedAt: string; timeLeftWhenCompleted: number; isCurse: boolean })[]
  coinEdits: { timestamp: string; previousAmount: number; newAmount: number; comment: string }[]
  activeCurse: Card | null
  curseAt: number | null
  coins: number
}

export default function ChallengeSelector() {
  const [gameState, setGameState] = useState<GameState>({
    drawnCards: [],
    history: [],
    coinEdits: [],
    activeCurse: null,
    curseAt: null,
    coins: 0,
  })
  const [, setTick] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editComment, setEditComment] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setGameState(JSON.parse(saved))
    } else {
      initializeGame()
    }
  }, [])

  useEffect(() => {
    if (gameState.drawnCards.length === 0 && !gameState.activeCurse) return
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [gameState.drawnCards.length, gameState.activeCurse])

  const saveState = (newState: GameState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    setGameState(newState)
  }

  const initializeGame = () => {
    const drawn = getRandomCards(CHALLENGES).map(card => ({ ...card, drawnAt: Date.now() }))
    saveState({
      drawnCards: drawn,
      history: [],
      coinEdits: [],
      activeCurse: null,
      curseAt: null,
      coins: 0,
    })
  }

  const getRandomCards = (cards: Card[]): Card[] => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    return [shuffled[0], shuffled[1]]
  }

  const shouldSpawnCurse = (): boolean => {
    return !gameState.activeCurse && Math.random() < 0.3
  }

  const getTimeRemaining = (drawnAt: number, isTimer?: number): number => {
    const duration = isTimer || TIMER_DURATION
    const elapsed = Math.floor((Date.now() - drawnAt) / 1000)
    return Math.max(0, duration - elapsed)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCategoryColor = (card: Card): string => {
    if (card.id >= 1 && card.id <= 4) return 'from-purple-500 to-pink-500'
    if (card.id >= 90 && card.id <= 99) return 'from-red-500 to-orange-500'
    return 'from-blue-500 to-cyan-500'
  }

  const getCategoryLabel = (card: Card): string => {
    if (card.id >= 1 && card.id <= 4) return 'SPECIAL CARD'
    if (card.id >= 90 && card.id <= 99) return 'CURSE'
    return 'CHALLENGE'
  }

  const handleCompleteCard = (cardId: number) => {
    const card = gameState.drawnCards.find(c => c.id === cardId)
    if (!card) return

    const timeLeftWhenCompleted = getTimeRemaining(card.drawnAt)
    const newHistory = [
      { ...card, completedAt: new Date().toLocaleString(), timeLeftWhenCompleted, isCurse: false },
      ...gameState.history,
    ]

    const remaining = gameState.drawnCards.filter(c => c.id !== cardId)
    const newCoins = gameState.coins + (card.points || 0)
    const replacement = getRandomCards(CHALLENGES)[0]
    const newDrawn = [...remaining, { ...replacement, drawnAt: Date.now() }]

    const spawnCurse = shouldSpawnCurse()
    const newCurse = spawnCurse ? CURSES[Math.floor(Math.random() * CURSES.length)] : gameState.activeCurse

    saveState({
      ...gameState,
      drawnCards: newDrawn,
      history: newHistory,
      coins: newCoins,
      activeCurse: newCurse,
      curseAt: spawnCurse ? Date.now() : gameState.curseAt,
    })
  }

  const handleCompleteCurse = () => {
    if (!gameState.activeCurse || !gameState.curseAt) return

    const timeLeftWhenCompleted = getTimeRemaining(gameState.curseAt, gameState.activeCurse.timerSeconds)
    const newHistory = [
      { ...gameState.activeCurse, completedAt: new Date().toLocaleString(), timeLeftWhenCompleted, isCurse: true },
      ...gameState.history,
    ]

    saveState({
      ...gameState,
      history: newHistory,
      activeCurse: null,
      curseAt: null,
    })
  }

  const handleSaveCoinEdit = () => {
    if (!editAmount || !editComment.trim()) {
      alert('Please enter both an amount and a comment')
      return
    }

    const newAmount = parseInt(editAmount, 10)
    if (isNaN(newAmount)) {
      alert('Please enter a valid number')
      return
    }

    const newEdit = {
      timestamp: new Date().toLocaleString(),
      previousAmount: gameState.coins,
      newAmount,
      comment: editComment.trim(),
    }

    saveState({
      ...gameState,
      coins: newAmount,
      coinEdits: [newEdit, ...gameState.coinEdits],
    })
    setShowEditModal(false)
    setEditAmount('')
    setEditComment('')
  }

  const { drawnCards, history, coinEdits, activeCurse, coins } = gameState
  const curseTimeRemaining = activeCurse && gameState.curseAt ? getTimeRemaining(gameState.curseAt, activeCurse.timerSeconds) : 0

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-4 text-center shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-800 opacity-90">COINS</div>
            <div className="text-4xl font-bold text-gray-900 mt-1">💰 {coins}</div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-3 rounded transition text-sm"
          >
            ✏️ Edit
          </button>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Coins</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Amount</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder={coins.toString()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comment (required)</label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Why are you changing this?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditAmount('')
                    setEditComment('')
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCoinEdit}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeCurse && (
        <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-xl p-8 text-white shadow-2xl flex flex-col border-2 border-red-700">
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-bold opacity-90 uppercase">⚠ CURSE #{activeCurse.id}</div>
                <h2 className="text-3xl font-bold mt-2">{activeCurse.title}</h2>
              </div>
              <div className={`text-right text-2xl font-bold ${curseTimeRemaining < 300 ? 'animate-pulse' : ''}`}>
                {formatTime(curseTimeRemaining)}
              </div>
            </div>
            <p className="text-lg leading-relaxed opacity-95">{activeCurse.description}</p>
          </div>
          <button
            onClick={handleCompleteCurse}
            className="mt-6 w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded-lg transition border-2 border-red-400"
          >
            ✓ Complete Curse
          </button>
        </div>
      )}

      {drawnCards.length > 0 && (
        <div className={`grid gap-6 ${drawnCards.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {drawnCards.map((card) => {
            const timeRemaining = getTimeRemaining(card.drawnAt)
            return (
              <div
                key={card.id}
                className={`bg-gradient-to-r ${getCategoryColor(card)} rounded-xl p-8 text-white shadow-2xl flex flex-col`}
              >
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold opacity-90">{getCategoryLabel(card)} #{card.id}</div>
                      <h2 className="text-3xl font-bold mt-2">{card.title}</h2>
                    </div>
                    <div className={`text-right text-2xl font-bold ${timeRemaining < 300 ? 'animate-pulse' : ''}`}>
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                  <p className="text-lg leading-relaxed opacity-95">{card.description}</p>
                  {card.points !== null && (
                    <div className="pt-4 border-t border-white border-opacity-30">
                      <span className="text-2xl font-bold">+{card.points} pts</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleCompleteCard(card.id)}
                  disabled={activeCurse && activeCurse.isBlocking}
                  className={`mt-6 w-full font-bold py-3 px-4 rounded-lg transition border ${
                    activeCurse && activeCurse.isBlocking
                      ? 'bg-white bg-opacity-10 text-white text-opacity-50 border-white border-opacity-10 cursor-not-allowed'
                      : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30'
                  }`}
                >
                  {activeCurse && activeCurse.isBlocking ? '🔒 Blocked by curse' : '✓ Complete'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {drawnCards.length > 0 && (
        <button
          onClick={() => initializeGame()}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition"
        >
          New Game
        </button>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Completed Challenges</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((card, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-sm border-l-4 ${
                  card.isCurse
                    ? 'bg-red-50 text-gray-700 border-red-500'
                    : 'bg-gray-100 text-gray-700 border-green-500'
                }`}
              >
                <div className="font-semibold">{card.isCurse ? '⚠ ' : ''}#{card.id} - {card.title}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {card.completedAt} · {card.points !== null ? `+${card.points} pts` : 'Variable points'} · {formatTime(card.timeLeftWhenCompleted)} remaining
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {coinEdits.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Coin Edit History</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {coinEdits.map((edit, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg text-sm border-l-4 bg-yellow-50 text-gray-700 border-yellow-500"
              >
                <div className="font-semibold">{edit.previousAmount} → {edit.newAmount} coins</div>
                <div className="text-xs text-gray-600 mt-1">{edit.timestamp}</div>
                <div className="text-xs text-gray-700 mt-2 italic">"{edit.comment}"</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
