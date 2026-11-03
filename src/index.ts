// Standalone entry. Module Federation needs an async boundary before shared modules (React) are
// used; the shell loads ./App through remoteEntry.js and never runs this file.
export const started: Promise<unknown> = import('./main')
