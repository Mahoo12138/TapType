import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {user && (
        <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
            <span className="text-xl">⌨️</span>
            <span className="text-lg font-bold text-gray-900">TapType</span>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            <NavLink to="/" label="仪表盘" icon="📊" />
            <NavLink to="/practice" label="打字练习" icon="⌨️" />
            <NavLink to="/library" label="内容管理" icon="📚" />
            <NavLink to="/analysis" label="数据分析" icon="📈" />
          </nav>

          <div className="border-t border-gray-200 p-3">
            <div className="mb-2 flex items-center gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                {user.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium text-gray-900">{user.username}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full rounded-md px-2 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-100"
            >
              退出登录
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

function NavLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate({ to })}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
