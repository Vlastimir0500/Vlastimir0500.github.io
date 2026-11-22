export const milestones = [
  {
    id: 'model', short: 'Spatial model', needs: [], role: 'Research software engineer', track: 'Computational neuroscience',
    title: 'Model a sense of place.', aim: 'Build a simulator that turns a voyage into a sequence of noisy place-cell responses. This is where a question about memory becomes a software problem.',
    deliverable: 'A seeded trajectory generator, an encoder, and a plot that puts firing rate beside position.',
    test: 'Change the seed and the route changes. Repeat a seed and every recorded observation matches.',
    link: '#research-atlas', linkText: 'Inspect the place-field study',
  },
  {
    id: 'automate', short: 'Pipeline', needs: [], role: 'Research software engineer', track: 'Automation engineering',
    title: 'Make the experiment runnable.', aim: 'Turn a notebook sequence into one job with explicit inputs, outputs and failure states. A collaborator should be able to run it without guessing which cell comes next.',
    deliverable: 'A configuration-driven pipeline that generates training data, fits a decoder, evaluates held-out voyages, and writes a result manifest.',
    test: 'Run from a clean environment with a single seed. Check the manifest contains the configuration, baseline and predictions.',
    link: '#navigation-replay', linkText: 'Run the browser experiment',
  },
  {
    id: 'bench', short: 'Benchmarks', needs: ['model'], role: 'Applied research engineer', track: 'Measurement and topology',
    title: 'Give the navigator a fair test.', aim: 'Find out when a spatial decoder earns its complexity. Reserve whole voyages for testing, compare with a last-landmark estimate, and vary how often landmarks appear.',
    deliverable: 'A benchmark comparing position error and recovery of the route’s loops across controlled changes in coverage.',
    test: 'Report errors by held-out voyage and show at least one case where the simpler baseline wins or the loop disappears.',
    link: '#mathematics', linkText: 'See my approach to estimator checks',
  },
  {
    id: 'reproduce', short: 'Replay', needs: ['automate'], role: 'Applied research engineer', track: 'Research infrastructure',
    title: 'Make a run replayable.', aim: 'Give every result a trail back to its data, code and assumptions. Automate regression checks so that a changed model cannot quietly inherit an old result.',
    deliverable: 'A versioned run manifest and a regression suite that replays a known seed and checks numerical tolerances.',
    test: 'A second machine can recreate a recorded run. A deliberately altered fixture produces a failing check.',
    link: '#work', linkText: 'See verification in MORPH',
  },
  {
    id: 'navigate', short: 'Navigator', needs: ['bench','reproduce'], role: 'Spatial intelligence research engineer', track: 'Systems integration',
    title: 'Close a channel. Watch it adapt.', aim: 'Combine the decoder and the replay pipeline in one navigation system. When a familiar channel closes, measure what the agent has to relearn.',
    deliverable: 'An interactive navigator with route reconstruction, a channel-closure test and a reproducible comparison with a fixed-map agent.',
    test: 'Count the crossings required to recover, and inspect whether the inferred route still connects the right landmarks.',
    link: '#research-atlas', linkText: 'Explore the proposed archipelago',
  },
  {
    id: 'publish', short: 'Release', needs: ['navigate'], role: 'Research engineering lead', track: 'Technical ownership',
    title: 'Ship a system someone else can use.', aim: 'Practice owning the whole research cycle, from a testable question to a release that another engineer can extend and challenge.',
    deliverable: 'An open research toolkit, a reproducible demonstration, a technical report and a documented failure case.',
    test: 'An independent reader can reproduce a figure, explain a limitation, and add a new environment from the public instructions.',
    link: 'https://github.com/Vlastimir0500', linkText: 'Browse my existing repositories',
  },
] as const

export type MilestoneId = typeof milestones[number]['id']
export function available(id:MilestoneId, done:readonly MilestoneId[]) {
  const milestone=milestones.find(m=>m.id===id)!
  return milestone.needs.every(parent=>done.includes(parent))
}
export function nextMilestone(done:readonly MilestoneId[]) {
  return milestones.find(m=>!done.includes(m.id) && available(m.id,done))?.id ?? null
}

const storageKey='vlastimir.career-route.v1'
export function readProgress():MilestoneId[] {
  try {
    const value:unknown=JSON.parse(localStorage.getItem(storageKey) || '[]')
    if (!Array.isArray(value)) return []
    const valid:MilestoneId[]=[]
    for (const item of value) {
      const m=milestones.find(node=>node.id===item)
      if (m && !valid.includes(m.id) && available(m.id,valid)) valid.push(m.id)
    }
    return valid
  } catch { return [] }
}
export function saveProgress(done:readonly MilestoneId[]) {
  try {localStorage.setItem(storageKey,JSON.stringify(done))} catch { /* The preview still works for this visit. */ }
}
