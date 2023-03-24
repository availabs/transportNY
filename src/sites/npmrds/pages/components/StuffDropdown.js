import React from "react"

const DefaultDropDownContainer = ({ children }) => {
  return (
    <div className="bg-white shadow-lg w-fit">
      { children }
    </div>
  )
}
const DefaultDropdownItem = ({ children }) => {
  return (
    <div className="px-2 hover:bg-gray-300">
      { children }
    </div>
  )
}
const DefaultInputContainer = ({ children }) => {
  return (
    <div className="px-2 py-1">
      { children }
    </div>
  )
}

const StuffDropdown = props => {
  const {
    items = [],
    zIndex = 5,
    xDirection = "right",
    yDirection = "down",
    DropDownContainer = DefaultDropDownContainer,
    DropdownItem = DefaultDropdownItem,
    InputContainer = DefaultInputContainer,
    children
  } = props;

  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);

  const [show, setShow] = React.useState(false);
  const onMouseOver = React.useCallback(e => {
    setShow(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    setShow(false);
  }, []);

  const [inner, setInner] = React.useState();
  const [xDir, setXDirection] = React.useState(xDirection === "right" ? 1 : -1);
  const [topOffset, setTopOffset] = React.useState(0);
  React.useEffect(() => {
    if (!inner || !show) return;
    const rect = inner.getBoundingClientRect();
    const height = window.innerHeight;
    const width = window.innerWidth;
    if ((rect.x + rect.width) > width) {
      setXDirection(xDir => -xDir);
    }
    if ((rect.y + rect.height) > height) {
      setTopOffset(height - (rect.y + rect.height))
    }
  }, [inner, show]);

  return (
    <div onClick={ stopPropagation }
      className="relative cursor-pointer"
      onMouseOver={ onMouseOver }
      onMouseLeave={ onMouseLeave }
    >
      { children }
      { !items.length ? null :
        !show ? null :
        <div ref={ setInner }
          className="absolute"
          style={ {
            zIndex: zIndex,
            top: `${ topOffset }px`,
            left: xDir === 1 ? "100%" : null,
            right: xDir === 1 ? null : "100%"
          } }
        >
          <DropDownContainer>
            { items
                .map(({ Item = DropdownItem,
                        value = null,
                        children }, i) => (
                  <StuffDropdown key={ i }
                    xDirection={ xDir === 1 ? "right" : "left" }
                    zIndex={ zIndex + 5 }
                    items={ children }>
                    <Item>
                      { value }
                    </Item>
                  </StuffDropdown>
                ))
            }
          </DropDownContainer>
        </div>
      }
    </div>
  )
}
export default StuffDropdown;
