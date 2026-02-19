'use client'

import { useId, useState } from 'react'

import { Badge } from '@fullstack-template/shad-ui/components/badge'
import { Checkbox } from '@fullstack-template/shad-ui/components/checkbox'

const BadgeSelectableDemo = ({value}: {value: string}) => {
  const [selected, setSelected] = useState(false)

  const id = useId()

  return (
    <Badge
      variant={selected ? 'secondary' : 'outline'}
      className='has-focus-visible:border-ring/50 has-focus-visible:ring-ring/50 relative cursor-pointer rounded-sm outline-none has-focus-visible:ring-2 m-1'
    >
      <Checkbox
        id={id}
        className='peer sr-only after:absolute after:inset-0'
        checked={selected}
        onCheckedChange={checked => setSelected(!!checked)}
      />
      <label htmlFor={id} className='cursor-pointer select-none after:absolute after:inset-0'>
        {value}
      </label>
    </Badge>
  )
}

export default BadgeSelectableDemo
