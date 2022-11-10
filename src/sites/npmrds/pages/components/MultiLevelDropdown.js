import React from "react"

const DropDownContainer = ({ children }) => {
  return (
    <div className="bg-white shadow-lg">
      { children }
    </div>
  )
}

const MultiLevelDropdown = props => {
  const {
    items = [],
    zIndex = 5,
    xDirection = "right",
    yDirection = "down",
    children
  } = props;

  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);

  const [outter, setOutter] = React.useState();
  const [xDir, setXDirection] = React.useState(xDirection === "right" ? 1 : -1);
  React.useEffect(() => {
    if (!outter) return;
    const rect = outter.getBoundingClientRect();
    const width = window.innerWidth;
    if ((rect.x + rect.width * 2) > width) {
      setXDirection(xDir => -xDir);
    }
  }, [outter]);

  const [inner, setInner] = React.useState();
  const [topOffset, setTopOffset] = React.useState(0);
  React.useEffect(() => {
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const height = window.innerHeight;
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

  return (
    <div ref={ setOutter }
      onClick={ stopPropagation }
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
            { items.map(({ item, children }, i) => (
                <MultiLevelDropdown key={ i }
                  xDirection={ xDir === 1 ? "right" : "left" }
                  zIndex={ zIndex + 5 }
                  items={ children }>
                  { item }
                </MultiLevelDropdown>
              ))
            }
          </DropDownContainer>
        </div>
      }
    </div>
  )
}
export default MultiLevelDropdown
