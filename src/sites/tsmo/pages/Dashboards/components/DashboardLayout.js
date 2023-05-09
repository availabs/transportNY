import React, { /*createContext*/ }  from "react"
import { useSelector, useDispatch } from 'react-redux';
import { setRegion, setMonth, setFsystem } from './dashboardSlice'
import { useNavigate,useLocation } from 'react-router-dom'
import get from 'lodash.get'

import {
  // useTheme,
  Select,
  ScalableLoading
} from "modules/avl-components/src"

import { REGIONS, MONTHS, F_SYSTEM_MAP } from './metaData'

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
  const navigate = useNavigate()
  const location = useLocation()
  // const theme = useTheme()
  const dispatch = useDispatch();
  const {region, month, fsystem} = useSelector(state =>  state.dashboard)

  return (
    <div className='max-w-7xl mx-auto mb-8'>
      <div className={ `
          inset-0 ${ loading ? "fixed" : "hidden" }
          flex justify-center items-center z-50 bg-black opacity-50
        `}>
          <ScalableLoading />
      </div>
      <div className=" grid grid-cols-4 gap-4 pt-4 px-2 lg:px-0">
        
       {/* <div className='col-span-4'>
          <div class="text-2xl font-thin text-blue-500 truncate shrink" alt="Transportation Systems Management and Operations (TSMO) System Performance Dashboards">Transportation Systems Management and Operations (TSMO) System Performance Dashboards</div>
        </div>*/}
        <div className="col-span-4">
          <Select
            options={ ['Incidents', 'Work Zones','Congestion'] }
            value={ get(pages ,`[${location.pathname}]`, 'Incidents') }
            onChange={ (e) => {
              navigate(`/${e.replace(/ /g, '').toLowerCase()}`)}
            }
            multi={ false }
            className = 'font-bold text-3xl'
            themeOptions={{color: 'transparent'}}
          />
        </div>
        <div className="col-span-4 md:col-span-2">
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
        <div className="col-span-2 md:col-span-1">
            <span className="">MONTH</span>
            <Select 
              options={ MONTHS }
               accessor={ v => v.name }
              valueAccessor={ v => v.value }
              value={ month }
              onChange={ (v) => dispatch(setMonth(v)) }
              className = 'font-bold py-3.5 '
              multi={ false }/>
        </div>
        <div className="col-span-2 md:col-span-1">
            <span className="">ROAD CLASS</span>
            <Select options={ Object.keys(F_SYSTEM_MAP) }
              value={ fsystem }
              onChange={ (v) => dispatch(setFsystem(v)) }
              className = 'font-bold py-3.5 '
            />
        </div>

          {children}
        

      </div>
    </div>
  )
}


export default Layout;
