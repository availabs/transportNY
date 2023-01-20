import React from 'react';
// import { reduxFalcor } from 'utils/redux-falcor';
import { avlFalcor } from "modules/avl-components/src"
import { connect } from 'react-redux';
import { withRouter } from "react-router-dom"

import styled from "styled-components"
import get from "lodash.get"
import deepequal from "deep-equal"

import GraphLayout from '../../components/GraphLayout'
import Sidebar from '../../components/Sidebar'

// import Modal from "components/AvlStuff/AvlModal"
import { Modal } from "sites/npmrds/components"
// import AvlTable from "components/AvlStuff/AvlTable"
// import { Input } from "components/common/styled-components"
// import ItemSelector from 'components/common/item-selector/item-selector';
import { Table, Input, Select, Button } from "modules/avl-components/src"

import { ControlBox, Control } from "sites/npmrds/pages/analysis/components/Sidebar/components/parts"

// import {
//   unregister,
//   needsUpdate
// } from "components/tmc_graphs/utils/DomainManager"
// import * as DomainManager from "components/tmc_graphs/utils/DomainManager"
import * as DomainManager from "sites/npmrds/pages/analysis/components/tmc_graphs/utils/DomainManager"

// import {
//   foldersFalcorRequest,
//   getFoldersFromState
// } from "pages/auth/MyStuff"

import * as stuff from "../store"
const {
  LOCAL_STORAGE_REPORT_KEY,
  RECENT_REGEX,
  replace,
  ...REDUX_ACTIONS
} = stuff;

class ReportBase extends React.Component {

  state = {
    viewing: true,
    previewing: false,
    isOpen: 0,
    showSaveModal: false,
    showTemplateModal: false,
    showLoadModal: false,
    loadData: {},
    highlightedTmcs: [],
    showTableModal: false,
    tableModalData: { data: [], keys: [] }
  }

  componentDidMount() {
    this.props.getDataDateExtent();
    this.props.resetState();

    const reportId = get(this.props, 'match.params.reportId', ""),
      templateId = get(this.props, 'match.params.templateId', ""),
      defaultType = get(this.props, 'match.params.defaultType', ""),
      routeId = get(this.props, 'match.params.routeId', ""),
      stationId = get(this.props, 'match.params.stationId', ""),
      path = get(this.props, 'match.path', "");

    const query = new URLSearchParams(this.props.location.search);

    if (reportId) {
      let loadReport = true;
      if (window.localStorage) {
        const key = `report-${ reportId }`,
          data = JSON.parse(window.localStorage.getItem(key));
        if (data) {
          loadReport = false;
          this.setState({
            showLoadModal: true,
            loadData: {
              key,
              data,
              onReject: () => this.props.loadReport(reportId)
            }
          });
        }
      }
      // console.log('load report', reportId)
      loadReport && this.props.loadReport(reportId);
    }
    else if (path === "/report/new") {
      const routeId = query.get("routeId");

      if (window.localStorage) {
        const key = LOCAL_STORAGE_REPORT_KEY,
          data = JSON.parse(window.localStorage.getItem(key)),
          onReject = () => routeId && this.props.addRouteComp(routeId.split("_"));
        if (data) {
          this.setState({
            showLoadModal: true,
            loadData: {
              key,
              data,
              onReject
            }
          });
        }
        else {
          onReject();
        }
      }
    }
    else if (path.includes("/report/new/route/") && routeId) {
      console.log("NEW REPORT:", routeId)
      this.props.loadRoutesForReport(
        routeId.split("_").filter(Boolean)
      );
    }
    else if (templateId && (routeId || stationId)) {
      this.props.loadRoutesAndTemplate(
        routeId.split("_").filter(Boolean),
        templateId,
        stationId.split("_").filter(Boolean)
      );
    }
    else if (defaultType && (routeId || stationId)) {
      this.props.loadRoutesAndTemplateByType(
        routeId.split("_").filter(Boolean),
        defaultType,
        stationId.split("_").filter(Boolean)
      );
    }
  }

  componentDidUpdate(oldProps, oldState) {
    const { owner, redirect, history } = this.props;

    if (redirect) {
      history.replace(redirect);
      this.updateReport({ redirect: false });
    }

    if (DomainManager.needsUpdate()) {
      this.forceUpdate();
    }
  }

  togglePreviewing() {
    this.setState({ previewing: !this.state.previewing });
  }

