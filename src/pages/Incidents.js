import React from "react";
// import {useFalcor} from '@availabs/avl-components'
// import { Link } from 'react-router-dom'
//import Layout from "pages/Layout";
// import get from 'lodash.get'

const Incidents = ({ ...props }) => {
  return (
    
      <div className="w-full max-w-7xl mx-auto">
        <div className="pt-4 pb-3 px-6">
          <h3 className="inline font-bold text-3xl">Incidents</h3>
        </div>
      </div>
    
  );
};

export default {
  name:'Incidents',
  icon: 'fal fa-chart-line',
  path: "/",
  exact: true,
  auth: false,
  mainNav: true,
  sideNav: {
    color: 'dark',
    size: 'compact'
  },
  component: Incidents,
};
