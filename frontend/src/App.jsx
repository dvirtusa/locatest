import React, { useState, useRef, useEffect, useCallback } from 'react'

// ─── SSE hook ─────────────────────────────────────────────────────────────────
function useAgent(sessionId, userId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastText, setLastText] = useState('')

  const send = useCallback(async (text) => {
    if (loading) return
    setMessages(prev => [...prev, { type: 'user', text }])
    setLoading(true)
    let agentText = ''
    try {
      const resp = await fetch('/run_sse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId, user_id: userId }),
      })
      const reader = resp.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          try {
            const ev = JSON.parse(line.slice(5).trim())
            if (ev.type === 'progress') {
              setMessages(prev => [...prev.filter(m => m.type !== 'progress'), { type: 'progress', label: ev.label }])
            } else if (ev.type === 'card') {
              setMessages(prev => [...prev.filter(m => m.type !== 'progress' && !m._streaming),
                { type: 'card', card_type: ev.card_type, data: ev.data }])
            } else if (ev.type === 'message_delta' && !ev.done) {
              agentText += ev.text
              setMessages(prev => {
                const last = prev[prev.length - 1]
                if (last?._streaming) return [...prev.slice(0, -1), { type: 'agent', text: agentText, _streaming: true }]
                return [...prev, { type: 'agent', text: agentText, _streaming: true }]
              })
            } else if (ev.type === 'message_delta' && ev.done) {
              setLastText(agentText)
              setMessages(prev => prev.map(m => m._streaming ? { ...m, _streaming: false } : m))
              setLoading(false)
            }
          } catch { /**/ }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: 'agent', text: `Error: ${err.message}` }])
    }
    setLoading(false)
  }, [loading, sessionId, userId])

  return { messages, loading, send, lastText, setMessages }
}

// ─── Google Wordmark ───────────────────────────────────────────────────────────
function GoogleWordmark() {
  return (
    <span className="g-wordmark">
      <span className="G">G</span><span className="o1">o</span><span className="o2">o</span><span className="g2">g</span><span className="l">l</span><span className="e">e</span>
    </span>
  )
}

// ─── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <header className="g-nav">
      <div className="g-logo">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <GoogleWordmark />
      </div>
      <div className="g-divider" />
      <span className="g-product"><span>Loca</span><span>Test</span> <sub>Internal</sub></span>
      <div className="g-nav-right">
        <div className="g-icon-btn" title="Sources">
          <svg viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
        </div>
        <div className="g-icon-btn" title="Notifications">
          <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
        </div>
        <div className="g-icon-btn" title="Help">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
        </div>
        <div className="g-avatar">DT</div>
      </div>
    </header>
  )
}

