import { falcorGraph } from "store/falcorGraph";

class FalcorWrapper {
  costructor() {
    this._refreshCache();
  }

  _refreshCache() {
    this.cache = falcorGraph.getCache();
  }

  async get(path) {
    await falcorGraph.get(path);

    await new Promise((resolve) => {
      setTimeout(() => {
        this._refreshCache();
        resolve();
      });
    });
  }
}

export default new FalcorWrapper();
