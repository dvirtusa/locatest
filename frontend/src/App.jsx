import React, { useState, useEffect, useRef, useCallback } from 'react'

// ─── colour tokens ────────────────────────────────────────────────────────────
const GOOGLE_BLUE   = '#1a73e8'
const GOOGLE_RED    = '#ea4335'
const GOOGLE_YELLOW = '#fbbc04'
const GOOGLE_GREEN  = '#34a853'

// ─── Utility ──────────────────────────────────────────────────────────────────
function statusColor(s = '') {
  const v = s.toLowerCase()
  if (v === 'pass' || v === 'stable' || v === 'released') return GOOGLE_GREEN
  if (v === 'fail' || v === 'critical' || v === 'failed') return GOOGLE_RED
  if (v === 'warning' || v === 'in_progress' || v === 'in progress') return GOOGLE_YELLOW
  if (v === 'in_qa' || v === 'in qa') return GOOGLE_BLUE
  return '#5f6368'
}

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '.3px',
      background: color + '22',
      color,
      border: `1px solid ${color}44`,
    }}>{label}</span>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <header style={{
      height: 64,
      background: '#fff',
      borderBottom: '1px solid #e8eaed',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 12,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,.08)',
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24">
        <path fill="#EA4335" d="M12 5.08L6 18h2.42l1.08-3h5l1.08 3H18z M10.08 13l1.92-5.33L13.92 13z"/>
      </svg>
      <span style={{ fontFamily: 'Google Sans', fontWeight: 600, fontSize: 18, color: '#202124' }}>
        Loca<span style={{ color: GOOGLE_BLUE }}>Test</span>
      </span>
      <span style={{ color: '#dadce0', margin: '0 4px' }}>|</span>
      <span style={{ fontFamily: 'Google Sans', color: '#5f6368', fontSize: 14 }}>Internal</span>
      <div style={{ flex: 1 }} />
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: GOOGLE_BLUE, fontWeight: 700, fontSize: 14, fontFamily: 'Google Sans',
      }}>QA</div>
    </header>
  )
}

// ─── Sprint bar ───────────────────────────────────────────────────────────────
function SprintBar({ onTabChange }) {
  const pills = [
    { label: 'Workspace', tab: 'workspace' },
    { label: 'Simulation', tab: 'simulation' },
    { label: 'RCA & Issues', tab: 'rca' },
    { label: 'Test Generation', tab: 'testgen' },
    { label: 'Firmware Builds', tab: 'firmware' },
  ]
  return (
    <div style={{
      background: '#202124',
      color: '#e8eaed',
      padding: '8px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: 'Roboto Mono', fontSize: 12, color: '#9aa0a6', marginRight: 8 }}>
        Sprint 43 · Active
      </span>
      {pills.map(p => (
        <button key={p.tab}
          onClick={() => onTabChange(p.tab)}
          style={{
            background: 'transparent', border: '1px solid #5f6368',
            borderRadius: 16, padding: '3px 12px',
            color: '#e8eaed', fontSize: 12, cursor: 'pointer',
            fontFamily: 'Google Sans',
          }}>
          {p.label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <span style={{
        background: '#fbbc0420', border: '1px solid #fbbc0444',
        borderRadius: 12, padding: '2px 10px',
        color: GOOGLE_YELLOW, fontSize: 12, fontWeight: 600,
      }}>⚠ 2 Release Blockers</span>
      <span style={{ fontSize: 12, color: '#9aa0a6' }}>89 new failures</span>
    </div>
  )
}

// ─── Tab nav ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'workspace',   label: 'Workspace' },
  { id: 'simulation',  label: 'Simulation' },
  { id: 'rca',         label: 'RCA & Issues' },
  { id: 'testgen',     label: 'Test Generation' },
  { id: 'firmware',    label: 'Firmware Builds' },
]

function TabNav({ active, onChange }) {
  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e8eaed',
      display: 'flex',
      padding: '0 24px',
      gap: 0,
    }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{
            background: 'none', border: 'none', padding: '14px 20px',
            cursor: 'pointer', fontSize: 14, fontFamily: 'Google Sans',
            fontWeight: active === t.id ? 600 : 400,
            color: active === t.id ? GOOGLE_BLUE : '#5f6368',
            borderBottom: active === t.id ? `2px solid ${GOOGLE_BLUE}` : '2px solid transparent',
            transition: 'all .15s',
          }}>
          {t.label}
        </button>
      ))}
    </nav>
  )
}

