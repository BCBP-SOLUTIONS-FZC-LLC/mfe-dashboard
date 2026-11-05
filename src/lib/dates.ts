// Calendar dates (`YYYY-MM-DD`, no time) as local dates. `new Date('2026-10-25')` is midnight UTC,
// which the SDK's formatDate shows as Oct 24 anywhere west of UTC; a due date is a day, not an
// instant, so it is built from its parts in the page's time zone.
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** The local Date for a `YYYY-MM-DD` calendar date; any other ISO string is parsed as an instant. */
export function calendarDate(iso: string): Date {
  const m = CALENDAR_DATE.exec(iso)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso)
}
