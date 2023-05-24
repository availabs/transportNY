import React from "react"

import get from "lodash/get"
import { useParams } from "react-router-dom"

import {
  ScalableLoading,
  useFalcor
} from "~/modules/avl-components/src"

import {
  MultiLevelSelect
} from "~/sites/npmrds/components"

import TmcInfo from "./components/TmcInfo"
import DataCompletenessGrid from "./components/DataCompletenessGrid"
import MetricByPeaks from "./components/MetricByPeaks"

import {
  tmcAttributes
} from "./components/utils"

const YEARS = [2022, 2021, 2020, 2019, 2018, 2017, 2016]
const METRICS = [
  { name: "Speed", key: "speed" },
  { name: "Travel Time", key: "tt" }
]
const RESOLUTIONS = [
  { name: "Hour", key: "hour", bins: 12, density: 1 },
  { name: "15 Minutes", key: "15-min", bins: 3, density: 4 },
  { name: "5 Minutes", key: "5-min", bins: 1, density: 12 }
]
const SOURCES = [
  { name: "All Vehicles", key: "ALL" },
  { name: "Passenger Vehicles", key: "PASS" },
  { name: "Freight Trucks", key: "TRUCK" }
]
const DisplayAccessor = d => d.name;
const ValueAccessor = d => d.key;

const InitialState = {
  loading: 0,
  year: YEARS[0],
  metric: METRICS[0],
  resolution: RESOLUTIONS[0],
  source: "ALL"
}
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "update-state":
      return { ...state, ...payload };
    case "loading":
      return {
        ...state,
        loading: state.loading + payload.loading
      }
    default:
      return state;
  }
}

const Section = ({ children }) => {
  return (
    <div className="px-6 py-4 bg-white shadow-lg rounded-lg">
      { children }
    </div>
  )
}

const TmcPage = props => {

  const { falcor, falcorCache } = useFalcor();

  const { tmc } = useParams();

  const [state, dispatch] = React.useReducer(Reducer, InitialState);

  const loadingStart = React.useCallback(() => {
    dispatch({
      type: "loading",
      loading: 1
    })
  }, []);
  const loadingEnd = React.useCallback(() => {
    dispatch({
      type: "loading",
      loading: -1
    })
  }, []);

  const setYear = React.useCallback(year => {
    dispatch({
      type: "update-state",
      year
    })
  }, []);
  const setMetric = React.useCallback(metric => {
    dispatch({
      type: "update-state",
      metric
    })
  }, []);
  const setSource = React.useCallback(source => {
    dispatch({
      type: "update-state",
      source
    })
  }, []);
  const setResolution = React.useCallback(resolution => {
    dispatch({
      type: "update-state",
      resolution
    })
  }, []);

  const {
    loading,
    year,
    metric,
    source,
    resolution
  } = state;

  React.useEffect(() => {
    loadingStart();
    falcor.get(
      ["tmc", tmc, "year", year, "npmrds", source],
      ["tmc", tmc, "meta", year, tmcAttributes]
    ).then(() => loadingEnd())
  }, [falcor, tmc, year, source, loadingStart, loadingEnd]);

  return (
    <div className="py-4 max-w-6xl mx-auto grid grid-cols-12 gap-4">

      { !loading ? null :
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ScalableLoading />
        </div>
      }

      <div className="col-span-9 grid grid-cols-1 gap-4">

        <Section>
          <TmcInfo tmc={ tmc } year={ year }/>
        </Section>

        <Section>
          <DataCompletenessGrid tmc={ tmc } { ...state }/>
        </Section>

        <Section>
          <MetricByPeaks tmc={ tmc } { ...state }/>
        </Section>

      </div>

      <div className="col-span-3">
        <div className="sticky" style={ { top: "1rem" } }>
          <Section>
            <div className="grid grid-cols-1 gap-4">

              <div>
                <div className="border-b mb-1 font-bold">
                  Year
                </div>
                <MultiLevelSelect
                  options={ YEARS }
                  value={ year }
                  onChange={ setYear }
                  removable={ false }
                  DisplayItem={ DisplayItem }/>
              </div>

              <div>
                <div className="border-b mb-1 font-bold">
                  Metric
                </div>
                <MultiLevelSelect
                  options={ METRICS }
                  value={ metric }
                  displayAccessor={ DisplayAccessor }
                  onChange={ setMetric }
                  removable={ false }
                  DisplayItem={ DisplayItem }/>
              </div>

              <div>
                <div className="border-b mb-1 font-bold">
                  Data Source
                </div>
                <MultiLevelSelect
                  options={ SOURCES }
                  value={ source }
                  displayAccessor={ DisplayAccessor }
                  valueAccessor={ ValueAccessor }
                  onChange={ setSource }
                  removable={ false }
                  DisplayItem={ DisplayItem }/>
              </div>

              <div>
                <div className="border-b mb-1 font-bold">
                  Resolution
                </div>
                <MultiLevelSelect
                  options={ RESOLUTIONS }
                  value={ resolution }
                  displayAccessor={ DisplayAccessor }
                  onChange={ setResolution }
                  removable={ false }
                  DisplayItem={ DisplayItem }/>
              </div>

            </div>
          </Section>
        </div>
      </div>

    </div>
  )
}

const config = {
  name: 'TMC',
  path: "/tmc/:tmc",
  exact: true,
  auth: true,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'compact'
  },
  component: TmcPage
}

export default config;

const DisplayItem = ({ children, active, hasChildren }) => {
  return (
    <div style={ { minWidth: "10rem" } }
      className={ `
        py-1 px-2 flex items-center text-left
        ${ active ? "bg-gray-400" : "hover:bg-gray-300 bg-gray-200" }
      ` }
    >
      <div className="flex-1">{ children }</div>
      { !hasChildren ? null :
        <span className="fa fa-caret-right ml-2"/>
      }
    </div>
  )
}
