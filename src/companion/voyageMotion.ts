export type Motion = 'idle' | 'walk' | 'run' | 'jump' | 'land' | 'look' | 'wave' | 'point' | 'celebrate' | 'sit' | 'inspect' | 'seated-wave'

const neutral = {
  nearShoulder: 8, nearElbow: 8, nearWrist: -5, farShoulder: -12, farElbow: 13, farWrist: 0,
  nearHip: 5, nearKnee: -4, nearFoot: 0, farHip: -9, farKnee: 4, farFoot: 0,
  spine: -2, head: 1, hat: -6, gaze: 0, lift: 0,
}
export type Pose = typeof neutral
export type Joint = Exclude<keyof Pose, 'lift'>
export const joints = Object.keys(neutral).filter((name): name is Joint => name !== 'lift')

export function poseFor(motion: Motion, stride: number, time: number, amount: number): Pose {
  const pose = { ...neutral }
  const sway = Math.sin(time * .0065)
  const sit = { nearHip: 70, nearKnee: -74, nearFoot: -5, farHip: 47, farKnee: -60, farFoot: 8, spine: 8, lift: 6 }
  switch (motion) {
    case 'walk':
    case 'run': {
      const run = motion === 'run'
      const strideSize = run ? 51 : 26
      const gait = Math.sin(stride)
      const lead = Math.cos(stride)
      Object.assign(pose, {
        nearHip: gait * strideSize, farHip: -gait * strideSize,
        nearKnee: -5 - Math.max(0, -lead) * (run ? 69 : 31),
        farKnee: -5 - Math.max(0, lead) * (run ? 69 : 31),
        nearFoot: -gait * 13, farFoot: gait * 13,
        nearShoulder: -gait * (run ? 44 : 23), farShoulder: gait * (run ? 44 : 23),
        nearElbow: run ? 72 : 20, farElbow: run ? 66 : 20,
        spine: run ? -12 : -4, head: run ? 5 : 1, hat: -6 - lead * 2,
        lift: -Math.abs(lead) * (run ? 4.6 : 2.2),
      })
      break
    }
    case 'jump':
      Object.assign(pose, { nearHip: 37, nearKnee: -55, farHip: -18, farKnee: -38, nearShoulder: 73, nearElbow: 35, farShoulder: -65, farElbow: -15, spine: -7, head: 5, hat: -10 }); break
    case 'land':
      Object.assign(pose, { nearHip: 32, nearKnee: -53, nearFoot: 17, farHip: 18, farKnee: -40, farFoot: 19, nearShoulder: 30, nearElbow: 18, farShoulder: -24, lift: 4, spine: -12, head: 8 }); break
    case 'wave':
      Object.assign(pose, { nearShoulder: 78, nearElbow: 75 + 11 * sway, nearWrist: -13 + 17 * sway, farShoulder: -19, head: -6, hat: -10 }); break
    case 'look':
      Object.assign(pose, { head: -9 + amount * 5, gaze: -.55, nearShoulder: 24, nearElbow: 91, nearWrist: 8, farShoulder: -15 }); break
    case 'inspect':
      Object.assign(pose, { spine: -12, head: -15, hat: -4, gaze: -.8, nearHip: 15, nearKnee: -19, nearShoulder: 32, nearElbow: 117, nearWrist: -6, farShoulder: -13, farElbow: 12, lift: 2 }); break
    case 'point':
      Object.assign(pose, { nearShoulder: 77, nearElbow: 13 - amount * 12, nearWrist: 4, farShoulder: -20, farElbow: 40, head: 6, gaze: -.6 }); break
    case 'celebrate':
      Object.assign(pose, { nearShoulder: 111, nearElbow: 40, farShoulder: -112, farElbow: -33, head: 5, spine: 4, nearHip: 10, nearKnee: -10, farHip: -13, farKnee: -8, lift: -2 }); break
    case 'seated-wave':
      Object.assign(pose, sit, { nearShoulder: 83, nearElbow: 70 + 12 * sway, nearWrist: -8 + 14 * sway, farShoulder: 7, farElbow: 32, head: -5 }); break
    case 'sit':
      Object.assign(pose, sit, { nearShoulder: 22, nearElbow: 44, farShoulder: 14, farElbow: 30, head: -10, hat: -9 }); break
  }
  return pose
}

export function applyPose(nodes: Record<Joint, SVGGElement>, joint: Joint, value: number) {
  const n = value.toFixed(2)
  const transform = joint === 'spine' ? 'rotate(' + n + ' 52 86)'
    : joint === 'head' ? 'rotate(' + n + ' 51 55)'
    : joint === 'hat' ? 'rotate(' + n + ' 49 31)'
    : joint === 'gaze' ? 'translate(' + n + ' 0)'
    : 'rotate(' + n + ')'
  nodes[joint].setAttribute('transform', transform)
}