  highlightTmcs(tmcs) {
    this.setState((prevState, props) => {
      let highlightedTmcs = [...prevState.highlightedTmcs],
        setState = false;
      for (const tmc of tmcs) {
        if (!highlightedTmcs.includes(tmc)) {
          highlightedTmcs.push(tmc);
          setState = true;
        }
      }
      return setState ? { highlightedTmcs } : null;
    })
  }
  unhighlightTmcs(tmcs) {
    this.setState((prevState, props) => {
      let highlightedTmcs = [...prevState.highlightedTmcs],
        setState = false;
      for (const tmc of tmcs) {
        if (highlightedTmcs.includes(tmc)) {
          highlightedTmcs = highlightedTmcs.filter(_tmc => _tmc !== tmc);
          setState = true;
        }
      }
      return setState ? { highlightedTmcs } : null;
    })
  }
  setHighlightedTmcs(tmcs) {
    if (!deepequal(tmcs, this.state.highlightedTmcs)) {
      this.setState({ highlightedTmcs: tmcs });
    }
  }

  fetchFalcorDeps() {
    if (!this.props.user.authed) return Promise.resolve();

    return this.props.falcor
      .get(
        ['routes2', 'user', 'length'],
        ['templates2', 'user', 'length'],
        ['templates2', 'all', 'defaultTypes'],
        ['folders2', 'user', 'length'],
        ['hds', 'continuous', 'stations', 'length']
      )
      .then(res => {

        const requests = [],
          routes = get(res, 'json.routes2.user.length', 0),
          templates = get(res, 'json.templates2.user.length', 0),
          folders = get(res, 'json.folders2.user.length', 0),
          stations = get(res, 'json.hds.continuous.stations.length', 0);

        if (routes) {
          requests.push(
            ['routes2', 'user', 'index', { from: 0, to: routes - 1 },
              ['id', 'name']
            ]
          )
        }
        if (templates) {
          requests.push(
            ['templates2', 'user', 'index', { from: 0, to: templates - 1 },
              ['id', 'name', 'routes', 'stations']
            ]
          )
        }
        if (folders) {
          requests.push(
            ['folders2', 'user', 'index', { from: 0, to: folders - 1 },
              ['id', 'name', 'type']
            ]
          )
        }
        if (stations) {
          requests.push(
            ['hds', 'continuous', 'stations', 'byIndex', { from: 0, to: stations - 1 },
              ['stationId', 'muni', 'data_type', 'geom']
            ]
          )
        }
        if (requests.length) {
          return this.props.falcor.get(...requests)
            // .then(res => (console.log("RES:", res), res))
            .then(res => {
              const folderIds = [];
              for (let i = 0; i < folders; ++i) {
                const fid = get(res, ["json", "folders2", "user", "index", i, "id"], null);
                folderIds.push(fid);
              }
              if (folderIds.length) {
                return this.props.falcor.get(["folders2", "stuff", folderIds])
                  .then(res => {
                    const routes = folderIds.reduce((a, c) => {
                      const stuff = get(res, ["json", "folders2", "stuff", c], []);
                      a.push(...stuff.filter(s => s.stuff_type === "route").map(s => s.stuff_id));
                      return a;
                    }, [])
                    if (routes.length) {
                      return this.props.falcor.get(
                        ["routes2", "id", routes, ["id", "name"]]
                      )
                    }
                  })
              }
            })
        }
      })
  }

  updateReport(update) {
    this.props.updateReport(update);
  }
  saveReport(update, reportId = null) {
    this.props.saveReport(update, reportId)
      .then(() => this.hideSaveModal());
  }

  addRouteComp(routeId, settings = null) {
    this.props.addRouteComp(routeId, settings, true);
  }
  removeRouteComp(compId) {
    this.props.removeRouteComp(compId, true);
  }
  updateRouteCompSettings(compId, settings) {
    this.props.updateRouteCompSettings(compId, settings);
  }
  updateRouteComp(compId, update) {
    this.props.updateRouteComp(compId, update);
  }
  updateRouteCompColor(compId, color) {
    this.props.updateRouteCompColor(compId, color);
  }
  updateAllComponents() {
    this.props.updateAllComponents();
  }
  reorderRouteComps(srcIndex, dstIndex) {
    this.props.reorderRouteComps(srcIndex, dstIndex);
  }

