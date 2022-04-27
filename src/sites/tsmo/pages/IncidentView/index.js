import React from "react";

import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import {
  // extent as d3extent,
  groups as d3groups,
  range as d3range,
  rollup as d3rollup,
} from "d3-array";
import { format as d3format } from "d3-format";
import { scaleQuantize, scaleQuantile, scaleLinear } from "d3-scale";

import get from "lodash.get";

import {
  ThemeContext,
  useFalcor,
  useTheme,
  Select,
  GridTable,
  ScalableLoading,
  Button,
  getColorRange,
} from "modules/avl-components/src";

import THEME from "theme";

import TmcMap from "./components/Map";

import { GridGraph, generateTestGridData } from "modules/avl-graph/src";
import { BarGraph, generateTestBarData } from "modules/avl-graph/src";
import { LineGraph, generateTestLineData } from "modules/avl-graph/src";

import {
  capitalize,
  DelayFormat,
  useComponentDidMount,
} from "./components/utils";

const Columns = [
  { id: "key", accessor: (d) => d.key, Header: () => null, colSpan: 1 },
  { id: "value", accessor: (d) => d.value, Header: () => null, colSpan: 3 },
];

const rawDataKeys = [
  "Description",
  "Event Category",
  "Event Type",
  "Open Time",
  "Close Time",
  "Duration",
  "Vehicle Delay",
];
const rawDataSortValues = rawDataKeys.reduce((a, c, i) => {
  a[c] = i;
  return a;
}, {});
const rawDataSort = (a, b) => {
  return rawDataSortValues[a.key] - rawDataSortValues[b.key];
};

const getTableValue = (key, eData) => {
  switch (key) {
    case "event_category":
    case "event_type":
      return capitalize(eData[key]);
    case "open_time":
    case "close_time":
      return new Date(eData[key]).toLocaleString();
    default:
      return eData[key];
  }
};

const ColorRange = getColorRange(7, "RdYlGn");

const Weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const getNpmrdsDate = date =>
  +`${ date.getFullYear() }${ `00${ date.getMonth() + 1 }`.slice(-2) }${ `00${ date.getDate() }`.slice(-2) }`;

const makeNpmrdsRequestKeys = (eventData) => {
  const congestion_data = get(eventData, ["congestion_data", "value"], null);
  if (!congestion_data) {
    return [[], [], null];
  }
  const {
    dates,
    tmcDelayData,
    delay,
    vehicleDelay,
    branches
  } = congestion_data;

  const tmcArray = branches
    .sort((a, b) => a.branch.length - b.branch.length)
    .reduce((a, { branch }) => {
      branch.forEach((tmc) => {
        if (!a.includes(tmc)) {
          // && tmcs.includes(tmc)) {
          a.push(tmc);
        }
      });
      return a;
    }, []);

  const year = dates[0].slice(0, 4);

  const keys = dates.map(date => {
    const mDate = new Date(date),
      dow = mDate.getDay(),
      npmrdsDate = getNpmrdsDate(mDate);

    return [
      tmcArray,
      npmrdsDate,
      npmrdsDate,
      0,
      288,
      [Weekdays[dow]],
      "5-minutes",
      "travel_time_all",
      "travelTime",
      encodeURI(JSON.stringify({})),
      "ny"
    ].join("|");
  });

  keys.push([
    tmcArray,
    +`${year}0101`,
    +`${year}1231`,
    0,
    288,
    Weekdays.slice(1, 6),
    "5-minutes",
    "travel_time_all",
    "travelTime",
    encodeURI(JSON.stringify({})),
    "ny"
  ].join("|"));

  return [keys, tmcArray, year];
};

const getFF = (tmc, year, falcorCache) => {
  const fftt = get(
    falcorCache,
    ["pm3", "measuresByTmc", tmc, year, "freeflow_tt"],
    {}
  );

  if (fftt) {
    return fftt;
  }

  const { length, avg_speedlimit } = get(
    falcorCache,
    ["tmc", tmc, "meta", year],
    {}
  );

  return (length / avg_speedlimit) * 3600;
};

