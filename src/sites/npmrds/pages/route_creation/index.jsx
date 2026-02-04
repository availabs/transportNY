import React from "react"

import get from "lodash/get"
import { useParams } from "react-router"

import { AvlMap } from "~/modules/avl-map/src"
import config from "~/config.json"

import { useFalcor } from "~/modules/avl-components/src"

import layerFunc from "./components/RouteCreationLayer"

const mapOptions = {
  zoom: 10,
  center: [-73.75619435918802, 42.65102710658],
  styles: [
    { name: "Terrain",
      style: 'mapbox://styles/am3081/cjgi6glse001h2sqgjqcuov28'
    },
    { name: "Dark",
      style: 'mapbox://styles/am3081/ckm85o7hq6d8817nr0y6ute5v'
    },
    { name: "streets",
      style: 'mapbox://styles/am3081/ckt3271or0nnu17oikkvl0eme'
    }
  ]
}

const RouteCreation = () => {

  const layers = React.useRef([layerFunc()]);
  const layerId = get(layers, ["current", 0, "id"]);

  const { routeId, folderId } = useParams();

  const layerProps = React.useMemo(() => {
    return {
      [layerId]: { routeId, folderId }
    }
  }, [layerId, routeId, folderId]);

  return (
    <div className="w-full h-full">
      <AvlMap key="testing-key"
        accessToken={ config.MAPBOX_TOKEN }
        mapOptions={ mapOptions }
        layers={ layers.current }
        layerProps={ layerProps }
        sidebarTabPosition="side"
        navigationControl="bottom-right"/>
    </div>
  )
}

const Config = [
  { name: 'Route Creation',
    icon: 'fa-duotone fa-road',
    path: "/route/creation",
    exact: true,
    auth: true,
    mainNav: false,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    component: RouteCreation
  },
  { name: 'Route Creation',
    icon: 'fa-duotone fa-road',
    path: "/route/creation/:routeId",
    exact: true,
    auth: true,
    mainNav: false,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    component: RouteCreation
  },
  { name: 'Route Creation',
    icon: 'fa-duotone fa-road',
    path: "/route/creation/folder/:folderId",
    exact: true,
    auth: true,
    mainNav: false,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    component: RouteCreation
  }
]

export default Config;
