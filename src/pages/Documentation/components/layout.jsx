import React from 'react'
import { NavLink, Link, useSubmit } from "react-router";

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
