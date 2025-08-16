'use client'
import { animate, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";

export function Repositories({ repositories }: { repositories: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(() => Math.round(count.get()))
  const [displayValue, setDisplayValue] = useState(0)

  // Animate the progress based on contributions (assuming max of 365 for a year)
  const progress = useTransform(count, [0, 50], [0, 100])
  const animatedProgress = useSpring(progress, { stiffness: 100, damping: 30 })

  // Convert progress to stroke-dashoffset for circle animation
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDashoffset = useTransform(animatedProgress, [0, 100], [circumference, 0])

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest)
    })
    return unsubscribe
  }, [rounded])

  useEffect(() => {
    // Animate to the target contributions count
    const controls = animate(count, repositories, { duration: 1, delay: 0.2 })
    return () => controls.stop()
  }, [repositories, count])

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-32 h-32">
        <svg
          width="128"
          height="128"
          viewBox="0 0 96 96"
          className="absolute inset-0"
        >
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-300"
          />
          {/* Animated progress circle */}
          <motion.circle
            cx="48"
            cy="48"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            className="rotate-[-90deg] origin-center"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6e8bff" />
              <stop offset="50%" stopColor="#6e8bff" />
              <stop offset="100%" stopColor="#6e8bff" />
            </linearGradient>
          </defs>
        </svg>

        {/* Count display in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{displayValue}</p>
            <p className="text-xs text-muted-foreground">repositories</p>
            <p className="text-xs text-muted-foreground">maintained</p>
          </div>
        </div>
      </div>
    </div>
  );
}
