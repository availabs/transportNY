import React, { /*createContext*/ }  from "react"
import { useSelector, useDispatch } from 'react-redux';
import { setRegion, setMonth, setFsystem } from './dashboardSlice'
import { useHistory,useLocation } from 'react-router-dom'
import get from 'lodash.get'

import {
  /*useTheme,*/
  Select,
  ScalableLoading
} from "modules/avl-components/src"

import { REGIONS, MONTHS, /*F_SYSTEMS*/ } from './metaData'

const pages = {
  '/': 'Incidents',
  '/incidents': 'Incidents',
  '/congestion': 'Congestion',
  '/workzones': 'Work Zones'
}

const Layout = ({
    loading,
    children
  }) => {
  const history = useHistory()
  const location = useLocation()
  // const theme = useTheme()
  const dispatch = useDispatch();
  const {region, month, fsystem} = useSelector(state =>  state.dashboard)
  
  return (
    <div className='pl-16 pr-2 max-w-7xl mx-auto'> 
      <div className=''>
      Transportation Systems Management and Operations (TSMO) System Performance Dashboards <br />
      
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className={ `
          inset-0 ${ loading ? "fixed" : "hidden" }
          flex justify-center items-center z-50 bg-black opacity-50
        `}>
          <ScalableLoading />
        </div>

        <div className="font-bold text-3xl">
          <Select 
            options={ ['Incidents', 'Work Zones','Congestion'] }
            value={ get(pages ,`[${location.pathname}]`, 'Incidents') }
            onChange={ (e) => { 
              history.push(`/${e.replace(/ /g, '').toLowerCase()}`)} 
            }
            multi={ false }
            className = 'font-bold text-3xl'
            themeOptions={{color: 'transparent'}}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-4">
          <div className="col-span-2">
            <span className="">REGION</span>
            <Select options={ REGIONS }
              accessor={ v => v.name }
              valueAccessor={ v => v.region }
              value={ region }
              onChange={ (v) => dispatch(setRegion(v)) }
              multi={ false }
              className = 'font-bold text-3xl'
              />
          </div>
          <div>
            <span className="">MONTH</span>
            <Select options={ MONTHS }
              value={ month }
              onChange={ (v) => dispatch(setMonth(v)) }
              className = 'font-bold text-3xl'
              multi={ false }/>
          </div>
          <div>
            <span className="">ROAD CLASS</span>
            <Select options={ ['All', 'Highways', 'State & Local'] }
              value={ fsystem }
              onChange={ (v) => dispatch(setFsystem(v)) }
              className = 'font-bold text-3xl'
            />
          </div>
          {children}
        </div>      
      </div>
    </div>
  )
}


export default Layout;
