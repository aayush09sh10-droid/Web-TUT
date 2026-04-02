import { useEffect } from 'react'
import { useAppDispatch } from '../../../store/hooks'
import { fetchHomeHistory } from '../api/homeApi'
import { setHomeHistory } from '../store/homeSlice'

export function useHomeHistory(authToken, headers) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!authToken) return

    const controller = new AbortController()

    async function loadHistory() {
      try {
        const items = await fetchHomeHistory(headers, controller.signal)
        dispatch(setHomeHistory(items))
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('History load error:', err)
        }
      }
    }

    loadHistory()
    return () => controller.abort()
  }, [authToken, dispatch, headers])
}
