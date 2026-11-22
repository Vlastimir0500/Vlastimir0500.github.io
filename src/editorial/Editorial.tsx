import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ProjectChapters from '../exhibits/ProjectChapters'
import ExperimentWall from '../desk/ExperimentWall'
import { Contact, Introduction } from '../story/StoryEnds'
import './editorial.css'

export default function Editorial() {
  const content = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element=content.current
    if (!element) return
    const media=gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      for (const title of element.querySelectorAll('h2')) {
        gsap.fromTo(title,{y:16,opacity:.72},{y:0,opacity:1,ease:'none',
          scrollTrigger:{trigger:title,start:'top 97%',end:'top 77%',scrub:true}})
      }
    })
    let frame=0
    let height=element.offsetHeight
    const resize=new ResizeObserver(() => {
      if (element.offsetHeight === height) return
      height=element.offsetHeight
      cancelAnimationFrame(frame)
      frame=requestAnimationFrame(() => ScrollTrigger.refresh())
    })
    resize.observe(element)
    return () => {media.revert(); resize.disconnect(); cancelAnimationFrame(frame)}
  },[])
  return <div className="ed-content" ref={content}>
    <Introduction />
    <ProjectChapters />
    <ExperimentWall />
    <Contact />
  </div>
}
