import React from "react"

import get from "lodash/get"

import { FuseWrapper } from "./FuseWrapper"
import { useClickOutside } from "./useClickOutside"

const EmptyArray = [];
const NoOp = () => {};
const Identity = v => v;

const stopPropagation = e => {
  e.stopPropagation();
};

const getDisplayValues = (options, value, dAccess, vAccess, result = []) => {
  return options.reduce((a, c, i) => {
    if (value.includes(vAccess(c))) {
      a.push({ display: dAccess(c), value: vAccess(c), key: i });
    }
    return getDisplayValues(get(c, "children", []), value, dAccess, vAccess, a);
  }, result);
}

const hasValue = value => {
  return Array.isArray(value) ? Boolean(value.length) : Boolean(value);
}

const MultiLevelSelect = props => {
  const {
    options = EmptyArray,
    value = null,
    onChange = NoOp,
    isMulti = false,
    displayAccessor = Identity,
    valueAccessor = Identity,
    xDirection = 0,
    zIndex = 5,
    placeholder = "Select a value...",
    disabled = false,
    DisplayItem = DefaultDisplayItem,
    isDropdown = false,
    searchable = false,
    removable = true,
    InputContainer = DefaultInputContainer,
    maxOptions = null,
    children
  } = props;

  const Value = React.useMemo(() => {
    return !value ? [] : Array.isArray(value) ? value : [value];
  }, [value]);

  const [outter, setOutter] = React.useState(null);

  const [show, setShow] = React.useState(false);
  const toggleDropdown = React.useCallback(e => {
    e.stopPropagation();
    setShow(show => !show);
  }, []);
  const showDropdown = React.useCallback(e => {
    e.stopPropagation();
    setShow(true);
  }, []);
  const hideDropdown = React.useCallback(e => {
    e.stopPropagation();
    setShow(false);
  }, []);

  useClickOutside(outter, hideDropdown);

  const [inner, setInner] = React.useState();
  const [xDir, setXDirection] = React.useState(xDirection);
  const [topOffset, setTopOffset] = React.useState(0);
  React.useEffect(() => {
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const height = window.innerHeight;
    const width = window.innerWidth;
    if ((rect.x + rect.width) > width) {
      setXDirection(xDir => -xDir);
    }
    if ((rect.y + rect.height) > height) {
      setTopOffset(height - (rect.y + rect.height))
    }
  }, [inner]);

  const [search, _setSearch] = React.useState("");
  const setSearch = React.useCallback(e => {
    _setSearch(e.target.value);
  }, []);

  const select = React.useCallback(option => {
    const value = valueAccessor(option);
    _setSearch("");
    if (isMulti) {
      if (Value.includes(value)) {
        onChange(Value.filter(v => v !== value));
      }
      else {
        onChange([...Value, value]);
      }
    }
    else {
      if (Value.includes(value)) {
        onChange(null);
      }
      else {
        onChange(value);
      }
      if (hasValue(value)) {
        setShow(false);
      }
    }
  }, [Value, onChange, isMulti, displayAccessor, valueAccessor]);

  const remove = React.useCallback(value => {
    if (isMulti && Value.includes(value)) {
      onChange(Value.filter(v => v !== value));
    }
    else if (!isMulti && Value.includes(value)){
      onChange(null);
    }
  }, [Value, onChange, isMulti]);

  const displayValues = React.useMemo(() => {
    return getDisplayValues(options, Value, displayAccessor, valueAccessor);
  }, [options, Value, displayAccessor, valueAccessor]);

  const hasChildren = React.useMemo(() => {
    return options.reduce((a, c) => a || Boolean(get(c, ["children", "length"], 0)), false)
  }, [options]);

  const fuse = React.useMemo(() => {
    return FuseWrapper(
      options,
      { keys: [{ name: "label", getFn: displayAccessor }],
        threshold: 0.25
      }
    );
  }, [options, displayAccessor]);

  const getItem = React.useCallback(opt => {
    return get(opt, "Item", DisplayItem);
  }, [DisplayItem]);

  const fused = fuse(search)

  return (
    <div ref={ setOutter }
      className={ `relative cursor-pointer` }
      onClick={ toggleDropdown }
    >

      { isDropdown ? children :
        <ValueContainer placeholder={ placeholder }
          disabled={ disabled }
          removable={ removable }
          remove={ remove }
          displayValues={ displayValues }/>
      }

      <div ref={ setInner }
        className={ `${ show ? "absolute" : "hidden" }` }
        style={ {
          zIndex,
          top: `calc(100% + ${ topOffset }px)`,
          left: xDir === 1 ? "100%" : xDir == 0 ? "0%" : null,
          right: xDir === -1 ? "100%" : null,
          paddingTop: "0.25rem"
        } }
      >
        { !searchable || hasChildren ? null :
          <div className="w-full"
            style={ {
              bottom: xDir ? "100%" : null,
              position: xDir ? "absolute" : "block"
            } }
            onClick={ stopPropagation }
          >
            <InputContainer>
              <input value={ search } onChange={ setSearch }
                className={ `
                  bg-white w-full px-2 py-1 rounded
                  focus:outline-2 focus:outline focus:outline-current
                  hover:outline-2 hover:outline hover:outline-gray-300
                ` }/>
            </InputContainer>
          </div>
        }
        { options.length ? null :
          <DisplayItem>
            No options available...
          </DisplayItem>
        }
        <div className="w-fit scrollbar-xs"
          style={ {
            maxHeight: hasChildren ? null : "24rem",
            overflow: hasChildren ? null : "auto"
          } }
        >
          { fuse(search).slice(0, maxOptions || Infinity).map((opt, i) => {
              const Item = getItem(opt);
              const value = valueAccessor(opt);
              return (
                <Dropdown key={ `${ value }-${ i }` }
                  { ...props }
                  options={ get(opt, "children", []) }
                  xDirection={ 1 }
                  zIndex={ zIndex + 5 }
                  select={ select }
                  Value={ Value }
                >
                  <Clickable disabled={ !hasValue(value) }
                    select={ select }
                    option={ opt }
                  >
                    <Item active={ Value.includes(value) }
                      hasChildren={ Boolean(get(opt, ["children", "length"], 0)) }
                    >
                      { displayAccessor(opt) }
                    </Item>
                  </Clickable>
                </Dropdown>
              )
            })
          }
        </div>
      </div>

    </div>
  )
}

