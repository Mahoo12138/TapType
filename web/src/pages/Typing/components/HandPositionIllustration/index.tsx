import standTypingHandPosition from '@/assets/standard_typing_hand_position.png'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Keyboard, X } from 'lucide-react'
import { useState } from 'react'

export default function HandPositionIllustration() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <button
          type="button"
          className={`flex items-center justify-center rounded p-0.5 text-lg text-indigo-500 outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white ${
            isOpen && 'bg-indigo-500 text-white'
          }`}
        >
          <Keyboard className="h-5 w-5" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-200 overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl dark:bg-gray-800" showCloseButton={false}>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          title="关闭对话框"
          className="absolute right-7 top-5 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-center text-xl font-medium leading-6 text-gray-800 dark:text-gray-200">
          推荐打字指法图示
        </h3>
        <div className="mt-8 flex justify-center">
          <img className="block max-w-full" src={standTypingHandPosition} alt="Standard Typing Hand Position" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
