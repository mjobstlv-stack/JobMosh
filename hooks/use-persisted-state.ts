"use client"

import { type Dispatch, type SetStateAction, useEffect, useState } from "react"

/**
 * Drop-in replacement for useState that persists value in localStorage.
 * Falls back to initialValue on first load (SSR-safe).
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setStateRaw] = useState<T>(initialValue)

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) setStateRaw(JSON.parse(stored) as T)
    } catch {}
  }, [key])

  function setState(value: SetStateAction<T>) {
    setStateRaw((prev) => {
      const next =
        typeof value === "function" ? (value as (p: T) => T)(prev) : value
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  return [state, setState]
}
