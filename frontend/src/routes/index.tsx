import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  if (!user) {
    navigate({ to: '/login' })
    return null
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        欢迎回来，{user.username} 👋
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DashboardCard
          title="今日练习"
          value="0 次"
          subtitle="开始你的第一次练习吧"
          icon="⌨️"
        />
        <DashboardCard
          title="连续打卡"
          value="0 天"
          subtitle="坚持练习，保持 streak"
          icon="🔥"
        />
        <DashboardCard
          title="待复习"
          value="0 个"
          subtitle="错题会在这里等你"
          icon="📝"
        />
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">快速开始</h2>
        <p className="text-gray-600">
          Phase 2 将在此处添加词库选择和练习入口。当前已完成用户认证系统。
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => navigate({ to: '/practice' })}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            开始练习
          </button>
          <button
            onClick={() => navigate({ to: '/library' })}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            管理词库
          </button>
        </div>
      </div>
    </div>
  )
}

function DashboardCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}
