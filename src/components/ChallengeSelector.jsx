import { useState, useEffect } from 'react'
import { ALL_CARDS, CHALLENGES, CURSES, SPECIAL_CARDS } from '../data/challenges'

const STORAGE_KEY = 'berlin-game-state'
const TIMER_DURATION = 3600
const CURSE_INTERVAL = 7200000

export default function ChallengeSelector() {
  const [drawnCards, setDrawnCards] = useState(null)
  const [cardTimestamps, setCardTimestamps] = useState({})
  const [, setTickCount] = useState(0)
  const [history, setHistory] = useState([])
  const [category, setCategory] = useState('all')
  const [activeCurse, setActiveCurse] = useState(null)
  const [curseTimestamp, setCurseTimestamp] = useState(null)
  const [gameStartTime, setGameStartTime] = useState(null)
  const [lastCurseTime, setLastCurseTime] = useState(null)

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

  const loadFromStorage = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const state = JSON.parse(saved)
      setDrawnCards(state.drawnCards)
      setCardTimestamps(state.cardTimestamps || {})
      setHistory(state.history)
      setActiveCurse(state.activeCurse || null)
      setCurseTimestamp(state.curseTimestamp || null)
      setGameStartTime(state.gameStartTime || null)
      setLastCurseTime(state.lastCurseTime || null)
      return true
    }
    return false
  }

  const getCurseProbability = (referenceTime) => {
    const timeReference = lastCurseTime || referenceTime
    const elapsedMs = Date.now() - timeReference
    const elapsedMins = elapsedMs / 60000

    if (elapsedMins >= 120) return 0.9
    if (elapsedMins <= 0) return 0.1

    return 0.1 + (elapsedMins / 120) * 0.8
  }

  const shouldDrawCurse = (referenceTime) => {
    const probability = getCurseProbability(referenceTime)
    return Math.random() < probability
  }

  const drawCurseCard = () => {
    const randomCurse = CURSES[Math.floor(Math.random() * CURSES.length)]
    return randomCurse
  }

  const drawInitialCards = () => {
    const now = Date.now()
    const drawn = getRandomCards(ALL_CARDS)
    const newTimestamps = {}
    drawn.forEach((card) => {
      newTimestamps[card.id] = now
    })

    let curse = null
    let curseTs = null
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
    saveToStorage(drawn, newTimestamps, [], curse, curseTs, now, lastCurseTime || now)
  }

  const drawReplacementCard = (cards, timestamps, hist) => {
    const drawn = getRandomCards(ALL_CARDS)
    const now = Date.now()
    const newCards = [...cards, drawn[0]]
    const newTimestamps = { ...timestamps, [drawn[0].id]: now }
    setDrawnCards(newCards)
    setCardTimestamps(newTimestamps)
    saveToStorage(newCards, newTimestamps, hist, activeCurse, curseTimestamp, gameStartTime, lastCurseTime)
  }

  const saveToStorage = (cards, timestamps, hist, curse = null, curseTs = null, startTime = null, lastCurseTs = null) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      drawnCards: cards,
      cardTimestamps: timestamps,
      history: hist,
      activeCurse: curse,
      curseTimestamp: curseTs,
      gameStartTime: startTime,
      lastCurseTime: lastCurseTs,
    }))
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

    const newTimestamps = {}
    drawn.forEach((card) => {
      newTimestamps[card.id] = now
    })

    setDrawnCards(drawn)
    setCardTimestamps(newTimestamps)
    saveToStorage(drawn, newTimestamps, history)
  }

  const getTimeRemaining = (cardId) => {
    if (!cardTimestamps[cardId]) return TIMER_DURATION
    const elapsed = Math.floor((Date.now() - cardTimestamps[cardId]) / 1000)
    return Math.max(0, TIMER_DURATION - elapsed)
  }

  const getTimeRemainingForCurse = () => {
    if (!curseTimestamp) return TIMER_DURATION
    const elapsed = Math.floor((Date.now() - curseTimestamp) / 1000)
    return Math.max(0, TIMER_DURATION - elapsed)
  }

  const handleCompleteCurse = () => {
    const completedCurse = activeCurse
    const timeLeftWhenCompleted = getTimeRemainingForCurse()
    const newHistory = [
      { ...completedCurse, completedAt: new Date().toLocaleString(), timeLeftWhenCompleted, isCurse: true },
      ...history,
    ]

    const now = Date.now()
    setActiveCurse(null)
    setCurseTimestamp(null)
    setLastCurseTime(now)
    setHistory(newHistory)
    saveToStorage(drawnCards, cardTimestamps, newHistory, null, null, gameStartTime, now)
  }

  const handleCompleteCard = (cardId) => {
    const completedCard = drawnCards.find(c => c.id === cardId)
    const timeLeftWhenCompleted = getTimeRemaining(cardId)
    const newHistory = [
      { ...completedCard, completedAt: new Date().toLocaleString(), timeLeftWhenCompleted, isCurse: false },
      ...history,
    ]

    const remaining = drawnCards.filter(c => c.id !== cardId)
    const newTimestamps = { ...cardTimestamps }
    delete newTimestamps[cardId]

    setHistory(newHistory)
    drawReplacementCard(remaining, newTimestamps, newHistory)
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
        <div className="text-sm text-gray-600">
          {drawnCards.length} card{drawnCards.length !== 1 ? 's' : ''} active {activeCurse && '+ 1 curse'}
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
                  className="mt-6 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-3 px-4 rounded-lg transition border border-white border-opacity-30"
                >
                  ✓ Complete
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
            const drawn = getRandomCards(ALL_CARDS)
            const now = Date.now()
            const newTimestamps = {}
            drawn.forEach((card) => {
              newTimestamps[card.id] = now
            })

            let curse = null
            let curseTs = null
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
            saveToStorage(drawn, newTimestamps, [], curse, curseTs, now, now)
          }}
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
    </div>
  )
}
