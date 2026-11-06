import fs from 'node:fs'

const THRESHOLD = Number(process.env.COVERAGE_THRESHOLD ?? 95)
const summaryPath = 'coverage/coverage-summary.json'

if (!fs.existsSync(summaryPath)) {
  console.error(`::error file=${summaryPath},title=Coverage gate::${summaryPath} missing — run 'npm run test:coverage' before the coverage gate`)
  process.exit(1)
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
const total = summary.total
const metrics = ['statements', 'branches', 'functions', 'lines']

console.log('::group::Coverage report summary')
for (const metric of metrics) {
  console.log(`${metric}: ${total[metric].pct}%`)
}
console.log('::endgroup::')

const pct = total.statements.pct
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `pct=${pct}\n`)
}

const failed = metrics.filter((metric) => Number(total[metric].pct) < THRESHOLD)
if (failed.length > 0) {
  const detail = failed.map((metric) => `${metric} ${total[metric].pct}%`).join(', ')
  console.error(
    `::error file=coverage/coverage-summary.json,title=Coverage gate::Coverage is below the ${THRESHOLD}% threshold (${detail}).`,
  )
  process.exit(1)
}

// The constitution's "Domain Layer > 90%": every file under src/domain/, on all four metrics, is
// held to its own bar as well (it is pure logic, so it should be near 100%).
const DOMAIN_THRESHOLD = Number(process.env.DOMAIN_COVERAGE_THRESHOLD ?? 90)
const domainFiles = Object.entries(summary).filter(([file]) => file.includes('/src/domain/'))
if (domainFiles.length === 0) {
  console.error('::error title=Coverage gate::no src/domain/ files in the coverage summary')
  process.exit(1)
}
const domainFailures = domainFiles.flatMap(([file, m]) =>
  metrics.filter((metric) => Number(m[metric].pct) <= DOMAIN_THRESHOLD).map((metric) => `${file.split('/src/')[1]} ${metric} ${m[metric].pct}%`),
)
if (domainFailures.length > 0) {
  console.error(`::error title=Coverage gate::Domain layer at or below ${DOMAIN_THRESHOLD}% (${domainFailures.join(', ')}).`)
  process.exit(1)
}
console.log(`Domain layer: ${domainFiles.length} files above ${DOMAIN_THRESHOLD}%`)

console.log(`Total statement coverage: ${pct}%`)
