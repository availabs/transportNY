import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"

import Fuse from "fuse.js"

export const hasValue = value => {
  if ((value === null) || (value === undefined)) return false;
  if ((typeof value === "string") && !value.length) return false;
  if (Array.isArray(value)) return value.reduce((a, c) => a || hasValue(c), false);
  if ((typeof value === "number") && isNaN(value)) return false;
  if ((typeof value === "object")) return Object.values(value).reduce((a, c) => a || hasValue(c), false);
  return true;
}

export const useClickOutside = (ref, callback) => {
  ref = get(ref, "current", ref);
  React.useEffect(() => {
    if (!ref) return;
    const handleClickOutside = e => {
      if (ref && !ref.contains(e.target)) {
        callback(e);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}

const DefaultDisplayItem = ({ children, isOpen, isActive, hasChildren }) => {
  return (
    <div
      className={ `
        py-1 px-2 flex items-center
        min-w-40 max-w-lg text-ellipsis overflow-hidden
        hover:bg-gray-400 w-full whitespace-nowrap
        ${ isActive ? "bg-gray-400" : isOpen ? "bg-gray-300" : "bg-gray-200" }
      ` }
    >
      <div className={ `
          flex-1 text-left
          min-w-40 max-w-sm text-ellipsis overflow-hidden
        ` }
      >
        { children }
      </div>
      { !hasChildren ? null :
        <span className="fa fa-caret-right ml-2"/>
      }
    </div>
  )
}

const Input = ({ value, onChange }) => {
  const doOnchange = React.useCallback(e => {
    onChange(e.target.value);
  }, [onChange]);
  return (
    <input className="block w-full py-1 px-2 rounded"
      value={ value }
      onChange={ doOnchange }/>
  )
}

const PlaceHolder = ({ children }) => {
  return (
    <div className={ `px-1 mt-1 ml-1 text-gray-300` }>
      { children }
    </div>
  )
}

const ValueItem = ({ display, value, remove, isRemovable }) => {
  const doRemove = React.useCallback(e => {
    e.stopPropagation();
    remove(value);
  }, [remove, value]);
  return (
    <div className={ `
        px-1 flex items-center rounded mt-1 ml-1
        ${ isRemovable ? "bg-gray-200" : "" }
      ` }
    >
      { display }
      { !isRemovable ? null :
        <span onClick={ doRemove }
          className={ `
            fa fa-remove text-xs ml-2 px-1 rounded
            hover:bg-gray-400
          ` }/>
      }
    </div>
  )
}

const ValueContainer = props => {
  const {
    displayValues,
    placeholder,
    disabled,
    remove,
    isRemovable
  } = props;

  return (
    <div tabIndex={ -1 }
      className={ `
        bg-white rounded pl-1 pb-1 pr-2 flex flex-wrap
        focus:outline-1 focus:outline focus:outline-current
        hover:outline-1 hover:outline hover:outline-gray-300
      ` }
    >
      { !displayValues.length ?
        <PlaceHolder>
          { placeholder }
        </PlaceHolder> :
        displayValues.map(({ key, ...v }, i) => (
          <ValueItem key={ key } { ...v }
            isRemovable={ isRemovable }
            remove={ remove }/>
        ))
      }
    </div>
  )
}

export const FuseWrapper = (stuff, options) => {
  const fuse = new Fuse(stuff, options)
  return search => {
    if (!search) return stuff;
    return fuse.search(search).map(f => f.item);
  }
}

const EmptyArray = [];
const NoOp = () => {};
const Identity = v => v;
const DefaultValueComparator = (a, b) => isEqual(a, b);

const stopPropagation = e => e.stopPropagation();

export const MultiLevelSelect = props => {
  const {
    options = EmptyArray,
    value = null,
    onChange = NoOp,
    isMulti = false,
    isDropdown = false,
    displayAccessor = Identity,
    valueAccessor = Identity,
    valueComparator = DefaultValueComparator,
    placeholder = "Select a value...",
    disabled = false,
    DisplayItem = DefaultDisplayItem,
    isSearchable = false,
    isRemovable = true,
    // InputContainer = DefaultInputContainer,
    children
  } = props;

  const Value = React.useMemo(() => {
    return !hasValue(value) ? [] : Array.isArray(value) ? value : [value];
  }, [value]);

  const [display, setDisplay] = React.useState("none");
  const toggle = React.useCallback(e => {
    e.stopPropagation();
    setDisplay(display => display === "none" ? "block" : "none");
  }, []);
  // const show = React.useCallback(e => {
  //   e.stopPropagation();
  //   setDisplay("block");
  // }, []);
  const hide = React.useCallback(e => {
    e.stopPropagation();
    setDisplay("none");
  }, []);

  const [ref, setRef] = React.useState(null);

  useClickOutside(ref, hide);

  const [item, setItem] = React.useState(null);
  const onMouseEnter = React.useCallback((e, item, i) => {
    const rect = e.target.getBoundingClientRect();
    const children = get(item, "children", [])
    setItem([children, rect.top, i]);
  }, []);

  const [hover, setHover] = React.useState(false);
  const onHoverEnter = React.useCallback(e => {
    setHover(true);
  }, []);
  const onHoverleave = React.useCallback(e => {
    setHover(false);
    setItem(null);
  }, []);

  const top = React.useMemo(() => {
    if (!item || !ref) return 0;
    const rect = ref.getBoundingClientRect();
    return item[1] - rect.top;
  }, [item, ref]);

  const includes = React.useCallback(value => {
    return Value.reduce((a, c) => {
      return a || valueComparator(c, value);
    }, false);
  }, [Value, valueComparator]);

  const select = React.useCallback((e, option) => {
    e.stopPropagation();
    const value = valueAccessor(option);
    setSearch("");
    if (isMulti) {
      if (isRemovable && includes(value)) {
        const newValue = Value.filter(v => !valueComparator(v, value));
        onChange(newValue);
      }
      else {
        onChange([...Value, value]);
      }
    }
    else {
      if (isRemovable && includes(value)) {
        onChange(null);
      }
      else {
        onChange(value);
      }
      if (hasValue(value)) {
        setDisplay("none");
      }
    }
  }, [Value, includes, onChange, isMulti, isRemovable, displayAccessor, valueAccessor, valueComparator]);

  const remove = React.useCallback(value => {
    if (isMulti && includes(value)) {
      onChange(Value.filter(v => !isEqual(v, value)));
    }
    else if (!isMulti && includes(value)){
      onChange(null);
    }
  }, [Value, includes, onChange, isMulti]);

  const getDisplayValues = React.useCallback((options, dAccess, vAccess, result = []) => {
    return options.reduce((a, c, i) => {
      if (includes(vAccess(c))) {
        a.push({ display: dAccess(c), value: vAccess(c), key: i });
      }
      return getDisplayValues(get(c, "children", []), dAccess, vAccess, a);
    }, result);
  }, [includes]);

  const displayValues = React.useMemo(() => {
    return getDisplayValues(options, displayAccessor, valueAccessor);
  }, [options, displayAccessor, valueAccessor, getDisplayValues]);

  const fuse = React.useMemo(() => {
    return FuseWrapper(
      options,
      { keys: [{ name: "label", getFn: displayAccessor }],
        threshold: 0.25
      }
    );
  }, [options, displayAccessor]);

  const [search, setSearch] = React.useState("");

  const fused = React.useMemo(() => {
    return fuse(search);
  }, [fuse, search]);

  return (
    <div onClick={ toggle }
      className="relative cursor-pointer"
    >

      { isDropdown ? children :
        <ValueContainer placeholder={ placeholder }
          disabled={ disabled }
          isRemovable={ isRemovable }
          remove={ remove }
          displayValues={ displayValues }/>
      }

      <div ref={ setRef }
        style={ {
          position: "absolute",
          zIndex: 50,
          top: "100%",
          left: "0px",
          display
        } }
        onMouseEnter={ onHoverEnter }
        onMouseLeave={ onHoverleave }
      >
        { !isSearchable ? null :
          <div className="p-2 bg-gray-200"
            onClick={ stopPropagation }
          >
            <Input value={ search }
              onChange={ setSearch }/>
          </div>
        }
        <div style={ {
            maxHeight: "20rem",
            overflow: "auto"
          } }
        >
          { fused.map((opt, i) => (
              <div key={ i }
                onMouseEnter={ e => onMouseEnter(e, opt, i) }
                onClick={ e => select(e, opt) }
              >
                <DisplayItem
                  isOpen={ get(item, 2, -1) === i }
                  isActive={ includes(valueAccessor(opt)) }
                  hasChildren={ Boolean(get(opt, ["children", "length"], 0)) }
                >
                  { displayAccessor(opt) }
                </DisplayItem>
              </div>
            ))
          }
        </div>

        { !item || !item[0].length ? null :
          <div className="z-10 absolute"
            style={ {
              left: "100%",
              display: hover && item ? "block" : "none",
              top: `${ top }px`
            } }
          >
            <DropBeside key={ get(item, 2, -1) }
              { ...props }
              options={ get(item, 0, []) }
              DisplayItem={ DisplayItem }
              value={ Value }
              select={ select }
              isMulti={ isMulti }
              isDropdown={ isDropdown }
              displayAccessor={ displayAccessor }
              valueAccessor={ valueAccessor }
              valueComparator={ valueComparator }
              isSearchable={ isSearchable }
              isRemovable={ isRemovable }
              includes={ includes }/>
          </div>
        }

      </div>
    </div>
  )
}

const DropBeside = props => {

  const {
    options,
    displayAccessor,
    valueAccessor,
    DisplayItem,
    select,
    includes,
    isSearchable
  } = props

  const [ref, setRef] = React.useState(null);

  const [item, setItem] = React.useState(null);
  const onMouseEnter = React.useCallback((e, item, i) => {
    const rect = e.target.getBoundingClientRect();
    const children = get(item, "children", [])
    setItem([children, rect.top, i]);
  }, []);

  const [hover, setHover] = React.useState(false);
  const onHoverEnter = React.useCallback(e => {
    setHover(true);
  }, []);
  const onHoverleave = React.useCallback(e => {
    setHover(false);
    setItem(null);
  }, []);

  const top = React.useMemo(() => {
    if (!item || !ref) return 0;
    const rect = ref.getBoundingClientRect();
    return item[1] - rect.top;
  }, [item, ref]);

  const fuse = React.useMemo(() => {
    return FuseWrapper(
      options,
      { keys: [{ name: "label", getFn: displayAccessor }],
        threshold: 0.25
      }
    );
  }, [options, displayAccessor]);

  const [search, setSearch] = React.useState("");

  const fused = React.useMemo(() => {
    return fuse(search);
  }, [fuse, search]);

  return (
    <div className="relative"
      onMouseEnter={ onHoverEnter }
      onMouseLeave={ onHoverleave }
    >
      { !isSearchable ? null :
        <div className="p-2 bg-gray-200 absolute bottom-full w-full min-w-40"
          onClick={ stopPropagation }
        >
          <Input value={ search }
            onChange={ setSearch }/>
        </div>
      }
      <div ref={ setRef }
        style={ {
          maxHeight: "20rem",
          overflow: "auto"
        } }
      >
        { fused.length ? null :
          <DisplayItem>
            No options available...
          </DisplayItem>
        }
        { fused.map((opt, i) => (
            <div key={ i }
              onMouseEnter={ e => onMouseEnter(e, opt, i) }
              onClick={ e => select(e, opt) }
            >
              <DisplayItem
                isOpen={ get(item, 2, -1) === i }
                isActive={ includes(valueAccessor(opt)) }
                hasChildren={ Boolean(get(opt, ["children", "length"], 0)) }
              >
                { displayAccessor(opt) }
              </DisplayItem>
            </div>
          ))
        }
      </div>

      { !item || !item[0].length ? null :
        <div className="z-10 absolute"
          style={ {
            left: "100%",
            display: hover && item ? "block" : "none",
            top: `${ top }px`
          } }
        >
          <DropBeside { ...props }
            key={ get(item, 2, -1) }
            options={ get(item, 0, []) }/>
        </div>
      }
    </div>
  )
}
