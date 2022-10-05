import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import SourcesLayout, { DataManagerHeader } from './components/SourcesLayout'
import { useFalcor } from "modules/avl-components/src";

import SourceView from './Source'
import SourceCreate from './Source/create'
import Settings from "./Source/settings";

import { setFalcorGraph } from "./store";

const DataManager = () => {
  const { falcorCache } = useFalcor();
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      dispatch(setFalcorGraph(falcorCache));
    })();
  }, [dispatch, falcorCache]);

  return (
    <div className='max-w-6xl mx-auto'>
      <SourcesLayout />
    </div>
  )
}

const SourceList = [{
  name:'Data Sources',
  path: "/datasources",
  exact: true,
  auth: false,
  mainNav: false,
  title: <DataManagerHeader />,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: DataManager
}]

const config = [
  ...SourceList,
  ...SourceView,
  ...SourceCreate,
  ...Settings
]

export default config;
