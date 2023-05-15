import React from "react";
import get from "lodash/get";

import {
  Select,
  useFalcor,
  getColorRange,
  Legend,
} from "~/modules/avl-components/src";

import {
  TransitSources,
  TransitLayers,
} from "~/pages/auth/Map/map-styles/transit";

import { LayerContainer } from "~/modules/avl-map/src";

const displayModes = {
  a: {
    domain: [5, 25, 50, 100, 300, 500, 1500],
    range: getColorRange(7, "Reds", true),
    format: ".2s",
  },
};

class TransitLayer extends LayerContainer {
  name = "Transit";
  sources = TransitSources;
  layers = TransitLayers;

  state = {
    activeStation: null,
    displayMode: "a",
    ...displayModes["a"],
  };

  onHover = {
    layers: [...TransitLayers.map((d) => d.id)],
    callback: (layerId, features, lngLat) => {
      let feature = features[0];
      const data = Object.keys(feature.properties).map((k) => [
        k,
        feature.properties[k],
      ]);

      data.push(["id", feature.id]);
      return data;
    },
  };

  onClick = {
    layers: [...TransitLayers.map((d) => d.id)],
    callback: (features, lngLat) => {
      let feature = features[0];
      console.log("click", feature, features);
      this.updateState({ activeStation: feature.s });
    },
  };

  setActiveStation = () => {};

  infoBoxes = [
    {
      Component: ({ layer }) => {
        return (
          <div>
            <Select
              options={[{ name: "Daily Average Bus Trips", v: "a" }]}
              valueAccessor={(d) => d.v}
              accessor={(d) => d.name}
              onChange={(d) => {
                layer.updateState({
                  displayMode: d,
                  ...displayModes[d],
                });
                layer.setDisplayMode(d);
              }}
              value={layer.state.displayMode}
              multi={false}
              searchable={false}
              removable={false}
            />
            <div className="py-2">
              <Legend
                domain={layer.state.domain}
                range={layer.state.range}
                format={layer.state.format}
                type={"threshold"}
              />
            </div>
            <div classname="w-full p-4 my-4">
              <div className="font-bold text-lg">
                Daily Average Trasit Trips
              </div>
              Derived by conflating gtfs data with the OSM network, this dataset
              shows the total number of busses which operate on each segement on
              an average day.
              <br /> <br />
              Each segment also includes a comma delimited list of transit
              agencies which operate on a segment and a list of routes which
              operate on that segment.
              <br /> <br />
            </div>
            <div classname="w-full py-2">
              <a
                className="py-2 px-16 mx-auto w-full bg-npmrds-800 hover:bg-cool-gray-700 font-sans text-sm text-npmrds-100 font-medium"
                href="/data/ris_conflation_transit_2020.zip"
                target="_blank"
              >
                Download as Shapefile
              </a>
            </div>
          </div>
        );
      },
    },
    {
      Component: ({ layer }) => (
        <div>
          <h4>{layer.state.activeStation}</h4>
        </div>
      ),
    },
  ];

  setDisplayMode = (displayMode) => {
    console.log(
      "set displayMode",
      ...this.state.domain.map((d, i) => [d, this.state.range[i]])
    );
    TransitLayers.forEach((d) => {
      this.mapboxMap.setPaintProperty(d.id, "line-color", {
        property: "total_bus",
        stops: [
          [0, "hsl(185, 0%, 27%)"],
          ...this.state.domain.map((d, i) => [d, this.state.range[i]]),
        ],
      });
    });
  };

  init(map, falcor) {}
  render(map) {
    this.setDisplayMode(this.state.displayMode);
  }
}

export const TransitLayerFactory = (options = {}) => new TransitLayer(options);
