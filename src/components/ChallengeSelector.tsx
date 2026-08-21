import { useState, useEffect } from 'react'
import { CHALLENGES, CURSES, Card } from '../data/challenges'

const STORAGE_KEY = 'berlin-game-state'
const TIMER_DURATION = 3600

type HistoryCard = Card & {
  completedAt: string
  timeLeftWhenCompleted: number
  isCurse: boolean
  status?: 'completed' | 'expired'
}

interface GameState {
  drawnCards: Card[] | null
  cardTimestamps: Record<number, number>
  history: HistoryCard[]
  coinEdits: { timestamp: string; previousAmount: number; newAmount: number; comment: string }[]
  activeCurse: Card | null
  curseTimestamp: number | null
  gameStartTime: number | null
  lastCurseTime: number | null
  coins: number
}

export default function ChallengeSelector() {
  const [drawnCards, setDrawnCards] = useState<Card[] | null>(null)
  const [cardTimestamps, setCardTimestamps] = useState<Record<number, number>>({})
  const [tickCount, setTickCount] = useState(0)
  const [history, setHistory] = useState<HistoryCard[]>([])
  const [coinEdits, setCoinEdits] = useState<{ timestamp: string; previousAmount: number; newAmount: number; comment: string }[]>([])
  const [activeCurse, setActiveCurse] = useState<Card | null>(null)
  const [curseTimestamp, setCurseTimestamp] = useState<number | null>(null)
  const [failedBackgroundImages, setFailedBackgroundImages] = useState<Set<number>>(new Set())
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [lastCurseTime, setLastCurseTime] = useState<number | null>(null)
  const [coins, setCoins] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editComment, setEditComment] = useState('')

  useEffect(() => {
    const loaded = loadFromStorage()
    if (!loaded) {
      drawInitialCards()
    }
  }, [])

  useEffect(() => {
    if ((!drawnCards || drawnCards.length === 0) && !activeCurse) return

    const interval = setInterval(() => {
      setTickCount((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [drawnCards, activeCurse])

  useEffect(() => {
    discardExpiredCards()
  }, [tickCount])

  const loadFromStorage = (): boolean => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const state: GameState = JSON.parse(saved)
      setDrawnCards(state.drawnCards)
      setCardTimestamps(state.cardTimestamps || {})
      setHistory(state.history)
      setCoinEdits(state.coinEdits || [])
      setActiveCurse(state.activeCurse || null)
      setCurseTimestamp(state.curseTimestamp || null)
      setGameStartTime(state.gameStartTime || null)
      setLastCurseTime(state.lastCurseTime || null)
      setCoins(state.coins || 0)
      return true
    }
    return false
  }

  const getCurseProbability = (referenceTime: number): number => {
    const timeReference = lastCurseTime || referenceTime
    const elapsedMs = Date.now() - timeReference
    const elapsedMins = elapsedMs / 60000

    if (elapsedMins >= 120) return 0.9
    if (elapsedMins <= 0) return 0.1

    return 0.1 + (elapsedMins / 120) * 0.8
  }

  const shouldDrawCurse = (referenceTime: number): boolean => {
    const probability = getCurseProbability(referenceTime)
    return Math.random() < probability
  }

  const drawCurseCard = (): Card => {
    const randomCurse = CURSES[Math.floor(Math.random() * CURSES.length)]
    return randomCurse
  }

  const drawInitialCards = (): void => {
    const now = Date.now()
    const drawn = getRandomCards(CHALLENGES)
    const newTimestamps: Record<number, number> = {}
    drawn.forEach((card) => {
      newTimestamps[card.id] = now
    })

    let curse: Card | null = null
    let curseTs: number | null = null
    if (shouldDrawCurse(now)) {
      curse = drawCurseCard()
      curseTs = now
    }

    setGameStartTime(now)
    setLastCurseTime(lastCurseTime || now)
    setDrawnCards(drawn)
    setCardTimestamps(newTimestamps)
    setActiveCurse(curse)
    setCurseTimestamp(curseTs)
    saveToStorage(drawn, newTimestamps, [], curse, curseTs, now, lastCurseTime || now, 0)
  }

  const drawReplacementCard = (cards: Card[], timestamps: Record<number, number>, hist: HistoryCard[], coinsValue: number = coins): void => {
    const drawn = getRandomCards(CHALLENGES)
    const now = Date.now()
    const newCards = [...cards, drawn[0]]
    const newTimestamps = { ...timestamps, [drawn[0].id]: now }

    let curse: Card | null = activeCurse
    let curseTs: number | null = curseTimestamp
    let lastCurse: number | null = lastCurseTime

    if (!activeCurse && shouldDrawCurse(lastCurseTime || gameStartTime || now)) {
      curse = drawCurseCard()
      curseTs = now
      lastCurse = lastCurseTime
    }

    setDrawnCards(newCards)
    setCardTimestamps(newTimestamps)
    setActiveCurse(curse)
    setCurseTimestamp(curseTs)
    saveToStorage(newCards, newTimestamps, hist, curse, curseTs, gameStartTime, lastCurse, coinsValue)
  }

  const saveToStorage = (cards: Card[] | null, timestamps: Record<number, number>, hist: HistoryCard[], curse: Card | null = null, curseTs: number | null = null, startTime: number | null = null, lastCurseTs: number | null = null, coinsValue: number = coins, edits: { timestamp: string; previousAmount: number; newAmount: number; comment: string }[] = coinEdits): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      drawnCards: cards,
      cardTimestamps: timestamps,
      history: hist,
      coinEdits: edits,
      activeCurse: curse,
      curseTimestamp: curseTs,
      gameStartTime: startTime,
      lastCurseTime: lastCurseTs,
      coins: coinsValue,
    }))
  }

  const getRandomCards = (cards: Card[]): Card[] => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    return [shuffled[0], shuffled[1]]
  }

  const getTimeRemaining = (cardId: number): number => {
    if (!cardTimestamps[cardId]) return TIMER_DURATION
    const elapsed = Math.floor((Date.now() - cardTimestamps[cardId]) / 1000)
    return Math.max(0, TIMER_DURATION - elapsed)
  }

  const getTimeRemainingForCurse = (): number => {
    if (!curseTimestamp || !activeCurse) return TIMER_DURATION
    const curseDuration = activeCurse.timerSeconds || TIMER_DURATION
    const elapsed = Math.floor((Date.now() - curseTimestamp) / 1000)
    return Math.max(0, curseDuration - elapsed)
  }

  const handleCompleteCurse = (): void => {
    const completedCurse = activeCurse
    const timeLeftWhenCompleted = getTimeRemainingForCurse()
    const newHistory = [
      { ...completedCurse, completedAt: new Date().toLocaleString(), timeLeftWhenCompleted, isCurse: true, status: 'completed' } as HistoryCard,
      ...history,
    ]

    const now = Date.now()
    setActiveCurse(null)
    setCurseTimestamp(null)
    setLastCurseTime(now)
    setHistory(newHistory)
    saveToStorage(drawnCards, cardTimestamps, newHistory, null, null, gameStartTime, now, coins)
  }

  const handleCompleteCard = (cardId: number): void => {
    const completedCard = drawnCards?.find(c => c.id === cardId)
    if (!completedCard) return

    const timeLeftWhenCompleted = getTimeRemaining(cardId)
    if (timeLeftWhenCompleted === 0) {
      discardExpiredCards([cardId])
      return
    }

    const newHistory = [
      { ...completedCard, completedAt: new Date().toLocaleString(), timeLeftWhenCompleted, isCurse: false, status: 'completed' } as HistoryCard,
      ...history,
    ]

    const remaining = drawnCards?.filter(c => c.id !== cardId) || []
    const newTimestamps = { ...cardTimestamps }
    delete newTimestamps[cardId]

    const earnedCoins = completedCard.points || 0
    const newCoins = coins + earnedCoins
    setCoins(newCoins)

    setHistory(newHistory)
    drawReplacementCard(remaining, newTimestamps, newHistory, newCoins)
  }

  const discardExpiredCards = (cardIds?: number[]): void => {
    if (!drawnCards?.length) return

    const expiredCards = drawnCards.filter((card) => {
      const isSelected = !cardIds || cardIds.includes(card.id)
      return isSelected && getTimeRemaining(card.id) === 0
    })
    if (expiredCards.length === 0) return

    const expiredIds = new Set(expiredCards.map((card) => card.id))
    const now = Date.now()
    const newHistory: HistoryCard[] = [
      ...expiredCards.map((card) => ({
        ...card,
        points: 0,
        completedAt: new Date().toLocaleString(),
        timeLeftWhenCompleted: 0,
        isCurse: false,
        status: 'expired' as const,
      })),
      ...history,
    ]
    const newTimestamps = { ...cardTimestamps }
    expiredIds.forEach((id) => delete newTimestamps[id])

    const newCards = drawnCards.filter((card) => !expiredIds.has(card.id))
    expiredCards.forEach(() => {
      const replacement = getRandomCards(CHALLENGES)[0]
      newCards.push(replacement)
      newTimestamps[replacement.id] = now
    })

    setDrawnCards(newCards)
    setCardTimestamps(newTimestamps)
    setHistory(newHistory)
    saveToStorage(newCards, newTimestamps, newHistory, activeCurse, curseTimestamp, gameStartTime, lastCurseTime, coins)
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

  const getBackgroundImage = (card: Card): string | undefined => {
    if (card.backgroundImage) return card.backgroundImage
    if (card.id >= 5 && card.id <= 89) return `/challenges/${card.id}.jpg`
    return undefined
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSaveCoinEdit = (): void => {
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
      previousAmount: coins,
      newAmount,
      comment: editComment.trim(),
    }

    const newEdits = [newEdit, ...coinEdits]
    setCoins(newAmount)
    setCoinEdits(newEdits)
    saveToStorage(drawnCards, cardTimestamps, history, activeCurse, curseTimestamp, gameStartTime, lastCurseTime, newAmount, newEdits)
    setShowEditModal(false)
    setEditAmount('')
    setEditComment('')
  }

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
              <div className={`text-right text-2xl font-bold ${getTimeRemainingForCurse() < 300 ? 'animate-pulse' : ''}`}>
                {formatTime(getTimeRemainingForCurse())}
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

      {drawnCards && (
        <div className={`grid gap-6 ${drawnCards.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {drawnCards.map((card) => {
            const timeRemaining = getTimeRemaining(card.id)
            const backgroundImage = getBackgroundImage(card)
            const imageFailed = failedBackgroundImages.has(card.id)
            return (
              <div
                key={card.id}
                className={`${imageFailed ? 'bg-slate-800' : `bg-gradient-to-r ${getCategoryColor(card)}`} relative overflow-hidden rounded-xl p-8 text-white shadow-2xl flex flex-col`}
              >
                {backgroundImage && !imageFailed && (
                  <>
                    <img
                      src={backgroundImage}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={() => setFailedBackgroundImages((failed) => new Set(failed).add(card.id))}
                    />
                    <div className="absolute inset-0 bg-slate-950/70" aria-hidden="true" />
                  </>
                )}
                <div className="relative z-10 space-y-4 flex-1">
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
                  disabled={(activeCurse && activeCurse.isBlocking) || timeRemaining === 0}
                  className={`relative z-10 mt-6 w-full font-bold py-3 px-4 rounded-lg transition border ${
                    (activeCurse && activeCurse.isBlocking) || timeRemaining === 0
                      ? 'bg-white bg-opacity-10 text-white text-opacity-50 border-white border-opacity-10 cursor-not-allowed'
                      : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30'
                  }`}
                >
                  {timeRemaining === 0 ? 'Expired' : activeCurse && activeCurse.isBlocking ? '🔒 Blocked by curse' : '✓ Complete'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {drawnCards && (
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY)
            const drawn = getRandomCards(CHALLENGES)
            const now = Date.now()
            const newTimestamps: Record<number, number> = {}
            drawn.forEach((card) => {
              newTimestamps[card.id] = now
            })

            let curse: Card | null = null
            let curseTs: number | null = null
            if (shouldDrawCurse(now)) {
              curse = drawCurseCard()
              curseTs = now
            }

            setDrawnCards(drawn)
            setCardTimestamps(newTimestamps)
            setHistory([])
            setActiveCurse(curse)
            setCurseTimestamp(curseTs)
            setGameStartTime(now)
            setLastCurseTime(now)
            setCoins(0)
            saveToStorage(drawn, newTimestamps, [], curse, curseTs, now, now, 0)
          }}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition"
        >
          New Game
        </button>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Challenge History</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((card, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-sm border-l-4 ${
                  card.isCurse
                    ? 'bg-red-50 text-gray-700 border-red-500'
                    : card.status === 'expired'
                      ? 'bg-gray-100 text-gray-700 border-gray-500'
                    : 'bg-gray-100 text-gray-700 border-green-500'
                }`}
              >
                <div className="font-semibold">{card.isCurse ? '⚠ ' : card.status === 'expired' ? 'Expired ' : ''}#{card.id} - {card.title}</div>
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
