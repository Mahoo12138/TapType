import React from 'react'

const InfoBox: React.FC<InfoBoxProps> = ({ info, description }) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <h3
        className="w-[80%] border-b border-gray-200 pb-1 text-center text-lg font-bold text-gray-600 dark:border-gray-700 dark:text-gray-400"
      >
        {info}
      </h3>
      <p className="pt-1 text-xs text-gray-400 dark:text-gray-500">{description}</p>
    </div>
  )
}

export default React.memo(InfoBox)

export type InfoBoxProps = {
  info: string
  description: string
}
