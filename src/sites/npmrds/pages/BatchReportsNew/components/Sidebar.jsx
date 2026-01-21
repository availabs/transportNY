import React from "react"

import RouteSelector from "./RouteSelector"
import TimeSelector from "./TimeSelector"
import ColumnAdder from "./ColumnAdder"

const BatchReportsTitle = () => {
  return (
    <div className="text-3xl font-bold border-b-4 border-current mb-2">
      Batch Reports
    </div>
  )
}

const Sidebar = ({ children, setReferenceValue, useBaseAsReference, ...props }) => {

  const baseColumnName = props.columns[0]?.name;

  const doSet = React.useCallback(e => {
    setReferenceValue(Boolean(e.target.checked));
  }, [setReferenceValue]);

console.log("useBaseAsReference", useBaseAsReference)

  return (
    <Collapsable>
      <div className="flex h-full flex-col">

        <div className="w-[400px] h-fit p-4">

          <BatchReportsTitle />

          <div className="grid grid-cols-1 gap-4">
            <RouteSelector { ...props }/>

            <TimeSelector { ...props }/>

            { !baseColumnName ? null :
              <div className="grid grid-cols-12">
                <div className={ `
                    col-span-12 border-b-2 font-bold border-current
                  ` }
                >
                  Percent Change Calculation
                </div>
                  <div className="col-span-10">
                    Use column "{ baseColumnName }" as reference 
                    values for percent change calculations
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <input type="checkbox"
                      className="flex-1 h-6 cursor-pointer"
                      checked={ useBaseAsReference }
                      onChange={ doSet }/>
                  </div>
              </div>
            }

            <ColumnAdder { ...props }/>
          </div>

        </div>

        <div className="flex-1 flex flex-col justify-end relative">
          <div className="absolute bottom-0 right-0 left-0">
            { children }
          </div>
        </div>

      </div>
    </Collapsable>
  )
}
export default Sidebar;

const Collapsable = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const toggle = React.useCallback(e => {
    e.stopPropagation();
    setIsOpen(isOpen => !isOpen);
  }, []);
  return (
    <div className={ `
        h-full bg-white relative
        ${ isOpen ? `w-[400px] overflow-visible` : "w-8 overflow-hidden" }
      ` }
    >
      <div className={ `
          absolute top-0 right-0 z-20 cursor-pointer
          bg-gray-300 hover:bg-gray-400
          w-8 h-8 flex items-center justify-center
          ${ isOpen ? "rounded-bl-lg" : "" }
        ` }
        onClick={ toggle }
      >
        <span className={ `
            fa ${ isOpen ? "fa-chevron-left" : "fa-chevron-right" }
          ` }/>
      </div>
      { isOpen ? null :
        <div className="absolute inset-0 z-10 bg-white"/>
      }
      <div className="w-fit h-full">
        { children }
      </div>
    </div>
  )
}
