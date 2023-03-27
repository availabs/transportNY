import get from "lodash.get"

import { VERSION } from "./ConflationStyles"

export default class WayCache {
  constructor() {
    this.cache = new Map();

    this.getWays = this.getWays.bind(this);
  }

  getWays(falcor, markers, year) {
    if (markers.length < 2) {
      return Promise.resolve({ ways: [], tmcs: [] });
    }

    // const url = `https://routing.availabs.org/0_4_2/route`;

    const version = `?conflation_map_version=${ year }_v${ VERSION }`;
    // const url = `https://routing2.availabs.org/route${ version }`;
    const url = `https://routing2.availabs.org/route${ version }&return_tmcs=1`;

    const locations = markers.map(m => {
      const p = m.getLngLat();
      return {
        lon: p.lng,
        lat: p.lat
      }
    });

    const key = JSON.stringify(locations);
    if (this.cache.has(key)) {
      return Promise.resolve(this.cache.get(key));
    }

    return fetch(url, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrer: 'no-referrer',
      body: JSON.stringify({ locations })
    })
    .then((res, error) => {
      if (error) return [];
      return res.json();
    })
    .then(res => {
      return { tmcs: get(res, "ways", []), ways: [] };
      return get(res, "ways", []);
    })
    // .then(ways => {
    //   return falcor.call(["conflation", "tmcs", "from", "ways"], [ways, [year]])
    //     .then(res => {
    //       const tmcs = get(res, ["json", "conflation", "tmcs", "from", "ways", year], []);
    //       this.cache.set(key, { ways, tmcs })
    //       return { ways, tmcs };
    //     });
    // })
  }
}
