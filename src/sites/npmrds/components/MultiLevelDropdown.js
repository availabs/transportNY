import React from "react"

import get from "lodash.get"

import { FuseWrapper } from "./FuseWrapper"

const DefaultDropdownContainer = ({ children, ...props }) => {
  return (
    <div className="bg-white shadow-lg" { ...props }>
      { children }
    </div>
  )
}
const DefaultDropdownItem = ({ onClick = null, children }) => {
  return (
    <div className="px-2 hover:bg-gray-300"
      onClick={ onClick }
    >
      { children }
    </div>
  )
}
const DefaultInputContainer = ({ children }) => {
  return (
    <div className="px-2 py-2 border-b">
      { children }
    </div>
  )
}

const NoOp = () => {};
const LabelAccessor = d => d.label;
const ValueAccessor = d => d.value;

export const MultiLevelDropdown = props => {
  const {
    items = [],
    zIndex = 5,
    xDirection = 1,
    yDirection = 1,
    DropdownContainer = DefaultDropdownContainer,
    DropdownItem = DefaultDropdownItem,
    InputContainer = DefaultInputContainer,
    onClick = NoOp,
    hideOnClick = false,
    labelAccessor = LabelAccessor,
    valueAccessor = ValueAccessor,
    searchable = false,
    isChild = false,
    children
  } = props;

  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);

  const [outter, setOutter] = React.useState();
  const [xDir, setXDirection] = React.useState(xDirection);
  // React.useEffect(() => {
  //   if (!outter) return;
  //   const rect = outter.getBoundingClientRect();
  //   const width = window.innerWidth;
  //   if ((rect.x + rect.width * 2) > width) {
  //     setXDirection(xDir => -xDir);
  //   }
  // }, [outter]);

  const [inner, setInner] = React.useState();
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

  const [show, setShow] = React.useState(false);
  const onMouseOver = React.useCallback(e => {
    setShow(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    setShow(false);
  }, []);

  const doOnClick = React.useCallback((e, v) => {
    e.stopPropagation();
    onClick(v);
    if (hideOnClick) {
      setShow(false);
    }
  }, [onClick, hideOnClick]);

  const hasChildren = React.useMemo(() => {
    return items.reduce((a, c) => {
      return a || Boolean(get(c, ["children", "length"], 0))
    }, false);
  }, [items]);

  const [search, _setSearch] = React.useState("");
  const setSearch = React.useCallback(e => {
    _setSearch(e.target.value);
  }, []);

  const fuse = React.useMemo(() => {
    return FuseWrapper(items, { keys: [{ name: "label", getFn: labelAccessor }], threshold: 0.25 });
  }, [items]);

  return (
    <div ref={ setOutter }
      onClick={ stopPropagation }
      className="relative cursor-pointer"
      onMouseOver={ onMouseOver }
      onMouseLeave={ onMouseLeave }
    >
      { children }
      { !items.length || !show ? null :
        <div ref={ setInner }
          className="absolute"
          style={ {
            zIndex,
            top: isChild ? "0%" : "100%",
            left: xDir === 1 ? "100%" : xDir == 0 ? "0%" : null,
            right: xDir === -1 ? "100%" : null
          } }
        >
          { !searchable || hasChildren || (items.length <= 15) ? null :
            <DropdownContainer>
              <InputContainer>
                <input type="text"
                  className={ `
                    w-full px-1 rounded
                    border-2 hover:border-current
                  ` }
                  value={ search }
                  onChange={ setSearch }
                  placeholder="search..."/>
              </InputContainer>
            </DropdownContainer>
          }
          <DropdownContainer
            style={ {
              maxHeight: hasChildren ? null : "24rem",
              overflow: hasChildren ? "visible" : "auto",
            } }
          >
            { fuse(search)
                .map(({ Item = DropdownItem,
                        children, ...rest }, i) => (
                  <MultiLevelDropdown key={ i }
                    { ...props }
                    xDirection={ 1 }
                    zIndex={ zIndex + 5 }
                    items={ children }
                    isChild={ true }
                  >
                    <Item onClick={ e => doOnClick(e, valueAccessor(rest)) }>
                      { labelAccessor(rest) }
                    </Item>
                  </MultiLevelDropdown>
                ))
            }
          </DropdownContainer>
        </div>
      }
    </div>
  )
}