  addStationComp(stationId) {
    this.props.addStationComp(stationId, true);
  }
  removeStationComp(compId) {
    this.props.removeStationComp(compId, true);
  }
  updateStationSettings(compId, update) {
    this.props.updateStationSettings(compId, update);
  }
  updateStation(compId, color) {
    this.props.updateStation(compId, color, true);
  }

  addGraphComp(type, layout = null, state = null) {
console.log("REPORT BASE ADD GRAPH COMP:", state)
    this.props.addGraphComp(type, layout, state);
  }
  removeGraphComp(index, graphId) {
    this.props.removeGraphComp(index, true);
  }
  updateGraphComp(index, update) {
    this.props.updateGraphComp(index, update);
  }

  onOpenOrClose(openOrClose) {
    this.setState({ isOpen: this.state.isOpen + openOrClose });
  }

  onLayoutChange(newLayouts) {
    this.props.onLayoutChange(newLayouts);
  }

  showSaveModal() {
    this.setState({ showSaveModal: true });
  }
  hideSaveModal() {
    this.setState({ showSaveModal: false });
  }

  showTemplateModal() {
    this.setState({ showTemplateModal: true });
  }
  hideTemplateModal() {
    this.setState({ showTemplateModal: false });
  }

  showLoadModal() {
    this.setState({ showLoadModal: true });
  }
  hideLoadModal() {
    const { onReject, key } = this.state.loadData;

    (typeof onReject === "function") && onReject();

    key && window.localStorage && window.localStorage.removeItem(key);

    this.setState({
      showLoadModal: false,
      loadData: {}
    });
  }
  loadFromStorage() {
    if (window.localStorage) {
      const { data } = this.state.loadData;
      this.props.loadReport(data);
    }
    this.setState({
      showLoadModal: false,
      loadData: {}
    });
  }

  loadTemplate(id) {
    this.props.loadTemplate(id);
  }
  saveTemplate(template, templateId) {
    return this.props.saveTemplate(template, templateId)
      .then(() => this.hideTemplateModal());
  }

  needsUpdate() {
    return this.props.route_comps.reduce((a, { compId, settings }) => {
      const SETTINGS = this.props.routeComponentSettings.get(compId);
      return a || this._needsUpdate(SETTINGS, settings);
    }, false) ||
    this.props.station_comps.reduce((a, c) =>
      a || !deepequal(c.settings, c.workingSettings)
    , false);
  }
  _needsUpdate(SETTINGS, settings) {
    return SETTINGS.startDate !== settings.startDate ||
      SETTINGS.endDate !== settings.endDate ||
      SETTINGS.startTime !== settings.startTime ||
      SETTINGS.endTime !== settings.endTime ||
      SETTINGS.resolution !== settings.resolution ||
      SETTINGS.dataColumn !== settings.dataColumn ||
      SETTINGS.compTitle !== settings.compTitle ||
      !deepequal(SETTINGS.weekdays, settings.weekdays) ||
      !deepequal(SETTINGS.overrides, settings.overrides);
  }

  showTableModal(data) {
    this.setState({ showTableModal: true, tableModalData: data });
  }
  hideTableModal() {
    this.setState({ showTableModal: false });
  }

