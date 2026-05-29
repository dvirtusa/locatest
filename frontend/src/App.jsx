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
const WF_STAGES = ['Intake', 'Analysis', 'Simulation', 'HIL Review', 'Issue Filing', 'Complete']
const TAB_TO_STAGE = { workspace: 1, simulation: 2, rca: 4, testgen: 1, firmware: 1 }
const STAGE_TO_TAB = { 2: 'simulation', 3: 'rca', 4: 'rca' }

function SessionBar({ activeTab, onTabChange }) {
  const activeStage = TAB_TO_STAGE[activeTab] ?? 1
  return (
    <div className="session-bar">
      <div className="sb-build">
        <div className="sb-icon">
          <svg viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
        </div>
        <span className="sb-name">Nest Hub 4.1.0.12-rc3 – QA Build</span>
        <span className="sb-meta">· Nest Firmware · Sprint 43</span>
      </div>
      <div className="sb-divider" />
      <div className="workflow">
        {WF_STAGES.map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <span className="wf-arrow">›</span>}
            <div
              className={`wf-stage${i < activeStage ? ' done' : i === activeStage ? ' active' : ''}${STAGE_TO_TAB[i] ? ' clickable' : ''}`}
              onClick={() => STAGE_TO_TAB[i] && onTabChange(STAGE_TO_TAB[i])}
            >
              <div className="wf-dot" />
              {s}
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="sb-right">
        <div className="agent-indicator">
          <div className="ai-dot" />
          <span className="agent-label">Agent Active · 89 new failures · Sprint 43</span>
        </div>
        <button className="sb-btn">⏸ Pause Agent</button>
      </div>
    </div>
  )
}

// ─── Tab nav ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'rca', label: 'RCA & Issues' },
  { id: 'testgen', label: 'Test Generation' },
  { id: 'firmware', label: 'Firmware Builds' },
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
  simulation: ['Run PT-BR regression', 'Show HIL queue', 'Retry with patch', 'Other locales affected?'],
  rca:        ['Generate RCA report', 'Approve & file issue', 'Compare screenshots', 'Check bundle diff'],
  testgen:    ['Night Mode test suite', 'Show generated tests', 'Which suites need tests?'],
  firmware:   ['Show all builds', 'Show blockers', 'Nest Hub test status', 'AR-SA firmware status'],
}

