import { createRootRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import {
  LayoutDashboard,
  Keyboard,
  BookOpen,
  BarChart3,
  AlertCircle,
  History,
  Target,
  Trophy,
  Settings,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const dark = useThemeStore((s) => s.dark)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  const handleNav = (to: string) => {
    setSidebarOpen(false)
    navigate({ to })
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile header */}
      {user && (
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-xl md:hidden dark:border-slate-800/60 dark:bg-slate-900/80">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Keyboard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">TapType</span>
        </header>
      )}

      {/* Mobile overlay */}
      {user && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      {user && (
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-200/60 bg-white/95 backdrop-blur-xl transition-transform duration-200 md:static md:translate-x-0 dark:border-slate-800/60 dark:bg-slate-900/95 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex h-14 items-center gap-2.5 border-b border-slate-200/60 px-5 dark:border-slate-800/60">
            <Keyboard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              TapType
            </span>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
            <NavLink to="/" label="仪表盘" icon={LayoutDashboard} onNav={handleNav} />
            <NavLink to="/practice" label="打字练习" icon={Keyboard} onNav={handleNav} />
            <NavLink to="/content" label="内容管理" icon={BookOpen} onNav={handleNav} />
            <NavLink to="/history" label="练习记录" icon={History} onNav={handleNav} />
            <NavLink to="/analysis" label="数据分析" icon={BarChart3} onNav={handleNav} />
            <NavLink to="/errors" label="错题集" icon={AlertCircle} onNav={handleNav} />
            <NavLink to="/goals" label="每日目标" icon={Target} onNav={handleNav} />
            <NavLink to="/achievements" label="成就" icon={Trophy} onNav={handleNav} />
            <NavLink to="/settings" label="设置" icon={Settings} onNav={handleNav} />
          </nav>

          <div className="border-t border-slate-200/60 p-3 dark:border-slate-800/60">
            <div className="mb-2 flex items-center gap-2.5 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                {user.username?.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user.username}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={toggleTheme}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{dark ? '浅色' : '深色'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                <span>退出</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className={`flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 ${user ? 'pt-14 md:pt-0' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}

function NavLink({ to, label, icon: Icon, onNav }: { to: string; label: string; icon: LucideIcon; onNav: (to: string) => void }) {
  const location = useLocation()
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <button
      onClick={() => onNav(to)}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
      }`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  )
}
