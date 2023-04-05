import React from "react"

import get from "lodash.get"
import styled from "styled-components"

// import { Button } from "components/common/styled-components"
import AvlModal from "components/AvlStuff/AvlModal"

import {
  Button,
  BooleanInput
} from "modules/avl-components/src"

import ItemSelector from 'components/common/item-selector/item-selector'
import Checkbox from "components/AvlMap/components/layerControl/checkboxFilter"

import {
  MultiLevelSelect
} from "sites/npmrds/components"

import { download as shpDownload } from 'utils/shp-write';
import { saveAs } from "file-saver"

import { ScalableLoading } from "components/loading/loadingPage"

import { useTheme, useFalcor} from '@availabs/avl-components'

class DataDownloader extends React.Component {
  timeout = null;
  state = {
    measures: [],
    metaVars: {},
    loading: false
  }
  componentDidMount() {
    if (window.localStorage) {
      const measures = JSON.parse(
        window.localStorage.getItem("default-measures") ||
        '["lottr", "tttr", "pti", "tti"]'
      );
      const metaVars = JSON.parse(
        window.localStorage.getItem("default-metaVars") ||
        `{
          "tmc": ["miles", "roadname", "aadt", "f_system", "nhs"],
          "ris": ["section_length", "road_name", "aadt_current_yr_est", "functional_class", "gis_id", "beg_mp"]
        }`
      )
      this.setState({ measures, metaVars });
    }
  }
  // componentDidUpdate(oldProps, oldState) {
  //   if (this.state.editing) {
  //     clearTimeout(this.timeout);
  //     this.timeout = setTimeout(() => this.setState({ editing: false }), 4000)
  //   }
  // }
  fetchFalcorDeps() {
    return this.props.falcor.get(["tmc", "metaInfo"], ["ris", "metaInfo"]);
  }
  makeFileName() {
    const { geoids, network, year, compareYear } = this.props;
    return `${ geoids.join("_") }_${ network }_${ year }${ compareYear !== "none" ? `_vs_${ compareYear }` : "" }`
  }
  downloadMeasures(selection) {
    const n = this.props.network,
      y = this.props.year;

    return this.props.falcor.chunk(
      ["conflation",
        n,
        selection,
        "data",
        [y, this.props.compareYear].filter(y => y !== "none"),
        this.state.measures
      ],
      [n, selection, 'meta', this.props.year,
        get(this.state, ["metaVars", n], [])
      ]
    ).then(() => {
      console.log('then downloadMeasures')
      this.saveDefaultMeasures()
    })
  }
  saveDefaultMeasures() {
    if (window.localStorage) {
      window.localStorage.setItem("default-measures", JSON.stringify(this.state.measures));
      window.localStorage.setItem("default-metaVars", JSON.stringify(this.state.metaVars));
    }
  }
  getMeasureProperties(n, y, cy, id) {
    const falcorCache = this.props.falcor.getCache()
    return this.state.measures.reduce((a, m) => {
      const toNaN = v => v === null ? NaN : +v,
        getValue = () => {
          const v = toNaN(get(falcorCache, ["conflation", n, id, "data", y, m], null));
          if (cy === "none") {
            return v;
          }
          const c = toNaN(get(falcorCache, ["conflation", n, id, "data", cy, m], null));
          return ((v - c) / c);
        };
      const v = getValue();
      if (!isNaN(v)) {
        a[m] = v;
      }
      if (cy === "none") {
        delete a.compare_year;
      }
      return a;
    }, { [n]: id, year: y, compare_year: cy })
  }
  getMetaVarProperties(n, y, id, props) {
    return get(this.state, ["metaVars", n], []).reduce((a, mv) => {
      const v = get(this.props.falcorCache, [n, id, "meta", y, mv], null);
      if (v) {
        a[mv] = v;
      }
      return a;
    }, props)
  }
  createFeatureCollection(selection) {
    const n = this.props.network,
      y = this.props.year,
      cy = this.props.compareYear;

   // console.log('createFeatureCollection', selection, this.getGeometry(selection[0]))
    const falcorCache = this.props.falcor.getCache()
    return {
      type: "FeatureCollection",
      features: selection.map(id => ({
        type: "Feature",
        geometry: get(falcorCache, [...this.props.layer.getGeomRequest(id), "value"], "FAILED"),
        properties: this.getMetaVarProperties(n, y, id, this.getMeasureProperties(n, y, cy, id))
      }))
    }
  }
  downloadShp() {
    this.setState({ loading: true });

    this.props.falcor.get(...this.props.layer.fetchRequestsForGeography())
    .then(() =>{
      const selection = this.props.layer.getSelectionForGeography();

      this.downloadMeasures(selection)
        .then(() => this.downloadGeometry(selection))
        .then(() => {
          let featureCollection = this.createFeatureCollection(selection);
          console.log('featureCollection', featureCollection)
          return shpDownload(featureCollection,
            { file: this.makeFileName(),
              folder: this.makeFileName(),
              types: { polyline: this.makeFileName() }
            },
            // aliasString,
            // tmcMetaString
          )
        }

        )
        .then(() => this.setState({ loading: false }));
    })
  }
  createCsv() {
    const selection = this.props.layer.getSelectionForGeography(),
      n = this.props.network,
      y = this.props.year,
      cy = this.props.compareYear,

      measures = this.state.measures,
      metaVars = get(this.state, ["metaVars", n], []),

      length = measures.length + metaVars.length;
      let fcache = this.props.falcor.getCache()

    return selection.map(id =>
      [id,
        ...measures.map(m => {
          const toNaN = v => v === null ? NaN : +v,
            getValue = () => {
              const v = toNaN(get(fcache, ["conflation", n, id, "data", y, m], null));
              if (cy === "none") {
                return v;
              }
              const c = toNaN(get(fcache, ["conflation", n, id, "data", cy, m], null));
              return ((v - c) / c);
            };
          const v = getValue();
          return isNaN(v) ? "" : v;
        }),
        ...metaVars.map(mv => get(fcache, [n, id, "meta", y, mv], "")),
      y, cy].slice(0, cy === "none" ? 2 + length : 3 + length).join(",")
    );
  }
  downloadCsv() {
    this.setState({ loading: true });
     this.props.falcor.get(...this.props.layer.fetchRequestsForGeography())
      .then(() =>{

      const n = this.props.network,
        selection = this.props.layer.getSelectionForGeography();
        console.log('download csv, selection.length', selection.length)


      this.downloadMeasures(selection)
        .then(() => {
          const rows = this.createCsv(),
            header = [this.props.network, ...this.state.measures, ...get(this.state, ["metaVars", n], []), "year"];
          if (this.props.compareYear !== "none") {
            header.push("compare year");
          }
          console.log('download csv rows', rows)
          rows.unshift(header.join(","))
          const blob = new Blob([rows.join("\n")], { type: "text/csv" });
          saveAs(blob, this.makeFileName() + '.csv');
        })
        .then(() => this.setState({ loading: false }));
      })
  }
  downloadGeometry(selection) {
    return this.props.falcor.chunk(this.props.layer.getGeomRequest(selection))
  }
  getGeometry(id) {
    //console.log(this.props.layer.getGeomRequest(id),this.props.falcorCache)
    return
  }

