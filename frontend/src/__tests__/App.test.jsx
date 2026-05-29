import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App.jsx'

// Mock fetch for SSE calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    body: {
      getReader: () => ({
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"message_delta","text":"Hello","session_id":"test","done":false}\n\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"message_delta","text":"","session_id":"test","done":true}\n\n'),
          })
          .mockResolvedValue({ done: true }),
      }),
    },
  })
)

describe('App', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders navbar with LocaTest branding', () => {
    render(<App />)
    // "LocaTest" is split across two spans; check for each part
    expect(screen.getByText('Loca')).toBeInTheDocument()
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText(/Internal/i)).toBeInTheDocument()
  })

  it('renders all 5 tab labels', () => {
    render(<App />)
    // Each tab label appears once in TabNav and once in SprintBar pills
    expect(screen.getAllByText('Workspace').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Run Tests').length).toBeGreaterThan(0)
    expect(screen.getAllByText('RCA & Issues').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Test Generator').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Builds').length).toBeGreaterThan(0)
  })

  it('shows sprint bar with release blocker badge', () => {
    render(<App />)
    // The badge text includes a unicode warning char; use getAllByText to handle duplicates
    const blockerEls = screen.getAllByText(/Release Blockers/i)
    expect(blockerEls.length).toBeGreaterThan(0)
    expect(screen.getAllByText(/89 new failures/i).length).toBeGreaterThan(0)
  })

  it('workspace tab shows pre-populated failure cards', () => {
    render(<App />)
    expect(screen.getByText(/LOC-NH-11198/i)).toBeInTheDocument()
    expect(screen.getByText(/LOC-NT-11201/i)).toBeInTheDocument()
  })

  it('switches to Run Tests tab on click', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('Run Tests')[0])
    expect(screen.getByText('PT-BR Regression')).toBeInTheDocument()
    expect(screen.getByText('AR-SA Smoke')).toBeInTheDocument()
  })

  it('switches to Test Generator tab and shows form', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('Test Generator')[0])
    expect(screen.getByText('Generate Test Cases')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Night Mode/i)).toBeInTheDocument()
  })

  it('generate button disabled when feature name is empty', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('Test Generator')[0])
    const btn = screen.getByText(/Generate Tests/i)
    expect(btn).toBeDisabled()
  })

  it('switches to Builds tab', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('Builds')[0])
    expect(screen.getByText('Nest Hub')).toBeInTheDocument()
    expect(screen.getByText('Nest Thermostat')).toBeInTheDocument()
  })

  it('switches to RCA & Issues tab', () => {
    render(<App />)
    fireEvent.click(screen.getAllByText('RCA & Issues')[0])
    expect(screen.getByText(/RCA Reports/i)).toBeInTheDocument()
    expect(screen.getByText(/RCA-2026-043-001/i)).toBeInTheDocument()
  })
})
