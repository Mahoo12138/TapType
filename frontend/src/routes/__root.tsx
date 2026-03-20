import { createRootRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
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
    <div className={cn('bg-transparent', user ? 'flex h-screen overflow-hidden' : 'min-h-screen')}>
      {user && (
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-border/70 bg-background/70 px-3 backdrop-blur-xl md:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="打开导航">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-r border-border/70 bg-card/95 p-0 backdrop-blur-xl">
              <SheetHeader className="border-b border-border/60 p-4">
                <SheetTitle className="flex items-center gap-2 text-sm tracking-wide uppercase text-muted-foreground">
                  <Keyboard className="size-4 text-primary" />
                  TapType
                </SheetTitle>
              </SheetHeader>
              <MobileSidebar
                user={user}
                dark={dark}
                onNav={handleNav}
                onLogout={handleLogout}
                onToggleTheme={toggleTheme}
              />
            </SheetContent>
          </Sheet>
          <Keyboard className="size-4 text-primary" />
          <span className="text-sm font-semibold tracking-wide text-foreground">TapType</span>
        </header>
      )}

      {user && (
        <aside className="hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-border/70 bg-card/70 backdrop-blur-xl md:flex md:flex-col">
          <div className="flex h-16 items-center gap-2 px-5">
            <Keyboard className="size-4 text-primary" />
            <span className="text-sm font-semibold tracking-[0.2em] uppercase text-foreground">TapType</span>
          </div>
          <Separator />
          <DesktopSidebar
            user={user}
            dark={dark}
            onNav={handleNav}
            onLogout={handleLogout}
            onToggleTheme={toggleTheme}
          />
        </aside>
      )}

      <main className={cn('flex-1 overflow-y-auto', user ? 'h-screen pt-14 md:pt-0' : 'min-h-screen')}>
        <Outlet />
      </main>
    </div>
  )
}

function NavLink({ to, label, icon: Icon, onNav }: { to: string; label: string; icon: LucideIcon; onNav: (to: string) => void }) {
  const location = useLocation()
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <Button
      onClick={() => onNav(to)}
      variant={active ? 'secondary' : 'ghost'}
      className={cn(
        'h-9 w-full justify-start gap-2.5 rounded-md px-3 text-sm',
        active && 'text-primary',
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      <span>{label}</span>
    </Button>
  )
}

function DesktopSidebar({
  user,
  dark,
  onNav,
  onLogout,
  onToggleTheme,
}: {
  user: { username: string; email: string }
  dark: boolean
  onNav: (to: string) => void
  onLogout: () => void
  onToggleTheme: () => void
}) {
  return (
    <>
      <nav className="flex-1 space-y-1 p-3">
        <NavLink to="/" label="仪表盘" icon={LayoutDashboard} onNav={onNav} />
        <NavLink to="/practice" label="打字练习" icon={Keyboard} onNav={onNav} />
        <NavLink to="/content" label="内容管理" icon={BookOpen} onNav={onNav} />
        <NavLink to="/history" label="练习记录" icon={History} onNav={onNav} />
        <NavLink to="/analysis" label="数据分析" icon={BarChart3} onNav={onNav} />
        <NavLink to="/errors" label="错题集" icon={AlertCircle} onNav={onNav} />
        <NavLink to="/goals" label="每日目标" icon={Target} onNav={onNav} />
        <NavLink to="/achievements" label="成就" icon={Trophy} onNav={onNav} />
        <NavLink to="/settings" label="设置" icon={Settings} onNav={onNav} />
      </nav>

      <Separator />
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-secondary/50 p-2.5">
          <Avatar>
            <AvatarFallback>{user.username?.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user.username}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onToggleTheme} variant="outline" className="justify-start">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {dark ? '浅色' : '深色'}
          </Button>
          <Button onClick={onLogout} variant="outline" className="justify-start">
            <LogOut className="size-4" />
            退出
          </Button>
        </div>
      </div>
    </>
  )
}

function MobileSidebar({
  user,
  dark,
  onNav,
  onLogout,
  onToggleTheme,
}: {
  user: { username: string; email: string }
  dark: boolean
  onNav: (to: string) => void
  onLogout: () => void
  onToggleTheme: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 p-3">
        <NavLink to="/" label="仪表盘" icon={LayoutDashboard} onNav={onNav} />
        <NavLink to="/practice" label="打字练习" icon={Keyboard} onNav={onNav} />
        <NavLink to="/content" label="内容管理" icon={BookOpen} onNav={onNav} />
        <NavLink to="/history" label="练习记录" icon={History} onNav={onNav} />
        <NavLink to="/analysis" label="数据分析" icon={BarChart3} onNav={onNav} />
        <NavLink to="/errors" label="错题集" icon={AlertCircle} onNav={onNav} />
        <NavLink to="/goals" label="每日目标" icon={Target} onNav={onNav} />
        <NavLink to="/achievements" label="成就" icon={Trophy} onNav={onNav} />
        <NavLink to="/settings" label="设置" icon={Settings} onNav={onNav} />
      </nav>
      <Separator />
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-secondary/50 p-2.5">
          <Avatar>
            <AvatarFallback>{user.username?.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{user.username}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button onClick={onToggleTheme} variant="outline" className="w-full justify-start">
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {dark ? '浅色' : '深色'}
        </Button>
        <Button onClick={onLogout} variant="outline" className="w-full justify-start">
          <LogOut className="size-4" />
          退出
        </Button>
      </div>
    </div>
  )
}
