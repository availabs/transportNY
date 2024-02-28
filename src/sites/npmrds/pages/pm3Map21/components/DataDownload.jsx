import React from "react"

import get from "lodash/get"
import { saveAs } from "file-saver"

import {
  useFalcor
} from "~/modules/avl-components/src"

const PM3Measures = [
  "lottr_interstate",
  "lottr_noninterstate",
  "tttr_interstate",
  "phed"
]

const DataDownload = ({ geolevels, versions, loadingStart, loadingStop }) => {

  const [requests, setRequests] = React.useState([]);

  React.useEffect(() => {
    if (!geolevels.length && !versions.length) return;

    const requests = geolevels.reduce((a, c) => {
      const request = [
        "pm3", "versionedCalculations", "version",
        versions.map(v => v.version),
        "geolevel", c.geoid
      ]
      a.push(request);
      return a;
    }, []);

    setRequests(requests);

  }, [geolevels, versions]);

  const { falcor } = useFalcor();

  const download = React.useCallback(e => {
    if (!requests.length) return;
    const base = ["pm3", "versionedCalculations", "version"]
    loadingStart();
    requests.reduce((a, c) => {
      return a.then(() => falcor.get(c))
    }, Promise.resolve())
      .then(res => {
        const falcorCache = falcor.getCache();
        const data = geolevels.map(({ name, geoid }) => {
          const row = [
            name, geoid,
            ...versions.reduce((a, c) => {
              const d = get(falcorCache, [...base, c.version, "geolevel", geoid, "value"]);
              a.push(
                ...PM3Measures.map(m => get(d, m, null))
              )
              return a;
            }, [])
          ];
          return row;
        });
        data.unshift([
          "name", "geoid",
          ...versions.reduce((a, c) => {
            a.push(...PM3Measures.map(m => `${ m }_${ c.year }`))
            return a;
          }, [])
        ]);
        const csv = data.map(row => `"${ row.join('","') }"`).join("\n");
        saveAs(new Blob([csv]), "pm3measures.csv")
      })
      .then(() => loadingStop());
  }, [falcor, requests,  geolevels, versions, loadingStart, loadingStop]);

  return (
    <div>
      <button onClick={ download }
        disabled={ !requests.length }
        className={ `
          w-full text-center py-1 rounded bg-white
          hover:outline hover:outline-2 hover:outline-gray-300
        ` }
      >
        Download It All!!!
      </button>
    </div>
  )
}
export default DataDownload;
