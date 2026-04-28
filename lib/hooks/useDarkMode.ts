'use client'

import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('triphoppa-theme')
    if (stored === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('triphoppa-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('triphoppa-theme', 'light')
      }
      return next
    })
  }

  return { isDark, toggle }
}