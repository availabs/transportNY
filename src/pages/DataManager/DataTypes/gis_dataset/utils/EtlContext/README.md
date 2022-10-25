# EltContext

Modeled after Moleculer [Context](https://moleculer.services/docs/0.14/context.html)

```typescript
type Context = {
  params: Record<string, any>;
  meta: { etlContextId; userId };
  initialState;
  damaCtrl; // EtlContexts MUST be able to plug in "routes".
  dispatch; // Local EtlContext. Parent listens for INITIAL and FINAL.
  getState; // Merge local useReducer state in with Redux state?
};
```

// useReducer, init, and UUID id for local EtlContext state
