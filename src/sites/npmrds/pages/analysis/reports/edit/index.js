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

  '/report/new',
  '/report/new/folder/:folderId',

  '/template/:templateId/route/:routeId',
  '/template/:templateId/station/:stationId',
  '/template/:templateId/route/:routeId/station/:stationId',

  '/template/type/:defaultType/route/:routeId',
  '/template/type/:defaultType/station/:stationId',
  '/template/type/:defaultType/route/:routeId/station/:stationId'
]

export default PATHS.map(path => ({
  ...BASE,
  path
}))