function BottomChat({ onSend, loading, lastText, activeTab }) {
  const [input, setInput] = useState('')
  const chips = CHIPS_BY_TAB[activeTab] || []
  const submit = (txt) => {
    const t = (txt || input).trim()
    if (!t || loading) return
    onSend(t)
    setInput('')
  }
  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }
  return (
    <div className="bottom-chat">
      {lastText && (
        <div className="bc-last-msg">
          <div className="bc-mini-avatar">
            <svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 012-2z"/></svg>
          </div>
          <span className="bc-alabel">LocaTest AI</span>
          <span className="bc-preview">{lastText.slice(0, 140)}{lastText.length > 140 ? '…' : ''}</span>
          <div className="bc-history-btn">Full conversation ↑</div>
        </div>
      )}
      <div className="bc-input-row">
        <div className="bc-chips">
          {chips.map(c => (
            <div key={c} className="bc-chip" onClick={() => submit(c)}>
              {c}
            </div>
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
function AgentMsg({ msg, onApprove }) {
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [])
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
    return <div ref={bottomRef}><AgentCard type={msg.card_type} data={msg.data} onApprove={onApprove} /></div>
  }
  return null
}

// ─── Card renderers ────────────────────────────────────────────────────────────
function AgentCard({ type, data, onApprove }) {
  switch (type) {
    case 'test.failures': return <FailuresCard data={data} />
    case 'dashboard.summary': return <DashCard data={data} />
    case 'suite.summary': return <SuiteCard data={data} />
    case 'test.list': case 'test.search': return <TestListCard data={data} />
    case 'locale.coverage': case 'locale.comparison': return <LocaleCard data={data} />
    case 'simulation.result': return <SimCard data={data} />
    case 'rca.report': return <RcaCard data={data} />
    case 'issue.draft': return <IssueCard data={data} onApprove={onApprove} />
    case 'issue.filed': return <FiledCard data={data} />
    case 'hil.queue': return <HilQCard data={data} onApprove={onApprove} />
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

function FailuresCard({ data }) {
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
            <div className="fi-link">View in Simulator <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
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
        <span className="ph-title">Simulation Result — {s.suite}</span>
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

function IssueCard({ data, onApprove }) {
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
        <button className="btn-hil-secondary">View Details</button>
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

function HilQCard({ data, onApprove }) {
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
            <button className="btn-hil-secondary" style={{ color: 'var(--g-red)', borderColor: '#fca5a5' }}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function GenCard({ data }) {
  const tests = data.tests || data.generated || []
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

function WorkspaceTab({ sessionId, userId }) {
  const { messages, loading, send, lastText, setMessages } = useAgent(sessionId, userId)
  const [hilIssue, setHilIssue] = useState(null)
  const feedRef = useRef(null)

  useEffect(() => {
    setMessages(INIT_WORKSPACE)
  }, [])

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [messages])

  const SOURCES = [
    { icon: '📱', name: 'Nest Hub 4.1.0.12-rc3', desc: 'QA Build · Active firmware · Sprint 43', badge: 'Active Build', badgeClass: 'blue', active: true },
    { icon: '🧪', name: 'pt-br-regression-suite.yaml', desc: '1,247 scenarios · Home, Assistant, Settings', badge: 'Loaded', badgeClass: 'green' },
    { icon: '🌍', name: 'locale-configs.json', desc: '10 locales · 18,000 string keys', badge: 'Loaded', badgeClass: 'green' },
    { icon: '📋', name: 'baseline-sprint-42.json', desc: 'Previous passing run · Sprint 42', badge: 'Baseline', badgeClass: 'gray' },
    { icon: '📄', name: 'sprint-43-release-notes.md', desc: 'Changelog · 14 new keys added', badge: 'Context', badgeClass: 'gray' },
  ]

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Sources pane */}
      <aside className="sources-pane">
        <div className="sp-header">
          <span className="sp-title">Build Sources</span>
          <div className="sp-add">
            <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14"/></svg>
            Add
          </div>
        </div>
        <div className="sources-list">
          {SOURCES.map(s => (
            <div key={s.name} className={`source-card${s.active ? ' active' : ''}`}>
              <div className="sc-top">
                <div className="sc-icon" style={{ background: s.active ? '#e8f0fe' : '#f8fafc' }}>{s.icon}</div>
                <div className="sc-body">
                  <div className="sc-name">{s.name}</div>
                  <div className="sc-desc">{s.desc}</div>
                </div>
                <div style={{ fontSize: 16, color: 'var(--text3)', cursor: 'pointer' }}>⋯</div>
              </div>
              <span className={`sc-badge ${s.badgeClass}`}>{s.badge}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 10px 10px' }}>
          <div className="sp-stats">
            <div className="ss-title">Session Stats</div>
            <div className="ss-row"><span className="ss-label">Tests Run</span><span className="ss-val" style={{ color: 'var(--g-blue)' }}>1,089</span></div>
            <div className="ss-row"><span className="ss-label">Passing</span><span className="ss-val" style={{ color: 'var(--g-green)' }}>1,058</span></div>
            <div className="ss-row"><span className="ss-label">Failing</span><span className="ss-val" style={{ color: 'var(--g-red)' }}>31</span></div>
            <div className="ss-row"><span className="ss-label">HIL Required</span><span className="ss-val" style={{ color: 'var(--hil)' }}>3</span></div>
            <div className="ss-row"><span className="ss-label">Remaining</span><span className="ss-val" style={{ color: 'var(--text2)' }}>158</span></div>
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
          <AgentMsg key={i} msg={msg} onApprove={(issue) => setHilIssue(issue)} />
        ))}
      </main>

      {hilIssue && <HilOverlay issue={hilIssue} onClose={() => setHilIssue(null)} />}
    </div>
  )
}

// ─── Simulation Tab ────────────────────────────────────────────────────────────
const SCENARIOS = [
  { id: 'LOC-SIM-001', name: 'PT-BR Regression', locale: 'pt-BR', status: 'fail', hil: true },
  { id: 'LOC-SIM-002', name: 'AR-SA Smoke', locale: 'ar-SA', status: 'pass', dur: '1:12s' },
  { id: 'LOC-RG-11198', name: 'PT-BR Checkout — "Place Order" untranslated', locale: 'pt-BR', status: 'fail', hil: false },
  { id: 'LOC-RG-11199', name: 'Checkout Summary Header — PT-BR', locale: 'pt-BR', status: 'fail', hil: false },
  { id: 'LOC-RG-11200', name: 'Payment Method Label — PT-BR', locale: 'pt-BR', status: 'fail', hil: false },
  { id: 'LOC-SM-04821', name: 'Login Smoke — PT-BR', locale: 'pt-BR', status: 'pass', dur: '0:42s' },
  { id: 'LOC-SM-04822', name: 'Home Screen Greeting — PT-BR', locale: 'pt-BR', status: 'pass', dur: '0:58s' },
  { id: 'LOC-SM-04823', name: 'Assistant UI — PT-BR', locale: 'pt-BR', status: 'pass', dur: '1:05s' },
  { id: 'LOC-NT-11201', name: 'Thermostat RTL Layout — AR-SA', locale: 'ar-SA', status: 'fail', hil: true },
  { id: 'LOC-RG-11204', name: 'RTL Layout — AR-SA Regression', locale: 'ar-SA', status: 'queued' },
]

function SimulationTab({ sessionId, userId }) {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')
  const { messages, loading, send, lastText } = useAgent(sessionId, userId)
  const [hilOpen, setHilOpen] = useState(false)

  const filtered = filter === 'All' ? SCENARIOS : filter === 'Pass' ? SCENARIOS.filter(s => s.status === 'pass') : filter === 'Fail' ? SCENARIOS.filter(s => s.status === 'fail') : SCENARIOS.filter(s => s.hil)

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left: scenario list */}
      <div className="sim-left">
        <div className="run-controls">
          <div className="rc-buttons">
            <button className="rc-btn secondary"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Run All</button>
            <button className="rc-btn secondary"><svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>Pause</button>
            <button className="rc-btn primary"><svg viewBox="0 0 24 24" style={{ fill: 'white' }}><path d="M19 13H5v-2h14v2z"/></svg>Stop</button>
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
            <div key={sc.id} className={`sc-item${selected?.id === sc.id ? ' active' : ''}`} onClick={() => { setSelected(sc); send(`Analyze scenario ${sc.id}: ${sc.name}`) }}>
              <div className={`sc-status-icon ${sc.status === 'pass' ? 'sci-pass' : sc.status === 'fail' ? 'sci-fail' : sc.hil ? 'sci-hil' : 'sci-queued'}`}>
                {sc.status === 'pass' ? '✓' : sc.status === 'fail' ? '✗' : sc.status === 'queued' ? '●●●' : '!'}
              </div>
              <div className="sc-body">
                <div className="sci-id">{sc.id}</div>
                <div className="sci-name">{sc.name}</div>
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

      {/* Right: detail */}
      <div className="sim-right">
        {selected ? (
          <>
            <div className="sr-header">
              <div>
                <div className="srh-id">{selected.id} · Regression · Home Screen Module</div>
                <div className="srh-title">{selected.name}</div>
                <div className="srh-badges">
                  {selected.status === 'fail' && <span className="srh-badge srhb-red">Critical Failure</span>}
                  <span className="srh-badge srhb-blue">{selected.locale}</span>
                  <span className="srh-badge srhb-gray">Regression</span>
                  {selected.hil && <span className="srh-badge srhb-hil">⏸ Awaiting HIL Decision</span>}
                </div>
              </div>
              <div className="srh-actions">
                <button className="btn-sm btn-outline">← Prev</button>
                <button className="btn-sm btn-outline">Next →</button>
                <button className="btn-sm btn-agent">Generate RCA →</button>
              </div>
            </div>

            <div className="debug-tabs">
              <div className="dt-tab active">Execution Steps <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--g-red)', marginLeft: 5, marginBottom: 1 }} /></div>
              <div className="dt-tab">Debug Inspector</div>
              <div className="dt-tab">Screenshots</div>
              <div className="dt-tab">Agent Reasoning</div>
            </div>

            <div className="sim-body">
              {/* Execution timeline */}
              <div className="exec-timeline">
                <div className="etl-title">Test Execution</div>
                {[
                  { n: 1, action: 'Navigate to Home Screen', result: 'Loaded in PT-BR locale (lang="pt-BR")', status: 'pass' },
                  { n: 2, action: 'Verify greeting string', result: '✗ Found: "Good morning" — Expected: "Bom dia"', status: 'fail' },
                  { n: 3, action: 'Verify weather label', result: '✗ Found: "Cloudy" — Expected: "Nublado"', status: 'fail' },
                  { n: 4, action: 'Verify date/time format', result: '⏭ Skipped — upstream failure', status: 'skip' },
                ].map((s, i, arr) => (
                  <div key={s.n} className="step-item" style={{ position: 'relative' }}>
                    {i < arr.length - 1 && <div style={{ position: 'absolute', left: 13, top: 26, bottom: -12, width: 2, background: s.status === 'pass' ? '#d1fae5' : s.status === 'fail' ? '#fecaca' : 'var(--border2)', zIndex: 0 }} />}
                    <div className={`step-num sn-${s.status}`} style={{ zIndex: 1 }}>{s.n}</div>
                    <div className="step-body">
                      <div className="step-action">{s.action}</div>
                      <div className={`step-result${s.status !== 'skip' ? ` ${s.status}` : ''}`} style={s.status === 'skip' ? { color: 'var(--text3)' } : {}}>{s.result}</div>
                      {s.status === 'fail' && (
                        <div className="step-screenshot">
                          <span className="ss-img-label">📸 Screenshot at failure point</span>
                          <div style={{ background: '#1a1a2e', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 8 }}>
                            <div style={{ background: 'rgba(30,41,59,.8)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 4, padding: '3px 12px', fontFamily: 'monospace', fontSize: 10, color: '#94a3b8' }}>
                              [ "Good morning" ] &lt;en-US fallback&gt;
                            </div>
                            <div style={{ position: 'absolute', top: 6, right: 8, background: 'rgba(234,67,53,.85)', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace' }}>TRANSLATION MISSING</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Debug inspector */}
              <div className="debug-inspector">
                <div className="di-section">
                  <div className="dis-header">
                    <span className="dis-title">String Bundle Inspector</span>
                    <span className="dis-badge error">2 keys missing</span>
                  </div>
                  <div style={{ background: '#1a1a2e', padding: '12px 14px', fontFamily: 'Roboto Mono' }}>
                    <div className="kv-row"><span className="kv-key">locale</span><span className="kv-val ok">"pt-BR"</span></div>
                    <div className="kv-row"><span className="kv-key">bundle_version</span><span className="kv-val ok">"4.1.0.12-sprint43"</span></div>
                    <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '8px 0' }} />
                    <div className="kv-row"><span className="kv-key">hs_weather_label</span><span className="kv-val ok">"Nublado" ✓</span></div>
                    <div className="kv-row"><span className="kv-key">hs_greeting_morning</span><span className="kv-val missing">KEY NOT FOUND ✗</span></div>
                    <div className="kv-row" style={{ marginLeft: 16 }}><span className="kv-key" style={{ color: '#f59e0b' }}>en-US fallback</span><span className="kv-val" style={{ color: '#fcd34d' }}>"Good morning"</span></div>
                  </div>
                </div>
                <div className="di-section">
                  <div className="dis-header">
                    <span className="dis-title">Agent Confidence</span>
                    <span className="dis-badge ok">High</span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    {[['Root cause certainty', 97, 'var(--g-green)'], ['Fix proposal accuracy', 94, 'var(--g-blue)']].map(([k, v, c]) => (
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
                {messages.map((msg, i) => <AgentMsg key={i} msg={msg} onApprove={() => {}} />)}
              </div>
            </div>

            {/* HIL Intervention */}
            {selected.hil && (
              <div className="hil-intervention">
                <div className="hi-top">
                  <div className="hi-icon"><svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V9h2v3z"/></svg></div>
                  <span className="hi-title">Agent Decision Point — Your Input Required</span>
                  <div className="hi-badge">HIL</div>
                </div>
                <p className="hi-sub">Agent has identified a <strong>blocker failure</strong> with 97% certainty. The PT-BR string key is missing from the Sprint 43 bundle. Please choose how to proceed.</p>
                <div className="hi-options">
                  {[['🐛', 'Mark as Bug', 'File to Buganizer with full RCA and proposed fix'], ['🔄', 'Retry with Patch', 'Inject the missing key and re-run to confirm fix'], ['✅', 'Override — Pass', 'Mark as known issue, continue with next scenario']].map(([icon, title, desc]) => (
                    <div key={title} className="hi-option" onClick={() => title === 'Mark as Bug' && setHilOpen(true)}>
                      <div className="hio-icon">{icon}</div>
                      <div className="hio-title">{title}</div>
                      <div className="hio-desc">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ask agent bar */}
            <div className="ask-bar">
              <div className="ask-avatar"><svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 012-2z" fill="white"/></svg></div>
              <input className="ask-input" type="text" placeholder={`Ask agent about ${selected.id}… e.g. "Are other locales affected?"`}
                onKeyDown={e => { if (e.key === 'Enter') { send(e.target.value); e.target.value = '' } }} />
              <button className="ask-send" onClick={e => { const inp = e.target.previousElementSibling; send(inp.value); inp.value = '' }}>Ask Agent</button>
            </div>
          </>
        ) : (
          <div className="empty-state"><div className="empty-icon">⚡</div><div className="empty-title">Select a scenario</div></div>
        )}
      </div>
      {hilOpen && <HilOverlay issue={{ id: 'b/337821049', title: `${selected.name} — Localization Failure`, severity: 'S2', component: 'Nest>Firmware>Localization>HomeScreen', test_case_ids: ['LOC-NH-11198', 'LOC-NH-11199'], description: 'Untranslated strings in PT-BR locale detected on Nest Hub Home Screen during Sprint 43 regression.' }} onClose={() => setHilOpen(false)} />}
    </div>
  )
}

// ─── RCA & Issues Tab ──────────────────────────────────────────────────────────
const BUGANIZER_ISSUES = [
  { id: 'b/337821049', title: '[PT-BR][P0] Home Screen greeting strings untranslated on Nest Hub firmware 4.1.0.12-rc3', severity: 'S2', component: 'Nest>Firmware>Localization>HomeScreen', status: 'DRAFT', approved: false, test_case_ids: ['LOC-NH-11198', 'LOC-NH-11199', 'LOC-NH-11200'], description: 'Untranslated greeting, weather, and calendar strings detected on PT-BR Nest Hub.' },
  { id: 'b/337821050', title: '[AR-SA][P0] Temperature label RTL overflow on Nest Thermostat 6.4.0.3-rc1', severity: 'S2', component: 'Nest>Firmware>Localization>ThermostatUI', status: 'DRAFT', approved: false, test_case_ids: ['LOC-NT-11201', 'LOC-NT-11202'], description: 'RTL layout engine not applied to temperature component.' },
]

function RcaTab({ sessionId, userId }) {
  const { messages, loading, send, lastText } = useAgent(sessionId, userId)
  const [selectedIssue, setSelectedIssue] = useState(BUGANIZER_ISSUES[0])
  const [hilIssue, setHilIssue] = useState(null)
  const [severity, setSeverity] = useState('S2')

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left: RCA report */}
      <div className="rca-left">
        {/* RCA Reports panel heading */}
        <div style={{ padding: '12px 20px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Google Sans', fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>RCA Reports</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>Report ID: <code style={{ fontSize: 11 }}>RCA-2026-043-001</code> · Sprint 43 · PT-BR Regression</div>
        </div>
        {/* RCA header */}
        <div className="rca-header">
          <div className="rca-avatar">
            <svg viewBox="0 0 24 24"><path d="M9.5 2A1.5 1.5 0 008 3.5v1A1.5 1.5 0 009.5 6h5A1.5 1.5 0 0016 4.5v-1A1.5 1.5 0 0014.5 2h-5zM6 5a3 3 0 00-3 3v9a3 3 0 003 3h12a3 3 0 003-3V8a3 3 0 00-3-3h-.5A2.5 2.5 0 0115 7.5h-6A2.5 2.5 0 016.5 5H6z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="rcah-label">Agent Root Cause Analysis · Complete</div>
            <div className="rcah-title">PT-BR Nest Hub Home Screen — Sprint 43 String Keys</div>
            <div className="rcah-meta">
              <span className="rcah-badge" style={{ background: '#d1fae5', color: '#065f46' }}>97% Confidence</span>
              <span className="rcah-badge" style={{ background: 'var(--hil-l)', color: '#92400e' }}>Pending Approval</span>
              <span className="rcah-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>P0 Release Blocker</span>
            </div>
          </div>
          <div className="rcah-actions">
            <button className="btn-sm btn-outline">← Back</button>
            <button className="btn-sm btn-agent">File Issue →</button>
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
            <p className="rca-narrative">
              Release branch <code>l10n-sprint43</code> is missing the PT-BR string bundle update. Strings <code>hs_greeting_morning</code>, <code>hs_greeting_afternoon</code>, <code>hs_weather_label</code>, and <code>hs_calendar_today</code> were added to <code>en-US.strings</code> in Sprint 43 but were <strong>not propagated to the PT-BR bundle</strong> <code>pt-BR.strings</code>. The app correctly detects the missing keys and falls back to the English locale — resulting in untranslated UI on all PT-BR Nest Hub devices.
            </p>
          </div>
        </div>

        {/* String bundle diff */}
        <div className="rca-section">
          <div className="rca-sec-header">
            <div className="rsh-icon" style={{ background: 'var(--g-blue)' }}><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg></div>
            <span className="rsh-title">String Bundle Diff</span>
            <span className="rsh-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>4 keys missing</span>
          </div>
          <div className="rca-sec-body">
            <div className="evidence-grid">
              <div className="ev-card">
                <div className="ev-title">en-US.strings (Sprint 43)</div>
                <div className="ev-code">
                  <div className="ev-ok">hs_greeting_morning = "Good morning"</div>
                  <div className="ev-ok">hs_greeting_afternoon = "Good afternoon"</div>
                  <div className="ev-ok">hs_weather_label = "Weather"</div>
                  <div className="ev-ok">hs_calendar_today = "Today"</div>
                </div>
              </div>
              <div className="ev-card">
                <div className="ev-title">pt-BR.strings (Sprint 43)</div>
                <div className="ev-code">
                  <div className="ev-missing">hs_greeting_morning = ∅ MISSING</div>
                  <div className="ev-missing">hs_greeting_afternoon = ∅ MISSING</div>
                  <div className="ev-missing">hs_weather_label = ∅ MISSING</div>
                  <div className="ev-missing">hs_calendar_today = ∅ MISSING</div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="diff-header">
                <span className="diff-filename">pt-BR.strings</span>
                <span style={{ fontSize: 11, background: 'rgba(52,168,83,.2)', color: '#81c995', padding: '1px 8px', borderRadius: 8, fontWeight: 600 }}>Proposed Fix</span>
              </div>
              <div className="diff-body">
                <div className="diff-line ctx"><span className="dl-gutter ctx" /><span className="dl-code ctx">// Home Screen - Sprint 43 additions</span></div>
                <div className="diff-line add"><span className="dl-gutter add">+</span><span className="dl-code add">hs_greeting_morning = "Bom dia";</span></div>
                <div className="diff-line add"><span className="dl-gutter add">+</span><span className="dl-code add">hs_greeting_afternoon = "Boa tarde";</span></div>
                <div className="diff-line add"><span className="dl-gutter add">+</span><span className="dl-code add">hs_weather_label = "Tempo";</span></div>
                <div className="diff-line add"><span className="dl-gutter add">+</span><span className="dl-code add">hs_calendar_today = "Hoje";</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual evidence */}
        <div className="rca-section">
          <div className="rca-sec-header">
            <div className="rsh-icon" style={{ background: 'var(--agent)' }}><svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>
            <span className="rsh-title">Visual Evidence — Untranslated Strings Captured on Device</span>
          </div>
          <div className="rca-sec-body">
            <div style={{ display: 'flex', gap: 12 }}>
              {[['Greeting', 'Good morning', 'Bom dia'], ['Weather', 'Weather', 'Tempo'], ['Calendar', 'Today', 'Hoje']].map(([label, wrong, right]) => (
                <div key={label} style={{ flex: 1, background: '#1a1a2e', borderRadius: 10, overflow: 'hidden', border: '1px solid #3c3c5c' }}>
                  <div style={{ background: '#303134', padding: '4px 10px', fontSize: 10, color: '#9aa0a6', fontFamily: 'Roboto Mono' }}>Nest Hub · pt-BR · {label}</div>
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ background: 'rgba(30,30,50,.8)', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontFamily: 'Roboto Mono' }}>
                      <div style={{ color: '#f28b82', fontSize: 9, marginBottom: 2 }}>ACTUAL (untranslated)</div>
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
            <span className="rsh-badge" style={{ background: 'var(--hil-l)', color: '#92400e' }}>3 Locales Affected</span>
          </div>
          <div className="rca-sec-body" style={{ padding: 0 }}>
            <table className="impact-table">
              <thead><tr><th>Test ID</th><th>Description</th><th>Severity</th><th>Device</th></tr></thead>
              <tbody>
                {[['LOC-NH-11198', 'Greeting string untranslated', 'P0', 'Nest Hub'], ['LOC-NH-11199', 'Weather label untranslated', 'P0', 'Nest Hub'], ['LOC-NH-11200', 'Calendar "Today" untranslated', 'P1', 'Nest Hub']].map(([id, desc, sev, dev]) => (
                  <tr key={id}>
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

        {/* Agent messages */}
        {messages.map((msg, i) => <AgentMsg key={i} msg={msg} onApprove={() => {}} />)}
      </div>

      {/* Right: Issue filing panel */}
      <div className="rca-right">
        <div className="issue-panel-header">
          Issue Filing — Buganizer
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Auto-populated by Agent</span>
        </div>
        <div className="issue-form">
          <div className="form-field"><label>Title</label><input defaultValue="[PT-BR][P0] Home Screen greeting strings untranslated on Nest Hub 4.1.0.12-rc3" /></div>
          <div className="form-field">
            <label>Severity</label>
            <div className="sev-pills">
              {['S0', 'S1', 'S2', 'S3'].map((s, i) => (
                <div key={s} className={`sev-pill${severity === s ? ` active s${i}` : ''}`} onClick={() => setSeverity(s)}>{s}</div>
              ))}
            </div>
          </div>
          <div className="form-field"><label>Component</label><input defaultValue="Nest > Firmware > Localization > HomeScreen" /></div>
          <div className="form-field"><label>Assignee</label><input defaultValue="l10n-team@google.com" /></div>
          <div className="form-field">
            <label>Affected Test Cases</label>
            {selectedIssue.test_case_ids.map(id => (
              <div key={id} style={{ fontFamily: 'Roboto Mono', fontSize: 12, color: 'var(--g-red)', padding: '2px 0' }}>• {id}</div>
            ))}
          </div>
          <div className="form-field"><label>Developer Comments</label><textarea rows={3} defaultValue="Root cause confirmed: Sprint 43 PT-BR bundle missing 4 keys. Fix: apply proposed diff to pt-BR.strings and rebuild." /></div>
          {messages.filter(m => m.type === 'agent').slice(-1).map((msg, i) => (
            <div key={i} style={{ background: 'var(--agent-ll)', borderRadius: 8, padding: 10, fontSize: 13, color: 'var(--dark2)', border: '1px solid rgba(109,40,217,.1)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--agent)', marginBottom: 4 }}>AGENT RECOMMENDATION</div>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="confirm-panel">
          <div className="confirm-checklist">
            {['RCA complete — 97% confidence', 'Root cause: 4 missing PT-BR string keys', 'Fix diff attached and reviewed', 'Affected test cases linked (3)'].map(item => (
              <div key={item} className="check-row">
                <svg viewBox="0 0 24 24" width={16} height={16} style={{ fill: 'none', stroke: 'var(--g-green)', strokeWidth: 2 }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="var(--g-green)" stroke="none"/></svg>
                {item}
              </div>
            ))}
          </div>
          <button className="btn-file-issue" onClick={() => setHilIssue(selectedIssue)}>
            🐛 Approve &amp; File Issue in Buganizer →
          </button>
        </div>
      </div>

      {hilIssue && <HilOverlay issue={hilIssue} onClose={() => setHilIssue(null)} />}
    </div>
  )
}

// ─── Test Generation Tab ───────────────────────────────────────────────────────
function TestGenTab({ sessionId, userId }) {
  const { messages, loading, send, lastText } = useAgent(sessionId, userId)
  const [form, setForm] = useState({ feature: '', device: 'Nest Hub', suite: 'Home Screen & Ambient Display', locales: 'all', priority: 'P1', description: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const generate = () => {
    if (!form.feature.trim()) return
    send(`Generate test cases for "${form.feature}" on ${form.device}, suite: ${form.suite}, locales: ${form.locales}, priority: ${form.priority}. ${form.description}`)
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div className="testgen-form">
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
      </div>
      <div className="testgen-results">
        <div className="tg-result-header">Generated Tests</div>
        <div className="tg-result-body">
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>✨</div>
              <div style={{ fontFamily: 'Google Sans', fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>AI-Powered Test Generation</div>
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>Fill in the feature details and click Generate. The agent will create localisation test cases for all selected locales, including string key verification, RTL layout checks, and device-specific UI assertions.</div>
            </div>
          ) : messages.map((msg, i) => <AgentMsg key={i} msg={msg} onApprove={() => {}} />)}
        </div>
      </div>
    </div>
  )
}

// ─── Firmware Builds Tab ───────────────────────────────────────────────────────
const FW_BUILDS = [
  { id: 'FW-001', device: 'Nest Hub', version: '4.1.0.12-rc3', status: 'in_qa', locales: 10, passRate: '88%', blocker: true },
  { id: 'FW-002', device: 'Nest Thermostat', version: '6.4.0.3-rc1', status: 'in_qa', locales: 10, passRate: '91%', blocker: true },
  { id: 'FW-003', device: 'Nest Hub Max', version: '4.1.0.11-rc2', status: 'stable', locales: 10, passRate: '96%', blocker: false },
  { id: 'FW-004', device: 'Nest Mini', version: '3.2.1.8-rc1', status: 'in_qa', locales: 8, passRate: '94%', blocker: false },
  { id: 'FW-005', device: 'Nest Cam', version: '2.7.0.5-rc2', status: 'released', locales: 10, passRate: '99%', blocker: false },
]

function FirmwareTab({ sessionId, userId }) {
  const [selected, setSelected] = useState(FW_BUILDS[0])
  const { messages, loading, send, lastText } = useAgent(sessionId, userId)

  const statusStyle = s => ({
    in_qa: { bg: 'var(--g-blue-ll)', color: '#1557b0' },
    stable: { bg: '#d1fae5', color: '#065f46' },
    released: { bg: '#d1fae5', color: '#065f46' },
  }[s] || { bg: '#f1f3f4', color: 'var(--text2)' })

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div className="fw-left">
        <div className="fw-panel-title">Firmware Builds</div>
        {FW_BUILDS.map(fw => {
          const ss = statusStyle(fw.status)
          return (
            <div key={fw.id} className={`fw-item${selected?.id === fw.id ? ' active' : ''}`} onClick={() => { setSelected(fw); send(`Tell me about ${fw.device} firmware ${fw.version}`) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                <span className="fw-device">{fw.device}</span>
                {fw.blocker && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: '#fee2e2', color: '#991b1b' }}>Blocker</span>}
              </div>
              <div className="fw-version">{fw.version}</div>
              <div className="fw-badges">
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: ss.bg, color: ss.color }}>{fw.status.replace('_', ' ')}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{fw.passRate} pass</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="fw-right">
        {selected ? (
          <>
            <div className="fw-detail-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="fw-detail-title">{selected.device} — {selected.version}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {selected.blocker && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 14, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>Release Blocker</span>}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 14, background: statusStyle(selected.status).bg, color: statusStyle(selected.status).color }}>{selected.status.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="fw-stats-row" style={{ marginTop: 12 }}>
                {[['Locales Tested', selected.locales], ['Pass Rate', selected.passRate], ['Sprint', 'Sprint 43']].map(([k, v]) => (
                  <div key={k} className="fw-stat">
                    <div className="fw-stat-val">{v}</div>
                    <div className="fw-stat-label">{k}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="agent-feed" style={{ padding: '16px 20px' }}>
              {messages.length === 0 && (
                <div className="agent-banner">
                  <div className="agent-avatar"><svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 012-2z"/></svg></div>
                  <div>
                    <div className="at-label">LocaTest Agent</div>
                    <div className="at-text">Select a build or ask about firmware QA status<span className="cursor" /></div>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => <AgentMsg key={i} msg={msg} onApprove={() => {}} />)}
            </div>
            <div className="ask-bar">
              <div className="ask-avatar"><svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 012-2z" fill="white"/></svg></div>
              <input className="ask-input" type="text" placeholder={`Ask about ${selected.device} ${selected.version}…`}
                onKeyDown={e => { if (e.key === 'Enter') { send(e.target.value); e.target.value = '' } }} />
              <button className="ask-send" onClick={e => { const inp = e.target.previousElementSibling; send(inp.value); inp.value = '' }}>Ask Agent</button>
            </div>
          </>
        ) : (
          <div className="empty-state"><div className="empty-icon">📱</div><div className="empty-title">Select a firmware build</div></div>
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
  const sessionId = useRef(Math.random().toString(36).slice(2)).current
  const userId = 'default_user'

  // Shared agent for bottom chat bar
  const sharedAgent = useAgent(sessionId, userId)

  const tabProps = { sessionId, userId }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <SessionBar activeTab={tab} onTabChange={setTab} />
      <TabNav active={tab} onChange={setTab} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {tab === 'workspace'  && <WorkspaceTab {...tabProps} />}
          {tab === 'simulation' && <SimulationTab {...tabProps} />}
          {tab === 'rca'        && <RcaTab {...tabProps} />}
          {tab === 'testgen'    && <TestGenTab {...tabProps} />}
          {tab === 'firmware'   && <FirmwareTab {...tabProps} />}
        </div>
        {/* Global bottom chat always visible */}
        <BottomChat onSend={sharedAgent.send} loading={sharedAgent.loading} lastText={sharedAgent.lastText} activeTab={tab} />
      </div>
      <Footer />
    </div>
  )
}
