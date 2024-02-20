import { ViewReport } from "../components/ReportBase"

const BASE = {
  name: 'Analysis',
  menuSettings: {
    image: 'none',
    scheme: 'color-scheme-dark',
    position: 'menu-position-side',
    layout: 'menu-layout-mini',
    style: 'color-style-default'
  },
  class: 'fa',
  auth: false,
  component: ViewReport
}
const PATHS = [
  '/report/view/:reportId',

  '/template/view/:templateId/route/:routeId',
  '/template/view/:templateId/station/:routeId',
  '/template/view/:templateId/route/:routeId/station/:stationId',

  '/template/view/:templateId/route/:routeId/dates/:dates',
]

export default PATHS.map(path => ({
  ...BASE,
  path
}))
