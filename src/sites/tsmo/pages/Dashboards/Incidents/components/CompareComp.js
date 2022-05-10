import React from "react"

export const fraction = (f, d = 0) => f.toLocaleString('en-US', { maximumFractionDigits: d } );

const lessThan0 = v => v < 0.0;

export const CompareComp = ({ prev, curr, title, display = fraction, green = lessThan0 }) => {
  const diff = curr - prev;
  const percent = diff / prev * 100;
  const icon = diff < 0.0 ? "fa fa-down" :
                diff > 0.0 ? "fa fa-up":
                "";
  const color = diff === 0 ? "" : green(diff) ? "text-green-600" : "text-red-600";
  return (
    <div>
      <div>{ title }</div>
      <div className='text-3xl'>
        { display(prev) }
      </div>
      <div className={ `text-3xl ${ color }` }>
        <span className={ `pr-1 ${ icon }` }/>
        { fraction(Math.abs(percent), 1) }%
      </div>
    </div>
  )
}

export const displayDuration = duration =>
  `${ fraction(Math.floor(duration / 60)) }:${ `00${ duration % 60 }`.slice(-2) }`;
