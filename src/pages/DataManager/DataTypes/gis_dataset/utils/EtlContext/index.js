// SEE: https://moleculer.services/docs/0.14/context.html

// FIXME: Need to decide how to handle getState and setState
//        Simple cloneDeep means cloned/spawned contexts mutate original.

import { useState, useRef, createContext } from "react";
import { assign, cloneDeep, isEqual, merge, omit } from "lodash";
import EventEmitter from "eventemitter3";
import { pEventIterator } from "p-event";

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

export function createEtlContextPropsProxy(ctx) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const { [prop]: value } = extractPropertiesFromEtlContextHierarchy(
          ctx,
          [prop]
        );
        return value;
      },
    }
  );
}

export function useEtlContextDependencies(_ctx, deps) {
  const { current: ctx } = useRef(_ctx);
  const [dependencies] = useState(deps.slice());

  const prevSliceRef = useRef({});
  const { current: prevSlice } = prevSliceRef;

  const newSlice = extractPropertiesFromEtlContextHierarchy(ctx, deps);

  for (const dep of dependencies) {
    if (!isEqual(prevSlice[dep], newSlice[dep])) {
      prevSliceRef.current = newSlice;

      // console.log("ctx", ctx.name, " dep", dep, "changed.");
      // console.log({ old: prevSlice[dep], new: newSlice[dep] });

      return newSlice;
    }
  }

  return prevSlice;
}

export function useEtlContext(_ctx) {
  const { current: ctx } = useRef(_ctx);
  const { current: dependencies } = useRef(new Set());

  const prevSliceRef = useRef(null);

  // The first time useEtlContext is used, we collect all the properties accessed.
  if (prevSliceRef.current === null) {
    // Need a non-proxied object because the proxy always has the context's current state.
    //   This means the prevSlice/newSlice comparison never finds a difference when prevSlice is proxy.
    const initialSlice = {};
    prevSliceRef.current = initialSlice;

    const proxy = new Proxy(
      {},
      {
        get(_target, prop) {
          dependencies.add(prop);

          const { [prop]: value } = extractPropertiesFromEtlContextHierarchy(
            ctx,
            [prop]
          );

          // If the prop has never been set, set it.
          if (!(prop in initialSlice)) {
            initialSlice[prop] = value;
          }

          return value;
        },
      }
    );

    return proxy;
  }

  const { current: prevSlice } = prevSliceRef;

  const newSlice = extractPropertiesFromEtlContextHierarchy(ctx, [
    ...dependencies,
  ]);

  for (const dep of dependencies) {
    if (!isEqual(prevSlice[dep], newSlice[dep])) {
      prevSliceRef.current = newSlice;

      console.log("useEtlContext for", ctx.name, "dependency", dep, "changed");
      return newSlice;
    }
  }

  return prevSliceRef.current;
}

export default class EtlContext {
  constructor(config) {
    assign(this, omit(config, ["getState", "setState", "assignMeta"]));

    this.id = uuid();

    this.meta = this.meta || (this.parentCtx && this.parentCtx.meta) || {};

    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);

    this._stateUpdateEventEmitter = new EventEmitter();
  }

  _resetNextStatePromise() {
    this._nextState = new Promise((resolve) => {
      this._resolveNextState = resolve;
    });
  }

  getState() {
    return this.state;
  }

  // state MUST be immutable
  setState(state) {
    this.state = state;
    this._stateUpdateEventEmitter.emit("data", state);
  }

  //  Returns an event emitter that emits when any of the dependencies change.
  makeDependenciesChangeEventEmitter(deps) {
    const emitter = new EventEmitter();

    let oldSlice = extractPropertiesFromEtlContextHierarchy(this, deps);

    const fn = () => {
      const newSlice = extractPropertiesFromEtlContextHierarchy(this, deps);

      for (const dep of deps) {
        if (!isEqual(oldSlice[dep], newSlice[dep])) {
          emitter.emit("data", newSlice);
          break;
        }
      }

      oldSlice = newSlice;
    };

    this._stateUpdateEventEmitter.on("data", fn);

    const finish = () => {
      emitter.removeAllListeners();
      this._stateUpdateEventEmitter.removeListener("data", fn);
    };

    return { emitter, finish };
  }

  //  This takes an array of dependencies and returns an iterator
  //    that yields only when any of the dependencies change.
  async *makeDependenciesChangeAsyncIterator(deps) {
    const { emitter, finish } = this.makeDependenciesChangeEventEmitter(deps);

    try {
      const iter = pEventIterator(emitter, "data");

      for await (const slice of iter) {
        yield slice;
      }
    } finally {
      finish();
    }
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
