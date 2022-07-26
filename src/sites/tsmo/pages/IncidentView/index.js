import React from "react";

import { useParams } from "react-router-dom";


import TmcMap from "./components/Map";
import IncidentGrid from './components/IncidentGrid'
import IncidentInfo, { IncidentTitle } from './components/IncidentInfo'
import CongestionInfo, {congestionController} from './components/CongestionInfo'


const IncidentViewNew = (props) => {
  const { event_id } = useParams(); 

  const [activeBranch, setActiveBranch] = React.useState(null)
  const [showRaw, setShowRaw] = React.useState(true);
  
  
  return (
    <div className='w-full'>
      <div className={`max-w-7xl mx-auto pb-4 px-4`}>
        <div>
          <div className="grid grid-cols-2 gap-4">
            
            <div className='col-span-2 pt-4'>
              <IncidentTitle event_id={event_id} />
            </div>
            
            <IncidentInfo event_id={event_id} />
            
            
              <CongestionInfo 
                event_id={event_id}
                activeBranch={activeBranch}
                setActiveBranch={setActiveBranch}
                showRaw={showRaw}
                setShowRaw={setShowRaw}
              /> 
          </div>
        </div>
      </div>
      <div className='max-w-7xl mx-auto grid grid-cols-3 gap-4 px-4 mb-8'>
        
          <TmcMap
            event_id={event_id}
            activeBranch={activeBranch}
            showRaw={showRaw}
          />
        

        <div className="col-span-2">
          <IncidentGrid
            event_id={event_id}
            activeBranch={activeBranch}
            showRaw={showRaw}
          />
        </div>

      </div>
    </div>
  );
};

const config = {
  name: "Incident View",
  path: '/incidents/:event_id',
  auth: false,
  exact: true,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: congestionController(IncidentViewNew)
}

export default config;
