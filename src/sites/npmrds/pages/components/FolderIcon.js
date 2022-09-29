import React from "react"

const FolderIcon = props => {
  const {
    icon,
    color,
    name,
    size = 10,
    opened = false,
    className = "",
    onClick = null
  } = props;
  return (
    <div className={ `
        flex items-center justify-center relative
        rounded-xl border-2 hover:border-current
        ${ opened ? "border-current" : "border-transparent" }
        ${ className }
      ` }
      style={ {
        width: `${ size }rem`,
        hieght: `${ size }rem`
      } }
      onClick={ onClick }
    >
      <span className="fa fa-folder"
        style={ {
          color: "#f1d592",
          fontSize: `${ 0.9 * size }rem`
        } }
      />
      <div className="left-0 right-0 absolute top-0 font-bold"
        style={ {
          paddingLeft: `${ size * 0.1 }rem`,
          paddingTop: `${ size * 0.15 }rem`,
          fontSize: `${ size * 0.1 }rem`
        } }
      >
        { name }
      </div>
      <div className="flex items-center justify-center absolute inset-0">
        <span className={ icon }
          style={ {
            color: color,
            fontSize: `${ 0.4 * size }rem`,
            paddingTop: `${ size * 0.25 }rem`
          } }/>
      </div>
    </div>
  )
}
export default FolderIcon;
