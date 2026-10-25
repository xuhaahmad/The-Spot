import { createContext, useContext } from 'react'

// Saved cafés and recent searches. The provider lives in PersonalProvider.jsx.
export const PersonalContext = createContext(null)

export function usePersonal() {
  const context = useContext(PersonalContext)
  if (!context) throw new Error('usePersonal must be used inside <PersonalProvider>')
  return context
}
