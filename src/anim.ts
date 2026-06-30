import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Reveal [data-reveal] elements as they scroll into view (fade + rise).
 *  Uses gsap.from so elements stay visible if a trigger ever misfires. */
export function revealOnScroll(scope?: Element | null) {
  const els = gsap.utils.toArray<HTMLElement>(
    scope ? scope.querySelectorAll('[data-reveal]') : '[data-reveal]',
  )
  els.forEach((el) => {
    gsap.from(el, {
      y: 30,
      autoAlpha: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    })
  })
}

export { gsap, ScrollTrigger }
