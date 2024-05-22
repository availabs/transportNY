import React from "react"

const DefaultDropDownContainer = ({ children }) => {
  return (
    <div className="bg-white shadow-lg shadow-black w-fit">
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

  const [inner, setInner] = React.useState();
  const [xDir, setXDirection] = React.useState(xDirection === "right" ? 1 : -1);
  const [yDir, setYDirection] = React.useState(yDirection === "down" ? 1 : -1);

  const [show, setShow] = React.useState(false);
  const onMouseOver = React.useCallback(e => {
    setShow(true);
    if (!inner) return;

    const rect = inner.getBoundingClientRect();
    const width = window.innerWidth;
    const height = window.innerHeight - 20;

    if (rect.x > (width * 0.5)) {
      setXDirection(-1);
    }
    if (rect.y > (height * 0.5)) {
      setYDirection(-1);
    }
  }, [inner]);
  const onMouseLeave = React.useCallback(e => {
    setShow(false);
    setXDirection(1);
    setYDirection(1);
  }, []);

  return (
    <div onClick={ stopPropagation }
      className="relative cursor-pointer"
      onMouseOver={ onMouseOver }
      onMouseLeave={ onMouseLeave }
    >
      { children }
      { !items.length ? null :
        <div ref={ setInner }
          className={ `absolute ${ show ? "" : "w-0 h-0 overflow-hidden" }` }
          style={ {
            zIndex,

            left: xDir === 1 ? "100%" : null,
            right: xDir === 1 ? null : "100%",

            top: yDir === 1 ? "0px" : null,
            bottom: yDir === 1 ? null : "0px"
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
