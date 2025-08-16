'use client'

import clsx from 'clsx'
import { motion } from "motion/react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function Button({ children, className, ...rest }: ButtonProps) {

  return (
    <motion.button
      drag
      dragElastic={0.2}
      dragSnapToOrigin
      {...rest}
      className={clsx(
        'flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:bg-foreground/80 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}
