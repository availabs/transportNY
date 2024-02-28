import { LayerContainer } from "~/modules/avl-map/src";

import get from "lodash/get"

class TmcLayer extends LayerContainer {
  sources = [
    { id: "tmc-geom",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        }
      }
    }
  ]
  layers = [
    { id: "tmc-layer",
      type: "line",
      source: "tmc-geom",
      layout: {
        "line-cap": "round"
      },
      paint: {
        "line-color": "#00c",
        "line-width": 8
      }
    }
  ]
  render(map) {
    const { bbox, geom } = this.props;
    if (bbox.length) {
      map.fitBounds(bbox, { padding: 75 });
    }
    if (geom) {
      map.getSource("tmc-geom").setData({
        type: "Feature",
        geometry: geom
      })
    }
  }
}

export default TmcLayer;
