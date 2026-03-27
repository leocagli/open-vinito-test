export function isWalletConnectResetError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /connection request reset/i.test(message)
}

export function clearWalletConnectSessionStorage(): void {
  if (typeof window === 'undefined') return

  const shouldClear = (key: string) => {
    const lower = key.toLowerCase()
    return key.startsWith('wc@2') || lower.includes('walletconnect') || key.startsWith('WCM_')
  }

  try {
    const localKeys = Object.keys(window.localStorage)
    for (const key of localKeys) {
      if (shouldClear(key)) {
        window.localStorage.removeItem(key)
      }
    }
  } catch {
    // Ignore storage access errors.
  }

  try {
    const sessionKeys = Object.keys(window.sessionStorage)
    for (const key of sessionKeys) {
      if (shouldClear(key)) {
        window.sessionStorage.removeItem(key)
      }
    }
  } catch {
    // Ignore storage access errors.
  }
}