  addMeasure(m) {
    if (!this.state.measures.includes(m)) {
      const measures = [...this.state.measures, m];
      this.setState({ measures });
      return true;
    }
    return false;
  }

  addMetaVar(mv) {
    const metaVars = [...get(this.state, ["metaVars", this.props.network], [])];
    if (!metaVars.includes(mv)) {
      metaVars.push(mv);
      this.setState({ metaVars: { ...this.state.metaVars, [this.props.network]: metaVars } });
      return true;
    }
    return false;
  }
  removeMetaVar(mv) {
    const metaVars = get(this.state, ["metaVars", this.props.network], []).filter(m => m !== mv);
    this.setState({ metaVars: { ...this.state.metaVars, [this.props.network]: metaVars } });
  }

  showModal() {
    const measures = [...this.state.measures];
    if (!this.state.measures.includes(this.props.measure)) {
      measures.push(this.props.measure);
    }
    this.setState({ show: true, measures });
  }
  render() {
    let test = 1
    const { layer, theme } = this.props,

      metaVars = get(this.state, ["metaVars", this.props.network], []),
      metaGraph = get(this.props, ["falcorCache", this.props.network, "metaInfo", "value"], {});

      //console.log('render downloader', this.props.allMeasures)
    return (
      <div>
        { this.state.loading ?
            <div style={ { display: "flex", justifyContent: "center" } }>
              <ScalableLoading scale={ 0.75 }/>
            </div>
          :
            <Button className='bg-npmrds-800 hover:bg-cool-gray-700 font-sans text-sm text-npmrds-100 font-medium' onClick={ e => this.showModal() }
              style={ { width: "100%", marginTop: "10px" } }>
              Open Data Downloader
            </Button>
        }

        <AvlModal
          show={ this.state.show }
          theme={{sidePanelBG: '#242730'}}
          onHide={ e => this.setState({ show: false }) }

          actions={ [
            { label: "Download as .csv",
              action: this.downloadCsv.bind(this)
            },
            { label: "Download as .shp",
              action: this.downloadShp.bind(this)
            }
          ] }>
          <div className={`relative ${theme.sidebarBg}`} style={ { width: "60vw", height: "60vh" } }>
            <div className='flex w-full h-full'>
              <div className='p-2'>
                 <div><h4 className='text-xl font-bold text-teal-500'>Data Downloader</h4></div>
                 <div>
                  <div className='font-medium text-lg'>Network:</div>
                  <span>{ this.props.network }</span>
                </div>
                <div>
                  <div className='font-medium text-lg'>Year:</div>
                  <span>{ this.props.year }</span>
                </div>
                {this.props.compareYear === 'none' ? '' :
                <div>
                  <div className='font-medium text-lg'>Compare Year:</div>
                  <span>{ this.props.compareYear }</span>
                </div>
                }
              </div>
              <div className='w-full h-full flex'>
                <div className='flex flex-col flex-1 bg-npmrds-600 p-2'>
                  <div className='text-xl font-bold'>Selected Variables</div>
                  <div>
                    <div>Performance Measures</div>
                    <div>
                      <div style={ { display: "inline-block", flexDirection: "column" } }>
                        { this.state.measures.map(m =>
                          <Measure measure={ m } graph={ this.props.falcorCache } key={ m }
                            remove={ e => this.setState({ measures: this.state.measures.filter(msr => msr !== m) }) }/>) }
                      </div>
                    </div>
                  </div>
                  <div>
                    <span>Metadata</span>
                    <div>
                      <div>
                        { metaVars.map(mv =>
                          <MetaVar metaVar={ mv } graph={ metaGraph } key={ mv }
                            remove={ e => this.removeMetaVar(mv) }/>) }
                      </div>
                    </div>
                  </div>
                </div>
                <ControlDiv
                  addMeasure={ m => this.addMeasure(m) }
                  allMeasures={ this.props.allMeasures }
                  measures={ this.props.measures }
                  selected={ this.state.measures }
                  addMetaVar={ mv => this.addMetaVar(mv) }
                  metaVars={ metaVars }
                  metaGraph={ metaGraph }
                  network={this.props.network}
                  risAttributes={ this.props.risAttributes }
                  tmcAttributes={ this.props.tmcAttributes }
                  theme={theme}
                />
              </div>
            </div>
          </div>
        </AvlModal>

      </div>
    )
  }
}

