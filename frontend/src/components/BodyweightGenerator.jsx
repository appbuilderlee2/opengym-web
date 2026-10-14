import { useState } from 'react'
import { generateBodyweightPlan, BODYWEIGHT_DAYS, BODYWEIGHT_STYLES } from '../lib/bodyweight-plan.js'
import { uid } from '../lib/format.js'

const CHOICES = { level: [['beginner','初級'],['intermediate','中級'],['advanced','進階']], days: [[3,'3 日'],[4,'4 日'],[5,'5 日']], duration: [[15,'15 分鐘'],[25,'25 分鐘'],[40,'40 分鐘']], impact: [['low','低衝擊'],['normal','一般']] }
function Choice({ title, options, value, onChange }) {
  return <label className="bw-generator-choice"><span>{title}</span><select value={value} onChange={e => onChange(e.target.value)}>{options.map(([v,label]) => <option key={v} value={v}>{label}</option>)}</select></label>
}
export default function BodyweightGenerator({ S, update, nav }) {
  const [open, setOpen] = useState(false)
  const [level, setLevel] = useState('beginner')
  const [days, setDays] = useState('4')
  const [duration, setDuration] = useState('25')
  const [impact, setImpact] = useState('low')
  const [style, setStyle] = useState('balanced')
  const [variation, setVariation] = useState('0')
  const [replaceWeek, setReplaceWeek] = useState(false)
  const [message, setMessage] = useState('')
  const create = () => {
    const routines = generateBodyweightPlan({ level, days: Number(days), duration: Number(duration), impact, style, variation: Number(variation) }, uid)
    if (!routines.length) {
      setMessage('暫時搵唔到合適嘅內建徒手動作，未有改動原有計劃。')
      return
    }
    update(state => {
      state.routines.push(...routines)
      if (replaceWeek) {
        // Explicit opt-in only. Preserve every other routine by default.
        for (const key of Object.keys(state.week || {})) delete state.week[key]
        routines.forEach((r, i) => { state.week[BODYWEIGHT_DAYS[i]] = r.id })
      } else {
        routines.forEach((r, i) => {
          const day = BODYWEIGHT_DAYS[i]
          const prev = state.week[day]
          state.week[day] = [...new Set([...([]).concat(prev || []).filter(Boolean), r.id])]
        })
      }
    })
    setMessage('已加入 ' + routines.length + ' 個徒手訓練，並安排到每週課表。')
    setOpen(false)
  }
  return <section className="bw-generator">
    <button className="bw-generator-entry" type="button" onClick={() => setOpen(v => !v)} aria-expanded={open}>
      <span className="bw-entry-icon" aria-hidden="true">🔥</span>
      <span className="bw-entry-copy"><strong>徒手減脂計劃</strong><small>毋須器械 · 自訂難度 · 每週課表</small></span>
      <span aria-hidden="true">{open ? '−' : '+'}</span>
    </button>
    {open && <div className="bw-generator-body">
      <p>根據你嘅體能、時間同訓練日數，從 openGym 動作庫建立可編輯課表。</p>
      <div className="bw-generator-grid">
        <Choice title="訓練類型" value={style} onChange={setStyle} options={BODYWEIGHT_STYLES} />
        <Choice title="動作組合" value={variation} onChange={setVariation} options={[[0,"組合 A"],[1,"組合 B"],[2,"組合 C"],[3,"組合 D"],[4,"組合 E"]]} />
        <Choice title="目前體能" value={level} onChange={setLevel} options={CHOICES.level} />
        <Choice title="每星期" value={days} onChange={setDays} options={CHOICES.days} />
        <Choice title="每次時間" value={duration} onChange={setDuration} options={CHOICES.duration} />
        <Choice title="運動衝擊" value={impact} onChange={setImpact} options={CHOICES.impact} />
      </div>
      <label className="bw-generator-check"><input type="checkbox" checked={replaceWeek} onChange={e => setReplaceWeek(e.target.checked)} />取代現有每週日程（保留原有訓練動作和記錄）</label>
      <p className="bw-generator-help">每種訓練類型提供 5 種組合，全部由原有動作庫配搭。預設不刪除舊課表；低衝擊會排除跑跳動作。實際動作以本機動作庫為準。</p>
      <button type="button" className="bw-create" onClick={create}>產生並加入我的課表</button>
    </div>}
    {message && <p className="bw-generator-message" role="status">{message}</p>}
  </section>
}
