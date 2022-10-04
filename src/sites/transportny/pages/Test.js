// import React, { useEffect, useState, useMemo } from 'react';
// import { ResponsiveTreeMap } from '@nivo/treemap'
// import {TreeMapNode} from './TreeMapNode'

// const SURVEYS = ['Smartphone','NYCDOT','NHTS','RHTS']

// let colors = ['#e8c1a0', '#f47560', '#f1e15b', '#e8a838', '#61cdbb', '#97e3d5']

// const Home = () => {
//   const [crosswalk, setCrosswalk] = useState([])
//   const [activeSurvey, setActiveSurvey] = useState(SURVEYS[0])

//   useEffect(() => {
//     fetch('/data/survey_cross_v2.json')
//       .then(r => r.json())
//       .then(d => setCrosswalk(d))
//   },[])

//   const treeData = useMemo(() => {
//     let data = crosswalk
//     .filter(d => d["Variable Categories"])
//     .filter(d => !['Identifier','Survey-related','Census-related'].includes(d["Variable Subject"]))
//     .reduce((out, curr) => {
      
//       if(!out[curr["Variable Categories"]]){
//         out[curr["Variable Categories"]] = {
//           name: curr["Variable Categories"],
//           children: {}
//         }
//       }

//       if(!out[curr["Variable Categories"]].children[curr["Variable Subject"]]){
//         out[curr["Variable Categories"]].children[curr["Variable Subject"]] = {
//           name: curr["Variable Subject"],
//           children: {}
//         }
//       }
//       let surveyQuestion = SURVEYS
//         .reduce((out,survey) => {
//           out[survey] = 0
//           let surveyKeys = Object.keys(crosswalk[0])
//             .filter(d => !['Variable','Label'].some(e => d.includes(e)))
//             .filter(d => d.includes(survey))

//           surveyKeys.forEach(surveyKey => {
//             if([1,2].includes(+curr[surveyKey])) {
//               out[survey] = 1
              
//             }
//           })
//           return out
//         },{})

//       let varName = curr["Collapse Category"] ? curr["Collapse Category"] :  curr["Mother - Label"]
//       if(!out[curr["Variable Categories"]].children[curr["Variable Subject"]].children[varName]){
//         out[curr["Variable Categories"]].children[curr["Variable Subject"]].children[varName] = {
//           name: varName,
//           q: 1,
//           mother_survey: curr['Mother Variable Survey Origin'],
//           ...surveyQuestion
//         }
//       } 

//       // if collapse variable
//       // update surveyQuestions
//       Object.keys(SURVEYS).forEach(survey => {
//         if(surveyQuestion[survey] === 0 &&
//           out[curr["Variable Categories"]].children[curr["Variable Subject"]].children[varName][survey] !== 0) {
//           out[curr["Variable Categories"]].children[curr["Variable Subject"]].children[varName][survey] = 1
//         }
//       })


      
//       return out
//     },{})
//     // flatten children to arrays
//     Object.values(data).forEach((tl,i) => {
//       tl.color = colors[i%6]
//       tl.children = Object.values(tl.children)
//       tl.children.forEach(ll => {
//         ll.children = Object.values(ll.children)
//           .sort(function(a,b){
//               return a.mother_survey.localeCompare(b.mother_survey);
//           })
//       })
//     })
//     return {
//       name: "survey",
//       color: colors[0],
//       children: Object.values(data)
//     }
//   },[crosswalk])

//   if(crosswalk[0]){
//     console.log('test', treeData)
//   }
//   return (
//     <div className='max-w-6xl mx-auto'>
//         Survey Topic Overlap
//         {/*<pre>
//           {crosswalk[0] ? JSON.stringify(crosswalk[0],null,3) : ''}
//         </pre>*/}
        
//           <div className='pb-4'>
//             <div className='pb-4  '>
//               <select className='bg-gray-100 p-4 text-lg font-bold border border-gray-300 rounded' value={activeSurvey} onChange={e => setActiveSurvey(e.target.value)}>
//                 {SURVEYS.map(survey => <option value={survey} >{survey}</option>)}
//               </select>
//             </div>
//             <div className='bg-white w-full h-[800px]'>
              
//               <ResponsiveTreeMap
//                 data={treeData}
//                 identity="name"
//                 value="q"
//                 valueFormat=".02s"
//                 enableLabel={false}
//                 margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
//                 labelSkipSize={12}
                
//                 nodeComponent={n => {
//                   if(n.node.isLeaf && n.node.data[`${activeSurvey}`] === 0){
//                     n.node.fill = '#eee'
//                     n.node.opacity = 1
//                   }
//                   return <TreeMapNode {...n} />
//                 }}
    
                
//                 labelTextColor={{
//                     from: 'color',
//                     modifiers: [
//                         [
//                             'darker',
//                             1.2
//                         ]
//                     ]
//                 }}
//                 parentLabelPosition="top"
//                 parenLabelSize={40}
//                 parentLabelTextColor={{
//                     from: 'color',
//                     modifiers: [
//                         [
//                             'darker',
//                             2
//                         ]
//                     ]
//                 }}
//                 borderColor={{
//                     from: 'color',
//                     modifiers: [
//                         [
//                             'darker',
//                             0.1
//                         ]
//                     ]
//                 }}
                
//                 animate={false}
//             />
//           </div>
//         </div>
     
//     </div>
//   )
// }


// const config = {
//   name:'TransportNY',
//   // title: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
//   // icon: 'fa-duotone fa-home',
//   path: "/test",
//   exact: true,
//   auth: false,
//   mainNav: false,
//   sideNav: {
//     color: 'dark',
//     size: 'none'
//   },
//   component: Home
// }

// export default config;