const expandData = (tmcs, year, requestKeys, falcorCache) => {
  return requestKeys.reduce((a, rk) => {
    const data = [...get(falcorCache, ["routes", "data", rk, "value"], [])];

    const tmcMap = d3rollup(
      data,
      (d) => d.pop(),
      (d) => d.tmc,
      (d) => +d.resolution
    );

    tmcMap.forEach((epochs, tmc) => {
      const domain = [],
        range = [];

      for (let e = 0; e < 288; ++e) {
        if (epochs.has(e)) {
          domain.push(e);
          range.push(epochs.get(e).value);
        } else if (e === 0 || e === 287) {
          const ff = getFF(tmc, year, falcorCache);
          if (ff) {
            domain.push(e);
            range.push(ff);
          }
        }
      }
      const scale = scaleLinear()
        .domain(domain)
        .range(range);

      for (let e = 0; e < 288; ++e) {
        if (!epochs.has(e)) {
          const row = {
            tmc,
            resolution: e,
            value: scale(e),
            interpolated: true,
          };
          data.push(row);
        }
      }
    });

    a[rk] = data;
    return a;
  }, {});
};

const branchSort = ((a, b) => {
  if (a.branch.length === b.branch.length) {
    return b.length - a.length;
  }
  return b.branch.length - a.branch.length;
})

