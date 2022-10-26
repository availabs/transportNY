// SEE: https://moleculer.services/docs/0.14/context.html

// FIXME: Need to decide how to handle getState and setState
//        Simple cloneDeep means cloned/spawned contexts mutate original.

import { useState, useRef, createContext } from "react";
import { assign, cloneDeep, isEqual, merge, omit } from "lodash";

import { v4 as uuid } from "uuid";

const selectorPrefixLength = "select".length;

export function selectors2props(ctx) {
  const { getState, selectors } = ctx;

  const state = getState();

  const selectorNames = Object.keys(selectors);

  const props = selectorNames.reduce((acc, selName) => {
    const name =
      selName.charAt(selectorPrefixLength).toLowerCase() +
      selName.slice(selectorPrefixLength + 1);

    acc[name] = selectors[selName](state);

    return acc;
  }, {});

  return props;
}

export function extractPropertiesFromEtlCtx(ctx, deps) {
  const { selectors, getState } = ctx;

  const selectorsSet = new Set(Object.keys(selectors));

  const state = getState();

  // CONVENTION: camelCase selectos and deps
  const depProps = deps.reduce((acc, dep) => {
    const depSelector = `select${dep.charAt(0).toUpperCase()}${dep.slice(1)}`;

    if (selectorsSet.has(depSelector)) {
      const selector = selectors[depSelector];
      acc[dep] = selector(state);
    }

    return acc;
  }, {});

  return depProps;
}

export function extractPropertiesFromEtlContextHierarchy(ctx, deps) {
  let curCtx = ctx;

  let unresolvedDeps = deps;

  const props = {};

  while (curCtx && unresolvedDeps.length) {
    const depProps = extractPropertiesFromEtlCtx(curCtx, unresolvedDeps);

    merge(props, depProps);

    unresolvedDeps = unresolvedDeps.filter((dep) => props[dep] === undefined);

    curCtx = curCtx.parentCtx;
  }

  return props;
}

export function useEtlContextDependencies(_ctx, deps) {
  const { current: ctx } = useRef(_ctx);
  const [dependencies] = useState(deps.slice());

  const prevSliceRef = useRef({});
  const { current: prevSlice } = prevSliceRef;

  // console.log("===== useEtlContextDependencies:", _ctx.name, "=====");

  const newSlice = extractPropertiesFromEtlContextHierarchy(ctx, deps);

  // console.log({ deps, prevSlice, newSlice });

  for (const dep of dependencies) {
    if (!isEqual(prevSlice[dep], newSlice[dep])) {
      prevSliceRef.current = newSlice;
      // console.log("returning new slice");
      return newSlice;
    }
  }

  // console.log("returning old slice");
  return prevSlice;
}

export default class EtlContext {
  constructor(config) {
    assign(this, omit(config, ["getState", "setState", "assignMeta"]));

    this.id = uuid();

    this.meta = this.meta || (this.parentCtx && this.parentCtx.meta) || {};

    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);
  }

  getState() {
    return this.state;
  }

  // state MUST be immutable
  setState(state) {
    this.state = state;
  }

  // meta is mutable. This allow spawned ctx to get updates by reference.
  // Should meta also be immutable?
  assignMeta(meta) {
    assign(this.meta, meta);
  }

  clone() {
    return new EtlContext({ ...this });
  }

  spawn(config) {
    const etlCtx = new EtlContext();

    assign(etlCtx, { ...config, state: cloneDeep(this.state) });

    if (!config.meta) {
      etlCtx.meta = this.meta;
    }

    etlCtx.parentCtx = this;

    return etlCtx;
  }
}

export const EtlContextReact = createContext(null);