export { MultiLevelSelect };

const Dropdown = props => {
  const {
    options = EmptyArray,
    Value = null,
    select = NoOp,
    displayAccessor = Identity,
    valueAccessor = Identity,
    xDirection,
    zIndex,
    DisplayItem = DefaultDisplayItem,
    searchable = false,
    InputContainer = DefaultInputContainer,
    maxOptions = null,
    children
  } = props;

  const [show, setShow] = React.useState(false);
  const showDropdown = React.useCallback(e => {
    setShow(true);
  }, []);
  const hideDropdown = React.useCallback(e => {
    setShow(false);
  }, []);

  const [inner, setInner] = React.useState();
  const [xDir, setXDirection] = React.useState(xDirection);
  const [topOffset, setTopOffset] = React.useState(0);
  React.useEffect(() => {
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const height = window.innerHeight;
    const width = window.innerWidth;
    if ((rect.x + rect.width) > width) {
      setXDirection(xDir => -xDir);
    }
    if ((rect.y + rect.height) > height) {
      setTopOffset(height - (rect.y + rect.height))
    }
  }, [inner]);

  const hasChildren = React.useMemo(() => {
    return options.reduce((a, c) => a || Boolean(get(c, ["children", "length"], 0)), false)
  }, [options]);

  const [search, _setSearch] = React.useState("");
  const setSearch = React.useCallback(e => {
    _setSearch(e.target.value);
  }, []);

  const doSelect = React.useCallback(opt => {
    select(opt);
    _setSearch("");
  }, [select]);

  const fuse = React.useMemo(() => {
    return FuseWrapper(
      options,
      { keys: [{ name: "label", getFn: displayAccessor }],
        threshold: 0.25
      }
    );
  }, [options, displayAccessor]);

  const getItem = React.useCallback(opt => {
    return get(opt, "Item", DisplayItem);
  }, [DisplayItem]);

  return (
    <div className="relative cursor-pointer"
      onMouseEnter={ options.length ? showDropdown : null }
      onMouseLeave={ options.length ? hideDropdown : null }
    >

      { children }

      <div ref={ setInner }
        className={ `${ show ? "absolute" : "hidden" }` }
        style={ {
          zIndex,
          top: `${ topOffset }px`,
          left: xDir === 1 ? "100%" : xDir == 0 ? "0%" : null,
          right: xDir === -1 ? "100%" : null
        } }
      >
        <div className="w-fit scrollbar-xs"
          style={ {
            maxHeight: hasChildren ? null : "24rem",
            overflow: hasChildren ? null : "auto"
          } }
        >
          { !searchable || hasChildren || (options.length < 10) ? null :
            <div className="w-full"
              style={ {
                bottom: xDir ? "100%" : null,
                position: xDir ? "absolute" : "block"
              } }
              onClick={ stopPropagation }
            >
              <InputContainer className="rounded-t pt-2">
                <input value={ search } onChange={ setSearch }
                  className={ `
                    bg-white w-full px-2 py-1 rounded
                    focus:outline-2 focus:outline focus:outline-current
                    hover:outline-2 hover:outline hover:outline-gray-300
                  ` }/>
              </InputContainer>
            </div>
          }
          <div className="w-fit">
            { fuse(search).slice(0, maxOptions || Infinity).map((opt, i) => {
                const Item = getItem(opt);
                return (
                  <Dropdown key={ `${ valueAccessor(opt) }-${ i }` }
                    { ...props }
                    options={ get(opt, "children", []) }
                    xDirection={ xDir }
                    zIndex={ zIndex + 5 }
                  >
                    <Clickable select={ doSelect } option={ opt }>
                      <Item active={ Value.includes(valueAccessor(opt)) }
                        hasChildren={ Boolean(get(opt, ["children", "length"], 0)) }
                      >
                        { displayAccessor(opt) }
                      </Item>
                    </Clickable>
                  </Dropdown>
                )
              })
            }
          </div>
        </div>
      </div>
    </div>
  )
}

