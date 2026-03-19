import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/practice')({
  component: Practice,
})

function Practice() {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">打字练习</h1>
      <p className="text-gray-600">Phase 2 将在此处实现完整的打字练习功能。</p>
    </div>
  )
}