// ─── Card renderers ───────────────────────────────────────────────────────────
function DashboardCard({ data }) {
  const m = data.metrics || data
  const rows = [
    ['Total Test Cases', m.total_tests ?? m.total],
    ['Pass Rate', m.pass_rate],
    ['Failing', m.failing_tests ?? m.failing],
    ['Automation Coverage', m.automation_coverage],
    ['Release Blockers', m.release_blockers],
    ['Active Sprint', m.active_sprint],
    ['Firmware Builds in QA', m.firmware_builds_in_qa],
  ].filter(([, v]) => v !== undefined)
  return (
    <div className="card">
      <div className="card-title">Dashboard Summary</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ background: '#f8f9fa', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: '#5f6368', marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#202124', fontFamily: 'Google Sans' }}>{String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SuiteSummaryCard({ data }) {
  const s = data.suite || data
  return (
    <div className="card">
      <div className="card-title">Suite: {s.name}</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        {[['Total', s.total], ['Pass', s.pass], ['Fail', s.fail], ['Coverage', s.automation_coverage]].map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#202124' }}>{v}</div>
            <div style={{ fontSize: 11, color: '#5f6368' }}>{k}</div>
          </div>
        ))}
      </div>
      {s.top_failures?.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#5f6368', marginBottom: 6 }}>Top failures</div>
          {s.top_failures.map(f => (
            <div key={f.id} style={{ borderLeft: `3px solid ${GOOGLE_RED}`, paddingLeft: 10, marginBottom: 6, fontSize: 13 }}>
              <span style={{ fontFamily: 'Roboto Mono', color: GOOGLE_BLUE }}>{f.id}</span>
              {' — '}{f.name}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function TestListCard({ data }) {
  const cases = data.cases || []
  return (
    <div className="card">
      <div className="card-title">Test Cases ({data.count ?? cases.length})</div>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              {['ID', 'Name', 'Status', 'Priority', 'Locale'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#5f6368', fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cases.map(tc => (
              <tr key={tc.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                <td style={{ padding: '6px 10px', fontFamily: 'Roboto Mono', color: GOOGLE_BLUE, fontSize: 12 }}>{tc.id}</td>
                <td style={{ padding: '6px 10px' }}>{tc.name}</td>
                <td style={{ padding: '6px 10px' }}>
                  <Badge label={tc.status} color={statusColor(tc.status)} />
                </td>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{tc.priority}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'Roboto Mono', fontSize: 12 }}>{tc.locale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FailuresCard({ data }) {
  const failures = data.failures || []
  return (
    <div className="card">
      <div className="card-title" style={{ color: GOOGLE_RED }}>
        ⚠ Failing Tests ({data.count ?? failures.length})
      </div>
      {failures.map(f => (
        <div key={f.id} style={{
          border: '1px solid #fce8e6', borderRadius: 8, padding: 12,
          marginBottom: 8, background: '#fff8f8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'Roboto Mono', color: GOOGLE_BLUE, fontSize: 13 }}>{f.id}</span>
            <Badge label={f.priority} color={GOOGLE_RED} />
            <span style={{ fontSize: 12, color: '#5f6368' }}>{f.locale} · {f.device}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{f.name}</div>
          {f.expected && (
            <div style={{ fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><span style={{ color: '#5f6368' }}>Expected: </span><span style={{ color: GOOGLE_GREEN }}>{f.expected}</span></div>
              <div><span style={{ color: '#5f6368' }}>Actual: </span><span style={{ color: GOOGLE_RED }}>{f.actual}</span></div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function LocaleCoverageCard({ data }) {
  const locales = data.locales || (data.locale ? [data] : [])
  return (
    <div className="card">
      <div className="card-title">Locale Coverage</div>
      {locales.map(l => (
        <div key={l.code} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
            <span style={{ fontWeight: 600 }}>{l.code} — {l.name}</span>
            <span style={{ color: statusColor(l.trend) }}>{l.health_score}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: '#e8eaed', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, width: `${l.health_score}%`, background: l.health_score >= 90 ? GOOGLE_GREEN : l.health_score >= 75 ? GOOGLE_YELLOW : GOOGLE_RED }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function SimulationCard({ data }) {
  const sim = data.simulation || data
  const sc = sim.status_color || (sim.status?.toLowerCase() === 'complete' ? 'green' : 'blue')
  return (
    <div className="card">
      <div className="card-title">Simulation Result</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {[['Scenario', sim.scenario_type], ['Locale', sim.locale], ['Suite', sim.suite]].map(([k, v]) => (
          <div key={k}><span style={{ color: '#5f6368', fontSize: 12 }}>{k}: </span><strong>{v}</strong></div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
        {[['Executed', sim.executed], ['Passed', sim.passed], ['Failed', sim.failed]].map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: k === 'Failed' ? GOOGLE_RED : k === 'Passed' ? GOOGLE_GREEN : '#202124' }}>{v}</div>
            <div style={{ fontSize: 11, color: '#5f6368' }}>{k}</div>
          </div>
        ))}
      </div>
      {sim.hil_required && (
        <div style={{ background: '#e8f0fe', borderRadius: 8, padding: 10, fontSize: 13, color: GOOGLE_BLUE }}>
          ✋ Human-in-the-Loop approval required before filing issues
        </div>
      )}
    </div>
  )
}

function RcaCard({ data }) {
  const r = data.report || data
  return (
    <div className="card">
      <div className="card-title">RCA Report — {r.id}</div>
      <div style={{ marginBottom: 10, fontSize: 13 }}>
        <Badge label={r.status?.replace('_', ' ')} color={r.status === 'pending_approval' ? GOOGLE_YELLOW : GOOGLE_GREEN} />
        <span style={{ marginLeft: 8, color: '#5f6368' }}>Confidence: {r.confidence_score}</span>
      </div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{r.title}</div>
      <div style={{ fontSize: 13, color: '#3c4043', marginBottom: 10 }}>{r.root_cause}</div>
      {r.affected_tests?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#5f6368', marginBottom: 4 }}>Affected tests</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {r.affected_tests.map(id => (
              <span key={id} style={{ fontFamily: 'Roboto Mono', fontSize: 12, background: '#e8f0fe', color: GOOGLE_BLUE, padding: '2px 8px', borderRadius: 10 }}>{id}</span>
            ))}
          </div>
        </div>
      )}
      {r.screenshots?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: '#5f6368', marginBottom: 6 }}>Evidence</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {r.screenshots.map((s, i) => (
              <div key={i} style={{
                width: 120, height: 80, borderRadius: 8, background: '#1a1a2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden', border: '1px solid #dadce0',
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                  <div style={{ color: GOOGLE_RED, fontSize: 9, fontFamily: 'Roboto Mono', textAlign: 'center' }}>[Untranslated]</div>
                  <div style={{ color: '#9aa0a6', fontSize: 8, marginTop: 4 }}>{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function IssueDraftCard({ data, onApprove }) {
  const issue = data.issue || data
  return (
    <div className="card" style={{ borderLeft: `3px solid ${GOOGLE_YELLOW}` }}>
      <div className="card-title">Buganizer Issue Draft</div>
      <div style={{ marginBottom: 8 }}>
        <Badge label={issue.status || 'DRAFT'} color={GOOGLE_YELLOW} />
        {issue.id && <span style={{ marginLeft: 8, fontFamily: 'Roboto Mono', color: GOOGLE_BLUE }}>{issue.id}</span>}
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{issue.title}</div>
      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#5f6368', marginBottom: 10 }}>
        <span>Severity: <strong>{issue.severity}</strong></span>
        <span>Component: {issue.component}</span>
      </div>
      {issue.description && (
        <div style={{ fontSize: 13, color: '#3c4043', marginBottom: 10, background: '#f8f9fa', padding: 10, borderRadius: 6 }}>
          {issue.description}
        </div>
      )}
      {!issue.approved && (
        <button onClick={() => onApprove && onApprove(issue.id)}
          style={{ background: GOOGLE_BLUE, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Google Sans', fontWeight: 600 }}>
          Review &amp; Approve
        </button>
      )}
    </div>
  )
}

function IssueFiled({ data }) {
  return (
    <div className="card" style={{ borderLeft: `3px solid ${GOOGLE_GREEN}` }}>
      <div className="card-title" style={{ color: GOOGLE_GREEN }}>✓ Issue Filed</div>
      <div style={{ fontFamily: 'Roboto Mono', color: GOOGLE_BLUE, fontSize: 14, marginBottom: 4 }}>{data.id || data.issue?.id}</div>
      <div style={{ fontSize: 13, color: '#3c4043' }}>{data.message || 'Issue successfully filed in Buganizer.'}</div>
    </div>
  )
}

function HilQueueCard({ data, onApprove }) {
  const pending = data.pending || []
  return (
    <div className="card">
      <div className="card-title">HIL Approval Queue ({pending.length})</div>
      {pending.map(item => (
        <div key={item.issue_id} style={{ border: '1px solid #e8eaed', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Roboto Mono', color: GOOGLE_BLUE }}>{item.issue_id}</span>
            <Badge label={item.status} color={GOOGLE_YELLOW} />
          </div>
          <div style={{ fontSize: 13, margin: '4px 0' }}>{item.title}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => onApprove && onApprove(item.issue_id, true)}
              style={{ background: GOOGLE_GREEN, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
              Approve
            </button>
            <button onClick={() => onApprove && onApprove(item.issue_id, false)}
              style={{ background: GOOGLE_RED, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
              Reject
            </button>
          </div>
        </div>
      ))}
      {pending.length === 0 && <div style={{ color: '#5f6368', fontSize: 13 }}>No pending approvals.</div>}
    </div>
  )
}

function TestGeneratedCard({ data }) {
  const tests = data.tests || data.generated || []
  return (
    <div className="card" style={{ borderLeft: `3px solid ${GOOGLE_GREEN}` }}>
      <div className="card-title" style={{ color: GOOGLE_GREEN }}>✓ Test Cases Generated</div>
      <div style={{ color: '#5f6368', fontSize: 13, marginBottom: 10 }}>
        {data.count ?? tests.length} test cases for "{data.feature_name || data.feature}"
      </div>
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {tests.map((t, i) => (
          <div key={t.id || i} style={{ borderBottom: '1px solid #f1f3f4', padding: '6px 0', fontSize: 13 }}>
            <span style={{ fontFamily: 'Roboto Mono', color: GOOGLE_BLUE, marginRight: 8 }}>{t.id}</span>
            <span>{t.name}</span>
            <span style={{ marginLeft: 8, color: '#5f6368', fontSize: 12 }}>{t.locale}</span>
          </div>
        ))}
      </div>
      {data.string_keys?.length > 0 && (
        <div style={{ marginTop: 10, background: '#fff8e1', borderRadius: 6, padding: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#f9a825', marginBottom: 4 }}>New string keys to translate</div>
          {data.string_keys.map(k => (
            <div key={k} style={{ fontFamily: 'Roboto Mono', fontSize: 12, color: '#5f6368' }}>{k}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function FirmwareListCard({ data }) {
  const builds = data.builds || data.firmware_builds || []
  return (
    <div className="card">
      <div className="card-title">Firmware Builds</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {builds.map(b => (
          <div key={b.id} style={{ background: '#f8f9fa', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{b.device}</div>
              <div style={{ fontFamily: 'Roboto Mono', fontSize: 12, color: '#5f6368' }}>{b.version}</div>
            </div>
            <Badge label={b.status} color={statusColor(b.status)} />
            {b.release_blocker && <Badge label="Blocker" color={GOOGLE_RED} />}
          </div>
        ))}
      </div>
    </div>
  )
}

function SprintCard({ data }) {
  const s = data.sprint || data
  return (
    <div className="card">
      <div className="card-title">Sprint {s.id} — {s.name}</div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
        {[['New Failures', s.new_failures], ['Fixed', s.fixed_count], ['In Progress', s.in_progress]].map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
            <div style={{ fontSize: 11, color: '#5f6368' }}>{k}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RoadmapCard({ data }) {
  const months = data.roadmap || []
  return (
    <div className="card">
      <div className="card-title">Automation Roadmap</div>
      {months.map(m => (
        <div key={m.month} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span>{m.month}</span>
            <span>{m.actual ?? '—'}% / {m.target}% target</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: '#e8eaed', position: 'relative' }}>
            {m.target && <div style={{ position: 'absolute', left: `${m.target}%`, top: -2, bottom: -2, width: 2, background: '#dadce0' }} />}
            {m.actual && <div style={{ height: '100%', borderRadius: 4, width: `${m.actual}%`, background: m.actual >= m.target ? GOOGLE_GREEN : GOOGLE_YELLOW }} />}
          </div>
        </div>
      ))}
    </div>
  )
}

function AgentCard({ type, data, onApprove }) {
  switch (type) {
    case 'dashboard.summary': return <DashboardCard data={data} />
    case 'suite.summary':     return <SuiteSummaryCard data={data} />
    case 'test.list':
    case 'test.search':       return <TestListCard data={data} />
    case 'test.failures':     return <FailuresCard data={data} />
    case 'locale.coverage':
    case 'locale.comparison': return <LocaleCoverageCard data={data} />
    case 'simulation.result': return <SimulationCard data={data} />
    case 'rca.report':        return <RcaCard data={data} />
    case 'issue.draft':       return <IssueDraftCard data={data} onApprove={onApprove} />
    case 'issue.filed':       return <IssueFiled data={data} />
    case 'hil.queue':         return <HilQueueCard data={data} onApprove={onApprove} />
    case 'test.generated':    return <TestGeneratedCard data={data} />
    case 'firmware.list':     return <FirmwareListCard data={data} />
    case 'sprint.summary':    return <SprintCard data={data} />
    case 'roadmap.overview':  return <RoadmapCard data={data} />
    default:
      return <div className="card" style={{ fontSize: 13, color: '#5f6368' }}>{JSON.stringify(data, null, 2)}</div>
  }
}

// ─── Agent feed ───────────────────────────────────────────────────────────────
function AgentFeed({ messages, onApprove }) {
  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
      {messages.map((msg, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          {msg.type === 'user' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px' }}>
              <div style={{
                background: GOOGLE_BLUE, color: '#fff',
                borderRadius: '18px 18px 4px 18px',
                padding: '10px 16px', maxWidth: '70%', fontSize: 14, lineHeight: 1.5,
              }}>{msg.text}</div>
            </div>
          )}
          {msg.type === 'progress' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 16px', color: '#5f6368', fontSize: 13 }}>
              <div className="spinner" />
              {msg.label}
            </div>
          )}
          {msg.type === 'text' && (
            <div style={{ display: 'flex', gap: 10, padding: '0 16px', alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>🤖</div>
              <div style={{
                background: '#f8f9fa', borderRadius: '4px 18px 18px 18px',
                padding: '10px 14px', maxWidth: '80%', fontSize: 14, lineHeight: 1.6, color: '#3c4043',
                whiteSpace: 'pre-wrap',
              }}>{msg.text}</div>
            </div>
          )}
          {msg.type === 'card' && (
            <div style={{ padding: '0 16px' }}>
              <AgentCard type={msg.card_type} data={msg.data} onApprove={onApprove} />
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

// ─── Chat bar ──────────────────────────────────────────────────────────────────
function ChatBar({ onSend, loading, placeholder }) {
  const [input, setInput] = useState('')
  const submit = () => {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
  }
  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }
  return (
    <div style={{
      borderTop: '1px solid #e8eaed', padding: '12px 16px',
      background: '#fff', display: 'flex', gap: 10, alignItems: 'flex-end',
    }}>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder || 'Ask the LocaTest agent…'}
        rows={1}
        style={{
          flex: 1, border: '1px solid #dadce0', borderRadius: 24,
          padding: '10px 16px', fontSize: 14, resize: 'none',
          fontFamily: 'Google Sans', outline: 'none',
          background: loading ? '#f8f9fa' : '#fff',
        }}
      />
      <button onClick={submit} disabled={loading || !input.trim()}
        style={{
          background: loading || !input.trim() ? '#f1f3f4' : GOOGLE_BLUE,
          color: loading || !input.trim() ? '#bdc1c6' : '#fff',
          border: 'none', borderRadius: '50%', width: 44, height: 44,
          cursor: loading || !input.trim() ? 'default' : 'pointer',
          fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
        {loading ? '⏳' : '↑'}
      </button>
    </div>
  )
}

// ─── Overlays ─────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, padding: 28,
        width: 540, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 8px 24px rgba(0,0,0,.15)',
      }}>
        {children}
      </div>
    </div>
  )
}

function HilOverlay({ issue, onClose }) {
  const [step, setStep] = useState(1)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const approve = async () => {
    setLoading(true)
    await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue_id: issue.id, approved: true, notes }),
    })
    setLoading(false)
    setDone(true)
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontFamily: 'Google Sans', fontWeight: 700, fontSize: 18 }}>HIL Approval</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#5f6368' }}>✕</button>
      </div>

      {done ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontFamily: 'Google Sans', fontWeight: 600, fontSize: 16 }}>Issue approved &amp; filed!</div>
          <div style={{ color: '#5f6368', fontSize: 14, marginTop: 4 }}>{issue.id}</div>
          <button onClick={onClose} style={{ marginTop: 16, background: GOOGLE_BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer' }}>Close</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
            {['Review', 'Verify', 'Approve'].map((s, idx) => (
              <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', margin: '0 auto 6px',
                  background: step > idx + 1 ? GOOGLE_GREEN : step === idx + 1 ? GOOGLE_BLUE : '#e8eaed',
                  color: step >= idx + 1 ? '#fff' : '#9aa0a6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                }}>{step > idx + 1 ? '✓' : idx + 1}</div>
                <div style={{ fontSize: 12, color: step === idx + 1 ? GOOGLE_BLUE : '#5f6368' }}>{s}</div>
                {idx < 2 && <div style={{ position: 'absolute', top: 13, left: '60%', right: '-40%', height: 2, background: step > idx + 1 ? GOOGLE_GREEN : '#e8eaed' }} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{issue.title}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#5f6368', marginBottom: 12 }}>
                <span>Severity: <strong>{issue.severity}</strong></span>
                <span>Component: {issue.component}</span>
              </div>
              <div style={{ fontSize: 13, background: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                {issue.description || 'Localization failure requiring Buganizer tracking.'}
              </div>
              <button onClick={() => setStep(2)} style={{ background: GOOGLE_BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontFamily: 'Google Sans', fontWeight: 600 }}>Review Impact →</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Affected Test Cases</div>
              {(issue.test_case_ids || []).map(id => (
                <div key={id} style={{ fontFamily: 'Roboto Mono', fontSize: 13, color: GOOGLE_BLUE, marginBottom: 4 }}>{id}</div>
              ))}
              <div style={{ marginTop: 12, background: '#fce8e6', borderRadius: 8, padding: 10, fontSize: 13, color: GOOGLE_RED }}>
                This issue will block the Nest Hub firmware OTA release.
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => setStep(1)} style={{ background: '#f1f3f4', color: '#3c4043', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ background: GOOGLE_BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontFamily: 'Google Sans', fontWeight: 600 }}>Verify &amp; Approve →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Add Notes (optional)</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Reviewer notes…"
                style={{ width: '100%', border: '1px solid #dadce0', borderRadius: 8, padding: 10, fontSize: 13, minHeight: 80, resize: 'vertical', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => setStep(2)} style={{ background: '#f1f3f4', color: '#3c4043', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>← Back</button>
                <button onClick={approve} disabled={loading}
                  style={{ background: GOOGLE_GREEN, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontFamily: 'Google Sans', fontWeight: 600, flex: 1 }}>
                  {loading ? 'Filing…' : '✓ Approve &amp; File Issue'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Overlay>
  )
}

function SimLaunchOverlay({ onClose, onLaunch }) {
  const [suite, setSuite] = useState('Home Screen & Ambient Display')
  const [locale, setLocale] = useState('pt-BR')
  const [type, setType] = useState('regression')
  return (
    <Overlay onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontFamily: 'Google Sans', fontWeight: 700, fontSize: 18 }}>Launch Simulation</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#5f6368' }}>✕</button>
      </div>
      {[
        ['Suite', suite, setSuite, ['Home Screen & Ambient Display', 'Google Assistant UI', 'Device Settings', 'Temperature Control UI', 'Notifications', 'Device Onboarding']],
        ['Locale', locale, setLocale, ['pt-BR', 'ar-SA', 'de-DE', 'fr-FR', 'ja-JP', 'ko-KR', 'zh-CN', 'hi-IN', 'es-ES', 'tr-TR']],
        ['Type', type, setType, ['regression', 'smoke', 'full', 'p0-only']],
      ].map(([label, val, setter, opts]) => (
        <div key={label} style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</label>
          <select value={val} onChange={e => setter(e.target.value)}
            style={{ width: '100%', border: '1px solid #dadce0', borderRadius: 8, padding: '8px 12px', fontSize: 14, background: '#fff' }}>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      ))}
      <button onClick={() => { onLaunch({ suite, locale, type }); onClose() }}
        style={{ width: '100%', background: GOOGLE_BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', cursor: 'pointer', fontFamily: 'Google Sans', fontWeight: 600, fontSize: 15 }}>
        ▶ Run Simulation
      </button>
    </Overlay>
  )
}

// ─── Workspace Tab ────────────────────────────────────────────────────────────
const INITIAL_WORKSPACE_MESSAGES = [
  {
    type: 'card',
    card_type: 'dashboard.summary',
    data: {
      metrics: {
        total_tests: '18,000',
        pass_rate: '88.3%',
        failing: 212,
        automation_coverage: '60.7%',
        release_blockers: 2,
        active_sprint: 'Sprint 43',
        firmware_builds_in_qa: 5,
      },
    },
  },
  {
    type: 'text',
    text: 'Sprint 43 is active with 89 new failures. Two P0 release blockers were detected — PT-BR Nest Hub greeting string and AR-SA Thermostat RTL layout. Automation coverage is at 60.7% against the 70% target. Five firmware builds are currently in QA.',
  },
  {
    type: 'card',
    card_type: 'test.failures',
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
  const [messages, setMessages] = useState(INITIAL_WORKSPACE_MESSAGES)
  const [loading, setLoading] = useState(false)
  const [hilIssue, setHilIssue] = useState(null)
  const evsRef = useRef(null)

  const handleApprove = (issueId) => {
    const dummyIssue = {
      id: issueId,
      title: 'Localization failure — approval required',
      severity: 'S2',
      component: 'Nest>Firmware>Localization',
      test_case_ids: ['LOC-NH-11198', 'LOC-NH-11199'],
      description: 'Untranslated string detected in PT-BR locale for Nest Hub Home Screen.',
    }
    setHilIssue(dummyIssue)
  }

  const sendMessage = useCallback(async (text) => {
    if (loading) return
    setMessages(prev => [...prev, { type: 'user', text }])
    setLoading(true)

    evsRef.current?.close()
    const resp = await fetch('/run_sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, session_id: sessionId, user_id: userId }),
    })

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    let agentText = ''

    const flush = () => {
      if (agentText) {
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.type === 'text' && last._streaming) {
            return [...prev.slice(0, -1), { type: 'text', text: agentText, _streaming: true }]
          }
          return [...prev, { type: 'text', text: agentText, _streaming: true }]
        })
      }
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        try {
          const ev = JSON.parse(line.slice(5).trim())
          if (ev.type === 'progress') {
            setMessages(prev => [...prev, { type: 'progress', label: ev.label, tool: ev.tool }])
          } else if (ev.type === 'card') {
            if (agentText) {
              setMessages(prev => [...prev.slice(0, prev.findIndex(m => m._streaming) === -1 ? prev.length : prev.findIndex(m => m._streaming)),
                { type: 'text', text: agentText }])
              agentText = ''
            }
            setMessages(prev => [
              ...prev.filter(m => !m._streaming),
              { type: 'card', card_type: ev.card_type, data: ev.data },
            ])
          } else if (ev.type === 'message_delta') {
            if (ev.done) {
              setMessages(prev => prev.map(m => m._streaming ? { ...m, _streaming: false } : m))
              setLoading(false)
            } else {
              agentText += ev.text
              flush()
            }
          } else if (ev.type === 'error') {
            setMessages(prev => [...prev.filter(m => m.type !== 'progress'), { type: 'text', text: `Error: ${ev.message}` }])
            setLoading(false)
          }
        } catch { /* skip malformed */ }
      }
    }
    setLoading(false)
  }, [loading, sessionId, userId])

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 220, borderRight: '1px solid #e8eaed', padding: 16, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#5f6368', letterSpacing: 1, marginBottom: 12 }}>SOURCES</div>
        {[
          { icon: '🧪', label: '18,000 Test Cases', sub: '9 Nest UI surfaces' },
          { icon: '🌐', label: '10 Locales', sub: 'pt-BR, ar-SA, de-DE…' },
          { icon: '📋', label: 'Sprint 43', sub: '89 new failures' },
          { icon: '📊', label: 'RCA Reports', sub: '2 pending' },
          { icon: '🐛', label: 'Buganizer', sub: '2 draft issues' },
          { icon: '⚡', label: 'Simulations', sub: '3 scenarios' },
          { icon: '📱', label: 'Firmware Builds', sub: '5 in QA' },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 8, padding: '8px 10px', marginBottom: 4, background: '#f8f9fa', cursor: 'default' }}>
            <div style={{ fontSize: 13 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: 11, color: '#5f6368', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AgentFeed messages={messages} onApprove={handleApprove} />
        <ChatBar onSend={sendMessage} loading={loading} placeholder="Ask about test suites, failures, locales…" />
      </div>
      {hilIssue && <HilOverlay issue={hilIssue} onClose={() => setHilIssue(null)} />}
    </div>
  )
}

// ─── Simulation Tab ───────────────────────────────────────────────────────────
const SCENARIOS = [
  { id: 'SIM-001', name: 'PT-BR Regression', suite: 'Home Screen & Ambient Display', locale: 'pt-BR', type: 'regression', status: 'complete', executed: 45, passed: 42, failed: 3, hil_required: true },
  { id: 'SIM-002', name: 'AR-SA Smoke', suite: 'Temperature Control UI', locale: 'ar-SA', type: 'smoke', status: 'complete', executed: 12, passed: 10, failed: 2, hil_required: true },
  { id: 'SIM-003', name: 'DE-DE Full Suite', suite: 'Device Settings', locale: 'de-DE', type: 'full', status: 'in_progress', executed: 210, passed: 208, failed: 2, hil_required: false },
]

function SimulationTab({ sessionId, userId }) {
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [showLaunch, setShowLaunch] = useState(false)
  const [hilIssue, setHilIssue] = useState(null)

  const launch = async ({ suite, locale, type }) => {
    const text = `Run a ${type} simulation for the ${suite} suite in ${locale}`
    setMessages(prev => [...prev, { type: 'user', text }])
    setLoading(true)
    const resp = await fetch('/run_sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, session_id: sessionId, user_id: userId }),
    })
    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        try {
          const ev = JSON.parse(line.slice(5).trim())
          if (ev.type === 'card' || ev.type === 'progress' || ev.type === 'message_delta') {
            if (ev.type === 'card') setMessages(prev => [...prev.filter(m => m.type !== 'progress'), { type: 'card', card_type: ev.card_type, data: ev.data }])
            if (ev.type === 'progress') setMessages(prev => [...prev, { type: 'progress', label: ev.label }])
            if (ev.type === 'message_delta' && ev.done) setLoading(false)
          }
        } catch { /* */ }
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 280, borderRight: '1px solid #e8eaed', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e8eaed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontFamily: 'Google Sans', fontSize: 15 }}>Scenarios</span>
          <button onClick={() => setShowLaunch(true)}
            style={{ background: GOOGLE_BLUE, color: '#fff', border: 'none', borderRadius: 20, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}>
            + New
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {SCENARIOS.map(s => (
            <div key={s.id} onClick={() => setSelected(s)}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid #f1f3f4',
                background: selected?.id === s.id ? '#e8f0fe' : 'transparent',
                borderLeft: selected?.id === s.id ? `3px solid ${GOOGLE_BLUE}` : '3px solid transparent',
              }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: '#5f6368' }}>{s.locale} · {s.type}</div>
              <div style={{ marginTop: 4 }}>
                <Badge label={s.status.replace('_', ' ')} color={statusColor(s.status)} />
                {s.hil_required && <Badge label="HIL" color={GOOGLE_YELLOW} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected ? (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8eaed', background: '#f8f9fa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'Google Sans', fontWeight: 700, fontSize: 16 }}>{selected.name}</div>
                  <div style={{ fontSize: 13, color: '#5f6368', marginTop: 2 }}>{selected.suite} · {selected.locale}</div>
                </div>
                <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                  {[['Executed', selected.executed], ['Passed', selected.passed, GOOGLE_GREEN], ['Failed', selected.failed, GOOGLE_RED]].map(([k, v, c]) => (
                    <div key={k}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: c || '#202124' }}>{v}</div>
                      <div style={{ fontSize: 11, color: '#5f6368' }}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>
              {selected.hil_required && (
                <div style={{ marginTop: 10, background: '#e8f0fe', borderRadius: 8, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: GOOGLE_BLUE }}>✋ HIL approval required before filing</span>
                  <button onClick={() => setHilIssue({ id: 'b/337821049', title: `${selected.name} — Localization Failures`, severity: 'S2', component: 'Nest>Firmware>Localization', test_case_ids: ['LOC-NH-11198'] })}
                    style={{ background: GOOGLE_BLUE, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
                    Review &amp; Approve
                  </button>
                </div>
              )}
            </div>
            <AgentFeed messages={messages} onApprove={(id) => setHilIssue({ id, title: 'Localization Failure', severity: 'S2', component: 'Nest>Firmware>Localization', test_case_ids: [] })} />
            <ChatBar onSend={launch} loading={loading} placeholder={`Ask about ${selected.name}…`} />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#5f6368' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
            <div style={{ fontSize: 16, fontFamily: 'Google Sans', marginBottom: 4 }}>Select a scenario</div>
            <div style={{ fontSize: 14 }}>or launch a new simulation</div>
          </div>
        )}
      </div>

      {showLaunch && <SimLaunchOverlay onClose={() => setShowLaunch(false)} onLaunch={launch} />}
      {hilIssue && <HilOverlay issue={hilIssue} onClose={() => setHilIssue(null)} />}
    </div>
  )
}

// ─── RCA & Issues Tab ─────────────────────────────────────────────────────────
const RCA_REPORTS_DATA = [
  {
    id: 'RCA-2026-043-001',
    title: 'PT-BR Nest Hub Home Screen String Bundle Missing',
    status: 'pending_approval',
    confidence_score: '97%',
    root_cause: 'Release branch l10n-sprint43 missing pt-BR string bundle update. Strings "hs_greeting_morning", "hs_greeting_afternoon", "hs_weather_label" defaulting to English fallback.',
    affected_tests: ['LOC-NH-11198', 'LOC-NH-11199', 'LOC-NH-11200'],
    screenshots: ['nh_home_ptbr_greeting.png', 'nh_home_ptbr_weather.png', 'nh_home_ptbr_calendar.png'],
    issue_id: 'b/337821049',
  },
  {
    id: 'RCA-2026-043-002',
    title: 'AR-SA Thermostat Temperature Label RTL Overflow',
    status: 'in_analysis',
    confidence_score: '89%',
    root_cause: 'RTL layout engine not applied to temperature display component. Arabic numeral rendering uses LTR character sequence causing visual overflow on 4-inch display.',
    affected_tests: ['LOC-NT-11201', 'LOC-NT-11202'],
    screenshots: ['nt_temp_arsa_rtl.png'],
    issue_id: 'b/337821050',
  },
]

const BUGANIZER_ISSUES_DATA = [
  { id: 'b/337821049', title: '[PT-BR][P0] Home Screen greeting strings untranslated on Nest Hub firmware 4.1.0.12-rc3', severity: 'S2', component: 'Nest>Firmware>Localization>HomeScreen', status: 'DRAFT', approved: false, test_case_ids: ['LOC-NH-11198', 'LOC-NH-11199', 'LOC-NH-11200'], description: 'Untranslated greeting, weather, and calendar strings detected on PT-BR locale Nest Hub during Sprint 43 regression.' },
  { id: 'b/337821050', title: '[AR-SA][P0] Temperature label RTL overflow on Nest Thermostat 6.4.0.3-rc1', severity: 'S2', component: 'Nest>Firmware>Localization>ThermostatUI', status: 'DRAFT', approved: false, test_case_ids: ['LOC-NT-11201', 'LOC-NT-11202'], description: 'RTL layout engine not applied to temperature component; Arabic numerals rendered LTR causing display overflow.' },
]

function RcaTab({ sessionId, userId }) {
  const [selectedRca, setSelectedRca] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [hilIssue, setHilIssue] = useState(null)

  const ask = async (text) => {
    setMessages(prev => [...prev, { type: 'user', text }])
    setLoading(true)
    const resp = await fetch('/run_sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, session_id: sessionId, user_id: userId }),
    })
    const reader = resp.body.getReader()
    const dec = new TextDecoder()
    let buf = '', agentText = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n'); buf = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        try {
          const ev = JSON.parse(line.slice(5).trim())
          if (ev.type === 'card') setMessages(prev => [...prev.filter(m => m.type !== 'progress'), { type: 'card', card_type: ev.card_type, data: ev.data }])
          if (ev.type === 'progress') setMessages(prev => [...prev, { type: 'progress', label: ev.label }])
          if (ev.type === 'message_delta' && !ev.done) { agentText += ev.text; setMessages(prev => { const last = prev[prev.length - 1]; return last?._streaming ? [...prev.slice(0, -1), { type: 'text', text: agentText, _streaming: true }] : [...prev, { type: 'text', text: agentText, _streaming: true }] }) }
          if (ev.type === 'message_delta' && ev.done) { setMessages(prev => prev.map(m => m._streaming ? { ...m, _streaming: false } : m)); setLoading(false) }
        } catch { /* */ }
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 280, borderRight: '1px solid #e8eaed', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed' }}>
          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'Google Sans', marginBottom: 8 }}>RCA Reports</div>
          {RCA_REPORTS_DATA.map(r => (
            <div key={r.id} onClick={() => setSelectedRca(r)}
              style={{
                borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer',
                background: selectedRca?.id === r.id ? '#e8f0fe' : '#f8f9fa',
                border: selectedRca?.id === r.id ? `1px solid ${GOOGLE_BLUE}44` : '1px solid transparent',
              }}>
              <div style={{ fontFamily: 'Roboto Mono', fontSize: 12, color: GOOGLE_BLUE, marginBottom: 2 }}>{r.id}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{r.title.slice(0, 60)}…</div>
              <Badge label={r.status.replace('_', ' ')} color={r.status === 'pending_approval' ? GOOGLE_YELLOW : GOOGLE_BLUE} />
            </div>
          ))}
          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'Google Sans', margin: '12px 0 8px' }}>Buganizer Drafts</div>
          {BUGANIZER_ISSUES_DATA.map(issue => (
            <div key={issue.id} style={{ borderRadius: 8, padding: '10px 12px', marginBottom: 8, background: '#fff8f8', border: '1px solid #fce8e6' }}>
              <div style={{ fontFamily: 'Roboto Mono', fontSize: 12, color: GOOGLE_BLUE, marginBottom: 2 }}>{issue.id}</div>
              <div style={{ fontSize: 12, marginBottom: 6 }}>{issue.title.slice(0, 55)}…</div>
              <button onClick={() => setHilIssue(issue)}
                style={{ background: GOOGLE_BLUE, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>
                Review &amp; Approve
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedRca ? (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8eaed', overflowY: 'auto' }}>
              <div style={{ fontFamily: 'Google Sans', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{selectedRca.title}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <Badge label={selectedRca.status.replace('_', ' ')} color={selectedRca.status === 'pending_approval' ? GOOGLE_YELLOW : GOOGLE_BLUE} />
                <span style={{ fontSize: 13, color: '#5f6368' }}>Confidence: {selectedRca.confidence_score}</span>
              </div>
              <div style={{ fontSize: 14, color: '#3c4043', marginBottom: 12, background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
                <strong>Root Cause: </strong>{selectedRca.root_cause}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {selectedRca.affected_tests.map(id => (
                  <span key={id} style={{ fontFamily: 'Roboto Mono', fontSize: 12, background: '#fce8e6', color: GOOGLE_RED, padding: '2px 8px', borderRadius: 10 }}>{id}</span>
                ))}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#5f6368' }}>Evidence — Untranslated Strings</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {selectedRca.screenshots.map((s, i) => (
                  <div key={i} style={{ width: 140, height: 100, borderRadius: 10, background: '#1a1a2e', position: 'relative', overflow: 'hidden', border: '1px solid #3c3c5c', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                      <div style={{ width: '90%', height: 3, background: '#3c3c5c', borderRadius: 2, marginBottom: 6 }} />
                      <div style={{ color: GOOGLE_RED, fontSize: 10, fontFamily: 'Roboto Mono', textAlign: 'center', marginBottom: 4 }}>Good morning</div>
                      <div style={{ color: GOOGLE_GREEN, fontSize: 9, fontFamily: 'Roboto Mono', textAlign: 'center', marginBottom: 6 }}>→ Bom dia</div>
                      <div style={{ width: '70%', height: 2, background: '#3c3c5c', borderRadius: 2 }} />
                      <div style={{ color: '#9aa0a6', fontSize: 8, marginTop: 4 }}>{s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <AgentFeed messages={messages} onApprove={(id) => setHilIssue(BUGANIZER_ISSUES_DATA.find(x => x.id === id) || { id, title: 'RCA Issue', severity: 'S2', component: 'Nest>Firmware>Localization', test_case_ids: [] })} />
            <ChatBar onSend={ask} loading={loading} placeholder="Ask about this RCA, create or approve issues…" />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#5f6368' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔬</div>
            <div style={{ fontSize: 16, fontFamily: 'Google Sans', marginBottom: 4 }}>Select an RCA report</div>
            <div style={{ fontSize: 14 }}>or ask about localization failures</div>
          </div>
        )}
      </div>
      {hilIssue && <HilOverlay issue={hilIssue} onClose={() => setHilIssue(null)} />}
    </div>
  )
}

// ─── Test Generation Tab ──────────────────────────────────────────────────────
function TestGenTab({ sessionId, userId }) {
  const [form, setForm] = useState({ feature: '', device: 'Nest Hub', suite: 'Home Screen & Ambient Display', locales: 'all', priority: 'P1', description: '' })
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const generate = async () => {
    const text = `Generate test cases for the "${form.feature}" feature on ${form.device}, suite: ${form.suite}, locales: ${form.locales}, priority: ${form.priority}. ${form.description}`
    setMessages(prev => [...prev, { type: 'user', text }])
    setLoading(true)
    const resp = await fetch('/run_sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, session_id: sessionId, user_id: userId }),
    })
    const reader = resp.body.getReader()
    const dec = new TextDecoder()
    let buf = '', agentText = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n'); buf = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        try {
          const ev = JSON.parse(line.slice(5).trim())
          if (ev.type === 'card') setMessages(prev => [...prev.filter(m => m.type !== 'progress'), { type: 'card', card_type: ev.card_type, data: ev.data }])
          if (ev.type === 'progress') setMessages(prev => [...prev, { type: 'progress', label: ev.label }])
          if (ev.type === 'message_delta' && !ev.done) { agentText += ev.text; setMessages(prev => { const last = prev[prev.length - 1]; return last?._streaming ? [...prev.slice(0, -1), { type: 'text', text: agentText, _streaming: true }] : [...prev, { type: 'text', text: agentText, _streaming: true }] }) }
          if (ev.type === 'message_delta' && ev.done) { setMessages(prev => prev.map(m => m._streaming ? { ...m, _streaming: false } : m)); setLoading(false) }
        } catch { /* */ }
      }
    }
    setLoading(false)
  }

  const inputStyle = { width: '100%', border: '1px solid #dadce0', borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: 'Google Sans', boxSizing: 'border-box', outline: 'none' }
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#3c4043', marginBottom: 6 }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 320, borderRight: '1px solid #e8eaed', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Google Sans', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Generate Test Cases</div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Feature Name *</label>
          <input value={form.feature} onChange={e => setField('feature', e.target.value)}
            placeholder="e.g. Night Mode for Thermostat" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Nest Device</label>
          <select value={form.device} onChange={e => setField('device', e.target.value)} style={inputStyle}>
            {['Nest Hub', 'Nest Hub Max', 'Nest Mini', 'Nest Cam', 'Nest Doorbell', 'Nest Thermostat'].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>UI Suite</label>
          <select value={form.suite} onChange={e => setField('suite', e.target.value)} style={inputStyle}>
            {['Home Screen & Ambient Display', 'Google Assistant UI', 'Device Settings', 'Temperature Control UI', 'Nest Cam & Doorbell UI', 'Routines & Automation', 'Notifications', 'Device Onboarding', 'Media Playback & Cast'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Locales</label>
          <select value={form.locales} onChange={e => setField('locales', e.target.value)} style={inputStyle}>
            <option value="all">All 10 locales</option>
            {['pt-BR', 'ar-SA', 'de-DE', 'fr-FR', 'ja-JP', 'ko-KR', 'zh-CN', 'hi-IN', 'es-ES', 'tr-TR'].map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Priority</label>
          <select value={form.priority} onChange={e => setField('priority', e.target.value)} style={inputStyle}>
            {['P0', 'P1', 'P2', 'P3'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Feature Description</label>
          <textarea value={form.description} onChange={e => setField('description', e.target.value)}
            placeholder="Describe the feature and expected localisation behaviour…"
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
        </div>

        <button onClick={generate} disabled={loading || !form.feature.trim()}
          style={{
            width: '100%', background: !form.feature.trim() || loading ? '#f1f3f4' : GOOGLE_BLUE,
            color: !form.feature.trim() || loading ? '#bdc1c6' : '#fff',
            border: 'none', borderRadius: 8, padding: '12px 0',
            cursor: !form.feature.trim() || loading ? 'default' : 'pointer',
            fontFamily: 'Google Sans', fontWeight: 600, fontSize: 15,
          }}>
          {loading ? '⏳ Generating…' : '✨ Generate Tests'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#5f6368' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
            <div style={{ fontSize: 16, fontFamily: 'Google Sans', marginBottom: 4 }}>AI-Powered Test Generation</div>
            <div style={{ fontSize: 14, textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
              Fill in the form and generate localisation test cases for any new Nest feature across all locales.
            </div>
          </div>
        ) : (
          <AgentFeed messages={messages} onApprove={() => {}} />
        )}
      </div>
    </div>
  )
}

// ─── Firmware Builds Tab ──────────────────────────────────────────────────────
const FIRMWARE_DATA = [
  { id: 'FW-001', device: 'Nest Hub', version: '4.1.0.12-rc3', status: 'in_qa', locales_tested: 10, pass_rate: '88%', release_blocker: true, sprint: 'Sprint 43' },
  { id: 'FW-002', device: 'Nest Thermostat', version: '6.4.0.3-rc1', status: 'in_qa', locales_tested: 10, pass_rate: '91%', release_blocker: true, sprint: 'Sprint 43' },
  { id: 'FW-003', device: 'Nest Hub Max', version: '4.1.0.11-rc2', status: 'stable', locales_tested: 10, pass_rate: '96%', release_blocker: false, sprint: 'Sprint 42' },
  { id: 'FW-004', device: 'Nest Mini', version: '3.2.1.8-rc1', status: 'in_qa', locales_tested: 8, pass_rate: '94%', release_blocker: false, sprint: 'Sprint 43' },
  { id: 'FW-005', device: 'Nest Cam', version: '2.7.0.5-rc2', status: 'released', locales_tested: 10, pass_rate: '99%', release_blocker: false, sprint: 'Sprint 42' },
]

function FirmwareTab({ sessionId, userId }) {
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const ask = async (text) => {
    setMessages(prev => [...prev, { type: 'user', text }])
    setLoading(true)
    const resp = await fetch('/run_sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, session_id: sessionId, user_id: userId }),
    })
    const reader = resp.body.getReader()
    const dec = new TextDecoder()
    let buf = '', agentText = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n'); buf = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        try {
          const ev = JSON.parse(line.slice(5).trim())
          if (ev.type === 'card') setMessages(prev => [...prev.filter(m => m.type !== 'progress'), { type: 'card', card_type: ev.card_type, data: ev.data }])
          if (ev.type === 'progress') setMessages(prev => [...prev, { type: 'progress', label: ev.label }])
          if (ev.type === 'message_delta' && !ev.done) { agentText += ev.text; setMessages(prev => { const l = prev[prev.length - 1]; return l?._streaming ? [...prev.slice(0, -1), { type: 'text', text: agentText, _streaming: true }] : [...prev, { type: 'text', text: agentText, _streaming: true }] }) }
          if (ev.type === 'message_delta' && ev.done) { setMessages(prev => prev.map(m => m._streaming ? { ...m, _streaming: false } : m)); setLoading(false) }
        } catch { /* */ }
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 280, borderRight: '1px solid #e8eaed', overflowY: 'auto' }}>
        <div style={{ padding: '14px 16px', fontWeight: 700, fontSize: 15, fontFamily: 'Google Sans', borderBottom: '1px solid #e8eaed' }}>
          Firmware Builds
        </div>
        {FIRMWARE_DATA.map(fw => (
          <div key={fw.id} onClick={() => { setSelected(fw); ask(`Tell me about ${fw.device} firmware ${fw.version}`) }}
            style={{
              padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f3f4',
              background: selected?.id === fw.id ? '#e8f0fe' : 'transparent',
              borderLeft: selected?.id === fw.id ? `3px solid ${GOOGLE_BLUE}` : '3px solid transparent',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{fw.device}</span>
              {fw.release_blocker && <Badge label="Blocker" color={GOOGLE_RED} />}
            </div>
            <div style={{ fontFamily: 'Roboto Mono', fontSize: 12, color: '#5f6368', marginBottom: 4 }}>{fw.version}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Badge label={fw.status.replace('_', ' ')} color={statusColor(fw.status)} />
              <span style={{ fontSize: 12, color: '#5f6368' }}>{fw.pass_rate}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected ? (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8eaed', background: '#f8f9fa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'Google Sans', fontWeight: 700, fontSize: 16 }}>{selected.device}</div>
                  <div style={{ fontFamily: 'Roboto Mono', fontSize: 13, color: '#5f6368', marginTop: 2 }}>{selected.version}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Badge label={selected.status.replace('_', ' ')} color={statusColor(selected.status)} />
                  {selected.release_blocker && <Badge label="Release Blocker" color={GOOGLE_RED} />}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                {[['Locales Tested', selected.locales_tested], ['Pass Rate', selected.pass_rate], ['Sprint', selected.sprint]].map(([k, v]) => (
                  <div key={k}>
                    <span style={{ fontSize: 12, color: '#5f6368' }}>{k}: </span>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
            <AgentFeed messages={messages} onApprove={() => {}} />
            <ChatBar onSend={ask} loading={loading} placeholder={`Ask about ${selected.device} ${selected.version}…`} />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#5f6368' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
            <div style={{ fontSize: 16, fontFamily: 'Google Sans' }}>Select a firmware build</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('workspace')
  const sessionId = useRef(Math.random().toString(36).slice(2)).current
  const userId = 'default_user'

  const tabProps = { sessionId, userId }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'Roboto, Google Sans, sans-serif' }}>
      <Navbar />
      <SprintBar onTabChange={setTab} />
      <TabNav active={tab} onChange={setTab} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'workspace'   && <WorkspaceTab {...tabProps} />}
        {tab === 'simulation'  && <SimulationTab {...tabProps} />}
        {tab === 'rca'         && <RcaTab {...tabProps} />}
        {tab === 'testgen'     && <TestGenTab {...tabProps} />}
        {tab === 'firmware'    && <FirmwareTab {...tabProps} />}
      </div>
    </div>
  )
}
