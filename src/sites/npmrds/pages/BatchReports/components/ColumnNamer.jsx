import React from "react"

import get from "lodash/get"

import { Button, Input, useClickOutside } from "~/modules/avl-map-2/src/uicomponents"

const ChevronsRight = () => {
  return (
    <>
      <span className="fa fa-chevron-right"/>
      <span className="fa fa-chevron-right"/>
      <span className="fa fa-chevron-right"/>
    </>
  )
}
const ChevronsLeft = () => {
  return (
    <>
      <span className="fa fa-chevron-left"/>
      <span className="fa fa-chevron-left"/>
      <span className="fa fa-chevron-left"/>
    </>
  )
}

const Column = ({ column, value, update }) => {
  const doUpdate = React.useCallback(v => {
    update(column, v);
  }, [update, column]);
  return (
    <div className="pt-2">
      <div>{ column.header }</div>
      <Input placeholder="rename to..."
        onChange={ doUpdate }
        value={ value }/>
    </div>
  )
}

const ColumnNamer = ({ columns, updateHeaders }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = React.useCallback(e => {
    e.stopPropagation();
    setIsOpen(isOpen => !isOpen);
  }, []);
  const close = React.useCallback(e => {
    e.stopPropagation();
    setIsOpen(false);
  }, []);
  const [ref, setRef] = React.useState(null);
  useClickOutside(ref, close);

  const [updates, _setUpdates] = React.useState({});
  const setUpdates = React.useCallback((column, header) => {
    _setUpdates(prev => {
      return { ...prev, [column.key]: header };
    })
  }, []);
  const doUpdateHeaders = React.useCallback(e => {
    updateHeaders(updates);
    _setUpdates({});
  }, [updateHeaders, updates]);

  const disabled = React.useMemo(() => {
    return Object.keys(updates)
      .reduce((a, c) => {
        return a && !Boolean(updates[c].length);
      }, true);
  }, [updates]);

  return (
    <div ref={ setRef }>
      <div className="col-span-2 border-b-2 mb-2">Rename Column Headers</div>

      <Button className="buttonBlock"
        onClick={ toggle }
      >
        { isOpen ?
          <>
            <ChevronsLeft /> Close
          </> :
          <>
            Open <ChevronsRight />
          </>
        }

      </Button>

      <div className={ `
          absolute top-0 left-full bg-gray-200 h-full z-10
          ${ isOpen ? "w-[400px] overflow-show" : "w-0 overflow-hidden" }
        ` }
      >
        <div className="flex flex-col p-4 h-full max-h-full relative">
          <div className="border-b-2 border-current pb-2 mb-2">
            <Button onClick={ doUpdateHeaders }
              className="buttonBlock mb-2"
              disabled={ disabled }
            >
              Update Headers
            </Button>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0">
              <div className={ `
                  h-full max-h-full overflow-auto scrollbar-sm px-2 pb-2
                ` }
              >
                { columns.map(col => (
                    <Column key={ col.key }
                      column={ col }
                      value={ get(updates, col.key, "") }
                      update={ setUpdates }/>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ColumnNamer;
