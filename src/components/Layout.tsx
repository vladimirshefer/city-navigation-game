import { Outlet, Link } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex gap-6">
          <Link to="/" className="font-semibold text-blue-600 hover:text-blue-800">
            David
          </Link>
          <Link to="/about" className="text-gray-600 hover:text-gray-900">
            Map
          </Link>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
