import get from "lodash.get";

const createSimpleSelector = (path) => (state) => get(state, path);

export default createSimpleSelector;
