import React from "react";
// import {useFalcor} from '@availabs/avl-components'
// import { Link } from 'react-router-dom'
import Layout from "pages/Layout";
// import get from 'lodash.get'

const Home = ({ ...props }) => {
  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto">
        <div className="pt-4 pb-3 px-6">
          <h3 className="inline font-bold text-3xl">Home</h3>
        </div>
      </div>
    </Layout>
  );
};

export default {
  path: "/",
  exact: true,
  auth: false,
  component: Home,
  layout: "Simple",
};
