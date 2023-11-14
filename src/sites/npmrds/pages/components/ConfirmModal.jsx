import React from "react"

import {
  Modal
} from "~/modules/avl-components/src"

import { Stuff } from "./Stuff"

const ConfirmModal = ({ action, stuff, onConfirm, isOpen = false, close }) => {

  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);

  return (
    <Modal open={ isOpen }>
      <div className="bg-gray-100 overflow-auto h-fit"
        onClick={ stopPropagation }
      >

        <div onClick={ close }
          className={ `
            absolute top-1 right-1 h-6 w-6
            rounded hover:bg-gray-400
            flex items-center justify-center
            cursor-pointer pointer-events-auto
          ` }
        >
          <span className="fa fa-close"/>
        </div>

        <div className="px-4 py-4">
          <div className="font-bold text-xl border-b-2 border-current mb-2">
            Are you sure you wish to { action }?
          </div>
          <div>
            { stuff.map(s => {
                return <Stuff key={ s.id } { ...s }/>
              })
            }
          </div>
          <div className="flex justify-end mt-2">
            <div className="flex-1">
              <button onClick={ close }
                className="px-4 py-1 rounded hover:bg-gray-400 border border-gray-400 pointer-events-auto">
                Cancel
              </button>
            </div>
            <div className="flex-0">
              <button onClick={ onConfirm }
                className="px-4 py-1 rounded hover:bg-gray-400 border border-gray-400 pointer-events-auto">
                Confirm
              </button>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  )
}
export default ConfirmModal