  render () {

    const numRouteIds = [
      ...new Set(this.props.route_comps.map(rc => rc.routeId))
    ].length;

    const numStationIds = [
      ...new Set(this.props.station_comps.map(sc => sc.stationId))
    ].length;

    const templates = this.props.templates
        .filter(({ routes, stations }) =>
          (routes === numRouteIds) && (stations === numStationIds)
        );

    const isNetwork = this.props.route_comps
        .reduce((a, c) => a || (c.colltype === "network"), false);

    return (
      <div style={ { position: "relative" } }>

        <GraphLayoutContainer isOpen={ this.state.isOpen }>
          <div className="container mx-auto">

            { this.state.viewing ? null :
              <div className="grid grid-cols-10">
                <div className="col-span-7 flex items-center">
                  <TitleContainer>
                    { this.props.name }
                  </TitleContainer>
                </div>

                <div className="col-span-3">
                  <ControlBox className="grid grid-cols-2 gap-1 p-2">
                    <Control className="btn btn-sm btn-outline-primary"
                      onClick={ e=> this.togglePreviewing() }
                    >
                      <div className="px-1">
                        <span className="fa fa-eye mr-1"/>
                        { this.state.previewing ? "Show Controls" : "Hide Controls" }
                      </div>
                    </Control>
                    <div />
                    <Control className="btn btn-sm btn-outline-success"
                      onClick={ e => this.showSaveModal() }
                      disabled={
                        ((this.props.route_comps.length === 0) &&
                         (this.props.station_comps.length === 0)) ||
                        (this.props.graphs.length === 0)
                      }
                    >
                      <div className="px-1">
                        <span className="fa fa-file-text mr-1"/>
                        Save as Report
                      </div>
                    </Control>
                    <Control className="btn btn-sm btn-outline-success"
                      onClick={ e => this.showTemplateModal() }
                      disabled={
                        ((this.props.route_comps.length === 0) &&
                         (this.props.station_comps.length === 0)) ||
                        (this.props.graphs.length === 0) ||
                        isNetwork
                      }
                    >
                      <div className="px-1">
                        Save as Template
                        <span className="fa fa-gear ml-1"/>
                      </div>
                    </Control>
                  </ControlBox>
                </div>
              </div>
            }

            { !this.state.viewing ? null :
              <div style= { {
                  padding: "10px 20px",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  border: "solid 2px #dde2ec"
                } }>
                <TitleContainer>
                  { this.props.name }
                </TitleContainer>
                <DescriptionContainer>
                  { this.props.description }
                </DescriptionContainer>
              </div>
            }

            <GraphLayout
              viewing={ this.state.viewing }
              previewing={ this.state.previewing }
              routes={ this.props.routes }
              graphs={ this.props.graphs }
              updateRouteData={ this.props.updateRouteData }
              updateStationData={ this.props.updateStationData }
              updateGraphComp={ this.updateGraphComp.bind(this) }
              removeGraphComp={ this.removeGraphComp.bind(this) }
              addGraphComp={ this.addGraphComp.bind(this) }
              onLayoutChange={ this.onLayoutChange.bind(this) }
              highlightedTmcs={ this.state.highlightedTmcs }
              highlightTmcs={ this.highlightTmcs.bind(this) }
              unhighlightTmcs={ this.unhighlightTmcs.bind(this) }
              setHighlightedTmcs={ this.setHighlightedTmcs.bind(this) }
              showTableModal={ this.showTableModal.bind(this) }
              hideTableModal={ this.hideTableModal.bind(this) }
              colorRange={ this.props.colorRange }
              station_comps={ this.props.station_comps }/>

          </div>
        </GraphLayoutContainer>

        { this.state.viewing ? null :
          <Sidebar isOpen={ this.state.isOpen }
            graphs={ this.props.graphs }
            route_comps={ this.props.route_comps }
            routes={ this.props.routes }
            routeComponentSettings={ this.props.routeComponentSettings }
            onOpenOrClose={ this.onOpenOrClose.bind(this) }
            addGraphComp={ this.addGraphComp.bind(this) }
            removeGraphComp={ this.removeGraphComp.bind(this) }
            updateRouteCompSettings={ this.updateRouteCompSettings.bind(this) }
            updateRouteComp={ this.updateRouteComp.bind(this) }
            updateRouteCompColor={ this.updateRouteCompColor.bind(this) }
            updateAllComponents={ this.updateAllComponents.bind(this) }
            reorderRouteComps={ this.reorderRouteComps.bind(this) }
            needsUpdate={ this.needsUpdate() }
            removeRouteComp={ this.removeRouteComp.bind(this) }
            addRouteComp={ this.addRouteComp.bind(this) }
            dateExtent={ this.props.dateExtent }
            yearsWithData={ this.props.yearsWithData }
            availableRoutes={ this.props.availableRoutes }
            templates={ templates }
            loadTemplate={ this.loadTemplate.bind(this) }
            folders={ this.props.folders }
            selectColorRange={ this.props.selectColorRange }
            colorRange={ this.props.colorRange }
            availableStations={ this.props.availableStations }
            station_comps={ this.props.station_comps }
            addStationComp={ this.addStationComp.bind(this) }
            removeStationComp={ this.removeStationComp.bind(this) }
            updateStationSettings={ this.updateStationSettings.bind(this) }
            updateStation={ this.updateStation.bind(this) }
            reorderStationComps={ this.props.reorderStationComps }/>
        }

        <Modal isOpen={ this.state.showTableModal }
          close={ this.hideTableModal.bind(this) }
        >
          <div style={ { width: "95vw", maxHeight: "80vh" } }
            className="overflow-auto"
          >
            <TableWrapper rowsPerPage={ 288 }
              pageSpread={ 6 }
              showHelp={ true }
              { ...this.state.tableModalData }/>
          </div>
        </Modal>

        <ReportSaveModal show={ this.state.showSaveModal }
          onHide={ this.hideSaveModal.bind(this) }
          updateReport={ this.updateReport.bind(this) }
          saveReport={ this.saveReport.bind(this) }
          user={ this.props.user }
          reportId={ this.props.reportId }
          folders={ this.props.folders.filter(f => f.type !== "AVAIL") }
          report={ {
            name: this.props.name,
            description: this.props.description,
            folder: this.props.folder,
            colorRange: this.props.colorRange
          } }/>

        <TemplateModal show={ this.state.showTemplateModal }
          saveTemplate={ this.saveTemplate.bind(this) }
          templateId={ this.props.templateId }
          onHide={ this.hideTemplateModal.bind(this) }
          defaultTypes={ this.props.defaultTypes }
          user={ this.props.user }
          folders={ this.props.folders.filter(f => f.type !== "AVAIL") }
          template={ {
            name: this.props.name,
            description: this.props.description,
            folder: this.props.folder,
            colorRange: this.props.colorRange,
            defaultType: this.props.defaultType,
            saveYearsAsRecent: this.props.saveYearsAsRecent,
            route_comps: this.props.route_comps,
            graph_comps: this.props.graphs,
            station_comps: this.props.station_comps
          } }/>

        <LoadModal show={ this.state.showLoadModal }
          onHide={ this.hideLoadModal.bind(this) }
          loadFromStorage={ this.loadFromStorage.bind(this) }
          reportId={ this.state.loadData.reportId }/>

      </div>
    )
  }
}
// //
class EditReportClass extends ReportBase {
  constructor(props) {
    super(props);
    this.state.viewing = false;
    this.state.isOpen = 1;
  }
}
class ViewReportClass extends ReportBase {
  constructor(props) {
    super(props);
    this.state.viewing = true;
    this.state.isOpen = 0;
  }
}

