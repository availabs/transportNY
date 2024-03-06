import React from "react"
import get from 'lodash/get'

export const fraction = (f, perUnit=1, d = 1) => (f/perUnit).toLocaleString('en-US', { maximumFractionDigits: d } );


const lessThan0 = v => v < 0.0;

export const CompareComp = ({ prev, curr, currPer=1, prevPer=1, perUnit='day', title,  display = fraction, green = lessThan0 }) => {
  const diff = (curr/currPer) - (prev/prevPer);
  const percent = diff / (prev/prevPer) * 100;
  const icon = diff > 0 ? "fad fa-arrow-trend-up" : "fad fa-arrow-trend-down"
  const color = diff === 0 ? "" : green(diff) ? "text-lime-600" : "text-rose-400";
  return (
    <div className='flex-1'>
      {/*<div>{ title }</div>*/}
      
      <div className={ `text-3xl ${ color }` }>
        <span className={ `px-2 text-base font-light ${ icon }` }/>
        { isNaN(fraction(Math.abs(percent), 1)) ?  '' : fraction(Math.abs(percent), 1) }%
      </div>
      <div className='text-xs text-gray-500 -mt-2'>
        { display(prev,prevPer) }  {perUnit ? `/ ${perUnit}` : ''} 
      </div>
    </div>
  )
}

export const HeroStatComp = ({data,stat,display=fraction, perUnit='day'}) => ( 
  <div className='text-gray-800 text-center '>
    {Object.keys(data.prevMonthByCat).map(cat => {
      if(get(data, `currentMonthbyCat[${cat}].count`,0) < 5) return ''
      return (
      <div key={cat} className='border-b'>
        <div className='text-left w-full'>{cat}</div>
        <div className='flex'>
          <div className='flex-1' > 
            <div className='flex'>
              <div className='w-10 h-10 shadow' style={{backgroundColor: data.colorsForTypes[cat]}} />
                <div className='flex-1'>
                  <div className='text-lg'>
                    {display(get(data, `currentMonthbyCat[${cat}][${stat}]`,0))}
                  </div>
                  <div className='text-xs text-gray-500 '>
                    {display(get(data, `currentMonthbyCat[${cat}][${stat}]`,0),perUnit ? data.currentMonthDays.length : 1)}  {perUnit ? `/ ${perUnit}` : ''}
                  </div>
                </div>
              </div>
            </div>
            <CompareComp title="Prev. Month"
              prev={ get(data, `prevMonthByCat[${cat}][${stat}]`,0) }
              prevPer = {perUnit ? data.prevMonthDays.length : 1}
              curr={ get(data, `currentMonthbyCat[${cat}][${stat}]`,0)}
              currPer = {perUnit ? data.currentMonthDays.length : 1}
              perUnit = {perUnit ? 'day' : null }
              display={display}
            />
          </div>
        </div>
    )})}
  </div>
)

export const CongestionStatComp = ({data,stat,display=fraction, perUnit='day'}) => ( 
  <div className='text-gray-800 text-center '>
    {['total', 'recurrent', 'non-recurrent','accident','construction'].map(cat => {
      if(get(data, `currMonth[${cat}]`,0) < 5) return ''
      return (
      <div key={cat} className='border-b'>
        <div className='text-left w-full'>{cat}</div>
        <div className='flex'>
          <div className='flex-1' > 
            <div className='flex'>
              <div className='w-10 h-10 shadow' style={{backgroundColor: data.colorsForTypes[cat]}} />
                <div className='flex-1'>
                  <div className='text-lg'>
                    {display(get(data, `currMonth[${cat}]`,0))}
                  </div>
                 {/* <div className='text-xs'>
                    {get(data, `currMonth[${cat}]`,0).toLocaleString()}
                  </div>*/}
                  <div className='text-xs text-gray-500 '>
                    {display(get(data, `currMonth[${cat}]`,0),perUnit ? get(data,`currMonth.numDays`,1) : 1)}  {perUnit ? `/ ${perUnit}` : ''}
                  </div>
                </div>
              </div>
            </div>
            <CompareComp title="Prev. Month"
              prev={ get(data, `prevMonth[${cat}]`,0) }
              prevPer = {perUnit ? get(data,`prevMonth.numDays`, 1) : 1}
              curr={ get(data, `currMonth[${cat}]`,0)}
              currPer = {perUnit ? get(data,`currMonth.numDays`, 1) : 1}
              perUnit = {perUnit ? 'day' : null }
              display={display}
            />
          </div>
        </div>
    )})}
  </div>
)

export const displayDuration = duration =>
  `${ fraction(Math.floor(duration / 60)) }:${ `00${ duration % 60 }`.slice(-2) }`;
