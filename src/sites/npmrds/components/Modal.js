import React from "react"

export const Modal = ({ isOpen, close = null, children }) => {
  return (
    <div className={ `
        fixed inset-0 items-center justify-center
        ${ isOpen ? "flex" : "hidden" }
        bg-black bg-opacity-75 z-50
      ` }
    >
      <div>
        <div className="relative p-4 h-fit w-fit bg-gray-100 rounded-lg shadow-xl">
          { !close ? null :
            <div onClick={ close }
              className={ `
                absolute top-1 right-1 h-6 w-6
                rounded hover:bg-gray-400
                flex items-center justify-center
                cursor-pointer
              ` }
            >
              <span className="fa fa-close"/>
            </div>
          }
          { children }
        </div>
      </div>
    </div>
  )
}
