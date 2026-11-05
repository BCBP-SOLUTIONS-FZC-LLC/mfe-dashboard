import { describe, expect, it } from 'vitest'
import { calendarDate } from '../../../src/lib/dates'

describe('calendarDate', () => {
  it('reads YYYY-MM-DD as that day in the page time zone, not midnight UTC', () => {
    const due = calendarDate('2026-10-25')
    // Local parts, so the SDK's formatDate shows Oct 25 in every time zone (new Date() gave Oct 24
    // west of UTC).
    expect([due.getFullYear(), due.getMonth(), due.getDate(), due.getHours()]).toEqual([2026, 9, 25, 0])
  })

  it('parses any other ISO string as an instant', () => {
    expect(calendarDate('2026-10-25T10:30:00Z').toISOString()).toBe('2026-10-25T10:30:00.000Z')
  })
})