const mapStateToProps = (state, props) => ({
  user: state.user,
  // availableRoutes: getAvailableRoutes(state, props),
  // templates: getTemplatesFromState(state),
  // defaultTypes: get(state, 'graph.templates.defaultTypes.value', []),
  // folders: getFoldersFromState(state),
  // availableStations: getStationsFromState(state, props),
  ...state.report
})

const mapDispatchToProps = {
  ...REDUX_ACTIONS
}

const mapCacheToProps = (falcorCache, props) => {
  return {
    availableRoutes: getAvailableRoutes(falcorCache),
    templates: getTemplates(falcorCache, props),
    folders: getFolders(falcorCache),
    availableStations: getStations(falcorCache),
    defaultTypes: get(falcorCache, ["templates2", "all", "defaultTypes", "value"], [])
  };
}

export const EditReport = connect(mapStateToProps, mapDispatchToProps)(withRouter(avlFalcor(EditReportClass, { mapCacheToProps })));
export const ViewReport = connect(mapStateToProps, mapDispatchToProps)(withRouter(avlFalcor(ViewReportClass, { mapCacheToProps })));

const GraphLayoutContainer = styled.div`
  overflow-y: auto;
  margin-left: ${ props => props.isOpen ? 300 : 0 }px;
  transition: margin-left 250ms;
  padding: 20px 0px;
  min-height: calc(100vh - 50px);
`

const TitleContainer = styled.div`
  font-size: 2rem;
  font-weight: bold;
`
const DescriptionContainer = styled.div`
  font-size: 1rem;
`

const HeaderControlBox = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: space-between;
  width: calc(100% - 4px);
  margin-left: 4px;

  > * {
    width: calc(50% - 2px);
    margin: 0px;
  }
  > *:nth-child(even) {
    margin-left: 4px;
  }
  > *:first-child,
  > *:nth-child(2) {
    margin-bottom: 4px;
  }
