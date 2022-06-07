import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveTreeMap } from '@nivo/treemap'
import {TreeMapNode} from './TreeMapNode'

const SURVEYS = ['Smartphone','NYCDOT','NHTS','RHTS']

let colors = ['#e8c1a0', '#f47560', '#f1e15b', '#e8a838', '#61cdbb', '#97e3d5']

const Home = () => {
  const [crosswalk, setCrosswalk] = useState([])

  useEffect(() => {
    fetch('/data/survey_cross.json')
      .then(r => r.json())
      .then(d => setCrosswalk(d))
  },[])

  const treeData = useMemo(() => {
    let data = crosswalk
    .filter(d => d["Variable Categories"])
    .reduce((out, curr) => {
      
      if(!out[curr["Variable Categories"]]){
        out[curr["Variable Categories"]] = {
          name: curr["Variable Categories"],
          children: {}
        }
      }

      if(!out[curr["Variable Categories"]].children[curr["Variable Subject"]]){
        out[curr["Variable Categories"]].children[curr["Variable Subject"]] = {
          name: curr["Variable Subject"],
          children: []
        }
      }
      let surveyQuestion = SURVEYS
        .reduce((out,survey) => {
          out[survey] = 0
          out[`${survey}_color`] = '#eee'
          let surveyKeys = Object.keys(crosswalk[0])
          .filter(d => !['Variable','Label', survey].some(e => d.includes(e)))

          surveyKeys.forEach(surveyKey => {
            if(+curr[surveyKey] === 1) {
              out[survey] = 1
              out[`${survey}_color`] = "#b2df8a"
            }
          })
          return out
        },{})

      let varData = {
        name: curr["Mother - Label"],
        color: surveyQuestion['RHTS_color'],
        fill: surveyQuestion['RHTS_color'],
        q: 1,
        ...surveyQuestion,
        total: SURVEYS.reduce((out,c) => out+= surveyQuestion[c])

      }

      out[curr["Variable Categories"]].children[curr["Variable Subject"]].children.push(varData)
      return out
    },{})
    Object.values(data).forEach((tl,i) => {
      tl.color = colors[i%6]
      tl.children = Object.values(tl.children)
    })
    return {
      name: "survey",
      color: colors[0],
      children: Object.values(data)
    }
  },[crosswalk])

  if(crosswalk[0]){
    console.log('test', treeData)
  }
  return (
    <div className='max-w-6xl mx-auto'>
        Test {crosswalk.length} x
        {SURVEYS.map((survey)=> (
          <div>
            <div className='p-4 text-lg font-bold'>{survey}</div>
            <div className='bg-white w-full h-[800px]'>
              
              <ResponsiveTreeMap
                data={treeData}
                identity="name"
                value="q"
                valueFormat=".02s"
                enableLabel={false}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                labelSkipSize={12}
                tile={'binary'}
                nodeComponent={n => {
                  if(n.node.isLeaf && n.node.data[`${survey}_color`] === '#eee'){
                    //console.log('n',n, n.node.color, n.node.data.color )
                    n.node.fill = n.node.data[`${survey}_color`]
                    n.node.opacity = 1
                  }
                  return <TreeMapNode {...n} />
                }}
    
                
                labelTextColor={{
                    from: 'color',
                    modifiers: [
                        [
                            'darker',
                            1.2
                        ]
                    ]
                }}
                parentLabelPosition="top"
                parenLabelSize={40}
                parentLabelTextColor={{
                    from: 'color',
                    modifiers: [
                        [
                            'darker',
                            2
                        ]
                    ]
                }}
                borderColor={{
                    from: 'color',
                    modifiers: [
                        [
                            'darker',
                            0.1
                        ]
                    ]
                }}
                
                animate={false}
            />
            </div>
          </div>
      ))}
    </div>
  )
}


const config = {
  name:'TransportNY',
  // title: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
  // icon: 'fa-duotone fa-home',
  path: "/test",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'none'
  },
  component: Home
}

export default config;