const IncidentViewNew = ({}) => {
  const { event_id } = useParams(),
    { falcor, falcorCache } = useFalcor();

  const [activeBranches, setActiveBranches] = React.useState([null, null]);
  const setUpstreamBranch = React.useCallback(branch => {
    setActiveBranches(prev => [branch, prev[1]]);
  }, []);
  const setDownstreamBranch = React.useCallback(branch => {
    setActiveBranches(prev => [prev[0], branch]);
  }, []);

  const [requestKeys, setRequestKeys] = React.useState([]);

  const MOUNTED = useComponentDidMount();

  const [loading, setLoading] = React.useState(0);
  const loadingStart = React.useCallback(() => {
    MOUNTED && setLoading(prev => prev + 1);
  }, [MOUNTED]);
  const loadingStop = React.useCallback(() => {
    MOUNTED && setLoading(prev => prev - 1);
  }, [MOUNTED]);

  const [showRaw, setShowRaw] = React.useState(true);
  const toggleRaw = React.useCallback(() => {
    setShowRaw(prev => !prev);
  }, []);

  React.useEffect(() => {
    loadingStart();
    falcor.get([
      "transcom",
      "historical",
      "events",
      event_id,
      [
        "event_id",
        "congestion_data",
        "open_time",
        "geom",
        "duration",
        "close_time",
        "description",
        "event_category",
        "event_type",
      ],
    ]).then(() => loadingStop());
    // .then(res => console.log("RES:", res))
    // .catch(e => console.log("ERROR:", e));
  }, [event_id, loadingStart, loadingStop]);

  React.useEffect(() => {
    const eventData = get(
      falcorCache,
      ["transcom", "historical", "events", event_id],
      {}
    );
    const [requestKeys, tmcs, year] = makeNpmrdsRequestKeys(eventData);
    setRequestKeys(requestKeys);
    if (requestKeys.length) {
      loadingStart();
      falcor
        .get(
          ["routes", "data", requestKeys],
          ["tmc", tmcs, "meta", year, ["aadt", "length", "avg_speedlimit"]],
          ["pm3", "measuresByTmc", tmcs, year, "freeflow_tt"]
        )
        .then(() => loadingStop());
    }
  }, [falcorCache, event_id, loadingStart, loadingStop]);

  const [eventData, rawData, calculatedData] = React.useMemo(() => {
    const eData = get(
      falcorCache,
      ["transcom", "historical", "events", event_id],
      {}
    );

    const rData = Object.keys(eData)
      .filter((key) => rawDataKeys.includes(capitalize(key)))
      .map((key) => ({
        key: capitalize(key),
        value: getTableValue(key, eData),
      }))
      .sort(rawDataSort);

    const cData = [];

    const dKey = showRaw ? "rawDelay" : "delay";
    const vdKey = showRaw ? "rawVehicleDelay" : "vehicleDelay";

    const conData = get(eData, ["congestion_data", "value"], {}),
      delay = DelayFormat(get(conData, dKey, "No Data")),
      vDelay = DelayFormat(get(conData, vdKey, "No Data"));

    cData.push({
      key: "Vehicle Delay",
      value: (
        <div className="font-mono grid grid-cols-3 gap-1">
          <div className="text-right">{vDelay}</div>
          <div>(hh:mm:ss)</div>
        </div>
      ),
    });
    cData.push({
      key: "Delay",
      value: (
        <div className="font-mono grid grid-cols-3 gap-1">
          <div className="text-right">{delay}</div>
          <div>(hh:mm:ss)</div>
        </div>
      ),
    });

    const { eventTmcs = [], startTime, endTime, dates = [""] } = conData;

    cData.push({
      key: "Event TMCs",
      value: <EventTmcs tmcs={eventTmcs} year={dates[0].slice(0, 4)} />,
    });

    // cData.push({
    //   key: "Start Time",
    //   value: `${ epochFormat(startTime) } (epoch ${ startTime })`
    // })
    // cData.push({
    //   key: "End Time",
    //   value: `${ epochFormat(endTime) } (epoch ${ endTime })`
    // })

    return [eData, rData, cData];
  }, [event_id, falcorCache, showRaw]);

  const [upstreamBranches, downstreamBranches] = React.useMemo(() => {
    const conData = get(eventData, ["congestion_data", "value"], {}),
      { branches = [] } = conData;;

    if (!branches.length) {
      return [[], []];
    }

    const tmcKey = showRaw ? "rawTmcDelayData" : "tmcDelayData";

    const upBranches = branches
        .filter((b) => b.direction === "up-stream")
        .map(b => ({
          ...b,
          key: b.branch.join(", "),
          delay: b.branch.reduce((a, c) => a + get(conData, [tmcKey, c], 0), 0)
        }))
        .sort((a, b) => b.delay - a.delay);
    const downBranches = branches
        .filter((b) => b.direction === "down-stream")
        .map(b => ({
          ...b,
          key: b.branch.join(", "),
          delay: b.branch.reduce((a, c) => a + get(conData, [tmcKey, c], 0), 0)
        }))
        .sort((a, b) => b.delay - a.delay);

    return [upBranches, downBranches];
  }, [eventData, showRaw]);

  React.useEffect(() => {
    if (!activeBranches[0] && !activeBranches[1] && (upstreamBranches.length || downstreamBranches.length)) {
      setActiveBranches([
        get(upstreamBranches, [0, "key"], null),
        get(downstreamBranches, [0, "key"], null)
      ]);
    }
  }, [upstreamBranches, downstreamBranches, activeBranches]);

  const gridData = React.useMemo(() => {

    const cData = get(eventData, ["congestion_data", "value"], null);
    if (!cData) {
      return [];
    }

console.log("cData:", cData);

    const { dates, branches = [], tmcDelayData = {}, eventTmcs = [] } = cData;

    const year = dates[0].slice(0, 4);

    const branchMap = branches.reduce((a, c) => {
      a[c.branch.join(", ")] = c;
      return a;
    }, {})

    const upBranch = get(branchMap, activeBranches[0], { branch: [] });
    const downBranch = get(branchMap, activeBranches[1], { branch: [] });

    const tmcs = new Set([
      ...upBranch.branch,//.filter(tmc => Boolean(tmcDelayData[tmc])),
      ...downBranch.branch//.filter(tmc => Boolean(tmcDelayData[tmc]))
    ])

    const tmcMap = new Map();

    upBranch.branch.forEach((tmc) => {
      if (!tmcMap.has(tmc)) {
        tmcMap.set(tmc, -tmcMap.size);
      }
    });
    downBranch.branch.forEach((tmc) => {
      if (!tmcMap.has(tmc)) {
        tmcMap.set(tmc, tmcMap.size);
      }
    });

    const expandedData = expandData(tmcs, year, requestKeys, falcorCache);

    const dataDomain = requestKeys.reduce((a, c) => {
      const data = get(expandedData, c, [])
        .filter(({ tmc }) => tmcs.has(tmc))
        .map((d) => {
          const { tmc, value } = d;
          const length = get(falcorCache, ["tmc", tmc, "meta", year, "length"]);
          return length * (3600.0 / value);
        });
      a.push(...data);
      return a;
    }, []);

    // const colors = scaleQuantize()
    //   .domain(d3extent(dataDomain))
    //   .range(ColorRange);

    const _colors = scaleQuantile()
      .domain(dataDomain)
      .range(ColorRange);

    const colors = (v, i, d, x) => {
      const c = _colors(v);
      return d.interpolated.includes(x) ? `${c}88` : c;
    };

    const gData = requestKeys.reduce((a, c, i) => {

      const date = dates[i] || dates[0].slice(0, 4);

      const keys = d3range(288)
        .map(e => `${ date }|${ e }`);

      if ((i === 0) || (i === (requestKeys.length - 1))) {
        a.push({ data: [], keys, colors })
      }

      const data = get(expandedData, c, [])
        .filter(({ tmc }) => tmcs.has(tmc))
        .map((d) => {
          const { tmc, value } = d;
          const length = get(falcorCache, [
            "tmc",
            tmc,
            "meta",
            date.slice(0, 4),
            "length",
          ]);
          return {
            ...d,
            value: length * (3600.0 / value),
            length,
          };
        });

        const grouped = d3groups(data, (d) => d.tmc);

        a[a.length - 1].data.push(...grouped
          .map(([tmc, group]) => {
            return {
              index: tmc,
              height: get(
                falcorCache,
                ["tmc", tmc, "meta", date.slice(0, 4), "length"],
                1
              ),
              interpolated: group.reduce((a, c) => {
                if (c.interpolated) {
                  a.push(`${ date }|${ c.resolution }`);
                }
                return a;
              }, []),
              ...group.reduce((a, c) => {
                a[`${ date }|${ c.resolution }`] = c.value;
                return a;
              }, {}),
            };
          })
          .sort((a, b) => tmcMap.get(a.index) - tmcMap.get(b.index)));

        return a;

      }, []);

      const keys1 = dates.reduce((a, c) => {
        d3range(288). forEach(e => {
          a.push(`${ c }|${ e }`);
        });
        return a;
      }, [])

      const diffData = { keys: keys1, data: [] },
        indexMap = new Map(),
        keySets = [],
        diffDomain = [];

      get(gData, [0, "data"], []).forEach(({ index, height, ...rest }, i) => {
        indexMap.set(index, i);
        const dData = { index, height };
        keySets.push(new Set());
        keys1.forEach((k) => {
          if (k in rest) {
            keySets[i].add(k);
            dData[k] = rest[k];
          }
        });
        diffData.data.push(dData);
      });

      const keys2 = d3range(288).map(e => `${ dates[0].slice(0, 4) }|${ e }`);

      get(gData, [1, "data"], []).forEach(({ index, height, ...rest }) => {
        if (!indexMap.has(index)) return;
        const i = indexMap.get(index);
        keys1.forEach((k1, ii) => {
          const k2 = keys2[ii % 288];
          if ((k2 in rest) && keySets[i].has(k1)) {
            keySets[i].delete(k1);
            diffData.data[i][k1] -= rest[k2];
            diffDomain.push(diffData.data[i][k1]);
          }
        });
      });

      keySets.forEach((set, i) => {
        set.forEach((k) => delete diffData.data[i][k]);
      });

      diffData.colors = scaleQuantile()
        .domain(diffDomain)
        .range(ColorRange);

      gData.push(diffData);

    return gData.map((gData, i) => ({
      gData,
      label:
        i === 0
          ? "Event Speeds"
          : i === 1
          ? "Yearly Avg. Speeds"
          : "Speed Differences",
    }));
  }, [requestKeys, eventData, falcorCache, activeBranches]);

  const points = React.useMemo(() => {
    const cData = get(eventData, ["congestion_data", "value"], null);
    if (!cData) {
      return [[], []];
    }
    const { startTime, endTime, eventTmcs, dates } = cData;

    return [
      [...eventTmcs.map((tmc) => ({
        index: tmc,
        key: `${ dates[0] }|${ startTime }`,
        spanTo: `${ dates[dates.length - 1] }|${ endTime }`,
        strokeWidth: 2,
        stroke: "#0cf",
      })),
      ...eventTmcs.map((tmc) => ({
        index: tmc,
        key: `${ dates[dates.length - 1] }|${ endTime }`,
        strokeWidth: 2,
        stroke: "#0cf",
      }))],
      [/*...eventTmcs.map((tmc) => ({
        index: tmc,
        key: `${ dates[0].slice(0, 4) }|${ startTime }`,
        spanTo: `${ dates[0].slice(0, 4) }|${ endTime }`,
        strokeWidth: 2,
        stroke: "#0cf",
      })),
      ...eventTmcs.map((tmc) => ({
        index: tmc,
        key: `${ dates[0].slice(0, 4) }|${ endTime }`,
        strokeWidth: 2,
        stroke: "#0cf",
      }))*/]
    ];
  }, [eventData]);

  const bounds = React.useMemo(() => {
    const cData = get(eventData, ["congestion_data", "value"], null);
    if (!cData) {
      return [[], []];
    }
    const { tmcBounds } = cData;

    const bounds1 = [], bounds2 = [];

    for (const tmc in tmcBounds) {
      bounds1.push({
        index: tmc,
        bounds: tmcBounds[tmc].map(b => b.join("|")),
        strokeWidth: 2,
        stroke: "#0cf",
      });
      // bounds2.push({
      //   index: tmc,
      //   bounds: tmcBounds[tmc].map(b => [b[0].slice(0, 4), b[1]].join("|")),
      //   strokeWidth: 2,
      //   stroke: "#0cf",
      // });
    }

    return [bounds1, bounds2];
  });

  const mapData = React.useMemo(() => {
    let mData = {
      tmcs: [],
      ways: [],
      year: null,
      point: null,
      eventData,
    };
    if (!eventData) {
      return mData;
    }
    const congestionData = get(eventData, ["congestion_data", "value"], null);
    if (!congestionData) {
      return mData;
    }

    const branchMap = congestionData.branches.reduce((a, c) => {
      a[c.branch.join(", ")] = c;
      return a;
    }, {})

    const upBranch = get(branchMap, activeBranches[0], { branch: [], ways: [] });
    const downBranch = get(branchMap, activeBranches[1], { branch: [], ways: [] });

    // const upBranch = get(activeBranches, 0, { branch: [], ways: [] });
    // const downBranch = get(activeBranches, 1, { branch: [], ways: [] });

    mData.tmcs = [...new Set([...upBranch.branch, ...downBranch.branch])];
    mData.ways = [...new Set([...upBranch.ways, ...downBranch.ways])].map((id) => +id);

    const open_time = new Date(eventData.open_time);
    mData.year = open_time.getFullYear();

    mData.point = get(eventData, ["geom", "value"], null);

    return mData;
  }, [eventData, activeBranches]);

  return (
    <ThemeContext.Provider value={THEME}>
      <div className={`py-6 ${THEME.bg} min-h-screen`}>
        <div
          className={`
          fixed left-0 top-0 right-0 bottom-0 ${loading ? "flex" : "hidden"}
          justify-center items-center z-50 bg-black opacity-50
        `}
        >
          <ScalableLoading />
        </div>

        <div className={`mx-8 p-4 bg-white shadow ${THEME.text}`}>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-3xl font-bold border-b-4 col-span-2">
              TRANSCOM EVENT ID: {event_id}
            </div>

            <div>
              <div className="grid col-spans-1 gap-2">
                <div className="font-bold text-2xl border-b-2">Event Data</div>
                <div className="grid grid-cols-4 gap-2 text-lg">
                  {rawData.map(({ key, value }) => (
                    <React.Fragment key={key}>
                      <div className="col-span-1 font-bold">{key}</div>
                      <div className="col-span-3">{value}</div>
                    </React.Fragment>
                  ))}
                </div>

                <div className="font-bold text-2xl border-b-2 grid grid-cols-3">
                  <div className="col-span-2">
                    Calculated Data ({ showRaw ? "unfilled" : "filled" })
                  </div>
                  <div className="col-span-1">
                    <Button block onClick={ toggleRaw }>
                      Toggle Data
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-lg">
                  {calculatedData.map(({ key, value }) => (
                    <React.Fragment key={key}>
                      <div className="col-span-1 font-bold">{key}</div>
                      <div className="col-span-3">{value}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ minHeight: "40rem" }}>
              <TmcMap {...mapData} showRaw={ showRaw }/>
            </div>

            <div className="col-span-1">
              <div className="font-bold text-xl border-b-2 mb-1">
                Up Stream Branches
              </div>
              <Select options={ upstreamBranches }
                value={ activeBranches[0] }
                accessor={ d => d.key }
                valueAccessor={ d => d.key }
                onChange={ setUpstreamBranch }/>
            </div>
            <div className="col-span-1">
              <div className="font-bold text-xl border-b-2 mb-1">
                Down Stream Branches
              </div>
              <Select options={ downstreamBranches }
                value={ activeBranches[1] }
                accessor={ d => d.key }
                valueAccessor={ d => d.key }
                onChange={ setDownstreamBranch }/>
            </div>

            {!gridData.length
              ? null
              : gridData.map(({ gData, label }, i) => (
                  <div
                    key={i}
                    className={`
                  col-span-2
                `}
                  >
                    <div className="font-bold text-2xl border-b-2 mb-1">
                      {label}
                    </div>
                    <div
                      style={{
                        height: `${Math.max(gData.data.length * 1.25, 20)}rem`,
                      }}
                    >
                      <GridGraph
                        {...gData}
                        showAnimations={false}
                        margin={{ top: 5, right: 5, bottom: 25, left: 75 }}
                        axisBottom={{
                          format: epochFormat,
                          tickDensity: 0.5,
                        }}
                        points={ points[i % 2] }
                        bounds={ bounds[i % 2] }
                        axisLeft={true}
                        hoverComp={{
                          HoverComp: GridHoverComp,
                          valueFormat: (v) =>
                            isNaN(String(v))
                              ? "No Data"
                              : `${Math.round(v)} MPH`,
                          keyFormat: epochFormat,
                        }}
                      />
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
};
// const mapStateToProps = (state) => ({});
//
// const IncidentView = connect(mapStateToProps)(IncidentViewNew);

const EventTmcs = ({ tmcs, year }) => {
  return (
    <div>
      {tmcs.map((tmc) => (
        <EventTmc key={tmc} tmc={tmc} year={year} />
      ))}
    </div>
  );
};
const dFormat = d3format(",d"),
  fFormat = d3format(",.2f"),
  dirFormat = {
    N: "northbound",
    S: "southbound",
    E: "eastbound",
    W: "westbound",
  };
const EventTmc = ({ tmc, year }) => {
  const { falcor, falcorCache } = useFalcor();
  React.useEffect(() => {
    falcor.get([
      "tmc",
      tmc,
      "meta",
      year,
      ["aadt", "length", "direction", "roadname"],
    ]);
  }, [falcor]);
  return (
    <div className="grid grid-cols-3">
      <div className="border-b col-span-3 font-bold">{tmc}</div>
      <div className="col-span-3 grid grid-cols-12 gap-1">
        <div className="col-span-3 font-bold">Road Name:</div>
        <div className="col-span-6 text-right font-mono">
          {get(falcorCache, ["tmc", tmc, "meta", year, "roadname"], null)}
        </div>
        <div className="col-span-3">
          {
            dirFormat[
              get(falcorCache, ["tmc", tmc, "meta", year, "direction"], null)
            ]
          }
        </div>
      </div>
      <div className="col-span-3 grid grid-cols-12 gap-1">
        <div className="col-span-3 font-bold">AADT:</div>
        <div className="col-span-6 text-right font-mono">
          {dFormat(get(falcorCache, ["tmc", tmc, "meta", year, "aadt"], null))}
        </div>
      </div>
      <div className="col-span-3 grid grid-cols-12 gap-1">
        <div className="col-span-3 font-bold">Length:</div>
        <div className="col-span-6 text-right font-mono">
          {fFormat(
            get(falcorCache, ["tmc", tmc, "meta", year, "length"], null)
          )}
        </div>
        <div>miles</div>
      </div>
    </div>
  );
};

const epochFormat = (de) => {
  const [d, e] = de.split("|");
  const m = e * 5;
  let hour = Math.floor(m / 60);
  const am = hour < 12 ? "am" : "pm";
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }
  return `${ d } ${hour}:${`0${m % 60}`.slice(-2)}${am}`;
};

const GridHoverComp = ({ data, indexFormat, keyFormat, valueFormat }) => {
  const theme = useTheme();
  const indexes = get(data, "indexes", []);
  const cols = Math.max(2, Math.ceil(indexes.length / 20));
  return (
    <div
      className={`
        grid grid-cols-${cols}
        grid-flow-col gap-1 px-2 pt-1 pb-2 rounded
        ${theme.accent1}
      `}
      style={{
        gridTemplateRows: `repeat(${Math.ceil(indexes.length / cols) +
          1}, minmax(0, 1fr))`,
      }}
    >
      <div
        className={`
        font-bold text-lg leading-6 border-b-2 pl-2 col-span-${cols}
      `}
      >
        {keyFormat(get(data, "key", null))}
      </div>
      {indexes.map((i) => (
        <div
          key={i}
          className={`
            flex items-center px-2 rounded transition
          `}
        >
          <div
            className="mr-2 rounded-sm color-square w-5 h-5"
            style={{
              backgroundColor: get(data, ["indexData", i, "color"], null),
              opacity: data.index === i ? 1 : 0.2,
            }}
          />
          <div className="mr-4">{indexFormat(i)}:</div>
          <div className="text-right flex-1">
            {valueFormat(get(data, ["indexData", i, "value"], 0))}
          </div>
        </div>
      ))}
    </div>
  );
};

const config = {
  name: "Incident View",
  path: '/incidents/:event_id',
  auth: false,
  exact: true,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  auth: true,
  component: IncidentViewNew
}

export default config;
