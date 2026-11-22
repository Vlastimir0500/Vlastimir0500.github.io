import Silicon from './Silicon'
import Mathematics from './Mathematics'
import Intelligence from './Intelligence'
import { ProjectTourProvider } from './ProjectTour'
import '../editorial/editorial.css'
import './exhibits.css'

export default function ProjectChapters() {
  return <ProjectTourProvider><Silicon /><Mathematics /><Intelligence /></ProjectTourProvider>
}
