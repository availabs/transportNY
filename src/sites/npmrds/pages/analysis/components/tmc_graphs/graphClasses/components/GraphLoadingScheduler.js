
const NEEDS_LOADING = []

const LOADING_GRAPHS = new Set()

const CONCURRENCY = 3;

const stopLoading = async id => {
  return new Promise(resolve => {
    LOADING_GRAPHS.delete(id);
    if (NEEDS_LOADING.length && (LOADING_GRAPHS.size < CONCURRENCY)) {
      const { id, func } = NEEDS_LOADING.pop();
      return resolve(startLoading(id, func));
    }
    return resolve();
  })
}

const startLoading = (id, func) => {
  LOADING_GRAPHS.add(id);
  return Promise.resolve(func())
    .then(() => stopLoading(id));
}

const addToQue = (id, func) => {
  NEEDS_LOADING.push({ id, func });
}

const getLoadingWrapper = (id, func) => {
  return new Promise(resolve => {
    if (LOADING_GRAPHS.size < CONCURRENCY) {
      resolve(startLoading(id, func));
    }
    else {
      resolve(addToQue(id, func));
    }
  })
}

class Scheduler {
  constructor() {
    this.request = this.request.bind(this);
  }
  request(graphId, func) {
    return getLoadingWrapper(graphId, func);
  }
}
export default Scheduler