const mapStateToProps = state => ({
  graph: state.graph
})
const mapDispatchToProps = {}

export const withHooksHOC = (Component: any) => {
  return (props: any) => {
    let { customTheme } = props
    if(!customTheme) {
      customTheme = {}
    }
    const theme =  { ...useTheme(), ...customTheme }
    const { falcor, falcorCache} = useFalcor();

    return <Component theme={theme} falcor={falcor} falcorCache={falcorCache} {...props} />;
  };
};

// export default withHooksHOC(connect(mapStateToProps, mapDispatchToProps)(reduxFalcor(DataDownloader)))
export default withHooksHOC(DataDownloader)

const ControlDivWidth = 400;

const ControlDivStyle = styled.div`
  color: ${ props => props.theme.textColorHl };
  width: ${ ControlDivWidth }px;
  height: 100%;


`
const INITIAL_STATE = {
  measure: null,
  useFreeflow: false,
  useRisAADT: false,
  showPerMiles: false,
  showVehicleHours: false,
  activeSubMeasures: [],
  peakDomain: [],
  peak: null,
  attribute: null,
  percentile: null
}

class ControlDiv extends React.Component {
  state = { ...INITIAL_STATE }
  setMeasure(m) {
    this.updateSubMeasures(m.value);
    this.setState({ measure: m });
  }
  updateSubMeasures(measure) {
    const activeSubMeasures = [];
    let peakDomain = [];

    switch (measure) {
      case "emissions":
        activeSubMeasures.push("peak", "risAADT");
        peakDomain = [
          { name: "No Peak", value: "none" },
          { name: "AM Peak", value: "am" },
          { name: "Off Peak", value: "off" },
          { name: "PM Peak", value: "pm" },
          { name: "Overnight", value: "overnight" },
          { name: "Weekend", value: "weekend" }
        ]
        break;
      case "RIS":
      case "TMC":
        activeSubMeasures.push("attributes");
        this.setState({ attribute: null });
        break;
      case "lottr":
        activeSubMeasures.push("peak");
        peakDomain = [
          { name: "No Peak", value: "none" },
          { name: "AM Peak", value: "am" },
          { name: "Off Peak", value: "off" },
          { name: "PM Peak", value: "pm" },
          { name: "Weekend", value: "weekend" }
        ]
        break;
      case "tttr":
        activeSubMeasures.push("peak");
        peakDomain = [
          { name: "No Peak", value: "none" },
          { name: "AM Peak", value: "am" },
          { name: "Off Peak", value: "off" },
          { name: "PM Peak", value: "pm" },
          { name: "Overnight", value: "overnight" },
          { name: "Weekend", value: "weekend" }
        ]
        break;
      case "phed":
        activeSubMeasures.push("peak", "freeflow", "risAADT", "perMiles", "vehicleHours");
        peakDomain = [
          { name: "No Peak", value: "none" },
          { name: "AM Peak", value: "am" },
          { name: "PM Peak", value: "pm" }
        ]
        break;
      case "ted":
        activeSubMeasures.push("freeflow", "risAADT", "perMiles", "vehicleHours");
        break;
      case "pti":
      case "tti":
        activeSubMeasures.push("peak");
        peakDomain = [
          { name: "No Peak", value: "none" },
          { name: "AM Peak", value: "am" },
          { name: "PM Peak", value: "pm" }
        ]
        break;
      case "pct_bins_reporting":
        activeSubMeasures.push("peak");
        peakDomain = [
          { name: "No Peak", value: "none" },
          { name: "AM Peak", value: "am" },
          { name: "Off Peak", value: "off" },
          { name: "PM Peak", value: "pm" },
          { name: "Overnight", value: "overnight" },
          { name: "Weekend", value: "weekend" }
        ]
      break;
      case "speed":
        activeSubMeasures.push("peak", "percentiles");
        peakDomain = [
          { name: "No Peak", value: "total" },
          { name: "AM Peak", value: "am" },
          { name: "Off Peak", value: "off" },
          { name: "PM Peak", value: "pm" },
          { name: "Overnight", value: "overnight" },
          { name: "Weekend", value: "weekend" }
        ]
        break;
    }
    this.setState({ activeSubMeasures, peakDomain })

    if (!activeSubMeasures.includes("attributes")) {
      this.setState({ attribute: null })
    }
    if (!activeSubMeasures.includes("speed")) {
      this.setState({ percentile: null })
    }
    if (!peakDomain.reduce((a, c) => a || (c.value === get(this.state.peak, "value", null)), false)) {
      if (measure === "speed") {
        this.setState({ peak: { name: "No Peak", value: "total" } });
      }
      else {
        this.setState({ peak: { name: "No Peak", value: "none" } });
      }
    }
    if ((measure !== "phed") && (measure !== "ted")) {
      this.setState({
        useFreeflow: false,
        showPerMiles: false,
        showVehicleHours: false
      });
    }
    if ((measure !== "phed") && (measure !== "ted") && (measure !== "emissions")) {
      this.setState({ useRisAADT: false });
    }
  }
  getMeasure() {
    const {
      measure,
      peak,
      useFreeflow,
      useRisAADT,
      showPerMiles,
      showVehicleHours,
      attribute,
      percentile
    } = this.state;
    return [
      get(measure, "value", null),
      useFreeflow && "freeflow",
      useRisAADT && "ris",
      showPerMiles && "per_mi",
      showVehicleHours && "vhrs",
      get(percentile, "value", null),
      get(peak, "value", null),
      get(attribute, "value", null)
    ].filter(v => Boolean(v) && (v !== "none")).join("_")
  }
  addMeasure() {
    this.updateSubMeasures(null);
    this.setState({ ...INITIAL_STATE });
    this.props.addMeasure(this.getMeasure());
  }
  render() {
    const { theme } = this.props
    // console.log('------control div render----------')
    // console.log('all measures includes this measure', this.getMeasure(), get(this.props,'allMeasures', []), !get(this.props,'allMeasures', []).includes(this.getMeasure()))
    // console.log('this measure is selected', this.getMeasure(), get(this.props,'selected', []),  get(this.props,'selected', []).includes(this.getMeasure()))
    // console.log('---------------------------------')
    return (
      <div className='flex w-80 flex-col  ml-2'>

        <div className={`bg-npmrds-600 flex-1 p-2 mb-2`}>
          <div >
            <div className='text-md font-medium'>Add Performance Measure</div>
            <Button
            onClick={ e => this.addMeasure() } large
            disabled={
              !get(this.props,'allMeasures', []).includes(this.getMeasure()) ||
              get(this.props,'selected', []).includes(this.getMeasure())
            }
            className='w-full'>
            Add Measure
          </Button>

            <div className='py-2'>
              <MultiLevelSelect
                value={ this.state.measure }
                options={ this.props.measures }
                isMulti={ false }
                searchable={ false }
                displayAccessor={ d => d.name }
                onChange={ v => this.setMeasure(v) }/>
            </div>
          </div>

          { !this.state.activeSubMeasures.includes("freeflow") ? null :
            <div>
              <Checkbox
                label="Use Freeflow"
                checked={ this.state.useFreeflow }
                onChange={ v => this.setState({ useFreeflow: v }) }/>
            </div>
          }

          { !this.state.activeSubMeasures.includes("risAADT") ? null :
            <div>
              <Checkbox
                label="Use RIS AADT"
                checked={ this.state.useRisAADT }
                onChange={ v => this.setState({ useRisAADT: v }) }/>
            </div>
          }

          { !this.state.activeSubMeasures.includes("perMiles") ? null :
            <div>
              <Checkbox
                label="Show Per Mile"
                checked={ this.state.showPerMiles }
                onChange={ v => this.setState({ showPerMiles: v }) }/>
            </div>
          }

          { !this.state.activeSubMeasures.includes("vehicleHours") ? null :
            <div>
              <Checkbox
                label="Show Vehicle Hours"
                checked={ this.state.showVehicleHours }
                onChange={ v => this.setState({ showVehicleHours: v }) }/>
            </div>
          }

          { !this.state.activeSubMeasures.includes("percentiles") ? null :
            <div>
              <div style={ { marginTop: "10px" } }>Percetile Selector</div>
              <ItemSelector
                selectedItems={ this.state.percentile }
                options={ [
                  { name: "5th Percentile", value: "5pctl" },
                  { name: "20th Percentile", value: "20pctl" },
                  { name: "25th Percentile", value: "25pctl" },
                  { name: "50th Percentile", value: "50pctl" },
                  { name: "75th Percentile", value: "75pctl" },
                  { name: "80th Percentile", value: "80pctl" },
                  { name: "95th Percentile", value: "95pctl" }
                ] }
                multiSelect={ false }
                searchable={ false }
                displayOption={ d => d.name }
                getOptionValue={ d => d }
                onChange={ v => this.setState({ percentile: v }) }/>
            </div>
          }

          { !this.state.activeSubMeasures.includes("peak") ? null :
            <div>
              <div style={ { marginTop: "10px" } }>Peak Selector</div>
              <ItemSelector
                selectedItems={ this.state.peak }
                options={ this.state.peakDomain }
                multiSelect={ false }
                searchable={ false }
                displayOption={ d => d.name }
                getOptionValue={ d => d }
                onChange={ v => this.setState({ peak: v }) }/>
            </div>
          }

          { !this.state.activeSubMeasures.includes("attributes") ? null :
            <div>
              <div style={ { marginTop: "10px" } }>Attribute Selector</div>
              <ItemSelector
                selectedItems={ this.state.attribute }
                options={ this.state.measure.value === "RIS" ? this.props.risAttributes : this.props.tmcAttributes }
                multiSelect={ false }
                searchable={ false }
                displayOption={ d => d.name }
                getOptionValue={ d => d }
                onChange={ v => this.setState({ attribute: v }) }/>
            </div>
          }


        </div>

        <div className='flex-1 bg-npmrds-600 p-2'>
          <div>
            <div className='text-md font-medium'>Add {this.props.network.toUpperCase()} Meta Variables</div>
            <ItemSelector
              selectedItems={ null }
              placeholder="Select a variable..."
              options={
                Object.keys(this.props.metaGraph)
                  .filter(mv => !this.props.metaVars.includes(mv))
                  .sort((a, b) => a < b ? -1 : a > b ? 1 : 0)
                  .reduce((a, c) => {
                    a.push({
                      key: c,
                      name: get(this.props.metaGraph, [c, "attrname"], c)
                    })
                    return a;
                  }, [])
              }
              multiSelect={ false }
              searchable={ false }
              displayOption={ d => d.name !== d.key ? `${ d.name } (${ d.key })` : d.key }
              getOptionValue={ d => d }
              onChange={ mv => this.props.addMetaVar(mv.key) }/>
          </div>
        </div>

      </div>
    )
  }
}

