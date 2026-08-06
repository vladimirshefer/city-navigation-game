import { useState } from 'react'
import { ALL_CARDS, CHALLENGES, CURSES, SPECIAL_CARDS } from '../data/challenges'

export default function ChallengeSelector() {
  const [current, setCurrent] = useState(null)
  const [category, setCategory] = useState('all')
  const [history, setHistory] = useState([])

  const getRandomChallenge = (cards) => {
    return cards[Math.floor(Math.random() * cards.length)]
  }

  const handleSelectChallenge = () => {
    let cards = ALL_CARDS
    if (category === 'challenges') cards = CHALLENGES
    else if (category === 'curses') cards = CURSES
    else if (category === 'special') cards = SPECIAL_CARDS

    const challenge = getRandomChallenge(cards)
    setCurrent(challenge)
    setHistory([challenge, ...history])
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

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          All Cards
        </button>
        <button
          onClick={() => setCategory('challenges')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'challenges'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Challenges
        </button>
        <button
          onClick={() => setCategory('curses')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'curses'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Curses
        </button>
        <button
          onClick={() => setCategory('special')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            category === 'special'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Special Cards
        </button>
      </div>

      {current && (
        <div className={`bg-gradient-to-r ${getCategoryColor(current)} rounded-xl p-8 text-white shadow-2xl`}>
          <div className="space-y-4">
            <div className="text-sm font-bold opacity-90">{getCategoryLabel(current)} #{current.id}</div>
            <h2 className="text-4xl font-bold">{current.title}</h2>
            <p className="text-lg leading-relaxed opacity-95">{current.description}</p>
            {current.points !== null && (
              <div className="pt-4 border-t border-white border-opacity-30">
                <span className="text-2xl font-bold">+{current.points} pts</span>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleSelectChallenge}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition"
      >
        {current ? 'Get Next Challenge' : 'Start Game'}
      </button>

      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Recent Challenges</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.slice(1).map((card, idx) => (
              <div
                key={idx}
                className="bg-gray-100 p-3 rounded-lg text-sm text-gray-700 border-l-4 border-blue-500"
              >
                <div className="font-semibold">#{card.id} - {card.title}</div>
                {card.points !== null && <div className="text-xs text-gray-600">+{card.points} pts</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
