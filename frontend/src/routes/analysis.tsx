import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/analysis')({
  component: Analysis,
})

function Analysis() {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">数据分析</h1>
      <p className="text-gray-600">Phase 3 将在此处实现历史趋势和键位热力图。</p>
    </div>
  )
}
