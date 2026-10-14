import { useEffect, useRef, useState } from 'react'
import { trainingAdvice } from '../lib/bodyweight-guidance.js'

const STORAGE = 'opengym_interval_timer_v1'
const DEFAULT = { work: 30, rest: 30, rounds: 8 }
const clamp = (n, low, high, fallback) => Number.isFinite(Number(n)) ? Math.min(high, Math.max(low, Math.round(Number(n)))) : fallback
function initialConfig() {
  try {
    const c = JSON.parse(localStorage.getItem(STORAGE) || '{}')
    return { work: clamp(c.work, 10, 300, 30), rest: clamp(c.rest, 5, 180, 30), rounds: clamp(c.rounds, 1, 30, 8) }
  } catch { return DEFAULT }
}
function phaseAt(config, elapsed) {
  const cycle = config.work + config.rest
  const total = cycle * config.rounds - config.rest
  if (elapsed >= total) return { phase: 'done', round: config.rounds, remaining: 0 }
  const round = Math.floor(elapsed / cycle) + 1
  const offset = elapsed % cycle
  const work = offset < config.work
  return { phase: work ? 'work' : 'rest', round, remaining: Math.max(0, Math.ceil((work ? config.work : cycle) - offset)) }
}
const time = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

export default function BodyweightTools({ S }) {
  const advice = trainingAdvice(S)
  const [config, setConfig] = useState(initialConfig)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const clock = useRef({ origin: 0, elapsed: 0 })
  const previous = useRef('')
  const setField = (key, value) => {
    setConfig(c => {
      const updated = { ...c, [key]: clamp(value, key === 'rounds' ? 1 : key === 'work' ? 10 : 5, key === 'rounds' ? 30 : key === 'work' ? 300 : 180, c[key]) }
      return updated
    })
    setRunning(false)
    setElapsed(0)
    clock.current.elapsed = 0
  }
  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify(config)) } catch {}
  }, [config])
  useEffect(() => {
    if (!running) return
    // Wall-clock based, so switching apps never makes the interval drift.
    const tick = () => {
      const next = clock.current.elapsed + (Date.now() - clock.current.origin) / 1000
      const max = (config.work + config.rest) * config.rounds - config.rest
      setElapsed(Math.min(max, next))
      if (next >= max) setRunning(false)
    }
    tick()
    const interval = setInterval(tick, 200)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', tick) }
  }, [running, config])
  const phase = phaseAt(config, elapsed)
  useEffect(() => {
    const current = phase.phase + ':' + phase.round
    if (!running || current === previous.current) return
    previous.current = current
    if (previous.current && navigator.vibrate) {
      try { navigator.vibrate(100) } catch {}
    }
  }, [phase.phase, phase.round, running])
  const pause = () => {
    if (running) {
      clock.current.elapsed = elapsed
      setRunning(false)
    } else {
      if (phase.phase === 'done') { clock.current.elapsed = 0; setElapsed(0) }
      clock.current.origin = Date.now()
      previous.current = ''
      setRunning(true)
    }
  }
  const reset = () => {
    setRunning(false)
    setElapsed(0)
    clock.current.elapsed = 0
    previous.current = ''
  }
  return <section className="bw-tools" aria-label="徒手訓練工具">
    <div className="bw-head"><span>徒手訓練</span><span className="bw-kicker">本機智能建議</span></div>
    <div className="bw-advice">
      <div className="bw-subhead">自動調整難度</div>
      <div className="bw-level">{advice.direction === 'increase' ? '可小幅增加強度 ↑' : advice.direction === 'ease' ? '建議放慢節奏 ↓' : '維持現時難度 →'}</div>
      <p>{advice.reason}</p>
      <div className="bw-meta">過去 14 日：已完成 {advice.completed}／{advice.planned} 個安排訓練日</div>
      <p className="bw-note">只按計劃完成率提供建議，唔會自動修改原有課表；有疼痛、不適或明顯疲勞時應減量或休息。</p>
    </div>
    <div className="bw-advice">
      <div className="bw-subhead">HIIT／循環計時器</div>
      <div className="bw-fields">
        <label>運動（秒）<input aria-label="運動秒數" type="number" min="10" max="300" inputMode="numeric" value={config.work} onChange={e => setField('work', e.target.value)} /></label>
        <label>休息（秒）<input aria-label="休息秒數" type="number" min="5" max="180" inputMode="numeric" value={config.rest} onChange={e => setField('rest', e.target.value)} /></label>
        <label>循環次數<input aria-label="循環次數" type="number" min="1" max="30" inputMode="numeric" value={config.rounds} onChange={e => setField('rounds', e.target.value)} /></label>
      </div>
      <div className="bw-clock" role="timer" aria-label="剩餘時間">
        <span>{phase.phase === 'done' ? '完成' : phase.phase === 'work' ? '運動' : '休息'} · 第 {phase.round}/{config.rounds} 輪</span>
        <strong>{time(phase.remaining)}</strong>
      </div>
      <div className="bw-actions">
        <button type="button" onClick={pause}>{running ? '暫停' : phase.phase === 'done' ? '重新開始' : elapsed ? '繼續' : '開始'}</button>
        <button type="button" onClick={reset}>重設</button>
      </div>
      <p className="bw-note">計時器只喺網頁開啟時運作；iPhone 鎖屏或切換 App 時無法保證提示音或震動。數值會保存在呢部裝置。</p>
    </div>
  </section>
}
