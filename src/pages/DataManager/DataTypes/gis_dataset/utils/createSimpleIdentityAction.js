const createSimpleIdentityAction = (type) => (payload) => ({ type, payload });

export default createSimpleIdentityAction;
