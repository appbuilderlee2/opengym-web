// Local, transparent training guidance. No AI service and no medical claims.
// Frequency is a proxy for consistency, not a measurement of exertion.
const dateKey = d => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
export function trainingAdvice(state, now = new Date()) {
  const done = new Set((state?.workouts || []).map(w => w.d).filter(Boolean))
  const week = state?.week || {}
  const planned = []
  for (let ago = 1; ago <= 14; ago++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ago, 12)
    const key = dateKey(day)
    const pinned = state?.dayPlan?.[key]
    const plan = pinned !== undefined ? pinned : week[day.getDay()]
    if (Array.isArray(plan) ? plan.length : Boolean(plan)) planned.push(key)
  }
  const completed = planned.filter(d => done.has(d)).length
  const ratio = planned.length ? completed / planned.length : null
  const recent = [...done].filter(d => {
    const day = new Date(d + 'T12:00:00')
    return Number.isFinite(day.getTime()) && (now - day) / 86400000 <= 14 && day <= now
  }).length
  if (ratio === null || planned.length < 3) {
    return { direction: 'hold', completed, planned: planned.length, recent, reason: '未有足夠既定訓練紀錄，先維持舒適強度。' }
  }
  if (ratio >= 0.85 && completed >= 4) {
    return { direction: 'increase', completed, planned: planned.length, recent, reason: '最近兩星期完成率穩定，可選擇小幅進階；如仍然疲勞就維持。' }
  }
  if (ratio < 0.5) {
    return { direction: 'ease', completed, planned: planned.length, recent, reason: '最近較難跟上計劃，建議減少一組或降低時間，先建立穩定習慣。' }
  }
  return { direction: 'hold', completed, planned: planned.length, recent, reason: '保持目前強度，確保動作穩定及恢復充足。' }
}
