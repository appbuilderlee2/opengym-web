// Generates ordinary openGym routines from catalogue-only bodyweight exercises.
// All suggestions run locally and never overwrite a saved workout.
import { CATALOGUE } from './exercises.js'
import { defaultConfig } from './history.js'

export const BODYWEIGHT_DAYS = [1, 3, 5, 0, 2]
export const BODYWEIGHT_STYLES = [
  ['balanced', '均衡全身'], ['strength', '肌力塑形'], ['cardio', '心肺燃脂'],
  ['core', '核心強化'], ['lower', '臀腿訓練'], ['upper', '上半身'],
  ['mobility', '低強度活動'], ['mixed', '混合循環'],
]
const exercises = {
  squat: ['squat'], reverseLunge: ['reverse lunge','lunge'], bridge: ['glute bridge','hip bridge'],
  calf: ['calf raise'], step: ['step up','step-up'], wall: ['wall sit'],
  push: ['push up','push-up'], incline: ['incline push up','incline push-up','wall push up'],
  plank: ['plank'], side: ['side plank'], bird: ['bird dog','bird-dog'],
  dead: ['dead bug'], crunch: ['crunch'], climber: ['mountain climber'],
  jack: ['jumping jack'], knees: ['high knees'], march: ['march','walking'],
  superman: ['superman'], leg: ['leg raise'],
}
const blocks = {
  balanced: [
    ['全身力量', ['squat','push','bridge','plank','bird']],
    ['心肺與核心', ['march','step','climber','dead','side']],
    ['臀腿力量', ['reverseLunge','bridge','squat','calf','wall']],
    ['全身循環', ['push','squat','bird','climber','plank']],
    ['恢復與穩定', ['bird','bridge','dead','calf','side']],
  ],
  strength: [
    ['全身肌力', ['squat','push','bridge','plank']],
    ['下半身肌力', ['reverseLunge','squat','bridge','calf']],
    ['上身及核心', ['push','incline','superman','side']],
    ['肌耐力循環', ['squat','push','wall','dead']],
    ['穩定訓練', ['bird','bridge','plank','reverseLunge']],
  ],
  cardio: [
    ['心肺循環 A', ['march','step','climber','squat']],
    ['全身帶氧', ['jack','knees','squat','plank']],
    ['心肺循環 B', ['step','climber','reverseLunge','bird']],
    ['高低交替', ['knees','jack','bridge','dead']],
    ['持續活動', ['march','step','squat','calf']],
  ],
  core: [
    ['核心基礎', ['plank','dead','bird','bridge']],
    ['側腹穩定', ['side','bird','dead','plank']],
    ['動態核心', ['climber','crunch','bridge','dead']],
    ['軀幹控制', ['plank','superman','bird','side']],
    ['核心耐力', ['dead','side','leg','bridge']],
  ],
  lower: [
    ['臀腿基礎', ['squat','bridge','calf','reverseLunge']],
    ['單腳穩定', ['reverseLunge','step','bridge','wall']],
    ['臀腿耐力', ['squat','wall','calf','bridge']],
    ['下肢循環', ['reverseLunge','squat','step','bird']],
    ['恢復與控制', ['bridge','calf','bird','wall']],
  ],
  upper: [
    ['推力與核心', ['push','incline','plank','superman']],
    ['上身穩定', ['incline','bird','side','plank']],
    ['肌耐力', ['push','superman','dead','incline']],
    ['肩帶穩定', ['bird','plank','push','side']],
    ['全身輔助', ['squat','incline','bridge','superman']],
  ],
  mobility: [
    ['溫和全身', ['march','bird','bridge','calf']],
    ['下肢活動', ['squat','calf','bridge','step']],
    ['核心穩定', ['dead','bird','side','bridge']],
    ['輕量循環', ['march','step','wall','bird']],
    ['恢復運動', ['bridge','calf','dead','march']],
  ],
  mixed: [
    ['全身力量', ['squat','push','bridge','plank']],
    ['心肺循環', ['march','step','climber','dead']],
    ['核心強化', ['side','bird','dead','crunch']],
    ['臀腿肌力', ['reverseLunge','wall','squat','bridge']],
    ['混合挑戰', ['push','jack','squat','plank']],
  ],
}
const levelConfig = { beginner: [2,8,20], intermediate: [3,12,30], advanced: [4,15,40] }
const nameOf = ex => String(ex.name || ex.n || ex.title || '').toLowerCase()
const eqOf = ex => String(ex.eq || ex.equipment || '').toLowerCase()
const unweighted = ex => /body weight|bodyweight|none|no equipment/.test(eqOf(ex)) || (!eqOf(ex) && ['calisthenics','isometric'].includes(ex.cat))
const noJump = /jump|burpee|high knees|mountain climber|hop|bound|plyometric/i
const findExercise = (terms, lowImpact) => {
  const possible = CATALOGUE.filter(ex => unweighted(ex) && (!lowImpact || !noJump.test(nameOf(ex))))
  for (const term of terms) {
    const exact = possible.find(ex => nameOf(ex) === term)
    if (exact) return exact
    const partial = possible.find(ex => nameOf(ex).includes(term))
    if (partial) return partial
  }
  return null
}
const rotate = (arr, offset) => arr.map((_, index) => arr[(index + offset) % arr.length])
export function generateBodyweightPlan({ level='beginner', days=4, duration=25, impact='low', style='balanced', variation=0 }={}, makeId) {
  const count = Math.max(3, Math.min(5, Number(days) || 4))
  const [sets, reps, secs] = levelConfig[level] || levelConfig.beginner
  const pool = blocks[style] || blocks.balanced
  const step = Math.abs(Math.trunc(Number(variation) || 0)) % pool.length
  const chosen = rotate(pool, step).slice(0, count)
  const used = new Map()
  const result = chosen.map(([title, keys], index) => {
    const ex = []
    const shifted = rotate(keys, step % keys.length)
    for (const key of shifted) {
      const entry = findExercise(exercises[key], impact === 'low')
      if (!entry || ex.some(item => item.id === entry.id)) continue
      // Favor varied movement patterns across the week, while allowing repeat staples.
      const seen = used.get(entry.id) || 0
      if (seen >= 2 && ex.length >= 3) continue
      const base = defaultConfig(entry.id)
      const hold = /plank|wall sit/.test(nameOf(entry))
      ex.push({ ...base, id: entry.id, bodyweight: true,
        sets: Math.max(1, Math.min(sets, Math.floor(Number(duration) / 8))),
        ...(hold || base.mode === 'time' ? { mode:'time', sec:secs } : { mode:'reps', reps }) })
      used.set(entry.id, seen + 1)
    }
    return { id: makeId(), name: '徒手減脂 · ' + title, emoji:'🔥', ex,
      bodyweightPlan: { style, level, impact, duration: Number(duration), variation:step, order:index } }
  }).filter(r => r.ex.length >= 2)
  return result
}
