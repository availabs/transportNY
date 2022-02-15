import React from "react";
// import {useFalcor} from '@availabs/avl-components'
// import { Link } from 'react-router-dom'
//import Layout from "pages/Layout";
// import get from 'lodash.get'

const Construction = ({ ...props }) => {
  return (
    
      <div className="w-full max-w-7xl mx-auto">
        <div className="pt-4 pb-3 px-6">
          <h3 className="inline font-bold text-3xl">Construction</h3>
        </div>
      </div>
    
  );
};

export default {
  name: 'Construction',
  path: "/construction",
  exact: true,
  auth: false,
  mainNav:true,
  icon: 'fal fa-chart-bar',
  sideNav: {
    color: 'dark',
    size: 'compact'
  },
  component: Construction
};
