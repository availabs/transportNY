import React from "react"
import {useFalcor} from 'modules/avl-components/src'
import get from 'lodash.get'

const stations = { "addi":"Addison","ande":"Andes","bspa":"Ballston Spa","bata":"Batavia","beac":"Beacon","beld":"Belden","bell":"Belleville","belm":"Belmont","berk":"Berkshire","bing":"Binghamton","bran":"Brant","brew":"Brewster","broc":"Brockport","bron":"Bronx","broo":"Brookfield","bkln":"Brooklyn","buff":"Buffalo","burd":"Burdett","burt":"Burt","camd":"Camden","cape":"Cape Vincent","csqr":"Central Square","chaz":"Chazy","ches":"Chestertown","cinc":"Cincinnatus","clar":"Claryville","clif":"Clifton Springs","clym":"Clymer","cobl":"Cobleskill","coho":"Cohocton","cold":"Cold Brook","copa":"Copake","cope":"Copenhagen","crog":"Croghan","dele":"Delevan","depo":"Deposit","dove":"Dover Plains","duan":"Duanesburg","eaur":"East Aurora","edin":"Edinburg","edwa":"Edwards","eldr":"Eldred","elle":"Ellenburg","elmi":"Elmira","essx":"Essex","faye":"Fayetteville","fred":"Fredonia","gabr":"Gabriels","gfld":"Glenfield","gfal":"Glens Falls","grot":"Groton","grov":"Grove","hamm":"Hammond","harp":"Harpersfield","harr":"Harrisburg","hart":"Hartsville","herk":"Herkimer","hfal":"High Falls","ilak":"Indian Lake","john":"Johnstown","jord":"Jordan","kind":"Kinderhook","laur":"Laurens","loui":"Louisville","malo":"Malone","manh":"Manhattan","medi":"Medina","medu":"Medusa","morr":"Morrisville","newc":"Newcomb","nbra":"North Branch","nhud":"North Hudson","oldf":"Old Forge","olea":"Olean","onta":"Ontario","oppe":"Oppenheim","osce":"Osceola","oswe":"Oswego","otis":"Otisville","oweg":"Owego","penn":"Penn Yan","phil":"Philadelphia","pise":"Piseco","pots":"Potsdam","quee":"Queens","rand":"Randolph","raqu":"Raquette Lake","redh":"Red Hook","redf":"Redfield","roxb":"Roxbury","rush":"Rush","sara":"Saranac","scha":"Schaghticoke","scho":"Schodack","schu":"Schuylerville","scip":"Scipio Center","sher":"Sherburne","some":"Somers","sbri":"South Bristol","sout":"Southold","spra":"Sprakers","spri":"Springfield","stat":"Staten Island","step":"Stephentown","ston":"Stony Brook","suff":"Suffern","tann":"Tannersville","tico":"Ticonderoga","tull":"Tully","tupp":"Tupper Lake","tyro":"Tyrone","voor":"Voorheesville","wall":"Wallkill","walt":"Walton","want":"Wantagh","wars":"Warsaw","warw":"Warwick","wate":"Waterloo","well":"Wellesley Island","west":"Westmoreland","wfmb":"Whiteface Mountain Base","whit":"Whitehall","wolc":"Wolcott","wbou":"Woodbourne","wgat":"Woodgate","york":"York",}


const Test1 = () => {
  const {falcor, falcorCache} = useFalcor()

  const [station, setStation] = React.useState('tann')
  const [start, setStart] = React.useState('2020-08-04')
  const [end, setEnd] = React.useState('2020-08-10')
  const [sum, setSum] = React.useState(12)
  const dataGetter = React.useMemo(() => ['mesonet',station, `["${start}","${end}"]`], [station, start,end])
  
  React.useEffect(() => {
    if(start.length === 10 && end.length === 10){
      falcor.get(dataGetter)
    }
  },[falcor,dataGetter, start.length, end.length])


  const sumBy = (data, num) => {
    let sumKey = null
    return Object.keys(data).reduce((out, k, i) => {
        if(i % num === 0) {
          sumKey = k
          out[sumKey] = data[k]
        } else {
          out[sumKey] += data[k]
        } 
        return out
    },{})
  }

  const data = React.useMemo(() => {
    let r = get(falcorCache, dataGetter, {response: 'no data'})
    //return r
    console.log('testing', r)
    return {
       station: get(r,'value.coords.station.data', 'No station'),
       data: sumBy(get(r,'value.coords.time.data', [])
        .reduce((out, t, i) => {
          let mins = t.split('T')[1]
          if(i === 0 && mins === '0000') {
            out[t] = 0
          }
          else if(mins === '0005') {
            out[t] = get(r,`value.data_vars.precip.data[0][${i}]`, -99)
          } else {
            out[t] = (get(r,`value.data_vars.precip.data[0][${i}]`, -99) - get(r,`value.data_vars.precip.data[0][${i-1}]`, -99)) 
          }
          return out
        },{}),sum)
    }

  },[dataGetter,falcorCache, sum])



  return (
    <div className='max-w-6xl mx-auto'>
      <div className = 'p-4'>
        <span className='text-4xl font-medium'> Mesonet Precipitation Data Liberator</span>
      </div>
      <div className='p-4 flex'>
        <div className='flex-1'>
          Station:
          <div>
            <select
              className='p-2 text-lg bg-white'
              value={station}
              onChange={e => setStation(e.target.value)}
            >
              {Object.keys(stations).map(s => <option key={s} value={s}>{stations[s]}</option>)} 
            </select>
          </div>
        </div>
        <div className='flex-1'>
          Interval:
          <div>
            <select
                className='p-2 text-lg bg-white'
                value={sum}
                onChange={e => setSum(e.target.value)}
              >
                <option value={12}>Hour</option>
                <option value={3}>15 Minutes</option>
                <option value={1}>5 Minutes</option>
              </select>
          </div>
        </div>
     
        <div className='flex-1'>
          Start Date: (yyyy-mm-dd)
          <div>
            <input
                className='p-2 text-lg bg-white'
                value={start}
                onChange={e => setStart(e.target.value)}
              />
               
          </div>
        </div>
        <div className='flex-1'>
          End Date: (max 60 day diff)
          <div>
            <input
                className='p-2 text-lg bg-white'
                value={end}
                onChange={e => setEnd(e.target.value)}
              />
               
          </div>
        </div>
      </div>
      <div className='p-4'>
        <div className='text-xl'>
          {stations[station]}
        </div>
        <div>
          <table>
            <thead>
              <tr>
                <th> Date / Time </th>
                <th> Precip (mm) </th>
              </tr>
            </thead>
            <tbody>
              {
                Object.keys(data.data)
                .map(d => {
                  return (
                    <tr>
                      <td className='border'>{d}</td>
                      <td className='border text-right'>{data.data[d]/100}</td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>
      {/*<pre>
        {JSON.stringify(data, null , 3 )}
      </pre>*/}
    </div>
  )
}

const config = {
  name:'Meso Getter',
  path: "/mesogetter",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Test1
}

export default config
