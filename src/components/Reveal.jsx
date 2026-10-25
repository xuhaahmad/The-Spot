import { useEffect, useRef } from 'react'

/**
 * Gently fades content in the first time it scrolls into view.
 *
 * Content is visible by default. The hidden "pending" state is only added from
 * JavaScript, and only when it's safe: the browser supports IntersectionObserver,
 * the user hasn't asked for reduced motion, and the element starts below the
 * fold. So if JavaScript or the observer fails, nothing is ever left invisible.
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window)) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    // Already on screen when the page loads: show it straight away, no animation.
    if (element.getBoundingClientRect().top < window.innerHeight * 0.9) return undefined

    element.classList.add('reveal--pending')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        element.classList.replace('reveal--pending', 'reveal--in')
        observer.disconnect()
      },
      // The huge top margin counts everything *above* the screen as seen, so content
      // skipped by a fast scroll or the End key is revealed instead of left hidden.
      { rootMargin: '100000px 0px -10% 0px' },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      element.classList.remove('reveal--pending')
    }
  }, [])

  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} style={{ '--reveal-delay': `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  )
}
