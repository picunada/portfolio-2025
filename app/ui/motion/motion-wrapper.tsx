'use client'

import { HTMLMotionProps, motion } from "motion/react"
import { ReactNode } from "react"

interface MotionWrapperProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: ReactNode
  as?: keyof typeof motion
}

export function MotionWrapper({
  children,
  as = "div",
  ...motionProps
}: MotionWrapperProps) {
  const MotionComponent = motion[as] as typeof motion.div

  return (
    <MotionComponent {...motionProps}>
      {children}
    </MotionComponent>
  )
}
