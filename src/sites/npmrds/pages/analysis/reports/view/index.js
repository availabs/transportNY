import { ViewReport } from "../components/ReportBase"

const COMMON = {
  name: 'Analysis',
  icon: 'fa-duotone fa-chart-line',
  sideNavActiveStyle: 'compact',
  component: ViewReport
}

// `/report/view/:reportId` is a public, shareable page: it must render for
// logged-out users. With `auth: false` and NO `authLevel`, checkAuth defaults
// the required level to -1, so no login redirect happens (an explicit
// `authLevel: 0` — as the old shared config used — would force login). The
// report-by-id Falcor route already serves without an auth token.
const PUBLIC_PATHS = [
  '/report/view/:reportId',
]

// Template views stay gated exactly as before (auth: false + authLevel: 0).
const GATED_PATHS = [
  '/template/view/:templateId/route/:routeId',
  '/template/view/:templateId/station/:routeId',
  '/template/view/:templateId/route/:routeId/station/:stationId',

  '/template/view/:templateId/tmcs/:tmcArray/dates/:dates',

  // '/template/view/:templateId/route/:routeId/dates/:dates',
]

export default [
  ...PUBLIC_PATHS.map(path => ({ ...COMMON, auth: false, path })),
  ...GATED_PATHS.map(path => ({ ...COMMON, auth: false, authLevel: 0, path })),
]