const MeasureStyle = styled.div`
  position: relative;
  display: block;
  padding: 2px 10px;

  border: 2px solid transparent;
  border-radius: 4px;
  :hover {
    border-color: #888;
  }
  > span.fa {
    display: none;
    position: absolute;
    top: -1px;
    left: 0;
    border-radius: 4px;
    padding: 4px 5px;
    cursor: pointer;
  }
  > span.fa:hover {
    color: ${ props => props.theme.sidePanelBg };
    background-color: ${ props => props.theme.textColor };
  }
  :hover > span.fa {
    display: inline;
  }
`
const Measure = ({ measure, graph, remove }) =>
  <MeasureStyle>
    <span className="fa fa-times"
      onClick={ remove }/>
    <span style={ { marginLeft: "30px" } }>
      { get(graph, ["pm3", "measureInfo", measure, "fullname"], measure) }
    </span>
  </MeasureStyle>
const MetaVar = ({ metaVar, graph, remove }) => {
  const attrname = get(graph, [metaVar, "attrname"], metaVar);
  return (
    <MeasureStyle>
      <span className="fa fa-times"
        onClick={ remove }/>
      <span style={ { marginLeft: "30px" } }>
        { attrname }{ metaVar !== attrname ? ` (${ metaVar })` : "" }
      </span>
    </MeasureStyle>
  )
}
