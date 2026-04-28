import { logger } from '../utils/logger'

function isBrowser() {
  return typeof window !== 'undefined'
}

function getStorage(storageType) {
  if (!isBrowser()) return null

  try {
    return window[storageType]
  } catch (error) {
    logger.warn(`Unable to access ${storageType}.`, { message: error?.message })
    return null
  }
}

export function readStorageItem(storageType, key) {
  const storage = getStorage(storageType)
  if (!storage) return null

  try {
    return storage.getItem(key)
  } catch (error) {
    logger.warn(`Unable to read ${storageType} item.`, { key, message: error?.message })
    return null
  }
}

export function writeStorageItem(storageType, key, value) {
  const storage = getStorage(storageType)
  if (!storage) return false

  try {
    storage.setItem(key, value)
    return true
  } catch (error) {
    logger.warn(`Unable to write ${storageType} item.`, { key, message: error?.message })
    return false
  }
}

export function removeStorageItem(storageType, key) {
  const storage = getStorage(storageType)
  if (!storage) return false

  try {
    storage.removeItem(key)
    return true
  } catch (error) {
    logger.warn(`Unable to remove ${storageType} item.`, { key, message: error?.message })
    return false
  }
}