// ─── Session bar ───────────────────────────────────────────────────────────────
function SessionBar({ onTabChange }) {
  const [paused, setPaused] = useState(false)
  const stats = [
    { label: 'Passed',   value: '1,058', color: '#34a853', tab: 'runtests' },
    { label: 'Failed',   value: '89',    color: '#ea4335', tab: 'runtests' },
    { label: 'P0 Blockers', value: '2',  color: '#f59e0b', tab: 'rca' },
    { label: 'HIL Pending', value: '3',  color: '#a855f7', tab: 'rca' },
    { label: 'Coverage', value: '60.7%', color: 'rgba(255,255,255,.5)', tab: null },
  ]
  return (
    <div className="session-bar">
      <div className="sb-build">
        <div className="sb-icon">
          <svg viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
        </div>
        <span className="sb-name">Nest Hub 4.1.0.12-rc3</span>
        <span className="sb-meta">· Sprint 43 · QA Build</span>
      </div>
      <div className="sb-divider" />
      <div className="sb-stats-row">
        {stats.map(({ label, value, color, tab }) => (
          <div
            key={label}
            className="sb-stat-pill"
            style={{ cursor: tab ? 'pointer' : 'default' }}
            onClick={() => tab && onTabChange(tab)}
            title={tab ? `Go to ${tab}` : undefined}
          >
            <span className="ssp-val" style={{ color }}>{value}</span>
            <span className="ssp-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="sb-right">
        <div className="agent-indicator">
          <div className="ai-dot" />
          <span className="agent-label">Agent Active</span>
        </div>
        <button className="sb-btn" onClick={() => setPaused(p => !p)}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>
    </div>
  )
}

// ─── Tab nav ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'workspace',  label: 'Workspace' },
  { id: 'testgen',    label: 'Test Generator' },
  { id: 'runtests',   label: 'Run Tests' },
  { id: 'rca',        label: 'RCA & Issues' },
  { id: 'builds',     label: 'Builds' },
]

function TabNav({ active, onChange }) {
  return (
    <div className="tab-nav">
      {TABS.map(t => (
        <button key={t.id} className={`tab-btn${active === t.id ? ' active' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Bottom chat bar ───────────────────────────────────────────────────────────
const CHIPS_BY_TAB = {
  workspace:  ['Show dashboard', 'List P0 failures', 'PT-BR coverage', 'Draft Buganizer ticket'],
  runtests:   ['Run PT-BR regression suite', 'Show HIL approval queue', 'Retry failing tests with patch', 'Other locales affected?'],
  rca:        ['Generate RCA report', 'Approve & file issue', 'Compare screenshots', 'Check bundle diff'],
  testgen:    ['Night Mode test suite', 'Show generated tests', 'Which suites need tests?'],
  builds:     ['Show all builds', 'Show blockers', 'Nest Hub test status', 'AR-SA firmware status'],
}

const CHIP_MESSAGES_BY_TAB = {
  workspace: {
    'Show dashboard': 'Show the LocaTest QA dashboard for Sprint 43 — total test count, pass rate, P0 release blockers, automation coverage percentage, and all firmware builds currently in QA.',
    'List P0 failures': 'List all P0 release blocker failures in Sprint 43 for Nest Hub 4.1.0.12-rc3 and Thermostat 6.4.0.3-rc1. Include test IDs (LOC-NH-11198, LOC-NT-11201, etc.), failing locale, device, expected vs actual values.',
    'PT-BR coverage': 'Show PT-BR locale test coverage for Sprint 43 Nest Hub 4.1.0.12-rc3: how many tests ran, passed, failed, automation percentage, and which suites have PT-BR failures. Include the Home Screen & Ambient Display suite breakdown.',
    'Draft Buganizer ticket': 'Draft a Buganizer issue for the critical PT-BR Nest Hub home screen failures: test cases LOC-NH-11198, LOC-NH-11199, LOC-NH-11200. Root cause: missing hs_greeting_morning, hs_weather_label, hs_calendar_today in pt-BR.strings Sprint 43 bundle. Severity S2, Priority P0.',
  },
  runtests: {
    'Run PT-BR regression suite': 'Run the PT-BR Home Screen regression suite for Nest Hub Sprint 43 firmware (4.1.0.12-rc3) across all PT-BR string key scenarios',
    'Show HIL approval queue': 'Show the HIL approval queue — which Sprint 43 test failures are currently blocked awaiting human-in-the-loop decision?',
    'Retry failing tests with patch': 'Retry the failing PT-BR test scenarios after applying the proposed fix: add hs_greeting_morning, hs_weather_label, and hs_calendar_today to pt-BR.strings',
    'Other locales affected?': 'Which locales other than PT-BR are affected by missing home screen string keys in the Sprint 43 Nest Hub build? Check ar-SA, de-DE, fr-FR, ja-JP, ko-KR across the same suite.',
  },
  rca: {
    'Generate RCA report': 'Generate an RCA report for the PT-BR Nest Hub home screen failures (b/337821049): identify root cause, affected string keys, and proposed fix for Sprint 43.',
    'Approve & file issue': 'Approve and file the current RCA draft to Buganizer for b/337821049 — PT-BR Nest Hub Sprint 43 home screen string failures.',
    'Compare screenshots': 'Compare the actual vs expected screenshots for the PT-BR home screen failures: hs_greeting_morning shows "Good morning" instead of "Bom dia".',
    'Check bundle diff': 'Show the pt-BR.strings bundle diff for Sprint 43 — which string keys are missing from the PT-BR bundle that exist in en-US.strings?',
  },
  builds: {
    'Show all builds': 'List all firmware builds currently in QA for Sprint 43: device name, version, status, pass rate, and whether each has a release blocker.',
    'Show blockers': 'Which firmware builds in Sprint 43 have release blockers? List device, version, blocker count, and the critical failing test cases.',
    'Nest Hub test status': 'Show the full test execution status for Nest Hub 4.1.0.12-rc3 in Sprint 43: total executed, passed, failed, skipped, per-locale breakdown, and which suites have failures.',
    'AR-SA firmware status': 'Show the AR-SA (Arabic) test results for the currently selected firmware build: how many tests ran, passed, failed — highlight any RTL layout failures or translation-missing errors.',
  },
}

function ChatDrawer({ onSend, loading, lastText, activeTab, messages, chipContext }) {
  const [expanded, setExpanded] = useState(false)
  const [drawerH, setDrawerH] = useState(320)
  const [input, setInput] = useState('')
  const bodyRef = useRef(null)
  const chips = CHIPS_BY_TAB[activeTab] || []

  const submit = (txt, isChip = false) => {
    let t = (txt || input).trim()
    if (!t || loading) return
    if (isChip) {
      const tabSpecific = CHIP_MESSAGES_BY_TAB[activeTab]?.[t]
      if (chipContext && tabSpecific) {
        t = `${chipContext}\n\n${tabSpecific}`
      } else if (tabSpecific) {
        t = tabSpecific
      } else if (chipContext) {
        t = `${chipContext}\n\n${t}`
      }
    }
    onSend(t)
    setInput('')
  }
  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }

  const startDrag = useCallback((e) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = drawerH
    const onMove = (ev) => {
      const newH = Math.max(100, Math.min(Math.floor(window.innerHeight * 0.72), startH + (startY - ev.clientY)))
      setDrawerH(newH)
      setExpanded(true)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [drawerH])

  useEffect(() => {
    if (expanded && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, expanded])

  return (
    <div className="chat-drawer" style={expanded ? { height: drawerH } : {}}>
      {/* Drag + toggle handle */}
      <div className="drawer-handle" onMouseDown={startDrag}>
        <div className="drawer-grip-zone">
          <div className="drawer-grip" />
        </div>
        <div className="drawer-title-row" onClick={() => setExpanded(e => !e)}>
          <div className="dhc-avatar">
            <svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 012-2z" fill="white"/></svg>
          </div>
          <span className="dhc-label">LocaTest AI</span>
          {!expanded && <span className="dhc-preview">{lastText ? lastText.slice(0, 110) + (lastText.length > 110 ? '…' : '') : 'Ask about this QA session — failures, root cause, test coverage…'}</span>}
          {expanded && <span className="dhc-badge">{messages.length} messages</span>}
          <div className={`dhc-toggle${expanded ? ' flipped' : ''}`}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 15l-6-6-6 6"/></svg>
          </div>
        </div>
      </div>

      {/* Conversation history — only when expanded */}
      {expanded && (
        <div className="drawer-body" ref={bodyRef}>
          {messages.length === 0
            ? <div className="drawer-empty">No conversation yet — ask something below!</div>
            : messages.map((msg, i) => <AgentMsg key={i} msg={msg} onApprove={() => {}} />)
          }
        </div>
      )}

      {/* Input row — always visible */}
      <div className="bc-input-row">
        <div className="bc-chips">
          {chips.map(c => (
            <div key={c} className="bc-chip" onClick={() => submit(c, true)}>{c}</div>
          ))}
        </div>
        <div className="bc-divider" />
        <div className="bc-input-wrap">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask LocaTest AI about this QA session… or type / for playbooks"
          />
          <button className="bc-send" onClick={() => submit()} disabled={loading || !input.trim()}>
            <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Agent feed messages ───────────────────────────────────────────────────────
function AgentMsg({ msg, onApprove, onNavigate }) {
  const bottomRef = useRef(null)
  if (msg.type === 'user') {
    return (
      <div className="msg-user" ref={bottomRef}>
        <div className="msg-user-bubble">{msg.text}</div>
      </div>
    )
  }
  if (msg.type === 'progress') {
    return (
      <div className="msg-progress" ref={bottomRef}>
        <div className="spinner" />
        {msg.label}
      </div>
    )
  }
  if (msg.type === 'agent') {
    return (
      <div className="msg-agent" ref={bottomRef}>
        <div className="agent-avatar" style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" width={14} height={14}><path d="M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 012-2z" fill="white"/></svg>
        </div>
        <div className="msg-agent-bubble">{msg.text}{msg._streaming && <span className="cursor" />}</div>
      </div>
    )
  }
  if (msg.type === 'card') {
    return <div ref={bottomRef}><AgentCard type={msg.card_type} data={msg.data} onApprove={onApprove} onNavigate={onNavigate} /></div>
  }
  return null
}

// ─── Inline reply bar ──────────────────────────────────────────────────────────
function FeedReplyBar({ send, loading, placeholder }) {
  const [input, setInput] = useState('')
  const submit = () => {
    const t = input.trim()
    if (!t || loading) return
    send(t)
    setInput('')
  }
  return (
    <div className="feed-reply-bar">
      <input
        className="frb-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
        placeholder={placeholder || 'Reply to agent…'}
        disabled={loading}
      />
      <button className="frb-send" onClick={submit} disabled={loading || !input.trim()}>
        {loading
          ? <div className="spinner" style={{ width: 12, height: 12, borderTopColor: 'white' }} />
          : <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        }
      </button>
    </div>
  )
}

// ─── Nest Device Screenshot Mock ──────────────────────────────────────────────
// Accepts both step format { actual, expected, key, screen }
// and screenshots format  { wrong, right, key, label, screen }
// variant: 'fail' (default, red) | 'pass' (green, shows expected/right text)
function NestDeviceMock({ shot, locale, variant = 'fail', size = 'sm' }) {
  const key    = shot.key
  const screen = shot.screen || shot.label || ''
  // normalise field names
  const wrongText    = (shot.actual  || shot.wrong  || '').replace(/"/g, '')
  const correctText  = (shot.expected || shot.right  || '').replace(/"/g, '')
  const displayText  = variant === 'pass' ? correctText : wrongText

  const isGreeting = /greeting|morning|afternoon|evening/i.test(screen + key)
  const isWeather  = /weather|clima|temp|rtl_layout|layout/i.test(screen + key)
  const isCalendar = /calendar|today|date/i.test(screen + key)
  const isThermostat = /thermostat|temp_unit|temp_label|temp_display/i.test(screen + key)
  const widgetIcon = isGreeting ? '🌅' : isCalendar ? '📅' : isThermostat ? '🌡' : isWeather ? '🌤' : '📱'

  const isFail  = variant === 'fail'
  const accent  = isFail ? 'rgba(234,67,53,' : 'rgba(52,168,83,'
  const textClr = isFail ? '#ff8a80' : '#81c995'
  const badgeBg = isFail ? 'rgba(234,67,53,.85)' : 'rgba(52,168,83,.8)'
  const badgeText = isFail ? `TRANSLATION MISSING · ${key}` : `✓ Expected · ${key}`

  return (
    <div className={`nest-mock${size === 'lg' ? ' nest-mock-lg' : ''}`}>
      <div className="nm-topbar">
        <span className="nm-device-label">Nest Hub · {locale || 'pt-BR'}</span>
        <span className="nm-fail-badge" style={{ background: badgeBg }}>{badgeText}</span>
      </div>
      <div className="nm-screen" style={{ background: isFail
        ? 'linear-gradient(160deg,#0d1b2a 0%,#1a2840 40%,#0a1628 100%)'
        : 'linear-gradient(160deg,#0d1f12 0%,#122b1a 40%,#0a1810 100%)' }}>
        <div className="nm-clock">
          <span className="nm-time">09:41</span>
          <span className="nm-date">Friday, May 29 · {locale || 'pt-BR'}</span>
        </div>
        <div className="nm-widget" style={{ background: `${accent}.12)`, border: `1px solid ${accent}.35)` }}>
          <span className="nm-widget-icon">{widgetIcon}</span>
          <div className="nm-widget-content">
            <div className="nm-actual-text" style={{ color: textClr }}>{displayText}</div>
            <div className="nm-fail-underline" style={{ background: `${accent}.5)` }} />
            {isFail && correctText && (
              <div className="nm-expected-row">
                <span className="nm-expected-label">Expected →</span>
                <span className="nm-expected-val">{correctText}</span>
              </div>
            )}
          </div>
        </div>
        <div className="nm-dots">
          {[0,1,2,3].map(i => <span key={i} className={`nm-dot ${i===0?'nm-dot-active':''}`} />)}
        </div>
      </div>
    </div>
  )
}

// ─── Card renderers ────────────────────────────────────────────────────────────
function AgentCard({ type, data, onApprove, onNavigate }) {
  switch (type) {
    case 'test.failures': return <FailuresCard data={data} onNavigate={onNavigate} />
    case 'dashboard.summary': return <DashCard data={data} />
    case 'suite.summary': return <SuiteCard data={data} />
    case 'test.list': case 'test.search': return <TestListCard data={data} />
    case 'locale.coverage': case 'locale.comparison': return <LocaleCard data={data} />
    case 'simulation.result': return <SimCard data={data} />
    case 'rca.report': return <RcaCard data={data} />
    case 'issue.draft': return <IssueCard data={data} onApprove={onApprove} onNavigate={onNavigate} />
    case 'issue.filed': return <FiledCard data={data} />
    case 'hil.queue': return <HilQCard data={data} onApprove={onApprove} onNavigate={onNavigate} />
    case 'test.generated': return <GenCard data={data} />
    case 'firmware.list': return <FwCard data={data} />
    case 'sprint.summary': case 'roadmap.overview': return <GenericCard data={data} />
    default: return null
  }
}

function DashCard({ data }) {
  const m = data.metrics || data
  const rows = [['Total Tests', m.total_tests], ['Pass Rate', m.pass_rate], ['Failing', m.failing_tests ?? m.failing], ['Automation Coverage', m.automation_coverage], ['Release Blockers', m.release_blockers], ['Active Sprint', m.active_sprint], ['Firmware Builds in QA', m.firmware_builds_in_qa]].filter(([, v]) => v !== undefined)
  return (
    <div className="phase-block" style={{ marginBottom: 16 }}>
      <div className="phase-header done-ph">
        <div className="ph-icon done"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
        <span className="ph-title">Dashboard Summary</span>
        <span className="ph-chip done">Live</span>
      </div>
      <div className="phase-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', fontFamily: 'Google Sans' }}>{String(v)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FailuresCard({ data, onNavigate }) {
  const failures = data.failures || []
  return (
    <>
      <div style={{ fontFamily: 'Google Sans', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Flagged Failures</div>
      <div className="failure-list">
        {failures.map(f => (
          <div key={f.id} className="failure-item">
            <span className="fi-id">{f.id}</span>
            <div style={{ flex: 1 }}>
              <div className="fi-desc">{f.name}</div>
              <div className="fi-lang">{f.locale} · {f.device || f.suite}</div>
              {f.expected && (
                <div style={{ fontSize: 12, marginTop: 4, display: 'flex', gap: 12 }}>
                  <span>Expected: <strong style={{ color: 'var(--g-green)' }}>{f.expected}</strong></span>
                  <span>Found: <strong style={{ color: 'var(--g-red)' }}>{f.actual}</strong></span>
                </div>
              )}
            </div>
            <div className="fi-link" onClick={() => onNavigate?.('runtests')} style={{ cursor: 'pointer' }}>View in Run Tests <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
          </div>
        ))}
      </div>
    </>
  )
}

function SuiteCard({ data }) {
  const s = data.suite || data
  return (
    <div className="phase-block">
      <div className="phase-header done-ph">
        <div className="ph-icon done"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
        <span className="ph-title">Suite: {s.name}</span>
        <span className="ph-chip done">Loaded</span>
      </div>
      <div className="phase-body">
        <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
          {[['Total', s.total], ['Pass', s.pass], ['Fail', s.fail], ['Coverage', s.automation_coverage]].map(([k, v]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TestListCard({ data }) {
  const cases = data.cases || []
  return (
    <div className="phase-block">
      <div className="phase-header done-ph">
        <div className="ph-icon done"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
        <span className="ph-title">Test Cases ({data.count ?? cases.length})</span>
      </div>
      <div className="phase-body" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['ID', 'Name', 'Status', 'Locale'].map(h => (
                <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: 'var(--text2)', fontSize: 11, fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cases.slice(0, 10).map(tc => (
              <tr key={tc.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                <td style={{ padding: '7px 12px', fontFamily: 'Roboto Mono', color: 'var(--g-blue)', fontSize: 12 }}>{tc.id}</td>
                <td style={{ padding: '7px 12px' }}>{tc.name}</td>
                <td style={{ padding: '7px 12px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: tc.status === 'PASS' ? '#d1fae5' : '#fee2e2', color: tc.status === 'PASS' ? '#065f46' : '#991b1b' }}>{tc.status}</span></td>
                <td style={{ padding: '7px 12px', fontFamily: 'Roboto Mono', fontSize: 12 }}>{tc.locale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LocaleCard({ data }) {
  const locales = data.locales || (data.locale ? [data] : [])
  return (
    <div className="phase-block">
      <div className="phase-header done-ph">
        <div className="ph-icon done"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
        <span className="ph-title">Locale Coverage</span>
      </div>
      <div className="phase-body">
        {locales.map(l => (
          <div key={l.code} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <strong>{l.code} — {l.name}</strong>
              <span style={{ color: l.health_score >= 90 ? 'var(--g-green)' : l.health_score >= 75 ? 'var(--g-yellow)' : 'var(--g-red)', fontWeight: 700 }}>{l.health_score}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${l.health_score}%`, background: l.health_score >= 90 ? 'var(--g-green)' : l.health_score >= 75 ? 'var(--g-yellow)' : 'var(--g-red)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SimCard({ data }) {
  const s = data.simulation || data
  return (
    <div className="phase-block">
      <div className="phase-header done-ph">
        <div className="ph-icon done"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
        <span className="ph-title">Test Run Result — {s.suite}</span>
        <span className="ph-chip done">Complete</span>
      </div>
      <div className="phase-body">
        <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
          {[['Executed', s.executed, 'var(--text)'], ['Passed', s.passed, 'var(--g-green)'], ['Failed', s.failed, 'var(--g-red)']].map(([k, v, c]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: c, fontFamily: 'Google Sans' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{k}</div>
            </div>
          ))}
        </div>
        {s.hil_required && (
          <div style={{ background: 'var(--hil-l)', border: '1px solid var(--hil-border)', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#92400e', fontWeight: 500 }}>
            ✋ Human-in-the-Loop approval required before Buganizer filing
          </div>
        )}
      </div>
    </div>
  )
}

function RcaCard({ data }) {
  const r = data.report || data
  return (
    <div className="phase-block">
      <div className="phase-header active-ph">
        <div className="ph-icon running"><svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 012-2z"/></svg></div>
        <span className="ph-title">{r.id} — {r.title?.slice(0, 50)}…</span>
        <span className="ph-chip running">{r.confidence_score}</span>
      </div>
      <div className="phase-body">
        <p style={{ marginBottom: 8 }}>{r.root_cause}</p>
        {r.affected_tests?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {r.affected_tests.map(id => (
              <span key={id} style={{ fontFamily: 'Roboto Mono', fontSize: 12, background: '#fee2e2', color: 'var(--g-red)', padding: '2px 8px', borderRadius: 10 }}>{id}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function IssueCard({ data, onApprove, onNavigate }) {
  const issue = data.issue || data
  return (
    <div className="hil-card">
      <div className="hil-header">
        <div className="hil-icon"><svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V9h2v3z" fill="white"/></svg></div>
        <span className="hil-label">Buganizer Draft Ready — {issue.id}</span>
        <span className="hil-badge">Review Required</span>
      </div>
      <p className="hil-body"><strong>{issue.title}</strong> · Severity: {issue.severity} · Component: {issue.component}</p>
      <div className="hil-actions">
        <button className="btn-hil-primary" onClick={() => onApprove?.(issue)}>👁 Review &amp; Approve →</button>
        <button className="btn-hil-secondary" onClick={() => onNavigate?.('rca')}>View Details</button>
      </div>
    </div>
  )
}

function FiledCard({ data }) {
  return (
    <div className="phase-block">
      <div className="phase-header done-ph">
        <div className="ph-icon done"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
        <span className="ph-title">Issue Filed — {data.id || data.issue?.id}</span>
        <span className="ph-chip done">Filed</span>
      </div>
      <div className="phase-body">{data.message || 'Issue successfully filed in Buganizer.'}</div>
    </div>
  )
}

function HilQCard({ data, onApprove, onNavigate }) {
  const pending = data.pending || []
  return (
    <div className="hil-card">
      <div className="hil-header">
        <div className="hil-icon"><svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V9h2v3z" fill="white"/></svg></div>
        <span className="hil-label">HIL Approval Queue ({pending.length} pending)</span>
      </div>
      {pending.map(item => (
        <div key={item.issue_id} style={{ background: 'white', borderRadius: 8, padding: 10, marginBottom: 8, border: '1px solid var(--hil-border)' }}>
          <div style={{ fontFamily: 'Roboto Mono', fontSize: 12, color: 'var(--agent)', marginBottom: 4 }}>{item.issue_id}</div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>{item.title}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-hil-primary" onClick={() => onApprove?.(item, true)}>Approve</button>
            <button className="btn-hil-secondary" style={{ color: 'var(--g-red)', borderColor: '#fca5a5' }} onClick={() => onApprove?.(item, false)}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function GenCard({ data }) {
  const tests = data.tests || data.generated || data.generated_tests || []
  return (
    <div className="phase-block">
      <div className="phase-header done-ph">
        <div className="ph-icon done"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
        <span className="ph-title">Generated: {data.count ?? tests.length} Test Cases</span>
        <span className="ph-chip done">✨ AI Generated</span>
      </div>
      <div className="phase-body" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['ID', 'Name', 'Locale'].map(h => <th key={h} style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--text2)', fontSize: 11, fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {tests.slice(0, 8).map((t, i) => (
              <tr key={t.id || i} style={{ borderBottom: '1px solid var(--border2)' }}>
                <td style={{ padding: '6px 12px', fontFamily: 'Roboto Mono', color: 'var(--agent)', fontSize: 11 }}>{t.id}</td>
                <td style={{ padding: '6px 12px' }}>{t.name}</td>
                <td style={{ padding: '6px 12px', fontFamily: 'Roboto Mono', fontSize: 12 }}>{t.locale}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.string_keys?.length > 0 && (
          <div className="string-keys" style={{ margin: 12, borderRadius: 8 }}>
            <div className="sk-title">⚠ New string keys — add to locale bundles</div>
            {data.string_keys.map(k => <div key={k} className="sk-key">{k}</div>)}
          </div>
        )}
      </div>
    </div>
  )
}

function FwCard({ data }) {
  const builds = data.builds || data.firmware_builds || []
  return (
    <div className="phase-block">
      <div className="phase-header done-ph">
        <div className="ph-icon done"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></div>
        <span className="ph-title">Firmware Builds ({builds.length})</span>
      </div>
      <div className="phase-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {builds.map(b => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', borderRadius: 8, padding: 10, border: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{b.device}</div>
              <div style={{ fontFamily: 'Roboto Mono', fontSize: 12, color: 'var(--text3)' }}>{b.version}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: b.status === 'released' ? '#d1fae5' : b.status === 'in_qa' ? 'var(--g-blue-ll)' : '#f1f3f4', color: b.status === 'released' ? '#065f46' : b.status === 'in_qa' ? '#1557b0' : 'var(--text2)' }}>{b.status}</span>
            {b.release_blocker && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fee2e2', color: '#991b1b' }}>Blocker</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function GenericCard({ data }) {
  return <div style={{ background: 'var(--agent-ll)', borderRadius: 10, padding: 12, fontSize: 13, border: '1px solid rgba(109,40,217,.1)' }}><pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Roboto Mono', fontSize: 12 }}>{JSON.stringify(data, null, 2)}</pre></div>
}

// ─── HIL Overlay ───────────────────────────────────────────────────────────────
function HilOverlay({ issue, onClose }) {
  const [step, setStep] = useState(1)
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const approve = async () => {
    setLoading(true)
    await fetch('/api/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ issue_id: issue.id, approved: true, notes }) })
    setLoading(false); setDone(true)
  }
  return (
    <div className="overlay-bg" onClick={onClose}>
      <div className="overlay-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span className="overlay-title" style={{ margin: 0 }}>HIL Approval — {issue.id}</span>
          <button className="overlay-close" onClick={onClose}>✕</button>
        </div>
        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'Google Sans', fontWeight: 600, fontSize: 17 }}>Issue approved &amp; filed in Buganizer!</div>
            <div style={{ color: 'var(--text2)', marginTop: 4 }}>{issue.id}</div>
            <button className="btn-file-issue" style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="hil-stepper">
              {['Review', 'Verify Impact', 'Approve'].map((s, idx) => (
                <div key={s} className="hil-step">
                  <div className="hil-step-circle" style={{ background: step > idx + 1 ? 'var(--g-green)' : step === idx + 1 ? 'var(--agent)' : 'var(--border)', color: step >= idx + 1 ? 'white' : 'var(--text3)' }}>
                    {step > idx + 1 ? '✓' : idx + 1}
                  </div>
                  <div className="hil-step-label" style={{ color: step === idx + 1 ? 'var(--agent)' : 'var(--text2)' }}>{s}</div>
                  {idx < 2 && <div className="hil-step-line" style={{ background: step > idx + 1 ? 'var(--g-green)' : 'var(--border)' }} />}
                </div>
              ))}
            </div>
            {step === 1 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8, fontFamily: 'Google Sans', fontSize: 15 }}>{issue.title}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
                  <span>Severity: <strong>{issue.severity}</strong></span>
                  <span>Component: {issue.component}</span>
                </div>
                <div style={{ fontSize: 13, background: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 16, lineHeight: 1.6 }}>
                  {issue.description || 'Localization failure requiring Buganizer tracking.'}
                </div>
                <button className="btn-file-issue" onClick={() => setStep(2)}>Review Impact →</button>
              </div>
            )}
            {step === 2 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 10, fontFamily: 'Google Sans' }}>Affected Test Cases</div>
                {(issue.test_case_ids || []).map(id => <div key={id} style={{ fontFamily: 'Roboto Mono', color: 'var(--g-red)', fontSize: 13, marginBottom: 4 }}>• {id}</div>)}
                <div style={{ marginTop: 12, background: '#fce8e6', borderRadius: 8, padding: 10, fontSize: 13, color: 'var(--g-red)' }}>
                  ⚠ This issue will block the Nest Hub firmware OTA release.
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn-sm btn-outline" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn-file-issue" style={{ flex: 1 }} onClick={() => setStep(3)}>Verify &amp; Continue →</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Reviewer Notes (optional)</div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any context or conditions for this approval…" style={{ width: '100%', border: '1.5px solid var(--border2)', borderRadius: 8, padding: 10, fontSize: 13, minHeight: 90, resize: 'vertical', fontFamily: 'Roboto' }} />
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn-sm btn-outline" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn-file-issue" style={{ flex: 1, background: 'var(--g-green)' }} onClick={approve} disabled={loading}>
                    {loading ? 'Filing…' : '✓ Approve & File Issue'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Workspace Tab ─────────────────────────────────────────────────────────────
const INIT_WORKSPACE = [
  {
    type: 'card', card_type: 'dashboard',
    data: {
      total_tests: 18247, pass_rate: '88.2%', failing_tests: 89,
      automation_coverage: '60.7%', release_blockers: 2,
      active_sprint: 'Sprint 43', firmware_builds_in_qa: 4,
    },
  },
  {
    type: 'agent',
    text: 'Running PT-BR regression suite — Phase 2 of 4 · Checkout module. I\'ve identified 2 P0 release blockers in Sprint 43 affecting Nest Hub (PT-BR greeting strings) and Thermostat (AR-SA RTL layout). Automation coverage is 60.7% against the 70% target.',
  },
  {
    type: 'card', card_type: 'test.failures',
    data: {
      failures: [
        { id: 'LOC-NH-11198', name: 'Home greeting string untranslated (PT-BR)', priority: 'P0', locale: 'pt-BR', device: 'Nest Hub', expected: 'Bom dia', actual: 'Good morning' },
        { id: 'LOC-NT-11201', name: 'Thermostat temp label RTL overflow (AR-SA)', priority: 'P0', locale: 'ar-SA', device: 'Thermostat', expected: '۲۳°م', actual: '23°C (LTR)' },
      ],
      count: 2,
    },
  },
]

const WORKSPACE_SESSION_CONTEXT = 'Session: Nest Hub 4.1.0.12-rc3 · Sprint 43 regression · 2 P0 blockers (LOC-NH-11198 PT-BR greeting strings, LOC-NT-11201 AR-SA RTL layout). 1,089/1,247 tests run, 31 failing, 3 HIL pending.'

const SOURCES = [
  {
    icon: '📱', name: 'Nest Hub 4.1.0.12-rc3', desc: 'QA Build · Active firmware · Sprint 43', badge: 'Active Build', badgeClass: 'blue',
    query: 'Show test execution summary for Nest Hub firmware 4.1.0.12-rc3 in Sprint 43: total tests, pass rate, failures by locale, P0 release blocker status.',
  },
  {
    icon: '🧪', name: 'pt-br-regression-suite.yaml', desc: '1,247 scenarios · Home, Assistant, Settings', badge: 'Loaded', badgeClass: 'green',
    query: 'Show PT-BR regression suite results for Sprint 43: how many of the 1,247 scenarios passed, failed, and are pending? List top PT-BR failures by priority.',
  },
  {
    icon: '🌍', name: 'locale-configs.json', desc: '10 locales · 18,000 string keys', badge: 'Loaded', badgeClass: 'green',
    query: 'Show locale coverage report for all 10 locales in Sprint 43 Nest Hub firmware. Compare health scores — which locales have the most failures?',
  },
  {
    icon: '📋', name: 'baseline-sprint-42.json', desc: 'Previous passing run · Sprint 42', badge: 'Baseline', badgeClass: 'gray',
    query: 'Compare Sprint 43 test results against the Sprint 42 baseline for Nest Hub. What new failures were introduced? Which cases that passed in Sprint 42 are now failing?',
  },
  {
    icon: '📄', name: 'sprint-43-release-notes.md', desc: 'Changelog · 14 new keys added', badge: 'Context', badgeClass: 'gray',
    query: 'Summarize Sprint 43 release notes: which of the 14 new string keys are at risk for localization failures? Which locales may be missing translations for the new keys?',
  },
]

function WorkspaceTab({ sessionId, userId, onTabChange, setChipContext }) {
  const { messages, loading, send, lastText, setMessages } = useAgent(sessionId, userId)
  const [hilIssue, setHilIssue] = useState(null)
  const [activeSourceIdx, setActiveSourceIdx] = useState(0)
  const feedRef = useRef(null)

  useEffect(() => {
    setMessages(INIT_WORKSPACE)
    setChipContext?.(WORKSPACE_SESSION_CONTEXT)
    return () => setChipContext?.(null)
  }, [])

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [messages])

  const handleSourceClick = (idx) => {
    setActiveSourceIdx(idx)
    send(SOURCES[idx].query)
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Sources pane */}
      <aside className="sources-pane">
        <div className="sp-header">
          <span className="sp-title">Build Sources</span>
          <div className="sp-add" onClick={() => send('What additional test suites or locale configuration files are available to load for Sprint 43 Nest Hub QA? List options.')}>
            <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14"/></svg>
            Add
          </div>
        </div>
        <div className="sources-list">
          {SOURCES.map((s, idx) => (
            <div key={s.name} className={`source-card${activeSourceIdx === idx ? ' active' : ''}`} onClick={() => handleSourceClick(idx)} style={{ cursor: 'pointer' }}>
              <div className="sc-top">
                <div className="sc-icon" style={{ background: activeSourceIdx === idx ? '#e8f0fe' : '#f8fafc' }}>{s.icon}</div>
                <div className="sc-body">
                  <div className="sc-name">{s.name}</div>
                  <div className="sc-desc">{s.desc}</div>
                </div>
                <div style={{ fontSize: 16, color: activeSourceIdx === idx ? 'var(--g-blue)' : 'var(--text3)', cursor: 'pointer' }}>›</div>
              </div>
              <span className={`sc-badge ${s.badgeClass}`}>{s.badge}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 10px 10px' }}>
          <div className="sp-stats">
            <div className="ss-title">Session Stats</div>
            <div className="ss-row" style={{ cursor: 'pointer' }} onClick={() => onTabChange('runtests')}>
              <span className="ss-label">Tests Run</span><span className="ss-val" style={{ color: 'var(--g-blue)' }}>1,089 →</span>
            </div>
            <div className="ss-row" style={{ cursor: 'pointer' }} onClick={() => onTabChange('runtests')}>
              <span className="ss-label">Passing</span><span className="ss-val" style={{ color: 'var(--g-green)' }}>1,058</span>
            </div>
            <div className="ss-row" style={{ cursor: 'pointer' }} onClick={() => send('List all 31 failing test cases in Sprint 43 Nest Hub 4.1.0.12-rc3 by priority. Include test ID, locale, failure description.')}>
              <span className="ss-label">Failing</span><span className="ss-val" style={{ color: 'var(--g-red)' }}>31 →</span>
            </div>
            <div className="ss-row" style={{ cursor: 'pointer' }} onClick={() => send('Show the HIL approval queue for Sprint 43 — which test failures require human-in-the-loop decision before issue filing?')}>
              <span className="ss-label">HIL Required</span><span className="ss-val" style={{ color: 'var(--hil)' }}>3 →</span>
            </div>
            <div className="ss-row">
              <span className="ss-label">Remaining</span><span className="ss-val" style={{ color: 'var(--text2)' }}>158</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Agent feed */}
      <main className="agent-feed" ref={feedRef}>
        <div className="agent-banner">
          <div className="agent-avatar">
            <svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 012-2z"/><circle cx="8.5" cy="17" r="1.5"/><circle cx="15.5" cy="17" r="1.5"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="at-label">LocaTest Agent · Analyzing</div>
            <div className="at-text">Running Nest Hub PT-BR regression suite — Phase 2 of 4 · Home Screen module<span className="cursor" /></div>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--agent)', background: 'var(--agent-l)', padding: '4px 10px', borderRadius: 12, fontWeight: 600 }}>87% Complete</div>
        </div>

        {messages.map((msg, i) => (
          <AgentMsg key={i} msg={msg} onApprove={(issue) => setHilIssue(issue)} onNavigate={onTabChange} />
        ))}
        <FeedReplyBar send={send} loading={loading} placeholder="Reply to agent about this QA session…" />
      </main>

      {hilIssue && <HilOverlay issue={hilIssue} onClose={() => setHilIssue(null)} />}
    </div>
  )
}

// ─── Simulation Tab ────────────────────────────────────────────────────────────
const SCENARIOS = [
  { id: 'LOC-SIM-001', name: 'PT-BR Home Screen Regression', locale: 'pt-BR', status: 'fail', hil: true, suite: 'Home Screen & Ambient Display' },
  { id: 'LOC-SIM-002', name: 'AR-SA Smoke Test Suite', locale: 'ar-SA', status: 'pass', dur: '1:12s', suite: 'Google Assistant UI' },
  { id: 'LOC-RG-11198', name: 'Greeting string untranslated (pt-BR)', locale: 'pt-BR', status: 'fail', hil: false, suite: 'Home Screen & Ambient Display' },
  { id: 'LOC-RG-11199', name: 'Weather label missing (pt-BR)', locale: 'pt-BR', status: 'fail', hil: false, suite: 'Home Screen & Ambient Display' },
  { id: 'LOC-RG-11200', name: 'Calendar "Today" untranslated (pt-BR)', locale: 'pt-BR', status: 'fail', hil: false, suite: 'Home Screen & Ambient Display' },
  { id: 'LOC-SM-04821', name: 'Login Smoke — PT-BR', locale: 'pt-BR', status: 'pass', dur: '0:42s', suite: 'Device Settings & Onboarding' },
  { id: 'LOC-SM-04822', name: 'Home Screen Greeting — PT-BR', locale: 'pt-BR', status: 'pass', dur: '0:58s', suite: 'Home Screen & Ambient Display' },
  { id: 'LOC-SM-04823', name: 'Assistant Voice Query — PT-BR', locale: 'pt-BR', status: 'pass', dur: '1:05s', suite: 'Google Assistant UI' },
  { id: 'LOC-NT-11201', name: 'Thermostat RTL Layout Overflow — AR-SA', locale: 'ar-SA', status: 'fail', hil: true, suite: 'Temperature Control UI' },
  { id: 'LOC-RG-11204', name: 'RTL Layout Regression — AR-SA', locale: 'ar-SA', status: 'queued', suite: 'Temperature Control UI' },
]

const SCENARIO_DATA = {
  'LOC-SIM-001': {
    module: 'Home Screen & Ambient Display · PT-BR Regression',
    steps: [
      { n: 1, action: 'Initialize test runner for pt-BR locale', result: 'Locale set: pt-BR, device: Nest Hub 4.1.0.12-rc3, lang tag confirmed', status: 'pass' },
      { n: 2, action: 'Navigate to Home Screen', result: 'Home Screen loaded. DOM ready in 840ms.', status: 'pass' },
      { n: 3, action: 'Verify hs_greeting_morning string', result: '✗ Found: "Good morning" — Expected: "Bom dia"', status: 'fail', screenshot: { actual: '"Good morning"', expected: '"Bom dia"', key: 'hs_greeting_morning', screen: 'Home Screen · Morning Greeting' } },
      { n: 4, action: 'Verify hs_weather_label string', result: '✗ Found: "Weather" — Expected: "Tempo"', status: 'fail', screenshot: { actual: '"Weather"', expected: '"Tempo"', key: 'hs_weather_label', screen: 'Home Screen · Weather Widget' } },
      { n: 5, action: 'Verify hs_calendar_today string', result: '✗ Found: "Today" — Expected: "Hoje"', status: 'fail', screenshot: { actual: '"Today"', expected: '"Hoje"', key: 'hs_calendar_today', screen: 'Home Screen · Calendar' } },
      { n: 6, action: 'Verify date/time localisation format', result: '⏭ Skipped — upstream failure in step 3', status: 'skip' },
    ],
    bundle: {
      locale: '"pt-BR"', bundle_version: '"4.1.0.12-sprint43"', keys_loaded: '18,247', keys_missing: '4',
      keys: [
        { key: 'hs_greeting_morning', value: 'MISSING', status: 'missing' },
        { key: 'hs_greeting_afternoon', value: 'MISSING', status: 'missing' },
        { key: 'hs_weather_label', value: 'MISSING', status: 'missing' },
        { key: 'hs_calendar_today', value: 'MISSING', status: 'missing' },
        { key: 'hs_rtl_enabled', value: '"false"', status: 'ok' },
        { key: 'hs_clock_format', value: '"HH:mm"', status: 'ok' },
      ],
    },
    variables: [
      { key: 'currentLocale', value: '"pt-BR"', status: 'ok' },
      { key: 'elementText', value: '"Good morning"', status: 'missing' },
      { key: 'expectedText', value: '"Bom dia"', status: 'ok' },
      { key: 'translationKey', value: '"hs_greeting_morning"', status: 'ok' },
      { key: 'keyExists(pt-BR)', value: 'false', status: 'missing' },
      { key: 'fallbackLocale', value: '"en-US"', status: 'warn' },
      { key: 'bundleLoadedAt', value: '"2026-05-29T04:12:00Z"', status: 'ok' },
    ],
    confidence: { rootCause: 97, fix: 94 },
    screenshots: [
      { label: 'Morning Greeting', screen: 'Home Screen', wrong: '"Good morning"', right: '"Bom dia"', key: 'hs_greeting_morning', type: 'string' },
      { label: 'Weather Widget', screen: 'Home Screen', wrong: '"Weather"', right: '"Tempo"', key: 'hs_weather_label', type: 'string' },
      { label: 'Calendar Block', screen: 'Home Screen', wrong: '"Today"', right: '"Hoje"', key: 'hs_calendar_today', type: 'string' },
    ],
    reasoning: [
      { phase: 'Observation', icon: '👁', text: 'Home Screen displayed 3 untranslated strings in pt-BR locale: hs_greeting_morning, hs_weather_label, hs_calendar_today. All show en-US fallback values.', status: 'done' },
      { phase: 'Hypothesis', icon: '💡', text: 'Missing string keys in pt-BR.strings bundle for Sprint 43. Likely caused by incomplete l10n sync during branch cut from main.', status: 'done' },
      { phase: 'Verification', icon: '🔍', text: 'Queried string bundle manifest via BundleInspector API. Confirmed: 4 keys added to en-US.strings in Sprint 43 are absent from pt-BR.strings. No open translation PR in Gerrit queue for these keys.', status: 'done' },
      { phase: 'Root Cause', icon: '🎯', text: 'l10n-sprint43 branch was cut from main before the PT-BR translator upload completed. The 4 new home screen string keys (hs_greeting_morning, hs_greeting_afternoon, hs_weather_label, hs_calendar_today) were never submitted to the PT-BR bundle.', status: 'done' },
      { phase: 'Proposed Fix', icon: '🔧', text: 'Add 4 missing translations to pt-BR.strings: hs_greeting_morning→"Bom dia", hs_greeting_afternoon→"Boa tarde", hs_weather_label→"Tempo", hs_calendar_today→"Hoje". Rebuild l10n-sprint43 branch and re-run regression.', status: 'done' },
    ],
  },
  'LOC-RG-11198': {
    module: 'Home Screen & Ambient Display · Greeting String',
    steps: [
      { n: 1, action: 'Set locale to pt-BR, navigate to Home Screen', result: 'Home Screen loaded with lang="pt-BR"', status: 'pass' },
      { n: 2, action: 'Assert hs_greeting_morning text content', result: '✗ Actual: "Good morning" | Expected: "Bom dia"', status: 'fail', screenshot: { actual: '"Good morning"', expected: '"Bom dia"', key: 'hs_greeting_morning', screen: 'Home Screen · Greeting' } },
      { n: 3, action: 'Check en-US fallback chain', result: 'Confirmed: key missing in pt-BR → fallback triggered to en-US', status: 'fail' },
      { n: 4, action: 'Capture failure screenshot', result: 'Screenshot saved to artifacts/LOC-RG-11198-fail.png', status: 'pass' },
    ],
    bundle: {
      locale: '"pt-BR"', bundle_version: '"4.1.0.12-sprint43"', keys_loaded: '18,247', keys_missing: '1',
      keys: [
        { key: 'hs_greeting_morning', value: 'MISSING', status: 'missing' },
        { key: 'hs_greeting_evening', value: '"Boa noite"', status: 'ok' },
        { key: 'hs_greeting_night', value: '"Boa noite"', status: 'ok' },
      ],
    },
    variables: [
      { key: 'currentLocale', value: '"pt-BR"', status: 'ok' },
      { key: 'elementText', value: '"Good morning"', status: 'missing' },
      { key: 'expectedText', value: '"Bom dia"', status: 'ok' },
      { key: 'translationKey', value: '"hs_greeting_morning"', status: 'ok' },
      { key: 'keyExists(pt-BR)', value: 'false', status: 'missing' },
      { key: 'fallbackTriggered', value: 'true', status: 'warn' },
    ],
    confidence: { rootCause: 99, fix: 97 },
    screenshots: [
      { label: 'Greeting String Failure', screen: 'Home Screen', wrong: '"Good morning" (en-US fallback)', right: '"Bom dia" (expected)', key: 'hs_greeting_morning', type: 'string' },
    ],
    reasoning: [
      { phase: 'Observation', icon: '👁', text: 'Greeting string hs_greeting_morning displays en-US value "Good morning" instead of pt-BR "Bom dia".', status: 'done' },
      { phase: 'Root Cause', icon: '🎯', text: 'String key hs_greeting_morning missing from pt-BR.strings bundle in Sprint 43 build. Direct subset of LOC-SIM-001 root cause.', status: 'done' },
      { phase: 'Fix', icon: '🔧', text: 'Add hs_greeting_morning = "Bom dia" to pt-BR.strings and rebuild.', status: 'done' },
    ],
  },
  'LOC-NT-11201': {
    module: 'Temperature Control UI · AR-SA RTL',
    steps: [
      { n: 1, action: 'Initialize ar-SA locale, navigate to Thermostat Control', result: 'Locale: ar-SA, device: Nest Thermostat 6.4.0.3-rc1', status: 'pass' },
      { n: 2, action: 'Assert RTL layout engine is active', result: '✗ Layout direction: LTR — Expected: RTL', status: 'fail', screenshot: { actual: 'LTR layout (left-to-right)', expected: 'RTL layout (right-to-left)', key: 'rtl_layout_enabled', screen: 'Thermostat Control' } },
      { n: 3, action: 'Verify temperature label position (right-aligned for RTL)', result: '✗ Label positioned left — Expected: right', status: 'fail' },
      { n: 4, action: 'Verify degree symbol: °م vs °C', result: '✗ Found: "23°C" — Expected: "۲۳°م"', status: 'fail', screenshot: { actual: '"23°C" (Latin)', expected: '"۲۳°م" (Arabic)', key: 'temp_unit_symbol', screen: 'Thermostat Display' } },
      { n: 5, action: 'Verify Arabic-Indic digit rendering', result: '⏭ Skipped — upstream RTL failure blocks digit test', status: 'skip' },
    ],
    bundle: {
      locale: '"ar-SA"', bundle_version: '"6.4.0.3-sprint43"', keys_loaded: '14,891', keys_missing: '0',
      keys: [
        { key: 'rtl_layout_enabled', value: '"false" (should be true)', status: 'missing' },
        { key: 'temp_unit_symbol', value: '"°C" (should be °م)', status: 'missing' },
        { key: 'locale_digits_mode', value: '"western" (should be arabic-indic)', status: 'missing' },
        { key: 'temp_label_ar_SA', value: '"درجة الحرارة"', status: 'ok' },
      ],
    },
    variables: [
      { key: 'currentLocale', value: '"ar-SA"', status: 'ok' },
      { key: 'layoutDirection', value: '"ltr"', status: 'missing' },
      { key: 'expectedDirection', value: '"rtl"', status: 'ok' },
      { key: 'tempDisplayValue', value: '"23°C"', status: 'missing' },
      { key: 'expectedTempValue', value: '"۲۳°م"', status: 'ok' },
      { key: 'rtlEngineVersion', value: '"2.1.4 (outdated)"', status: 'warn' },
      { key: 'RTL_CAPABLE_flag', value: 'false', status: 'missing' },
    ],
    confidence: { rootCause: 91, fix: 88 },
    screenshots: [
      { label: 'Temperature Display', screen: 'Thermostat Control', wrong: '"23°C" (LTR, Latin)', right: '"۲۳°م" (RTL, Arabic)', key: 'temp_unit_symbol', type: 'rtl' },
      { label: 'Layout Direction', screen: 'Thermostat Control', wrong: 'Left-to-Right layout', right: 'Right-to-Left layout', key: 'rtl_layout_enabled', type: 'layout' },
    ],
    reasoning: [
      { phase: 'Observation', icon: '👁', text: 'Thermostat Control screen uses LTR layout for ar-SA locale. Temperature shows Latin degree symbol (°C) instead of Arabic (°م). Numbers are Western digits (23) not Arabic-Indic (۲۳).', status: 'done' },
      { phase: 'Hypothesis', icon: '💡', text: 'RTL layout engine flag not set for ThermostatControlView. This component may have been rewritten and lost its RTL capability registration.', status: 'done' },
      { phase: 'Verification', icon: '🔍', text: 'Inspected ThermostatControlView component registration in ComponentManifest.xml (CL #4429183, Sprint 42 rewrite). RTL_CAPABLE flag is false. All other view components have RTL_CAPABLE=true.', status: 'done' },
      { phase: 'Root Cause', icon: '🎯', text: 'ThermostatControlView was fully rewritten in Sprint 42 (CL #4429183) and the RTL_CAPABLE flag was not migrated from the legacy ThermostatView to the new component definition. RTL layout engine skips views without this flag.', status: 'done' },
      { phase: 'Proposed Fix', icon: '🔧', text: 'Set RTL_CAPABLE=true in ThermostatControlView ComponentManifest.xml. Update temp formatter: use Arabic-Indic digits (١٢٣) and Arabic degree symbol (°م) when locale=ar-SA. Cherry-pick to l10n-sprint43.', status: 'done' },
    ],
  },
}

function getScenarioData(sc) {
  return SCENARIO_DATA[sc?.id] || {
    module: `${sc?.suite || 'Regression'} · ${sc?.locale}`,
    steps: [
      { n: 1, action: `Initialize test runner for ${sc?.locale} locale`, result: `Locale: ${sc?.locale}, device: Nest Hub 4.1.0.12-rc3`, status: 'pass' },
      { n: 2, action: 'Execute test scenario', result: sc?.status === 'pass' ? '✓ All assertions passed' : '✗ Assertion failure detected', status: sc?.status || 'pass' },
      sc?.status === 'pass' ? { n: 3, action: 'Verify string localisation', result: 'All string keys present and correctly translated', status: 'pass' } : { n: 3, action: 'Capture failure artifacts', result: 'Screenshot and variable dump saved to test artifacts', status: sc?.status === 'fail' ? 'fail' : 'pass' },
    ].filter(Boolean),
    bundle: { locale: `"${sc?.locale}"`, bundle_version: '"4.1.0.12-sprint43"', keys_loaded: '18,247', keys_missing: '0', keys: [] },
    variables: [
      { key: 'currentLocale', value: `"${sc?.locale}"`, status: 'ok' },
      { key: 'testStatus', value: `"${sc?.status}"`, status: sc?.status === 'fail' ? 'missing' : 'ok' },
      { key: 'duration', value: sc?.dur ? `"${sc.dur}"` : '"--"', status: 'ok' },
    ],
    confidence: { rootCause: 82, fix: 78 },
    screenshots: sc?.status === 'pass' ? [] : [{ label: 'Test Failure', screen: sc?.suite || 'Device Screen', wrong: 'Actual (see artifacts)', right: 'Expected (from spec)', key: 'unknown', type: 'string' }],
    reasoning: [
      { phase: 'Observation', icon: '👁', text: `Test scenario ${sc?.id} executed for ${sc?.locale} locale on ${sc?.suite || 'device'}.`, status: 'done' },
      { phase: 'Result', icon: '🎯', text: sc?.status === 'pass' ? 'All assertions passed. No localisation issues found for this scenario.' : 'Assertion failure detected. Agent recommends manual inspection of string bundle and device screenshot.', status: 'done' },
    ],
  }
}

function LiveRunPanel({ scenarios, onSelect }) {
  const passing = scenarios.filter(s => s.status === 'pass').length
  const failing = scenarios.filter(s => s.status === 'fail').length
  const queued = scenarios.filter(s => s.status === 'queued').length
  const currentlyRunning = scenarios.find(s => s.status === 'queued')
  return (
    <div className="live-run-panel">
      <div className="lrp-header">
        <div>
          <div className="lrp-title">Live Test Execution</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>1,089 / 1,247 complete · PT-BR &amp; AR-SA Regression · Sprint 43</div>
        </div>
        <div className="lrp-stats">
          {[['Passed', passing, 'var(--g-green)'], ['Failed', failing, 'var(--g-red)'], ['Queued', queued, 'var(--text3)'], ['HIL', 2, 'var(--hil)']].map(([k, v, c]) => (
            <div key={k} className="lrp-stat">
              <span className="lrp-stat-val" style={{ color: c }}>{v}</span>
              <span className="lrp-stat-label">{k}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="lrp-progress">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
          <span>Overall progress</span>
          <span style={{ color: failing > 0 ? 'var(--g-red)' : 'var(--g-green)', fontWeight: 600 }}>{failing} failures · 2 HIL blocks</span>
        </div>
        <div style={{ height: 8, background: '#f1f3f4', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${(passing / Math.max(scenarios.length, 1) * 100).toFixed(0)}%`, background: 'var(--g-green)', transition: 'width .6s' }} />
          <div style={{ width: `${(failing / Math.max(scenarios.length, 1) * 100).toFixed(0)}%`, background: 'var(--g-red)' }} />
          <div style={{ flex: 1, background: '#dadce0' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: 'var(--text2)' }}>
          {[['Pass', 'var(--g-green)'], ['Fail', 'var(--g-red)'], ['Queued', '#dadce0']].map(([label, bg]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: bg, display: 'inline-block' }} />{label}</span>
          ))}
        </div>
      </div>
      {currentlyRunning && (
        <div className="lrp-current">
          <div className="lrp-current-label">Currently Executing</div>
          <div className="lrp-current-item">
            <div className="spinner" />
            <div className="lrp-current-body">
              <div className="lrp-current-id">{currentlyRunning.id}</div>
              <div className="lrp-current-name">{currentlyRunning.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{currentlyRunning.suite}</div>
            </div>
            <span className="lrp-current-locale">{currentlyRunning.locale}</span>
          </div>
        </div>
      )}
      <div className="lrp-scroll">
        <div className="lrp-section-label">All Scenarios — Click to inspect</div>
        <div className="lrp-grid">
          {scenarios.map(s => (
            <div key={s.id} className={`lrp-cell lrpc-${s.status === 'pass' ? 'pass' : s.status === 'fail' ? 'fail' : s.hil ? 'hil' : 'queue'}`} onClick={() => onSelect(s)} title={s.name}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="lrpc-id">{s.id}</div>
                <div className="lrpc-name">{s.name.length > 32 ? s.name.slice(0, 32) + '…' : s.name}</div>
                <div style={{ fontSize: 10, opacity: .7, marginTop: 2 }}>{s.locale}</div>
              </div>
              <div className="lrpc-status">{s.status === 'pass' ? '✓' : s.status === 'fail' ? '✗' : s.hil ? '!' : '…'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const SCENARIO_TO_ISSUE = {
  'LOC-SIM-001': 'b/337821049', 'LOC-RG-11198': 'b/337821049',
  'LOC-RG-11199': 'b/337821049', 'LOC-RG-11200': 'b/337821049',
  'LOC-NT-11201': 'b/337821050', 'LOC-RG-11204': 'b/337821050',
}

function SimulationTab({ sessionId, userId, onTabChange, setSelectedIssueId, setChipContext }) {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')
  const { messages, loading, send } = useAgent(sessionId, userId)
  const [hilOpen, setHilOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [debugTab, setDebugTab] = useState('exec')
  const debugRef = useRef(null)

  useEffect(() => {
    if (debugRef.current) debugRef.current.scrollTop = debugRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    return () => setChipContext?.(null)
  }, [])

  const filtered = filter === 'All' ? SCENARIOS : filter === 'Pass' ? SCENARIOS.filter(s => s.status === 'pass') : filter === 'Fail' ? SCENARIOS.filter(s => s.status === 'fail') : SCENARIOS.filter(s => s.hil)
  const scenarioData = selected ? getScenarioData(selected) : null

  const selectScenario = (sc) => {
    setSelected(sc)
    setDebugTab('exec')
    setChipContext?.(`Currently inspecting test run ${sc.id} — "${sc.name}" | locale: ${sc.locale} | suite: ${sc.suite} | status: ${sc.status}${sc.hil ? ' (HIL required)' : ''}.`)
    send(`Analyze test run ${sc.id}: ${sc.name} (locale: ${sc.locale})`)
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left: scenario list */}
      <div className="sim-left">
        <div className="run-controls">
          <div className="rc-buttons">
            <button className="rc-btn secondary" onClick={() => { setFilter('All'); setRunning(true); setSelected(null); send('Run all test scenarios for the pt-BR and ar-SA regression suites') }}>
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Run All
            </button>
            <button className="rc-btn secondary" onClick={() => setRunning(r => !r)}>
              <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>{running ? 'Resume' : 'Pause'}
            </button>
            <button className="rc-btn secondary" onClick={() => { const idx = filtered.findIndex(s => s.id === selected?.id); const next = filtered[idx + 1]; if (next) selectScenario(next) }}>
              <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>Step
            </button>
            <button className="rc-btn primary" onClick={() => { setSelected(null); setFilter('All'); setRunning(false) }}>
              <svg viewBox="0 0 24 24" style={{ fill: 'white' }}><path d="M19 13H5v-2h14v2z"/></svg>Stop
            </button>
          </div>
          <div>
            <div className="progress-label">
              <span>1,089 / 1,247 complete</span>
              <span style={{ color: 'var(--g-red)', fontWeight: 600 }}>3 failures · 2 HIL</span>
            </div>
            <div className="progress-bar-wrap">
              <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,var(--g-blue),var(--g-green))', width: '87%' }} />
            </div>
          </div>
        </div>
        <div className="filter-tabs">
          {[['All', 1247], ['Pass', 1086], ['Fail', 3], ['HIL', 2]].map(([label, count]) => (
            <div key={label} className={`ft-tab${filter === label ? ' active' : ''}`} onClick={() => setFilter(label)}>
              {label} <span className="count" style={filter === label && label === 'Fail' ? { background: '#fee2e2', color: '#991b1b' } : {}}>{count}</span>
            </div>
          ))}
        </div>
        <div className="scenario-list">
          {filtered.map(sc => (
            <div key={sc.id} className={`sc-item${selected?.id === sc.id ? ' active' : ''}`} onClick={() => selectScenario(sc)}>
              <div className={`sc-status-icon ${sc.status === 'pass' ? 'sci-pass' : sc.status === 'fail' ? 'sci-fail' : sc.hil ? 'sci-hil' : 'sci-queued'}`}>
                {sc.status === 'pass' ? '✓' : sc.status === 'fail' ? '✗' : sc.status === 'queued' ? '●' : '!'}
              </div>
              <div className="sc-body">
                <div className="sci-id">{sc.id}</div>
                <div className="sci-name">{sc.name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 2 }}>{sc.suite}</div>
              </div>
              <div className="sc-right">
                <div className="sci-lang">{sc.locale}</div>
                {sc.hil && <div className="sci-badge sib-hil">HIL</div>}
                {sc.status === 'fail' && !sc.hil && <div className="sci-badge sib-fail">Fail</div>}
                {sc.dur && <div className="sci-dur">{sc.dur}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: detail or live panel */}
      <div className="sim-right">
        {selected ? (
          <>
            <div className="sr-header">
              <div>
                <div className="srh-id">{selected.id} · {selected.suite}</div>
                <div className="srh-title">{selected.name}</div>
                <div className="srh-badges">
                  {selected.status === 'fail' && <span className="srh-badge srhb-red">Critical Failure</span>}
                  <span className="srh-badge srhb-blue">{selected.locale}</span>
                  <span className="srh-badge srhb-gray">Regression</span>
                  {selected.hil && <span className="srh-badge srhb-hil">⏸ Awaiting HIL Decision</span>}
                  {selected.status === 'pass' && <span className="srh-badge" style={{ background: '#d1fae5', color: '#065f46' }}>Passed</span>}
                </div>
              </div>
              {(() => {
                const selIdx = filtered.findIndex(s => s.id === selected.id)
                return (
                  <div className="srh-actions">
                    <button className="btn-sm btn-outline" disabled={selIdx <= 0} onClick={() => { const p = filtered[selIdx - 1]; selectScenario(p) }}>← Prev</button>
                    <button className="btn-sm btn-outline" disabled={selIdx >= filtered.length - 1} onClick={() => { const n = filtered[selIdx + 1]; selectScenario(n) }}>Next →</button>
                    <button className="btn-sm btn-agent" onClick={() => { setSelectedIssueId?.(SCENARIO_TO_ISSUE[selected?.id] || 'b/337821049'); onTabChange?.('rca') }}>Generate RCA →</button>
                  </div>
                )
              })()}
            </div>

            <div className="debug-tabs">
              {[['exec', 'Execution Steps', selected.status === 'fail'], ['inspector', 'Debug Inspector', false], ['screenshots', 'Screenshots', selected.status === 'fail'], ['reasoning', 'Agent Reasoning', false]].map(([id, label, dot]) => (
                <div key={id} className={`dt-tab${debugTab === id ? ' active' : ''}`} onClick={() => setDebugTab(id)}>
                  {label}
                  {dot && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--g-red)', marginLeft: 5, marginBottom: 1 }} />}
                </div>
              ))}
            </div>

            {/* Execution Steps tab */}
            {debugTab === 'exec' && (
              <div className="sim-body">
                <div className="exec-timeline">
                  <div className="etl-title">Test Execution · {scenarioData.steps.length} steps</div>
                  {scenarioData.steps.map((s, i, arr) => (
                    <div key={s.n} className="step-item" style={{ position: 'relative' }}>
                      {i < arr.length - 1 && <div style={{ position: 'absolute', left: 13, top: 26, bottom: -12, width: 2, background: s.status === 'pass' ? '#d1fae5' : s.status === 'fail' ? '#fecaca' : 'var(--border2)', zIndex: 0 }} />}
                      <div className={`step-num sn-${s.status}`} style={{ zIndex: 1 }}>{s.n}</div>
                      <div className="step-body">
                        <div className="step-action">{s.action}</div>
                        <div className={`step-result${s.status === 'fail' ? ' fail' : s.status === 'pass' ? ' pass' : ''}`} style={s.status === 'skip' ? { color: 'var(--text3)' } : {}}>{s.result}</div>
                        {s.screenshot && <NestDeviceMock shot={s.screenshot} locale={selected.locale} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="debug-inspector" ref={debugRef}>
                  <div className="di-section">
                    <div className="dis-header">
                      <span className="dis-title">Agent Confidence</span>
                      <span className={`dis-badge ${scenarioData.confidence.rootCause >= 90 ? 'ok' : 'error'}`}>{scenarioData.confidence.rootCause >= 90 ? 'High' : 'Medium'}</span>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      {[['Root cause certainty', scenarioData.confidence.rootCause, 'var(--g-green)'], ['Fix proposal accuracy', scenarioData.confidence.fix, 'var(--g-blue)']].map(([k, v, c]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--text2)', width: 170 }}>{k}</span>
                          <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${v}%`, height: '100%', background: c, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {messages.length > 0 && (
              <div className="sim-agent-panel">
                <div className="sap-label">Agent Response</div>
                <div className="sap-messages">
                  {messages.map((msg, i) => <AgentMsg key={i} msg={msg} onApprove={() => {}} />)}
                </div>
                <FeedReplyBar send={send} loading={loading} placeholder="Reply to agent…" />
              </div>
            )}

            {/* Debug Inspector tab */}
            {debugTab === 'inspector' && (
              <div className="sim-body" style={{ overflow: 'auto' }}>
                <div className="exec-timeline" style={{ width: '100%', maxWidth: 380 }}>
                  <div className="etl-title">String Bundle Inspector</div>
                  <div className="di-section">
                    <div className="dis-header">
                      <span className="dis-title">Bundle Meta</span>
                      <span className={`dis-badge ${scenarioData.bundle.keys_missing !== '0' ? 'error' : 'ok'}`}>{scenarioData.bundle.keys_missing} missing</span>
                    </div>
                    <div style={{ background: '#1a1a2e', padding: '12px 14px', fontFamily: 'Roboto Mono' }}>
                      <div className="kv-row"><span className="kv-key">locale</span><span className="kv-val ok">{scenarioData.bundle.locale}</span></div>
                      <div className="kv-row"><span className="kv-key">bundle_version</span><span className="kv-val ok">{scenarioData.bundle.bundle_version}</span></div>
                      <div className="kv-row"><span className="kv-key">keys_loaded</span><span className="kv-val ok">{scenarioData.bundle.keys_loaded}</span></div>
                      <div className="kv-row"><span className="kv-key">keys_missing</span><span className="kv-val" style={{ color: scenarioData.bundle.keys_missing !== '0' ? '#f28b82' : '#81c995' }}>{scenarioData.bundle.keys_missing}</span></div>
                    </div>
                  </div>
                  {scenarioData.bundle.keys.length > 0 && (
                    <div className="di-section" style={{ marginTop: 12 }}>
                      <div className="dis-header"><span className="dis-title">String Keys</span></div>
                      <div style={{ background: '#1a1a2e', padding: '12px 14px', fontFamily: 'Roboto Mono' }}>
                        {scenarioData.bundle.keys.map(k => (
                          <div key={k.key} className="kv-row">
                            <span className="kv-key">{k.key}</span>
                            <span className={`kv-val${k.status === 'missing' ? ' missing' : k.status === 'ok' ? ' ok' : ''}`}>{k.status === 'missing' ? 'KEY NOT FOUND ✗' : k.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="debug-inspector" ref={debugRef}>
                  <div className="etl-title" style={{ fontFamily: 'Google Sans', fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 14 }}>Variable Watch</div>
                  <div className="di-section">
                    <div className="dis-header">
                      <span className="dis-title">Runtime Variables</span>
                      <span className={`dis-badge ${scenarioData.variables.some(v => v.status === 'missing') ? 'error' : 'ok'}`}>Live</span>
                    </div>
                    <div style={{ background: '#1a1a2e', padding: '12px 14px', fontFamily: 'Roboto Mono' }}>
                      {scenarioData.variables.map(v => (
                        <div key={v.key} className="kv-row">
                          <span className="kv-key">{v.key}</span>
                          <span className={`kv-val${v.status === 'missing' ? ' missing' : v.status === 'ok' ? ' ok' : ''}`} style={v.status === 'warn' ? { color: '#f59e0b' } : {}}>{v.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Screenshots tab */}
            {debugTab === 'screenshots' && (
              <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                {scenarioData.screenshots.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">📸</div><div className="empty-title">No failures to capture</div><div className="empty-sub">This scenario passed all assertions</div></div>
                ) : (
                  <>
                    <div style={{ fontFamily: 'Google Sans', fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.5px' }}>Failure Screenshots · {selected.id}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      {scenarioData.screenshots.map((ss, idx) => (
                        <div key={idx}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, display: 'flex', align: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'Roboto Mono', color: 'var(--g-blue)' }}>📸 {ss.label || ss.screen}</span>
                            <span style={{ color: 'var(--text3)' }}>·</span>
                            <span style={{ fontFamily: 'Roboto Mono', fontSize: 10, background: 'var(--g-blue-ll)', color: '#1557b0', padding: '1px 6px', borderRadius: 4 }}>{ss.key}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--g-red)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g-red)', display: 'inline-block' }} />Actual — Device Screen
                              </div>
                              <NestDeviceMock shot={ss} locale={selected.locale} variant="fail" size="lg" />
                            </div>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--g-green)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g-green)', display: 'inline-block' }} />Expected — From Spec
                              </div>
                              <NestDeviceMock shot={ss} locale={selected.locale} variant="pass" size="lg" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Agent Reasoning tab */}
            {debugTab === 'reasoning' && (
              <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                <div style={{ fontFamily: 'Google Sans', fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.5px' }}>Agent Reasoning Chain · {selected.id}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {scenarioData.reasoning.map((r, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--agent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>{r.icon}</div>
                      <div style={{ flex: 1, background: '#f8f9fa', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'Google Sans', fontSize: 12, fontWeight: 700, color: 'var(--agent)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{r.phase}</div>
                        <div style={{ fontSize: 13.5, color: 'var(--dark2)', lineHeight: 1.65 }}>{r.text}</div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#065f46', fontWeight: 700, flexShrink: 0 }}>✓</div>
                    </div>
                  ))}
                  {messages.filter(m => m.type === 'agent').map((msg, i) => (
                    <div key={`agent-${i}`} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1a73e8,#4285f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" width={16} height={16}><path d="M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 012-2z" fill="white"/></svg>
                      </div>
                      <div style={{ flex: 1, background: 'var(--agent-ll)', border: '1px solid rgba(26,115,232,.2)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'Google Sans', fontSize: 12, fontWeight: 700, color: 'var(--agent)', marginBottom: 6 }}>Live Agent Response</div>
                        <div style={{ fontSize: 13.5, color: 'var(--dark2)', lineHeight: 1.65 }}>{msg.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {messages.length > 0 && <FeedReplyBar send={send} loading={loading} placeholder="Reply to agent…" />}
              </div>
            )}

            {/* HIL Intervention */}
            {selected.hil && (
              <div className="hil-intervention">
                <div className="hi-top">
                  <div className="hi-icon"><svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V9h2v3z"/></svg></div>
                  <span className="hi-title">Agent Decision Point — Your Input Required</span>
                  <div className="hi-badge">HIL</div>
                </div>
                <p className="hi-sub">Agent has identified a <strong>blocker failure</strong> with {scenarioData.confidence.rootCause}% certainty. Please choose how to proceed.</p>
                <div className="hi-options">
                  {[['🐛', 'Mark as Bug', 'File to Buganizer with full RCA and proposed fix'], ['🔄', 'Retry with Patch', 'Inject the missing key and re-run to confirm fix'], ['✅', 'Override — Pass', 'Mark as known issue, continue with next scenario']].map(([icon, title, desc]) => (
                    <div key={title} className="hi-option" onClick={() => title === 'Mark as Bug' && setHilOpen(true)}>
                      <div className="hio-icon">{icon}</div>
                      <div className="hio-title">{title}</div>
                      <div className="hio-desc">{desc}</div>
                    </div>
                  ))}
                </div>
                <div className="hi-debug-tools">
                  {['Inspect DOM', 'Compare Screenshots', 'Check Bundle Diff', 'Run Partial Fix'].map(tool => (
                    <div key={tool} className="hi-tool-btn" onClick={() => send(`${tool} for scenario ${selected.id}`)}>{tool}</div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : running ? (
          <LiveRunPanel scenarios={filtered} onSelect={selectScenario} />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">⚡</div>
            <div className="empty-title">Select a scenario to inspect</div>
            <div className="empty-sub">or click Run All to start execution</div>
          </div>
        )}
      </div>
      {hilOpen && selected && <HilOverlay issue={{ id: 'b/337821049', title: `${selected.name} — Localization Failure`, severity: 'S2', component: 'Nest>Firmware>Localization>HomeScreen', test_case_ids: ['LOC-NH-11198', 'LOC-NH-11199'], description: 'Untranslated strings detected during Sprint 43 regression.' }} onClose={() => setHilOpen(false)} />}
    </div>
  )
}

// ─── RCA & Issues Tab ──────────────────────────────────────────────────────────
const BUGANIZER_ISSUES = [
  {
    id: 'b/337821049', status: 'DRAFT', severity: 'S2', priority: 'P0', approved: false,
    locale: 'pt-BR', device: 'Nest Hub',
    title: '[PT-BR][P0] Home Screen greeting strings untranslated on Nest Hub firmware 4.1.0.12-rc3',
    component: 'Nest>Firmware>Localization>HomeScreen',
    test_case_ids: ['LOC-NH-11198', 'LOC-NH-11199', 'LOC-NH-11200', 'LOC-SIM-001'],
    description: 'Untranslated greeting, weather, and calendar strings detected on PT-BR Nest Hub.',
    rca: {
      rcaId: 'RCA-2026-043-001', confidence: 97, sprint: 'Sprint 43',
      title: 'PT-BR Nest Hub Home Screen — Sprint 43 String Keys',
      rootCause: 'Release branch l10n-sprint43 is missing the PT-BR string bundle update. Strings hs_greeting_morning, hs_greeting_afternoon, hs_weather_label, and hs_calendar_today were added to en-US.strings in Sprint 43 but were not propagated to the PT-BR bundle pt-BR.strings. The app correctly detects the missing keys and falls back to the English locale — resulting in untranslated UI on all PT-BR Nest Hub devices.',
      diffTitle: 'pt-BR.strings — 4 missing keys',
      diffEn: ['hs_greeting_morning = "Good morning"', 'hs_greeting_afternoon = "Good afternoon"', 'hs_weather_label = "Weather"', 'hs_calendar_today = "Today"'],
      diffLocale: ['hs_greeting_morning = ∅ MISSING', 'hs_greeting_afternoon = ∅ MISSING', 'hs_weather_label = ∅ MISSING', 'hs_calendar_today = ∅ MISSING'],
      diffFix: ['+  hs_greeting_morning = "Bom dia";', '+  hs_greeting_afternoon = "Boa tarde";', '+  hs_weather_label = "Tempo";', '+  hs_calendar_today = "Hoje";'],
      evidence: [['Greeting', 'Good morning', 'Bom dia'], ['Weather', 'Weather', 'Tempo'], ['Calendar', 'Today', 'Hoje']],
      impact: [['LOC-NH-11198', 'Greeting string untranslated', 'P0', 'Nest Hub'], ['LOC-NH-11199', 'Weather label untranslated', 'P0', 'Nest Hub'], ['LOC-NH-11200', 'Calendar "Today" untranslated', 'P1', 'Nest Hub']],
    },
    bugFields: [
      ['Title', '[PT-BR][P0] Home Screen greeting strings untranslated on Nest Hub 4.1.0.12-rc3'],
      ['Component', 'Nest > Firmware > Localization > HomeScreen'],
      ['Severity', 'S2 — Major'], ['Sprint', 'Sprint 43'], ['Assignee', 'l10n-team@google.com'],
    ],
    comment: 'Root cause confirmed: Sprint 43 PT-BR bundle missing 4 keys (hs_greeting_morning, hs_greeting_afternoon, hs_weather_label, hs_calendar_today). Apply proposed diff to pt-BR.strings and rebuild the l10n-sprint43 branch to resolve.',
  },
  {
    id: 'b/337821050', status: 'DRAFT', severity: 'S2', priority: 'P0', approved: false,
    locale: 'ar-SA', device: 'Nest Thermostat',
    title: '[AR-SA][P0] Temperature label RTL overflow on Nest Thermostat 6.4.0.3-rc1',
    component: 'Nest>Firmware>Localization>ThermostatUI',
    test_case_ids: ['LOC-NT-11201', 'LOC-NT-11202'],
    description: 'RTL layout engine not applied to temperature component for ar-SA locale.',
    rca: {
      rcaId: 'RCA-2026-043-002', confidence: 91, sprint: 'Sprint 43',
      title: 'AR-SA Nest Thermostat — RTL Layout Engine Not Applied',
      rootCause: 'ThermostatControlView was fully rewritten in Sprint 42 (CL #4429183) and the RTL_CAPABLE flag was not migrated from the legacy component. RTL layout engine skips views without this flag, causing temperature labels, digit formatting, and control positioning to use LTR layout for all RTL locales including ar-SA.',
      diffTitle: 'ComponentManifest.xml — RTL flag missing',
      diffEn: ['<view name="ThermostatControlView">', '  RTL_CAPABLE=false  ← INCORRECT', '  locale_digits="western" ← INCORRECT', '  temp_format="°C"  ← INCORRECT', '</view>'],
      diffLocale: ['<view name="LegacyThermostatView"> (Sprint 41)', '  RTL_CAPABLE=true ✓', '  locale_digits="auto" ✓', '  temp_format="locale_aware" ✓', '</view>'],
      diffFix: ['+  RTL_CAPABLE=true', '+  locale_digits="arabic-indic" for ar-SA', '+  temp_format="°م" for ar-SA', '+  layout_gravity="end" for RTL'],
      evidence: [['Temperature', '23°C (LTR)', '۲۳°م (RTL)'], ['Layout', 'Left-to-Right', 'Right-to-Left']],
      impact: [['LOC-NT-11201', 'Temperature label RTL overflow', 'P0', 'Nest Thermostat'], ['LOC-NT-11202', 'Degree symbol localisation', 'P0', 'Nest Thermostat']],
    },
    bugFields: [
      ['Title', '[AR-SA][P0] Temperature label RTL overflow on Nest Thermostat 6.4.0.3-rc1'],
      ['Component', 'Nest > Firmware > Localization > ThermostatUI'],
      ['Severity', 'S2 — Major'], ['Sprint', 'Sprint 43'], ['Assignee', 'rtl-eng@google.com'],
    ],
    comment: 'Root cause confirmed: ThermostatControlView (CL #4429183) missing RTL_CAPABLE flag. Set RTL_CAPABLE=true in ComponentManifest.xml, update temperature formatter for ar-SA digit/symbol localisation, and cherry-pick to l10n-sprint43.',
  },
  {
    id: 'b/337821051', status: 'REVIEW', severity: 'S3', priority: 'P1', approved: false,
    locale: 'de-DE', device: 'Nest Mini',
    title: '[DE-DE][P1] Package delivery notification text truncated on Nest Mini 3.2.1.8-rc1',
    component: 'Nest>Firmware>Localization>Notifications',
    test_case_ids: ['LOC-NF-40102'],
    description: 'German notification text overflows notification bubble for package delivery alerts.',
    rca: {
      rcaId: 'RCA-2026-043-003', confidence: 88, sprint: 'Sprint 43',
      title: 'DE-DE Nest Mini — Notification Bubble Text Overflow',
      rootCause: 'The German string for package delivery notification ("Paketlieferung erkannt — bitte Klingel prüfen") is 47% longer than the English equivalent ("Package delivery detected"). The notification bubble has a hardcoded max-width of 240px inherited from the en-US design spec. No text truncation or line-wrapping logic exists for non-English locales.',
      diffTitle: 'NotificationView.xml — hardcoded width',
      diffEn: ['<NotificationBubble', '  max_width="240px"  ← en-US hardcoded', '  text_overflow="clip"', '  wrap="false"', '/>'],
      diffLocale: ['DE-DE text: "Paketlieferung erkannt"', '  rendered_width: 287px', '  overflow: 47px CLIPPED', '  visible_chars: ~78% of string'],
      diffFix: ['+  max_width="auto"  or  locale_aware_width=true', '+  text_overflow="ellipsis"  for short titles', '+  wrap="true"  for notification body text', '+  max_lines="2" for overflow'],
      evidence: [['Notification', '"Package de…" (clipped)', '"Paketlieferung erkannt — bitte Klingel prüfen"']],
      impact: [['LOC-NF-40102', 'Package delivery text truncated', 'P1', 'Nest Mini']],
    },
    bugFields: [
      ['Title', '[DE-DE][P1] Package delivery notification truncated on Nest Mini 3.2.1.8-rc1'],
      ['Component', 'Nest > Firmware > Localization > Notifications'],
      ['Severity', 'S3 — Moderate'], ['Sprint', 'Sprint 43'], ['Assignee', 'ui-layout@google.com'],
    ],
    comment: 'Root cause: NotificationBubble has hardcoded max-width=240px from en-US spec. German strings average 40% longer. Fix: use locale-aware dynamic width or add text-overflow/line-wrap for long-text locales (de-DE, fi-FI, etc.).',
  },
]

function RcaTab({ sessionId, userId, onTabChange, selectedIssueId, setSelectedIssueId }) {
  const { messages, loading, send } = useAgent(sessionId, userId)
  const [selectedIssue, setSelectedIssue] = useState(() => BUGANIZER_ISSUES.find(b => b.id === selectedIssueId) || BUGANIZER_ISSUES[0])
  const [hilIssue, setHilIssue] = useState(null)

  useEffect(() => {
    if (selectedIssueId) {
      const found = BUGANIZER_ISSUES.find(b => b.id === selectedIssueId)
      if (found) setSelectedIssue(found)
    }
  }, [selectedIssueId])

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Issue list sidebar */}
      <div className="rca-issues-list">
        <div className="ril-header">RCA Reports <span className="ril-count">{BUGANIZER_ISSUES.length}</span></div>
        {BUGANIZER_ISSUES.map(issue => (
          <div key={issue.id} className={`ril-item${selectedIssue?.id === issue.id ? ' active' : ''}`} onClick={() => { setSelectedIssue(issue); setSelectedIssueId?.(issue.id) }}>
            <div className="ril-top">
              <span className={`ril-status ${issue.status === 'DRAFT' ? 'ril-draft' : 'ril-review'}`}>{issue.status}</span>
              <span className="ril-confidence">{issue.rca.confidence}% conf</span>
            </div>
            <div className="ril-id">{issue.id}</div>
            <div className="ril-title">{issue.title.length > 62 ? issue.title.slice(0, 62) + '…' : issue.title}</div>
            <div className="ril-meta">
              <span className={`ril-sev ${issue.severity === 'S2' ? 'rsev-s2' : 'rsev-s3'}`}>{issue.severity}</span>
              <span className="ril-locale">{issue.locale}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{issue.device}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Center: RCA report */}
      <div className="rca-left">
        <div style={{ padding: '10px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Google Sans', fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>RCA Report — {selectedIssue.id}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>ID: <code style={{ fontSize: 11 }}>{selectedIssue.rca.rcaId}</code> · {selectedIssue.rca.sprint} · {selectedIssue.locale}</div>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* RCA header */}
        <div className="rca-header">
          <div className="rca-avatar">
            <svg viewBox="0 0 24 24"><path d="M9.5 2A1.5 1.5 0 008 3.5v1A1.5 1.5 0 009.5 6h5A1.5 1.5 0 0016 4.5v-1A1.5 1.5 0 0014.5 2h-5zM6 5a3 3 0 00-3 3v9a3 3 0 003 3h12a3 3 0 003-3V8a3 3 0 00-3-3h-.5A2.5 2.5 0 0115 7.5h-6A2.5 2.5 0 016.5 5H6z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="rcah-label">Agent Root Cause Analysis · Complete</div>
            <div className="rcah-title">{selectedIssue.rca.title}</div>
            <div className="rcah-meta">
              <span className="rcah-badge" style={{ background: '#d1fae5', color: '#065f46' }}>{selectedIssue.rca.confidence}% Confidence</span>
              <span className="rcah-badge" style={{ background: 'var(--hil-l)', color: '#92400e' }}>Pending Approval</span>
              <span className="rcah-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>{selectedIssue.priority} Blocker</span>
            </div>
          </div>
          <div className="rcah-actions">
            <button className="btn-sm btn-outline" onClick={() => { setSelectedIssueId?.(selectedIssue.id); onTabChange?.('runtests') }}>← Back</button>
            <button className="btn-sm btn-agent" onClick={() => setHilIssue(selectedIssue)}>File Issue →</button>
          </div>
        </div>

        {/* Root cause */}
        <div className="rca-section">
          <div className="rca-sec-header">
            <div className="rsh-icon" style={{ background: 'var(--g-red)' }}><svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V9h2v3z"/></svg></div>
            <span className="rsh-title">Root Cause</span>
            <span className="rsh-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>Blocker</span>
          </div>
          <div className="rca-sec-body">
            <p className="rca-narrative">{selectedIssue.rca.rootCause}</p>
          </div>
        </div>

        {/* Evidence diff */}
        <div className="rca-section">
          <div className="rca-sec-header">
            <div className="rsh-icon" style={{ background: 'var(--g-blue)' }}><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg></div>
            <span className="rsh-title">{selectedIssue.rca.diffTitle}</span>
            <span className="rsh-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>{selectedIssue.rca.diffLocale.length} issues</span>
          </div>
          <div className="rca-sec-body">
            <div className="evidence-grid">
              <div className="ev-card">
                <div className="ev-title">Actual (Failing State)</div>
                <div className="ev-code">{selectedIssue.rca.diffLocale.map((l, i) => <div key={i} className="ev-missing">{l}</div>)}</div>
              </div>
              <div className="ev-card">
                <div className="ev-title">Expected / Baseline</div>
                <div className="ev-code">{selectedIssue.rca.diffEn.map((l, i) => <div key={i} className="ev-ok">{l}</div>)}</div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="diff-header">
                <span className="diff-filename">{selectedIssue.rca.diffTitle}</span>
                <span style={{ fontSize: 11, background: 'rgba(52,168,83,.2)', color: '#81c995', padding: '1px 8px', borderRadius: 8, fontWeight: 600 }}>Proposed Fix</span>
              </div>
              <div className="diff-body">
                {selectedIssue.rca.diffFix.map((line, i) => (
                  <div key={i} className="diff-line add"><span className="dl-gutter add">+</span><span className="dl-code add">{line}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Visual evidence */}
        <div className="rca-section">
          <div className="rca-sec-header">
            <div className="rsh-icon" style={{ background: 'var(--agent)' }}><svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>
            <span className="rsh-title">Visual Evidence — {selectedIssue.device} · {selectedIssue.locale}</span>
          </div>
          <div className="rca-sec-body">
            <div style={{ display: 'flex', gap: 12 }}>
              {selectedIssue.rca.evidence.map(([label, wrong, right]) => (
                <div key={label} style={{ flex: 1, background: '#1a1a2e', borderRadius: 10, overflow: 'hidden', border: '1px solid #3c3c5c' }}>
                  <div style={{ background: '#303134', padding: '4px 10px', fontSize: 10, color: '#9aa0a6', fontFamily: 'Roboto Mono' }}>{selectedIssue.device} · {selectedIssue.locale} · {label}</div>
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ background: 'rgba(30,30,50,.8)', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontFamily: 'Roboto Mono' }}>
                      <div style={{ color: '#f28b82', fontSize: 9, marginBottom: 2 }}>ACTUAL (failing)</div>
                      <div style={{ color: '#fca5a5' }}>"{wrong}"</div>
                    </div>
                    <div style={{ background: 'rgba(30,50,30,.8)', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontFamily: 'Roboto Mono' }}>
                      <div style={{ color: '#81c995', fontSize: 9, marginBottom: 2 }}>EXPECTED</div>
                      <div style={{ color: '#86efac' }}>"{right}"</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Impact table */}
        <div className="rca-section">
          <div className="rca-sec-header">
            <div className="rsh-icon" style={{ background: 'var(--hil)' }}><svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V9h2v3z"/></svg></div>
            <span className="rsh-title">Impact Analysis</span>
            <span className="rsh-badge" style={{ background: 'var(--hil-l)', color: '#92400e' }}>{selectedIssue.rca.impact.length} test cases</span>
          </div>
          <div className="rca-sec-body" style={{ padding: 0 }}>
            <table className="impact-table">
              <thead><tr><th>Test ID</th><th>Description</th><th>Priority</th><th>Device</th></tr></thead>
              <tbody>
                {selectedIssue.rca.impact.map(([id, desc, sev, dev]) => (
                  <tr key={id} style={{ cursor: 'pointer' }} onClick={() => onTabChange?.('runtests')}>
                    <td style={{ fontFamily: 'Roboto Mono', color: 'var(--g-blue)', fontSize: 12 }}>{id}</td>
                    <td>{desc}</td>
                    <td><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: sev === 'P0' ? '#fee2e2' : '#fff7ed', color: sev === 'P0' ? '#991b1b' : '#9a3412' }}>{sev}</span></td>
                    <td style={{ color: 'var(--text2)' }}>{dev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        </div>

        {/* Agent response panel — only visible when send() produces messages */}
        {messages.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border2)', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'Google Sans', fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '12px 24px 4px' }}>Agent Response</div>
            <div style={{ padding: '0 24px 4px', maxHeight: 200, overflowY: 'auto' }}>
              {messages.map((msg, i) => <AgentMsg key={i} msg={msg} onApprove={() => {}} />)}
            </div>
            <FeedReplyBar send={send} loading={loading} placeholder="Reply to agent about this issue…" />
          </div>
        )}
      </div>

      {/* Right: Issue filing panel */}
      <div className="rca-right">
        <div className="ir-header">
          <div className="irh-title">Issue Filing — Buganizer</div>
          <div className="irh-sub">{selectedIssue.id} · {selectedIssue.status}</div>
        </div>
        <div className="buganizer-card">
          <div className="bc-header" style={{ background: '#1a73e8' }}>
            <span className="bc-logo">Buganizer</span>
            <span className="bc-title">{selectedIssue.title.slice(0, 44)}…</span>
            <span className="bc-id">{selectedIssue.id}</span>
          </div>
          <div className="bc-body">
            {selectedIssue.bugFields.map(([label, val]) => (
              <div key={label} className="bc-field">
                <span className="bcf-label">{label}</span>
                <span className="bcf-val">{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="comment-preview">
          <div className="cp-header-bar">
            <span className="cp-header-bar-title">Developer Comment</span>
            <span className="cp-preview-badge">AI Generated</span>
          </div>
          <div className="comment-body">
            <div className="cb-avatar">AI</div>
            <div className="cb-content">
              <div className="cbc-name">LocaTest Agent <span className="cbc-role">· RCA Agent</span></div>
              <div className="cbc-text">{selectedIssue.comment}</div>
            </div>
          </div>
        </div>
        <div className="hil-approval">
          <div className="ha-title">⚠ Awaiting HIL Approval</div>
          <div className="ha-body">Review the draft and approve to file, or refine before filing.</div>
          <div className="ha-buttons">
            <button className="btn-approve" onClick={() => setHilIssue(selectedIssue)}>✓ Approve &amp; File to Buganizer</button>
            <div className="btn-row">
              <button className="btn-refine" onClick={() => send(`Refine the Buganizer issue draft for ${selectedIssue.id} to improve precision and add more technical detail`)}>Refine Issue</button>
              <button className="btn-discard" onClick={() => send(`Discard the current draft for ${selectedIssue.id} and start fresh`)}>Discard Draft</button>
            </div>
          </div>
        </div>
      </div>

      {hilIssue && <HilOverlay issue={hilIssue} onClose={() => setHilIssue(null)} />}
    </div>
  )
}

// ─── Test Generation Tab ───────────────────────────────────────────────────────
const TEST_SUITES = [
  {
    id: 'TS-001', name: 'Home Screen & Ambient Display', device: 'Nest Hub',
    total: 847, pass: 812, fail: 23, skip: 12, automated: 644, automation: '76%',
    lastRun: '2026-05-29',
    cases: [
      { id: 'LOC-NH-11198', name: 'Greeting string — morning', locale: 'pt-BR', status: 'FAIL', priority: 'P0', automated: true },
      { id: 'LOC-NH-11199', name: 'Weather label translation', locale: 'pt-BR', status: 'FAIL', priority: 'P0', automated: true },
      { id: 'LOC-NH-11200', name: 'Calendar "Today" label', locale: 'pt-BR', status: 'FAIL', priority: 'P1', automated: true },
      { id: 'LOC-NH-11201', name: 'Ambient clock format (RTL)', locale: 'ar-SA', status: 'PASS', priority: 'P1', automated: true },
      { id: 'LOC-NH-11202', name: 'Home screen RTL layout', locale: 'ar-SA', status: 'PASS', priority: 'P1', automated: false },
      { id: 'LOC-NH-11203', name: 'Date format — de-DE', locale: 'de-DE', status: 'PASS', priority: 'P2', automated: true },
      { id: 'LOC-NH-11204', name: 'Greeting string — evening', locale: 'fr-FR', status: 'SKIP', priority: 'P2', automated: false },
      { id: 'LOC-NH-11205', name: 'Ambient greeting (ja-JP)', locale: 'ja-JP', status: 'PASS', priority: 'P2', automated: true },
      { id: 'LOC-NH-11206', name: 'Temperature unit label', locale: 'ko-KR', status: 'PASS', priority: 'P2', automated: true },
    ],
  },
  {
    id: 'TS-002', name: 'Google Assistant UI', device: 'Nest Hub',
    total: 312, pass: 287, fail: 8, skip: 17, automated: 193, automation: '62%',
    lastRun: '2026-05-29',
    cases: [
      { id: 'LOC-AS-20101', name: 'Voice query response — pt-BR', locale: 'pt-BR', status: 'PASS', priority: 'P1', automated: true },
      { id: 'LOC-AS-20102', name: 'Assistant card title (ar-SA)', locale: 'ar-SA', status: 'FAIL', priority: 'P0', automated: true },
      { id: 'LOC-AS-20103', name: 'Suggestion chip text — de-DE', locale: 'de-DE', status: 'PASS', priority: 'P2', automated: true },
      { id: 'LOC-AS-20104', name: 'Error message translation (fr-FR)', locale: 'fr-FR', status: 'SKIP', priority: 'P2', automated: false },
      { id: 'LOC-AS-20105', name: 'Follow-up prompt — ja-JP', locale: 'ja-JP', status: 'PASS', priority: 'P2', automated: true },
    ],
  },
  {
    id: 'TS-003', name: 'Device Settings & Onboarding', device: 'Nest Hub',
    total: 198, pass: 191, fail: 4, skip: 3, automated: 118, automation: '60%',
    lastRun: '2026-05-28',
    cases: [
      { id: 'LOC-ST-30201', name: 'Language selection UI', locale: 'pt-BR', status: 'PASS', priority: 'P1', automated: true },
      { id: 'LOC-ST-30202', name: 'Timezone label — ar-SA', locale: 'ar-SA', status: 'FAIL', priority: 'P1', automated: true },
      { id: 'LOC-ST-30203', name: 'Wi-Fi setup strings — de-DE', locale: 'de-DE', status: 'PASS', priority: 'P2', automated: false },
      { id: 'LOC-ST-30204', name: 'Account link prompt (ko-KR)', locale: 'ko-KR', status: 'SKIP', priority: 'P3', automated: false },
    ],
  },
  {
    id: 'TS-004', name: 'Temperature Control UI', device: 'Nest Thermostat',
    total: 267, pass: 241, fail: 18, skip: 8, automated: 187, automation: '70%',
    lastRun: '2026-05-29',
    cases: [
      { id: 'LOC-NT-11201', name: 'Temperature label RTL overflow', locale: 'ar-SA', status: 'FAIL', priority: 'P0', automated: true },
      { id: 'LOC-NT-11202', name: 'Degree symbol localisation', locale: 'ar-SA', status: 'FAIL', priority: 'P0', automated: true },
      { id: 'LOC-NT-11203', name: 'Mode labels (Heat/Cool) — pt-BR', locale: 'pt-BR', status: 'PASS', priority: 'P1', automated: true },
      { id: 'LOC-NT-11204', name: 'Schedule time format — de-DE', locale: 'de-DE', status: 'PASS', priority: 'P2', automated: true },
      { id: 'LOC-NT-11205', name: 'Eco mode label — ja-JP', locale: 'ja-JP', status: 'SKIP', priority: 'P3', automated: false },
    ],
  },
  {
    id: 'TS-005', name: 'Notifications & Alerts', device: 'Nest Hub',
    total: 143, pass: 138, fail: 3, skip: 2, automated: 129, automation: '90%',
    lastRun: '2026-05-28',
    cases: [
      { id: 'LOC-NF-40101', name: 'Motion alert string — pt-BR', locale: 'pt-BR', status: 'PASS', priority: 'P1', automated: true },
      { id: 'LOC-NF-40102', name: 'Package delivery text — de-DE', locale: 'de-DE', status: 'FAIL', priority: 'P1', automated: true },
      { id: 'LOC-NF-40103', name: 'Sound alert label (ar-SA)', locale: 'ar-SA', status: 'PASS', priority: 'P2', automated: true },
    ],
  },
]

function TestGenTab({ sessionId, userId }) {
  const genSessionId = useRef(`${sessionId}-tg`).current
  const { messages, loading, send } = useAgent(genSessionId, userId)
  const [mode, setMode] = useState('generate')
  const [form, setForm] = useState({ feature: '', device: 'Nest Hub', suite: 'Home Screen & Ambient Display', locales: 'all', priority: 'P1', description: '' })
  const [selectedSuite, setSelectedSuite] = useState(TEST_SUITES[0])
  const [tcFilter, setTcFilter] = useState('All')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const generate = () => {
    if (!form.feature.trim()) return
    send(`Generate test cases for "${form.feature}" on ${form.device}, suite: ${form.suite}, locales: ${form.locales}, priority: ${form.priority}. ${form.description}`)
  }

  const filteredCases = selectedSuite
    ? (tcFilter === 'All' ? selectedSuite.cases : selectedSuite.cases.filter(c => c.status === tcFilter))
    : []

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left panel */}
      <div className="testgen-form">
        {/* Mode switcher */}
        <div className="tg-mode-switch">
          <button className={`tgm-btn${mode === 'generate' ? ' active' : ''}`} onClick={() => setMode('generate')}>Generate</button>
          <button className={`tgm-btn${mode === 'browse' ? ' active' : ''}`} onClick={() => setMode('browse')}>Browse Suites</button>
        </div>

        {mode === 'generate' ? (
          <>
            <div className="tg-title">Generate Test Cases</div>
            <div className="tg-field"><label className="tg-label">Feature Name *</label><input className="tg-input" value={form.feature} onChange={e => set('feature', e.target.value)} placeholder="e.g. Night Mode Display for Thermostat" /></div>
            <div className="tg-field"><label className="tg-label">Nest Device</label>
              <select className="tg-select" value={form.device} onChange={e => set('device', e.target.value)}>
                {['Nest Hub', 'Nest Hub Max', 'Nest Mini', 'Nest Cam', 'Nest Doorbell', 'Nest Thermostat'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="tg-field"><label className="tg-label">UI Suite</label>
              <select className="tg-select" value={form.suite} onChange={e => set('suite', e.target.value)}>
                {['Home Screen & Ambient Display', 'Google Assistant UI', 'Device Settings', 'Temperature Control UI', 'Nest Cam & Doorbell UI', 'Routines & Automation', 'Notifications', 'Device Onboarding', 'Media Playback & Cast'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="tg-field"><label className="tg-label">Locales</label>
              <select className="tg-select" value={form.locales} onChange={e => set('locales', e.target.value)}>
                <option value="all">All 10 locales (recommended)</option>
                {['pt-BR', 'ar-SA', 'de-DE', 'fr-FR', 'ja-JP', 'ko-KR', 'zh-CN', 'hi-IN', 'es-ES', 'tr-TR'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="tg-field"><label className="tg-label">Priority</label>
              <select className="tg-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {['P0', 'P1', 'P2', 'P3'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="tg-field"><label className="tg-label">Feature Description</label>
              <textarea className="tg-input" rows={4} style={{ resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe expected localisation behaviour, string keys needed, device-specific UI constraints…" />
            </div>
            <button className="btn-generate" onClick={generate} disabled={loading || !form.feature.trim()}>
              {loading ? <><div className="spinner" style={{ borderTopColor: 'white', width: 14, height: 14 }} />Generating…</> : 'Generate Tests'}
            </button>
          </>
        ) : (
          /* Browse Suites list */
          <div className="suite-list">
            {TEST_SUITES.map(suite => (
              <div key={suite.id} className={`suite-item${selectedSuite?.id === suite.id ? ' active' : ''}`} onClick={() => { setSelectedSuite(suite); setTcFilter('All') }}>
                <div className="si-top">
                  <span className="si-id">{suite.id}</span>
                  <span className="si-device">{suite.device}</span>
                </div>
                <div className="si-name">{suite.name}</div>
                <div className="si-stats">
                  <span className="si-stat pass">{suite.pass} pass</span>
                  <span className="si-stat fail">{suite.fail} fail</span>
                  <span className="si-stat skip">{suite.skip} skip</span>
                </div>
                <div className="si-bar">
                  <div style={{ height: '100%', background: 'var(--g-green)', width: `${Math.round(suite.pass / suite.total * 100)}%`, borderRadius: 2 }} />
                  <div style={{ height: '100%', background: 'var(--g-red)', width: `${Math.round(suite.fail / suite.total * 100)}%`, borderRadius: 2 }} />
                  <div style={{ height: '100%', background: '#dadce0', flex: 1, borderRadius: 2 }} />
                </div>
                <div className="si-meta">{suite.total} cases · {suite.automation} automated · {suite.lastRun}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="testgen-results">
        {mode === 'generate' ? (
          <>
            <div className="tg-result-header">Generated Tests</div>
            <div className="tg-result-body">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>✨</div>
                  <div style={{ fontFamily: 'Google Sans', fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>AI-Powered Test Generation</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7 }}>Fill in the feature details and click Generate. The agent will create localisation test cases for all selected locales, including string key verification, RTL layout checks, and device-specific UI assertions.</div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => <AgentMsg key={i} msg={msg} onApprove={() => {}} />)}
                </>
              )}
            </div>
            {messages.length > 0 && (
              <FeedReplyBar send={send} loading={loading} placeholder="Ask agent to refine, add locales, or generate more…" />
            )}
          </>
        ) : selectedSuite ? (
          <>
            {/* Suite detail header */}
            <div className="tcb-header">
              <div>
                <div style={{ fontFamily: 'Google Sans', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{selectedSuite.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{selectedSuite.id} · {selectedSuite.device} · Last run: {selectedSuite.lastRun}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {[['Total', selectedSuite.total, 'var(--text)'], ['Pass', selectedSuite.pass, 'var(--g-green)'], ['Fail', selectedSuite.fail, 'var(--g-red)'], ['Skip', selectedSuite.skip, 'var(--text3)']].map(([k, v, c]) => (
                  <div key={k} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: c, fontFamily: 'Google Sans' }}>{v}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Filter bar */}
            <div className="tc-filter-bar">
              {['All', 'PASS', 'FAIL', 'SKIP'].map(f => (
                <div key={f} className={`tcf-tab${tcFilter === f ? ' active' : ''}`} onClick={() => setTcFilter(f)}>
                  {f}
                  <span className="tcf-count">{f === 'All' ? selectedSuite.total : selectedSuite.cases.filter(c => c.status === f).length}</span>
                </div>
              ))}
              <button className="tcf-ask-btn" onClick={() => send(`Analyze test suite ${selectedSuite.id}: ${selectedSuite.name}. What are the most critical failures?`)}>Ask Agent →</button>
            </div>
            {/* Test case table */}
            <div className="tc-table-wrap">
              <table className="tc-table">
                <thead>
                  <tr>
                    {['ID', 'Test Case', 'Locale', 'Priority', 'Status', 'Auto'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map(tc => (
                    <tr key={tc.id}>
                      <td><span className="tc-id">{tc.id}</span></td>
                      <td className="tc-name">{tc.name}</td>
                      <td><span className="tc-locale">{tc.locale}</span></td>
                      <td><span className={`tc-priority p${tc.priority[1]}`}>{tc.priority}</span></td>
                      <td>
                        <span className={`tc-status ts-${tc.status.toLowerCase()}`}>{tc.status}</span>
                      </td>
                      <td style={{ textAlign: 'center', color: tc.automated ? 'var(--g-green)' : 'var(--text3)', fontSize: 13 }}>
                        {tc.automated ? '✓' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCases.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>No test cases matching filter.</div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

// ─── Firmware Builds Tab ───────────────────────────────────────────────────────
const FW_BUILDS = [
  {
    id: 'FW-001', device: 'Nest Hub', version: '4.1.0.12-rc3', status: 'in_qa', blocker: true,
    executed: 1247, passed: 1089, failed: 89, skipped: 69, passRate: '87.3%',
    localeResults: [
      { locale: 'pt-BR', executed: 168, passed: 124, failed: 31, skipped: 13 },
      { locale: 'ar-SA', executed: 145, passed: 121, failed: 18, skipped: 6 },
      { locale: 'de-DE', executed: 132, passed: 128, failed: 2, skipped: 2 },
      { locale: 'fr-FR', executed: 132, passed: 129, failed: 1, skipped: 2 },
      { locale: 'ja-JP', executed: 130, passed: 127, failed: 2, skipped: 1 },
      { locale: 'ko-KR', executed: 130, passed: 125, failed: 4, skipped: 1 },
      { locale: 'zh-CN', executed: 130, passed: 127, failed: 2, skipped: 1 },
      { locale: 'hi-IN', executed: 130, passed: 128, failed: 29, skipped: 43 },
      { locale: 'es-ES', executed: 100, passed: 98, failed: 0, skipped: 2 },
      { locale: 'tr-TR', executed: 100, passed: 82, failed: 0, skipped: 18 },
    ],
    suiteResults: [
      { name: 'Home Screen & Ambient Display', executed: 847, passed: 812, failed: 23, skipped: 12 },
      { name: 'Google Assistant UI', executed: 312, passed: 187, failed: 58, skipped: 67 },
      { name: 'Device Settings', executed: 88, passed: 90, failed: 8, skipped: 0 },
    ],
  },
  {
    id: 'FW-002', device: 'Nest Thermostat', version: '6.4.0.3-rc1', status: 'in_qa', blocker: true,
    executed: 524, passed: 476, failed: 32, skipped: 16, passRate: '90.8%',
    localeResults: [
      { locale: 'pt-BR', executed: 57, passed: 55, failed: 1, skipped: 1 },
      { locale: 'ar-SA', executed: 57, passed: 39, failed: 17, skipped: 1 },
      { locale: 'de-DE', executed: 50, passed: 49, failed: 1, skipped: 0 },
      { locale: 'fr-FR', executed: 50, passed: 49, failed: 0, skipped: 1 },
      { locale: 'ja-JP', executed: 50, passed: 49, failed: 1, skipped: 0 },
      { locale: 'ko-KR', executed: 50, passed: 47, failed: 2, skipped: 1 },
      { locale: 'zh-CN', executed: 50, passed: 49, failed: 1, skipped: 0 },
      { locale: 'hi-IN', executed: 50, passed: 48, failed: 1, skipped: 1 },
      { locale: 'es-ES', executed: 55, passed: 47, failed: 6, skipped: 2 },
      { locale: 'tr-TR', executed: 55, passed: 44, failed: 2, skipped: 9 },
    ],
    suiteResults: [
      { name: 'Temperature Control UI', executed: 267, passed: 241, failed: 18, skipped: 8 },
      { name: 'Device Settings', executed: 198, passed: 191, failed: 14, skipped: 3 },
      { name: 'Notifications', executed: 59, passed: 44, failed: 0, skipped: 15 },
    ],
  },
  {
    id: 'FW-003', device: 'Nest Hub Max', version: '4.1.0.11-rc2', status: 'stable', blocker: false,
    executed: 1105, passed: 1062, failed: 22, skipped: 21, passRate: '96.1%',
    localeResults: [
      { locale: 'pt-BR', executed: 115, passed: 109, failed: 5, skipped: 1 },
      { locale: 'ar-SA', executed: 115, passed: 110, failed: 4, skipped: 1 },
      { locale: 'de-DE', executed: 110, passed: 108, failed: 1, skipped: 1 },
      { locale: 'fr-FR', executed: 110, passed: 109, failed: 0, skipped: 1 },
      { locale: 'ja-JP', executed: 110, passed: 109, failed: 1, skipped: 0 },
      { locale: 'ko-KR', executed: 110, passed: 107, failed: 3, skipped: 0 },
      { locale: 'zh-CN', executed: 110, passed: 109, failed: 1, skipped: 0 },
      { locale: 'hi-IN', executed: 110, passed: 108, failed: 2, skipped: 0 },
      { locale: 'es-ES', executed: 110, passed: 107, failed: 3, skipped: 0 },
      { locale: 'tr-TR', executed: 105, passed: 96, failed: 2, skipped: 7 },
    ],
    suiteResults: [
      { name: 'Home Screen & Ambient Display', executed: 610, passed: 593, failed: 10, skipped: 7 },
      { name: 'Google Assistant UI', executed: 312, passed: 300, failed: 9, skipped: 3 },
      { name: 'Device Settings', executed: 183, passed: 169, failed: 3, skipped: 11 },
    ],
  },
  {
    id: 'FW-004', device: 'Nest Mini', version: '3.2.1.8-rc1', status: 'in_qa', blocker: false,
    executed: 412, passed: 387, failed: 14, skipped: 11, passRate: '93.9%',
    localeResults: [
      { locale: 'pt-BR', executed: 55, passed: 51, failed: 3, skipped: 1 },
      { locale: 'ar-SA', executed: 55, passed: 52, failed: 2, skipped: 1 },
      { locale: 'de-DE', executed: 50, passed: 49, failed: 1, skipped: 0 },
      { locale: 'fr-FR', executed: 50, passed: 49, failed: 0, skipped: 1 },
      { locale: 'ja-JP', executed: 50, passed: 50, failed: 0, skipped: 0 },
      { locale: 'ko-KR', executed: 50, passed: 47, failed: 3, skipped: 0 },
      { locale: 'zh-CN', executed: 50, passed: 48, failed: 2, skipped: 0 },
      { locale: 'hi-IN', executed: 52, passed: 41, failed: 3, skipped: 8 },
    ],
    suiteResults: [
      { name: 'Google Assistant UI', executed: 265, passed: 251, failed: 10, skipped: 4 },
      { name: 'Device Settings', executed: 147, passed: 136, failed: 4, skipped: 7 },
    ],
  },
  {
    id: 'FW-005', device: 'Nest Cam', version: '2.7.0.5-rc2', status: 'released', blocker: false,
    executed: 318, passed: 315, failed: 2, skipped: 1, passRate: '99.1%',
    localeResults: [
      { locale: 'pt-BR', executed: 35, passed: 35, failed: 0, skipped: 0 },
      { locale: 'ar-SA', executed: 35, passed: 34, failed: 1, skipped: 0 },
      { locale: 'de-DE', executed: 30, passed: 30, failed: 0, skipped: 0 },
      { locale: 'fr-FR', executed: 30, passed: 30, failed: 0, skipped: 0 },
      { locale: 'ja-JP', executed: 30, passed: 30, failed: 0, skipped: 0 },
      { locale: 'ko-KR', executed: 30, passed: 29, failed: 1, skipped: 0 },
      { locale: 'zh-CN', executed: 30, passed: 30, failed: 0, skipped: 0 },
      { locale: 'hi-IN', executed: 28, passed: 27, failed: 0, skipped: 1 },
      { locale: 'es-ES', executed: 35, passed: 35, failed: 0, skipped: 0 },
      { locale: 'tr-TR', executed: 35, passed: 35, failed: 0, skipped: 0 },
    ],
    suiteResults: [
      { name: 'Nest Cam & Doorbell UI', executed: 318, passed: 315, failed: 2, skipped: 1 },
    ],
  },
]

function FirmwareTab({ sessionId, userId, onTabChange, setChipContext }) {
  const [selected, setSelected] = useState(FW_BUILDS[0])
  const { messages, loading, send, lastText } = useAgent(sessionId, userId)

  useEffect(() => {
    if (!selected) return
    setChipContext?.(`[Build context] Device: ${selected.device} | Version: ${selected.version} | Status: ${selected.status} | Pass rate: ${selected.passRate} | Passed: ${selected.passed} | Failed: ${selected.failed} | Skipped: ${selected.skipped} | Sprint 43 QA build${selected.blocker ? ' | HAS RELEASE BLOCKER' : ''}`)
    return () => setChipContext?.(null)
  }, [selected?.id])

  const sendWithContext = (t) => {
    const ctx = `[Build context] Device: ${selected?.device} | Version: ${selected?.version} | Status: ${selected?.status} | Pass rate: ${selected?.passRate} | Passed: ${selected?.passed} | Failed: ${selected?.failed} | Sprint 43\n\n${t}`
    send(ctx)
  }

  const statusStyle = s => ({
    in_qa: { bg: 'var(--g-blue-ll)', color: '#1557b0' },
    stable: { bg: '#d1fae5', color: '#065f46' },
    released: { bg: '#d1fae5', color: '#065f46' },
  }[s] || { bg: '#f1f3f4', color: 'var(--text2)' })

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div className="fw-left">
        <div className="fw-panel-title">Builds</div>
        {FW_BUILDS.map(fw => {
          const ss = statusStyle(fw.status)
          return (
            <div key={fw.id} className={`fw-item${selected?.id === fw.id ? ' active' : ''}`} onClick={() => { setSelected(fw); send(`[Build context] Device: ${fw.device} | Version: ${fw.version} | Status: ${fw.status} | Pass rate: ${fw.passRate} | Passed: ${fw.passed} | Failed: ${fw.failed} | Sprint 43${fw.blocker ? ' | HAS RELEASE BLOCKER' : ''}\n\nSummarise the test results for ${fw.device} firmware ${fw.version} — pass rate, failed count, any release blockers, and which locales need attention.`) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                <span className="fw-device">{fw.device}</span>
                {fw.blocker && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: '#fee2e2', color: '#991b1b' }}>Blocker</span>}
              </div>
              <div className="fw-version">{fw.version}</div>
              <div className="fw-badges">
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: ss.bg, color: ss.color }}>{fw.status.replace('_', ' ')}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{fw.passRate}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11 }}>
                <span style={{ color: 'var(--g-green)' }}>{fw.passed}P</span>
                <span style={{ color: 'var(--g-red)' }}>{fw.failed}F</span>
                <span style={{ color: 'var(--text3)' }}>{fw.skipped}S</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="fw-right">
        {selected ? (
          <>
            {/* Header */}
            <div className="fw-detail-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="fw-detail-title">{selected.device} — {selected.version}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Sprint 43 · QA Build</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {selected.blocker && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 14, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>Release Blocker</span>}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 14, background: statusStyle(selected.status).bg, color: statusStyle(selected.status).color }}>{selected.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Execution summary 4 cards */}
            <div className="build-exec-section">
              <div className="bes-title">Test Execution Summary</div>
              <div className="exec-stat-grid">
                {[
                  { label: 'Executed', value: selected.executed, color: 'var(--text)', bg: '#f8f9fa' },
                  { label: 'Passed', value: selected.passed, color: 'var(--g-green)', bg: '#d1fae5' },
                  { label: 'Failed', value: selected.failed, color: 'var(--g-red)', bg: '#fee2e2' },
                  { label: 'Skipped', value: selected.skipped, color: 'var(--text3)', bg: '#f1f3f4' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className="exec-stat-card" style={{ background: bg }}>
                    <div className="esc-value" style={{ color }}>{value.toLocaleString()}</div>
                    <div className="esc-label">{label}</div>
                  </div>
                ))}
              </div>
              {/* Pass rate bar */}
              <div style={{ padding: '0 16px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                  <span>Overall pass rate</span>
                  <span style={{ fontWeight: 700, color: selected.failed > 10 ? 'var(--g-red)' : 'var(--g-green)' }}>{selected.passRate}</span>
                </div>
                <div style={{ height: 8, background: '#f1f3f4', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(selected.passed / selected.executed * 100).toFixed(1)}%`, background: 'var(--g-green)', transition: 'width .4s' }} />
                  <div style={{ width: `${(selected.failed / selected.executed * 100).toFixed(1)}%`, background: 'var(--g-red)' }} />
                  <div style={{ flex: 1, background: '#dadce0' }} />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: 'var(--text2)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--g-green)', display: 'inline-block' }} />Pass</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--g-red)', display: 'inline-block' }} />Fail</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#dadce0', display: 'inline-block' }} />Skip</span>
                </div>
              </div>
            </div>

            {/* Suite breakdown */}
            <div className="build-exec-section">
              <div className="bes-title">Test Suite Results</div>
              <div style={{ padding: '0 16px 14px' }}>
                {selected.suiteResults.map(sr => {
                  const pct = Math.round(sr.passed / sr.executed * 100)
                  return (
                    <div key={sr.name} className="suite-result-row">
                      <div className="srr-name">{sr.name}</div>
                      <div className="srr-bar-wrap">
                        <div style={{ height: '100%', background: 'var(--g-green)', width: `${sr.passed / sr.executed * 100}%` }} />
                        <div style={{ height: '100%', background: 'var(--g-red)', width: `${sr.failed / sr.executed * 100}%` }} />
                        <div style={{ height: '100%', background: '#dadce0', flex: 1 }} />
                      </div>
                      <div className="srr-stats">
                        <span style={{ color: 'var(--g-green)' }}>{sr.passed}P</span>
                        <span style={{ color: 'var(--g-red)' }}>{sr.failed}F</span>
                        <span style={{ color: 'var(--text3)' }}>{sr.skipped}S</span>
                        <span style={{ color: 'var(--text2)', marginLeft: 4 }}>{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Locale breakdown table */}
            <div className="build-exec-section">
              <div className="bes-title">Locale Breakdown</div>
              <div style={{ overflowX: 'auto', margin: '0 16px 16px' }}>
                <table className="locale-result-table">
                  <thead>
                    <tr>
                      <th>Locale</th>
                      <th>Executed</th>
                      <th>Passed</th>
                      <th>Failed</th>
                      <th>Skipped</th>
                      <th>Pass Rate</th>
                      <th>Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.localeResults.map(lr => {
                      const pct = Math.round(lr.passed / lr.executed * 100)
                      const health = pct >= 97 ? 'green' : pct >= 90 ? 'yellow' : 'red'
                      return (
                        <tr key={lr.locale}>
                          <td><span className="lrt-locale">{lr.locale}</span></td>
                          <td className="lrt-num">{lr.executed}</td>
                          <td className="lrt-num" style={{ color: 'var(--g-green)', fontWeight: 600 }}>{lr.passed}</td>
                          <td className="lrt-num" style={{ color: lr.failed > 0 ? 'var(--g-red)' : 'var(--text3)', fontWeight: lr.failed > 0 ? 700 : 400 }}>{lr.failed}</td>
                          <td className="lrt-num" style={{ color: 'var(--text3)' }}>{lr.skipped}</td>
                          <td className="lrt-num">{pct}%</td>
                          <td>
                            <span className={`lrt-health lrth-${health}`}>{health === 'green' ? '● Good' : health === 'yellow' ? '● Warn' : '● Critical'}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Agent feed */}
            <div className="agent-feed" style={{ padding: '16px 20px', minHeight: 80 }}>
              {messages.length === 0 && (
                <div className="agent-banner">
                  <div className="agent-avatar"><svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 012-2z"/></svg></div>
                  <div>
                    <div className="at-label">LocaTest Agent</div>
                    <div className="at-text">Ask about this build — e.g. "What's causing the AR-SA failures?" or "Compare with previous sprint"<span className="cursor" /></div>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => <AgentMsg key={i} msg={msg} onApprove={() => {}} />)}
            </div>
            <FeedReplyBar send={sendWithContext} loading={loading} placeholder="Ask agent about this build…" />
          </>
        ) : (
          <div className="empty-state"><div className="empty-icon">📱</div><div className="empty-title">Select a build</div></div>
        )}
      </div>
    </div>
  )
}

// ─── Google Footer ─────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="g-footer">
      <span className="gf-copyright">© 2025 Google LLC</span>
      <div className="gf-links">
        {['Privacy', 'Terms', 'Help', 'Send Feedback', 'Policies'].map(l => (
          <span key={l} className="gf-link">{l}</span>
        ))}
      </div>
      <div className="gf-right">
        <svg width="14" height="14" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="gf-logo-text">Google LocaTest</span>
      </div>
    </footer>
  )
}

// ─── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('workspace')
  const [selectedIssueId, setSelectedIssueId] = useState(null)
  const [chipContext, setChipContext] = useState(null)
  const sessionId = useRef(Math.random().toString(36).slice(2)).current
  const userId = 'default_user'

  const sharedAgent = useAgent(sessionId, userId)
  const tabProps = { sessionId, userId, onTabChange: setTab, selectedIssueId, setSelectedIssueId, setChipContext }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <SessionBar onTabChange={setTab} />
      <TabNav active={tab} onChange={setTab} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {tab === 'workspace'  && <WorkspaceTab {...tabProps} />}
          {tab === 'runtests'   && <SimulationTab {...tabProps} />}
          {tab === 'rca'        && <RcaTab {...tabProps} />}
          {tab === 'testgen'    && <TestGenTab {...tabProps} />}
          {tab === 'builds'     && <FirmwareTab {...tabProps} />}
        </div>
        <ChatDrawer onSend={sharedAgent.send} loading={sharedAgent.loading} lastText={sharedAgent.lastText} activeTab={tab} messages={sharedAgent.messages} chipContext={chipContext} />
      </div>
      <Footer />
    </div>
  )
}
