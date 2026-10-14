// Offline bodyweight plan generator: output is compatible with standard openGym routines.
import { CATALOGUE } from './exercises.js'
import { defaultConfig } from './history.js'

const blocks = [
  { title: '全身力量', movements: [['squat'], ['push up', 'push-up'], ['mountain climber'], ['plank']] },
  { title: '低衝擊心肺', movements: [['march', 'walking'], ['step up', 'step-up'], ['bird dog', 'bird-dog'], ['standing calf raise', 'calf raise']] },
  { title: '下半身及核心', movements: [['lunge'], ['glute bridge', 'hip bridge'], ['dead bug'], ['side plank']] },
  { title: '全身循環', movements: [['squat'], ['push up', 'push-up'], ['reverse lunge', 'lunge'], ['plank']] },
  { title: '活動與穩定', movements: [['bird dog', 'bird-dog'], ['glute bridge'], ['standing calf raise', 'calf raise'], ['dead bug']] },
]
const levels = { beginner: [2, 8, 20], intermediate: [3, 12, 30], advanced: [4, 15, 40] }
const text = ex => String(ex.name || ex.n || ex.title || '').toLowerCase()
const equipment = ex => String(ex.eq || ex.equipment || '').toLowerCase()
const isBodyweight = ex => /body weight|bodyweight|none|no equipment/.test(equipment(ex)) || (!equipment(ex) && ['calisthenics', 'isometric'].includes(ex.cat))
function findExercise(terms) {
  const found = CATALOGUE.filter(ex => terms.some(term => text(ex).includes(term)))
  return found.find(isBodyweight) || found.find(ex => ['calisthenics', 'isometric'].includes(ex.cat)) || null
}
export function generateBodyweightPlan({ level = 'beginner', days = 4, duration = 25, impact = 'low' }, makeId) {
  const [baseSets, reps, sec] = levels[level] || levels.beginner
  const selected = blocks.slice(0, Math.max(3, Math.min(5, Number(days) || 4))).map(block => (
    impact === 'normal' && block.title === '低衝擊心肺'
      ? { ...block, title: '心肺循環', movements: [['jumping jack'], ['high knees'], ['mountain climber'], ['plank']] }
      : block
  ))
  const approxSets = Math.max(1, Math.min(baseSets, Math.floor((Number(duration) || 25) / 8)))
  return selected.map((block, index) => {
    const entries = []
    for (const terms of block.movements) {
      const ex = findExercise(terms)
      if (!ex || entries.some(x => x.id === ex.id)) continue
      const base = defaultConfig(ex.id)
      entries.push({
        id: ex.id, ...base, bodyweight: true, sets: approxSets,
        ...(base.mode === 'time' || /plank|wall sit/.test(text(ex)) ? { mode: 'time', sec } : { reps }),
      })
    }
    return {
      id: makeId(), name: '徒手減脂 · ' + block.title, emoji: '🔥', ex: entries,
      bodyweightPlan: { week: 1, duration: Number(duration), impact, level, order: index },
    }
  }).filter(r => r.ex.length > 0)
}
export const BODYWEIGHT_DAYS = [1, 3, 5, 0, 2]
