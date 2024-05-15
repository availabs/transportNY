import React from "react"

const Radio = ({ label, selected, select, value, disabled }) => {
  const doSelect = React.useCallback(e => {
    select(value);
  }, [select, value]);
  return (
    <div onClick={ disabled ? null : doSelect }
      className={ `
        flex items-center border-b border-transparent hover:border-inherit
      ` }
    >
      <div className={ `
          rounded-full border w-4 h-4 mr-2
          ${ selected ? "border-blue-500" : "border-gray-500" }
          flex items-center justify-center
        ` }
      >
        { !selected ? null :
          <div className="w-2 h-2 rounded-full bg-blue-500"/>
        }
      </div>
      <div>
      </div>
        { label }
    </div>
  )
}

const Identity = i => i;

const RadioSelector = props => {
  const {
    options = [],
    value,
    onChange,
    displayAccessor = Identity,
    valueAccessor = Identity,
    disabled = false
  } = props;
  return (
    <div className={ `
        grid grid-cols-1 gap-1 px-2 py-1
        ${ disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer" }
      ` }
    >
      { options.map((o, i) => (
          <Radio key={ valueAccessor(o) }
            label={ displayAccessor(o) }
            selected={ valueAccessor(o) === value }
            value={ valueAccessor(o) }
            select={ onChange }
            disabled={ disabled }/>
        ))
      }
    </div>
  )
}
export default RadioSelector
