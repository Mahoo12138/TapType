import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/library')({
  component: Library,
})

function Library() {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">内容管理</h1>
      <p className="text-gray-600">Phase 2 将在此处实现词库和句库管理。</p>
    </div>
  )
}
