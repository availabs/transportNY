import React from "react"
import { connect } from "react-redux"
import { reduxFalcor } from "utils/redux-falcor"

import get from "lodash.get"
import styled from "styled-components"

import { Button } from "components/common/styled-components"
import AvlModal from "components/AvlStuff/AvlModal"

import ItemSelector from 'components/common/item-selector/item-selector'
import Checkbox from "components/AvlMap/components/layerControl/checkboxFilter"

import { download as shpDownload } from 'utils/shp-write';
import { saveAs } from "file-saver"

import { falcorChunkerNice } from "store/falcorGraph"

import { ScalableLoading } from "components/loading/loadingPage"

// const StyledDiv = styled.div`
//   > * {
//     margin: 5px 0px;
//   }
// `

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
  componentDidUpdate(oldProps, oldState) {
    if (this.state.editing) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.setState({ editing: false }), 4000)
    }
  }
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

    return falcorChunkerNice(
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
    ).then(() => this.saveDefaultMeasures())
  }
  saveDefaultMeasures() {
    if (window.localStorage) {
      window.localStorage.setItem("default-measures", JSON.stringify(this.state.measures));
      window.localStorage.setItem("default-metaVars", JSON.stringify(this.state.metaVars));
    }
  }
  getMeasureProperties(n, y, cy, id) {
    return this.state.measures.reduce((a, m) => {
      const toNaN = v => v === null ? NaN : +v,
        getValue = () => {
          const v = toNaN(get(this.props.graph, ["conflation", n, id, "data", y, m], null));
          if (cy === "none") {
            return v;
          }
          const c = toNaN(get(this.props.graph, ["conflation", n, id, "data", cy, m], null));
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
      const v = get(this.props.graph, [n, id, "meta", y, mv], null);
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

    return {
      type: "FeatureCollection",
      features: selection.map(id => ({
        type: "Feature",
        geometry: this.getGeometry(id),
        properties: this.getMetaVarProperties(n, y, id, this.getMeasureProperties(n, y, cy, id))
      }))
    }
  }
  downloadShp() {
    this.setState({ loading: true });

    const selection = this.props.layer.getSelectionForGeography();

    this.downloadMeasures(selection)
      .then(() => this.downloadGeometry(selection))
      .then(() =>
        shpDownload(this.createFeatureCollection(selection),
          { file: this.makeFileName(),
            folder: "layers",
            types: { polyline: "polylines" }
          },
          // aliasString,
          // tmcMetaString
        )
      )
      .then(() => this.setState({ loading: false }));
  }
  createCsv() {
    const selection = this.props.layer.getSelectionForGeography(),
      n = this.props.network,
      y = this.props.year,
      cy = this.props.compareYear,

      measures = this.state.measures,
      metaVars = get(this.state, ["metaVars", n], []),

      length = measures.length + metaVars.length;

    return selection.map(id =>
      [id,
        ...measures.map(m => {
          const toNaN = v => v === null ? NaN : +v,
            getValue = () => {
              const v = toNaN(get(this.props.graph, ["conflation", n, id, "data", y, m], null));
              if (cy === "none") {
                return v;
              }
              const c = toNaN(get(this.props.graph, ["conflation", n, id, "data", cy, m], null));
              return ((v - c) / c);
            };
          const v = getValue();
          return isNaN(v) ? "" : v;
        }),
        ...metaVars.map(mv => get(this.props.graph, [n, id, "meta", y, mv], "")),
      y, cy].slice(0, cy === "none" ? 2 + length : 3 + length).join(",")
    );
  }
  downloadCsv() {
    this.setState({ loading: true });

    const n = this.props.network,
      selection = this.props.layer.getSelectionForGeography();

    this.downloadMeasures(selection)
      .then(() => {
        const rows = this.createCsv(),
          header = [this.props.network, ...this.state.measures, ...get(this.state, ["metaVars", n], []), "year"];
        if (this.props.compareYear !== "none") {
          header.push("compare year");
        }
        rows.unshift(header.join(","))
        const blob = new Blob([rows.join("\n")], { type: "text/csv" });
        saveAs(blob, this.makeFileName() + '.csv');
      })
      .then(() => this.setState({ loading: false }));
  }
  downloadGeometry(selection) {
    return falcorChunkerNice(this.props.layer.getGeomRequest(selection))
  }
  getGeometry(id) {
    return get(this.props.graph, [...this.props.layer.getGeomRequest(id), "value"], "FAILED")
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
    const { layer } = this.props,

      metaVars = get(this.state, ["metaVars", this.props.network], []),
      metaGraph = get(this.props, ["graph", this.props.network, "metaInfo", "value"], {});
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

        <AvlModal show={ this.state.show }
          onHide={ e => this.setState({ show: false }) }
          actions={ [
            { label: "Download as .csv",
              action: this.downloadCsv.bind(this)
            },
            { label: "Download as .shp",
              action: this.downloadShp.bind(this)
            }
          ] }>
          <div style={ { width: "80vw", height: "90vh", position: "relative" } }>
            <ControlDiv addMeasure={ m => this.addMeasure(m) }
              allMeasures={ this.props.allMeasures }
              measures={ this.props.measures }
              selected={ this.state.measures }
              addMetaVar={ mv => this.addMetaVar(mv) }
              metaVars={ metaVars }
              metaGraph={ metaGraph }
              risAttributes={ this.props.risAttributes }
              tmcAttributes={ this.props.tmcAttributes }/>
            <InfoDiv>
              <InfoBox>
                <span>Network:</span><span>{ this.props.network }</span>
              </InfoBox>
              <InfoBox>
                <span>Year:</span><span>{ this.props.year }</span>
              </InfoBox>
              <InfoBox>
                <span>Compare Year:</span><span>{ this.props.compareYear }</span>
              </InfoBox>
              <InfoBox>
                <span>Measures</span>
                <div>
                  <div style={ { display: "inline-block", flexDirection: "column" } }>
                    { this.state.measures.map(m =>
                      <Measure measure={ m } graph={ this.props.graph } key={ m }
                        remove={ e => this.setState({ measures: this.state.measures.filter(msr => msr !== m) }) }/>) }
                  </div>
                </div>
              </InfoBox>
              <InfoBox>
                <span>Meta Variables</span>
                <div>
                  <div>
                    { metaVars.map(mv =>
                      <MetaVar metaVar={ mv } graph={ metaGraph } key={ mv }
                        remove={ e => this.removeMetaVar(mv) }/>) }
                  </div>
                </div>
              </InfoBox>
            </InfoDiv>
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

export default connect(mapStateToProps, mapDispatchToProps)(reduxFalcor(DataDownloader))

const ControlDivWidth = 400;

const ControlDivStyle = styled.div`
  color: ${ props => props.theme.textColorHl };
  width: ${ ControlDivWidth }px;
  position: absolute;
  height: 100%;
  left: 0;
  top: 0;

  > div {
    border-radius: 4px;
    position: absolute;
    padding: 10px;
    border: 2px solid #888;
    height: calc(65% - 5px);
    width: 100%;
    left: 0;
    top: 0;
    margin-bottom: 5px;
  }
  > div:last-child {
    height: calc(35% - 5px);
    top: 65%;
    margin-top: 5px;
    margin-bottom: 0px;
  }
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
    return (
      <ControlDivStyle>

        <div>
          <div>
            <div>Performance Measures</div>
            <ItemSelector
              selectedItems={ this.state.measure }
              options={ this.props.measures }
              multiSelect={ false }
              searchable={ false }
              displayOption={ d => d.name }
              getOptionValue={ d => d }
              onChange={ v => this.setMeasure(v) }/>
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

          <Button 
            onClick={ e => this.addMeasure() } large
            disabled={
              !get(this.props,'allMeasures', []).includes(this.getMeasure()) ||
              get(this.props,'selected', []).includes(this.getMeasure())
            }
            style={ { position: "absolute", bottom: 10, width: "calc(100% - 20px)" } }>
            Add Measure
          </Button>
        </div>

        <div>
          <div>
            <div>TMC Meta Variables</div>
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

      </ControlDivStyle>
    )
  }
}
const InfoDiv = styled.div`
  width: calc(100% - ${ ControlDivWidth + 10 }px);
  height: 100%;
  border: 2px solid #888;
  border-radius: 4px;
  position: absolute;
  left: ${ ControlDivWidth + 10 }px;
  top: 0;
  display: flex;
  flex-direction: column;
  padding: 5px;
`
const InfoBox = styled.div`
  font-size: 18px;
  padding: 5px;
  > span:first-child {
    display: inline-block;
    width: 30%;font-weight: bold;
  }
  > span:last-child {
    display: inline-block;
    width: 30%;
  }
`
const MeasureStyle = styled.div`
  position: relative;
  display: block;
  padding: 2px 10px;
  margin-left: 30px;
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
