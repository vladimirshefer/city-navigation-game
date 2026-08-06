export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Welcome to David</h1>
      <p className="text-lg text-gray-600">
        A modern React app with React Router, React Query, and Tailwind CSS.
      </p>
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">Getting Started</h2>
        <ul className="list-disc list-inside text-blue-800 space-y-1">
          <li>Edit <code className="bg-white px-2 py-1 rounded">src/pages/Home.jsx</code> to build</li>
          <li>Router is ready in <code className="bg-white px-2 py-1 rounded">src/App.jsx</code></li>
          <li>React Query is configured in <code className="bg-white px-2 py-1 rounded">src/main.jsx</code></li>
        </ul>
      </div>
    </div>
  )
}