const DefaultInputContainer = ({ className = "", children }) => {
  return (
    <div className={ `bg-gray-100 px-2 py-1 border-b ${ className }`}>
      { children }
    </div>
  )
}

const ValueItem = ({ display, value, remove, removable }) => {
  const doRemove = React.useCallback(e => {
    remove(value);
  }, [remove, value]);
  return (
    <div
      className={ `
        ${ removable ? "px-1 bg-gray-200 flex items-center rounded" : null }
      ` }
    >
      { display }
      { !removable ? null :
        <span className="fa fa-remove text-xs ml-2 px-1 rounded hover:bg-gray-400"
          onClick={ doRemove }/>
      }
    </div>
  )
}
const PlaceHolder = ({ children }) => {
  return (
    <div className="text-gray-400">
      { children }
    </div>
  )
}
const ValueContainer = props => {
  const {
    displayValues,
    placeholder,
    disabled,
    remove,
    removable
  } = props;

  return (
    <div tabIndex={ 0 }
      className={ `
        bg-white rounded px-2 py-1 flex flex-wrap
        focus:outline-2 focus:outline focus:outline-current
        hover:outline-2 hover:outline hover:outline-gray-300
      ` }
    >
      { !displayValues.length ?
        <PlaceHolder>
          { placeholder }
        </PlaceHolder> :
        displayValues.map((v, i) => (
          <div key={ v.key }>
            <ValueItem { ...v }
              removable={ removable }
              remove={ remove }/>
          </div>
        ))
      }
    </div>
  )
}
const DefaultDisplayItem = ({ children, active, hasChildren }) => {
  return (
    <div style={ { minWidth: "12rem" } }
      className={ `
        py-1 px-2 flex items-center text-left min-w-fit whitespace-nowrap
        ${ active ? "bg-gray-400" : "hover:bg-gray-300 bg-gray-100" }
      ` }
    >
      <div className="flex-1">{ children }</div>
      { !hasChildren ? null :
        <span className="fa fa-caret-right ml-2"/>
      }
    </div>
  )
}
const Clickable = ({ select, option, disabled, children }) => {
  const onClick = React.useCallback(e => {
    e.stopPropagation();
    select(option);
  }, [select, option]);
  return (
    <div onClick={ disabled ? null : onClick }>
      { children }
    </div>
  )
}
