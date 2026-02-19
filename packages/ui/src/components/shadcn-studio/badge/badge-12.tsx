'use client'

import { useState } from 'react'

import { XIcon } from 'lucide-react'

import { Badge } from '@fullstack-template/shad-ui/components/badge'

const BadgeClosableDemo = ({name, handleDelete}: {name: string, handleDelete: (hashtag: string) => void}) => {
  const [isActive, setIsActive] = useState(true)

  if (!isActive) return null

  return (
    <Badge>
      {name}
      <button
        className='focus-visible:border-ring focus-visible:ring-ring/50 text-primary-foreground/60 hover:text-primary-foreground -my-px -ms-px -me-1.5 inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[inherit] p-0 transition-[color,box-shadow] outline-none focus-visible:ring-[3px]'
        aria-label='Close'
        onClick={() => {
          setIsActive(false)
          handleDelete(name)
        }}
      >
        <XIcon className='size-3' aria-hidden='true' />
      </button>
    </Badge>
  )
}

export default BadgeClosableDemo
