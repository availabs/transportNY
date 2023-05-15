import React from 'react'
import { NavLink, Link, useSubmit } from "react-router-dom";

const theme = {
  layout: {
    page: 'h-full w-full bg-slate-100 flex flex-col',
    container: '2xl:max-w-[1536px] 2xl:mx-auto w-full flex-1 flex flex-col',
    // content: 'border flex-1 bg-white'
  }
}

export default function SiteLayout ({children, ...props},) {
  return (
    <div className={theme.layout.page}>
      <div className={theme.layout.container}> 
        {children}
      </div>
    </div>
  )
}

// function FakeHeader () {
//   return (
//     <>
//     <div className='w-full h-12 border-b bg-slate-100 fixed z-20' >
//       <div className='2xl:max-w-[1536px] 2xl:mx-auto w-full flex items-baseline'>
//         <NavLink to='/' className='p-3'>Home</NavLink>
//         <div className='flex-1'></div>
//         <NavLink to='/edit' className='p-3'>Edit</NavLink>
//       </div>
//     </div>
//     <div className='pb-12'/>
//     </>
//   )
// }
