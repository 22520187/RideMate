import { useEffect, useState } from 'react'

/**
 * Hook để debounce giá trị với delay time
 * @param {any} value - Giá trị cần debounce
 * @param {number} delay - Thời gian delay (ms)
 * @returns {any} - Giá trị đã được debounce
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook để debounce callback function
 * @param {Function} callback - Function cần debounce
 * @param {number} delay - Thời gian delay (ms)
 * @param {Array} deps - Dependencies array
 * @returns {Function} - Function đã được debounce
 */
export const useDebouncedCallback = (callback, delay, deps = []) => {
  const [debouncedCallback, setDebouncedCallback] = useState(() => callback)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [callback, delay, ...deps])

  return debouncedCallback
}
