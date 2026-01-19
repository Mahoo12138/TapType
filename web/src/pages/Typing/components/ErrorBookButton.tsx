import { recordErrorBookAction } from '@/utils'
import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Book } from 'lucide-react'

const ErrorBookButton = () => {
  const navigate = useNavigate()

  const toErrorBook = useCallback(() => {
    navigate({ to: '/error-book' })
    recordErrorBookAction('open')
  }, [navigate])

  return (
    <button
      type="button"
      onClick={toErrorBook}
      className={`flex items-center justify-center rounded p-[2px] text-lg text-indigo-500 outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white`}
      title="查看错题本"
    >
      <Book className="h-5 w-5" />
    </button>
  )
}

export default ErrorBookButton
