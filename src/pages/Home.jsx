import ChallengeSelector from '../components/ChallengeSelector'

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Berlin - The Game #2</h1>
        <p className="text-lg text-gray-600 mt-2">Challenge Randomizer</p>
      </div>
      <ChallengeSelector />
    </div>
  )
}
