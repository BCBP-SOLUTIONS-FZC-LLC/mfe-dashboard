// A calendar day (`YYYY-MM-DD`): a due date or a delegation period bound, not an instant. Kept as its
// ISO string, so it never shifts a day across time zones (new Date('YYYY-MM-DD') is UTC midnight),
// and two days compare as strings. Immutable; equal days have equal `iso`.
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

export class CalendarDay {
  readonly iso: string

  private constructor(iso: string) {
    this.iso = iso
  }

  /** The day `iso` names; throws on anything that is not a real `YYYY-MM-DD` day. */
  static parse(iso: string): CalendarDay {
    const m = ISO_DAY.exec(iso)
    const day = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined
    if (!m || !day || CalendarDay.fromLocalDate(day).iso !== iso) throw new RangeError(`not a calendar day: ${JSON.stringify(iso)}`)
    return new CalendarDay(iso)
  }

  /** The local calendar day of the instant `d` (the viewer's "today"). */
  static fromLocalDate(d: Date): CalendarDay {
    const parts = [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n, i) => String(n).padStart(i === 0 ? 4 : 2, '0'))
    return new CalendarDay(parts.join('-'))
  }

  /** The day `n` days later (or earlier for a negative `n`), across months and years. */
  addDays(n: number): CalendarDay {
    const [y, m, d] = this.iso.split('-').map(Number) as [number, number, number]
    return CalendarDay.fromLocalDate(new Date(y, m - 1, d + n))
  }

  isBefore(other: CalendarDay): boolean {
    return this.iso < other.iso
  }

  equals(other: CalendarDay): boolean {
    return this.iso === other.iso
  }
}
