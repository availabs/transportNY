import { ViewReport } from "../components/ReportBase"

const BASE = {
  name: 'Analysis',
  icon: 'fa-duotone fa-chart-line',
  sideNav: {
    color: 'dark',
    size: 'compact'
  },
  auth: false,
  component: ViewReport
}
const PATHS = [
  '/report/view/:reportId',

  '/template/view/:templateId/route/:routeId',
  '/template/view/:templateId/station/:routeId',
  '/template/view/:templateId/route/:routeId/station/:stationId',

  '/template/view/:templateId/tmcs/:tmcArray/dates/:dates',

  // '/template/view/:templateId/route/:routeId/dates/:dates',
]

export default PATHS.map(path => ({
  ...BASE,
  path
}))
