import React from "react"

const FolderIcon = ({ children, open, ...props }) => {
  const {
    icon,
    color,
    name,
    type,
    size = 10,
    opened = false,
    className = ""
  } = props;
  return (
    <div className={ `
        flex items-center justify-center relative
        ${ className }
      ` }
      style={ {
        width: `${ size }rem`,
        height: `${ size }rem`
      } }
    >
      <span className="fa fa-folder"
        style={ {
          color: "#f1d592",
          fontSize: `${ 0.95 * size }rem`
        } }
      />
      <div className="left-0 right-0 absolute top-0 font-bold"
        style={ {
          paddingLeft: `${ size * 0.05 }rem`,
          paddingTop: `${ size * 0.2 }rem`,
          fontSize: `${ size * 0.1 }rem`
        } }
      >
        { size < 10 ? null : <FolderName name={ name } type={ type }/> }
      </div>
      <div className="flex items-center justify-center absolute inset-0">
        <span className={ icon }
          style={ {
            color: color,
            fontSize: `${ 0.4 * size }rem`,
            paddingTop: `${ size * 0.275 }rem`
          } }/>
      </div>
      <div className="absolute inset-0">
        { children }
      </div>
    </div>
  )
}
export default FolderIcon;

const FolderName = ({ type, name }) => {
  return (
    <span>
      { !name ? null : type === "group" ? "Group " : null }
      { name }
    </span>
  )
}
