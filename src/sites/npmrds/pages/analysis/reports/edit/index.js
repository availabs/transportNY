import { EditReport } from "../components/ReportBase"

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
  auth: true,
  component: EditReport
}
const PATHS = [
  '/report/edit/:reportId',

  '/report/new/folder/:folderId',
  '/report/new/route/:routeId',
  '/report/new',

  '/template/edit/:templateId/route/:routeId',
  '/template/edit/:templateId/station/:stationId',
  '/template/edit/:templateId/route/:routeId/station/:stationId',

  // '/template/edit/:templateId/route/:routeId/dates/:dates',

  '/template/edit/type/:defaultType/route/:routeId',
  '/template/edit/type/:defaultType/station/:stationId',
  '/template/edit/type/:defaultType/route/:routeId/station/:stationId'
]

export default PATHS.map(path => ({
  ...BASE,
  path
}))
