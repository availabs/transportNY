import React, { Fragment, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import cloneDeep from 'lodash/cloneDeep'

import { useSubmit, useLocation } from "react-router-dom";
import {json2DmsForm, getUrlSlug, toSnakeCase} from './nav'


const theme = {
  pageControls: {
    controlItem: 'pl-6 py-0.5 text-md cursor-pointer hover:text-blue-500 text-slate-400',
    content: '',
  }
}

export function PageControls({ item, dataItems, edit, status }) {
  const submit = useSubmit()
  const { pathname = '/edit' } = useLocation()
  const [showDelete, setShowDelete] = useState(false)
  const NoOp = () => {}


  const duplicateItem = () => {
    const highestIndex = dataItems
    .filter(d => !d.parent)
    .reduce((out,d) => {
      return Math.max(isNaN(d.index) ? -1 : d.index  , out)
    },-1)

    const newItem = cloneDeep(item)
    delete newItem.id
    newItem.title += ' Dup'
    newItem.index = highestIndex + 1
    newItem.url_slug = getUrlSlug(newItem, dataItems)
    
    submit(json2DmsForm(newItem), { method: "post", action: pathname })
  }

  const insertSubPage = async () => {
    const highestIndex = dataItems
    .filter(d => d.parent === item.id)
    .reduce((out,d) => {
      return Math.max(isNaN(d.index) ? 0 : d.index  , out)
    },0)

    //console.log(highestIndex, dataItems)
    const newItem = {
      title: 'New Page',
      parent: item.id,
      index: highestIndex + 1
    }
    newItem.url_slug = `${getUrlSlug(newItem,dataItems)}`

    submit(json2DmsForm(newItem), { method: "post", action: pathname })
  }
    

  const saveItem = async () => {
    const newItem = cloneDeep(item)
    newItem.url_slug = getUrlSlug(newItem, dataItems)
    submit(json2DmsForm(newItem), { method: "post", action: `/docs/edit/${newItem.url_slug}` })

  }
  
  //console.log('showDelete', showDelete)
  return (
    <div className='w-52 hidden xl:block'>
      <div className='w-52 fixed hidden xl:block'> 
        {edit &&
          <div className='p-4'>
            <div className='w-full flex justify-center pb-6'>
              <div 
                onClick={saveItem}
                className='inline-flex w-36 justify-center rounded-lg cursor-pointer text-sm font-semibold py-2 px-4 bg-blue-600 text-white hover:bg-blue-500 shadow-lg border border-b-4 border-blue-800 hover:border-blue-700 active:border-b-2 active:mb-[2px] active:shadow-none'>
                <span className='flex items-center'>
                  <span className='pr-2'>Save</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>

                </span>
              </div>
            </div>
            <div onClick={insertSubPage}
              className={theme.pageControls.controlItem}
            >
              {'☲ Insert Subpage'}
            </div>
            <div onClick={duplicateItem}
              className={theme.pageControls.controlItem}
            >
              {'☳ Duplicate'}
            </div>
            <div onClick={() => setShowDelete(true)}
              className={theme.pageControls.controlItem}
            >
              { '☵ Delete' }
              <DeleteModal
                item={item}
                open={showDelete}
                setOpen={setShowDelete}
              />
            </div>
          </div>
        }
      <div>
        {status ? <div>{JSON.stringify(status)}</div> : ''}
      </div>
      </div> 
    </div>
  )
}

export function DeleteModal ({item, open, setOpen})  {
  const cancelButtonRef = useRef(null)
  const submit = useSubmit()
  const [loading, setLoading] = useState(false)
  return (
    <Modal
      open={open}
      setOpen={setOpen}
      initialFocus={cancelButtonRef}
    >
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
            Delete Page {item.title} {item.id}
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Are you sure you want to deactivate your account? All of your data will be permanently removed
              from our servers forever. This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          type="button"
          disabled={loading}
          className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
          onClick={async () => {
            setLoading(true)
            //item.id = 1103;
            //console.log(item)
            await submit(json2DmsForm(item,'delete'), { method: "post", action: '/docs/edit' })
            setLoading(false);
            setOpen(false);
          }}
        >
          Delet{loading ? 'ing...' : 'e'}
        </button>
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
          onClick={() => setOpen(false)}
          ref={cancelButtonRef}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )

}

export function Modal({open, setOpen, initialFocus, children}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" initialFocus={initialFocus} onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto" >
          <div 
            onClick={() =>  {setOpen(false);}} 
            className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

