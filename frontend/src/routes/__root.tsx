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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const dark = useThemeStore((s) => s.dark)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false)

  const isPracticeRoute = location.pathname === '/practice' || location.pathname.startsWith('/practice/')

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
        isPracticeRoute ? (
          <div className="group/practice-sidebar hidden md:block">
            <div className="fixed inset-y-0 left-0 z-30 w-5" aria-hidden="true" />
            <aside className="pointer-events-none fixed left-0 top-0 z-40 hidden h-screen w-72 -translate-x-6 overflow-y-auto border-r border-border/70 bg-card/70 opacity-0 backdrop-blur-xl transition-all duration-200 group-hover/practice-sidebar:pointer-events-auto group-hover/practice-sidebar:translate-x-0 group-hover/practice-sidebar:opacity-100 focus-within:pointer-events-auto focus-within:translate-x-0 focus-within:opacity-100 md:flex md:flex-col">
              <div className="flex h-16 items-center justify-between gap-2 px-5">
                <div className="flex items-center gap-2">
                  <Keyboard className="size-4 text-primary" />
                  <span className="text-sm font-semibold tracking-[0.2em] uppercase text-foreground">TapType</span>
                </div>
                <Button variant="ghost" size="icon" aria-label="收起侧边栏" title="练习时侧边栏悬浮显示">
                  <PanelLeftClose className="size-4" />
                </Button>
              </div>
              <Separator />
              <DesktopSidebar
                user={user}
                dark={dark}
                collapsed={false}
                onNav={handleNav}
                onLogout={handleLogout}
                onToggleTheme={toggleTheme}
                onToggleCollapse={() => setDesktopSidebarCollapsed((value) => !value)}
              />
            </aside>
          </div>
        ) : (
          <aside className={cn(
            'hidden h-screen shrink-0 overflow-y-auto border-r border-border/70 bg-card/70 backdrop-blur-xl transition-[width] duration-200 md:flex md:flex-col',
            desktopSidebarCollapsed ? 'w-20' : 'w-72',
          )}>
            <div className="flex h-16 items-center justify-between gap-2 px-4">
              <div className="flex min-w-0 items-center gap-2 px-1">
                <Keyboard className="size-4 shrink-0 text-primary" />
                {!desktopSidebarCollapsed && (
                  <span className="truncate text-sm font-semibold tracking-[0.2em] uppercase text-foreground">TapType</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={desktopSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
                onClick={() => setDesktopSidebarCollapsed((value) => !value)}
              >
                {desktopSidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              </Button>
            </div>
            <Separator />
            <DesktopSidebar
              user={user}
              dark={dark}
              collapsed={desktopSidebarCollapsed}
              onNav={handleNav}
              onLogout={handleLogout}
              onToggleTheme={toggleTheme}
              onToggleCollapse={() => setDesktopSidebarCollapsed((value) => !value)}
            />
          </aside>
        )
      )}

      <main className={cn('flex-1 overflow-y-auto', user ? 'h-screen pt-14 md:pt-0' : 'min-h-screen')}>
        <Outlet />
      </main>
    </div>
  )
}

function NavLink({
  to,
  label,
  icon: Icon,
  onNav,
  collapsed = false,
}: {
  to: string
  label: string
  icon: LucideIcon
  onNav: (to: string) => void
  collapsed?: boolean
}) {
  const location = useLocation()
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <Button
      onClick={() => onNav(to)}
      title={label}
      aria-label={label}
      variant={active ? 'secondary' : 'ghost'}
      className={cn(
        'h-9 w-full rounded-md text-sm',
        collapsed ? 'justify-center px-2' : 'justify-start gap-2.5 px-3',
        active && 'text-primary',
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      {!collapsed && <span>{label}</span>}
    </Button>
  )
}

function DesktopSidebar({
  user,
  dark,
  collapsed,
  onNav,
  onLogout,
  onToggleTheme,
  onToggleCollapse,
}: {
  user: { username: string; email: string }
  dark: boolean
  collapsed: boolean
  onNav: (to: string) => void
  onLogout: () => void
  onToggleTheme: () => void
  onToggleCollapse: () => void
}) {
  return (
    <>
      <nav className="flex-1 space-y-1 p-3">
        <NavLink to="/" label="仪表盘" icon={LayoutDashboard} onNav={onNav} collapsed={collapsed} />
        <NavLink to="/practice" label="打字练习" icon={Keyboard} onNav={onNav} collapsed={collapsed} />
        <NavLink to="/content" label="内容管理" icon={BookOpen} onNav={onNav} collapsed={collapsed} />
        <NavLink to="/history" label="练习记录" icon={History} onNav={onNav} collapsed={collapsed} />
        <NavLink to="/errors" label="错题集" icon={AlertCircle} onNav={onNav} collapsed={collapsed} />
        <NavLink to="/goals" label="每日目标" icon={Target} onNav={onNav} collapsed={collapsed} />
        <NavLink to="/achievements" label="成就" icon={Trophy} onNav={onNav} collapsed={collapsed} />
        <NavLink to="/settings" label="设置" icon={Settings} onNav={onNav} collapsed={collapsed} />
      </nav>

      <Separator />
      <div className="space-y-3 p-3">
        <div className={cn('rounded-lg bg-secondary/50 p-2.5', collapsed ? 'flex justify-center' : 'flex items-center gap-2.5')}>
          <Avatar>
            <AvatarFallback>{user.username?.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.username}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
        </div>
        <div className={cn('gap-2', collapsed ? 'flex flex-col' : 'grid grid-cols-2')}>
          <Button onClick={onToggleTheme} variant="outline" className={collapsed ? 'justify-center px-0' : 'justify-start'} title={dark ? '切换到浅色模式' : '切换到深色模式'}>
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {!collapsed && (dark ? '浅色' : '深色')}
          </Button>
          <Button onClick={onLogout} variant="outline" className={collapsed ? 'justify-center px-0' : 'justify-start'} title="退出登录">
            <LogOut className="size-4" />
            {!collapsed && '退出'}
          </Button>
          {!collapsed && (
            <Button onClick={onToggleCollapse} variant="outline" className="col-span-2 justify-start">
              <PanelLeftClose className="size-4" />
              收起侧边栏
            </Button>
          )}
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