`

const getFolders = falcorCache => {

  const length = get(falcorCache, 'folders2.user.length', 0);
  const refs = [];

  for (let i = 0; i < length; ++i) {
    const ref = get(falcorCache, `folders2.user.index[${ i }].value`, null);
    if (ref !== null) {
      refs.push(ref);
    }
  }

  const folders = refs.map(ref => {
    const folder = { ...get(falcorCache, ref) };
    folder.stuff = get(falcorCache, ["folders2", "stuff", folder.id, "value"])
    return folder;
  })

  return folders;
}

const getAvailableRoutes = falcorCache => {

  const length = get(falcorCache, 'routes2.user.length', 0);
  const refs = [];

  for (let i = 0; i < length; ++i) {
    const ref = get(falcorCache, `routes2.user.index[${ i }].value`, null);
    if (ref !== null) {
      refs.push(ref);
    }
  }

  return refs.map(ref => ({
    ...get(falcorCache, ref)
  })).filter(Boolean);
}
const getTemplates = (falcorCache, props) => {

  const { yearsWithData } = props;
  const mostRecent = Math.max(...yearsWithData);

  const length = get(falcorCache, 'templates2.user.length', 0);
  const refs = [];

  for (let i = 0; i < length; ++i) {
    const ref = get(falcorCache, `templates2.user.index[${ i }].value`, null);
    if (ref !== null) {
      refs.push(ref);
    }
  }

  return refs.map(ref => {
    const template = get(falcorCache, ref);
    return { ...template };
  })
  .map(({ name, ...rest }) => ({
    ...rest,
    name: RECENT_REGEX.test(name) ? replace(name, mostRecent) : name
  }))
}
const getStations = falcorCache => {
  const length = get(falcorCache, 'hds.continuous.stations.length', 0),
    stationRefs = [],
    stations = [];

  for (let i = 0; i <= length; ++i) {
    const ref = get(falcorCache, ['hds', 'continuous', 'stations', 'byIndex', i, 'value'], null);
    if (ref) {
      stationRefs.push(ref);
    }
  }
  return stationRefs.reduce((a, c) => {
    const station = get(falcorCache, c, null);
    if (station) {
      a.push({ ...station });
    }
    return a;
  }, []);
}

const ReportInit = report => ({
  ...report
});
const ReportReducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "update":
      return { ...state, ...payload.update };
    case "reset":
      return { ...payload.state }
    default:
      return state;
  }
}

const ReportSaveModal = props => {
  const [state, dispatch] = React.useReducer(ReportReducer, props.report, ReportInit);
  const setState = React.useCallback(update => {
    dispatch({
      type: "update",
      update
    });
  }, []);

  React.useEffect(() => {
    if (!props.show && !deepequal(state, props.report)) {
      dispatch({
        type: "reset",
        state: { ...props.report }
      });
    }
  }, [props.show, props.report, state]);

  const cancel = React.useCallback(e => {
    props.onHide();
  }, [props.onHide]);

  const save = React.useCallback(() => {
    props.updateReport({ ...state });
    props.saveReport({ ...state }, props.reportId);
  }, [props.updateReport, props.saveReport, props.reportId, state]);

  const saveAs = React.useCallback(() => {
    props.updateReport({ ...state });
    props.saveReport({ ...state });
  }, [props.updateReport, props.saveReport, state]);

  const disabled = React.useMemo(() => {
    return !(state.name && state.folder);
  }, [state]);

  return (
    <Modal isOpen={ props.show }>
      <div style={ { width: "min(max(50vw, 500px), 75vw)" } }
        className="grid grid-cols-4 gap-1"
      >
        <label className="font-bold text-right" htmlFor="name">Title</label>
        <input type="text" id="name"
          className="px-2 py-1 border rounded col-span-3"
          onChange={ e => setState({ name: e.target.value }) }
          value={ state.name }/>

        <label className="font-bold text-right" htmlFor="description">Description</label>
        <textarea id="description"
          placeholder="enter a description..."
          className="px-2 py-1 border rounded col-span-3"
          onChange={ e => setState({ description: e.target.value }) }
          value={ state.description }
          rows="5"/>

        <label className="font-bold text-right">Folder</label>
        <div className="col-span-3">
          <Select options={ props.folders }
            accessor={ f => f.name }
            valueAccessor={ f => f.id }
            value={ state.folder }
            onChange={ id => setState({ folder: id })}/>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 border-t pt-4 mt-4">
        <Button onClick={ cancel }>
          Cancel
        </Button>
        <div className="grid grid-cols-2 gap-1 col-span-3">
          { !props.reportId ? <div /> :
            <Button disabled={ disabled }
              onClick={ save }
            >
              Save Changes
            </Button>
          }
          <Button disabled={ disabled }
            onClick={ saveAs }
          >
            Save as New Report
          </Button>
        </div>
      </div>
    </Modal>
  )
}

const TemplateInit = template => ({
  ...template
});
const TemplateReducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "update":
      return { ...state, ...payload.update };
    case "reset":
      return { ...payload.state }
    default:
      return state;
  }
}

const TemplateModal = props => {
  const [state, dispatch] = React.useReducer(TemplateReducer, props.template, TemplateInit);
  const setState = React.useCallback(update => {
    dispatch({
      type: "update",
      update
    });
  }, []);

  React.useEffect(() => {
    if (!props.show && !deepequal(state, props.template)) {
      dispatch({
        type: "reset",
        state: { ...props.template }
      });
    }
  }, [props.show, props.template, state]);

  const save = React.useCallback(() => {
    props.saveTemplate({ ...state }, props.templateId);
  }, [props.saveTemplate, props.templateId, state]);

  const saveAs = React.useCallback(() => {
    props.saveTemplate({ ...state });
  }, [props.saveTemplate, state]);

  const cancel = React.useCallback(e => {
    props.onHide();
  }, [props.onHide]);

  const disabled = false;

  return (
    <Modal isOpen={ props.show }>
      <div style={ { width: "min(max(50vw, 500px), 75vw)" } }
        className="grid grid-cols-4 gap-1"
      >
        <label className="font-bold text-right"
          htmlFor="name"
        >
          Title
        </label>
        <input type="text" id="name"
          className="px-2 py-1 border rounded col-span-3"
          onChange={ e => setState({ name: e.target.value }) }
          value={ state.name }/>

        <label className="font-bold text-right"
          htmlFor="description"
        >
          Description
        </label>
        <textarea id="description"
          placeholder="enter a description..."
          className="px-2 py-1 border rounded col-span-3"
          onChange={ e => setState({ description: e.target.value }) }
          value={ state.description }
          rows="5"/>

        <label className="font-bold text-right">Folder</label>
        <div className="col-span-3">
          <Select options={ props.folders }
            accessor={ f => f.name }
            valueAccessor={ f => f.id }
            value={ state.folder }
            onChange={ id => setState({ folder: id })}/>
        </div>

        <label className="font-bold text-right"
          htmlFor="recent"
        >
          Save Years As Recent
        </label>
        <div className="col-span-3">
          <input type="checkbox" id="recent"
            className="px-2 py-1 border rounded col-span-3"
            onChange={ e => setState({ saveYearsAsRecent: e.target.checked }) }
            checked={ state.saveYearsAsRecent }/>
        </div>
        { !get(props.user, 'groups', []).includes("AVAIL") ? null :
          <>
            <label className="font-bold text-right">Default Type</label>
            <Select options={ props.defaultTypes }
              value={ state.defaultType }
              onChange={ defaultType => setState({ defaultType }) }/>
          </>
        }

      </div>

      <div className="grid grid-cols-4 gap-1 border-t pt-4 mt-4">
        <Button onClick={ cancel }>
          Cancel
        </Button>
        <div className="grid grid-cols-2 gap-1 col-span-3">
          { !props.templateId ? <div /> :
            <Button disabled={ disabled }
              onClick={ save }
            >
              Save Changes
            </Button>
          }
          <Button disabled={ disabled }
            onClick={ saveAs }
          >
            Save as New Template
          </Button>
        </div>
      </div>
    </Modal>
  )
}

class TemplateModalOld extends React.Component {
  state = {
    ...this.props.report,
    defaultType: "none"
  }
  componentDidUpdate(oldProps) {
    const {
      defaultType,
      ...report
    } = this.state;
    if ((!this.props.show && !deepequal(report, this.props.report)) ||
        (oldProps.defaultTypes.length !== this.props.defaultTypes.length)) {
      this.setState({
        ...this.props.report,
        defaultType: this.props.defaultTypes.includes(this.props.templateId) && get(this.props.user, 'groups', []).includes("AVAIL") ? this.props.templateId : "none"
      });
    }
  }
  onChange(update) {
    if ((update.type === "personal") && (this.state.type !== "personal")) {
      update = {
        ...update,
        owner: this.props.user.id
      }
    }
    else if ((update.type === "group") && (this.state.type !== "group")) {
      update = {
        ...update,
        owner: this.props.user.groups[0]
      }
    }
    else if ((update.type === "public") && (this.state.type !== "public")) {
      update = {
        ...update,
        owner: this.props.user.id
      }
    }
    else if (update.defaultType && (update.defaultType !== "none")) {
      update = {
        ...update,
        type: "public",
        owner: this.props.user.id
      }
    }
    this.setState(update);
  }
  onSave() {
    return this.props.saveTemplate(this.state, this.props.templateId);
  }
  onSaveAs() {
    return this.props.saveTemplate(this.state);
  }

  render() {
    return (
      <Modal show={ this.props.show }
        onHide={ this.props.onHide }
        actions={
          [
            { label: this.props.templateId === null ? "Save Template" : "Save Changes",
              action: this.onSave.bind(this),
              type: "success" },
            { label: "Save As New Template",
              action: this.onSaveAs.bind(this),
              type: "success" }
          ].filter(({ label }) => (label !== "Save As New Template") || this.props.templateId)
        }>

        <div>
          <label>Template Title</label>
          <Input type="text"
            onChange={ e => this.onChange({ name: e.target.value }) }
            value={ this.state.name }/>
        </div>

        <div>
          <label>Template Description</label>
          <textarea placeholder="enter a description"
            onChange={ e => this.onChange({ description: e.target.value }) }
            value={ this.state.description }
            rows="5"/>
        </div>

        <div>
          <label>Template Type</label>
          <Select
            disabled={ this.state.defaultType !== "none" }
            multiSelect={ false }
            searchable={ false }
            selectedItems={ this.state.type }
            options={ ["personal", "group", "public"] }
            displayOption={ d => d }
            getOptionValue={ d => d }
            onChange={ type => this.onChange({ type }) }/>
        </div>

        <div>
          <label>Template Owner</label>
          <Select
            disabled={ (this.state.type === "personal") || (this.state.type === "public") }
            multiSelect={ false }
            searchable={ false }
            selectedItems={ this.state.owner }
            options={ [...this.props.user.groups] }
            displayOption={ d => this.state.type !== "group" ? "self" : d }
            getOptionValue={ d => d }
            onChange={ group => this.onChange({ group }) }/>
        </div>

        <div style={ {
            display: "flex",
            alignItems: "center"
          } }>
          <label style={ { width: "45%" } }>Save Years As Recent</label>
          <Input type="checkbox"
            style={ { height: "1.25rem", width: "1.25rem" } }
            checked={ this.state.saveYearsAsRecent }
            onChange={ e => this.onChange({ saveYearsAsRecent: e.target.checked }) }/>
        </div>

        { !get(this.props.user, 'groups', []).includes("AVAIL") ? null :
          <div>
            <label>Default Type</label>
            <Select
              multiSelect={ false }
              searchable={ false }
              selectedItems={ this.state.defaultType }
              options={ this.props.defaultTypes }
              displayOption={ d => d }
              getOptionValue={ d => d }
              onChange={ defaultType => this.onChange({ defaultType }) }/>
          </div>
        }

      </Modal>
    )
  }
}

const LoadModal = props => {
  const cancel = React.useCallback(e => {
    props.onHide();
  }, [props.onHide]);
  const load = React.useCallback(e => {
    props.loadFromStorage();
  }, [props.loadFromStorage]);
  return (
    <Modal isOpen={ props.show }>
      <div>
        <div>{ `You have unsaved data${ props.reportId ? ` for this report` : `` }.` }</div>
        <div>Do you wish to load your unsaved data?</div>
      </div>

      <div>
        { `Selecting [Cancel] will result in the lose of all unsaved data.` }
      </div>

      <div className="grid grid-cols-2 border-t pt-4 mt-4">
        <div className="">
          <Button onClick={ cancel }>
            Cancel
          </Button>
        </div>
        <div className="flex justify-end">
          <Button onClick={ load }>
            Load
          </Button>
        </div>
      </div>
    </Modal>
  )
}

const TableWrapper = ({ keys, data }) => {
  const columns = React.useMemo(() => {
    return keys.map(k => ({
      accessor: k,
      Header: k
    }))
  }, [keys])
  return (
    <Table data={ data }
      columns={ columns }
      disableFilters={ true }/>
  )
}
