import React from "react"

import get from "lodash/get"

import { FuseWrapper } from "./FuseWrapper"
import { useClickOutside } from "./useClickOutside"

const NO_OP = () => {};
const IDENTITY = v => v;

export const TypeAhead = props => {
  const {
    value = "",
    onChange = NO_OP,
    options = [],
    valueAccessor = IDENTITY,
    displayAccessor = IDENTITY
  } = props;

  const [focus, setFocus] = React.useState(false);
  const onFocus = React.useCallback(() => {
    setFocus(true);
  }, []);
  const onBlur = React.useCallback(() => {
    setFocus(false);
  }, []);

  const [ref, setRef] = React.useState(null);
  useClickOutside(ref, onBlur);

  const doOnChange = React.useCallback(e => {
    onChange(e.target.value);
  }, [onChange]);

  const onClick = React.useCallback(v => {
    onChange(valueAccessor(v));
  }, [onChange, valueAccessor]);

  const fuse = React.useMemo(() => {
    return FuseWrapper(
      options,
      { keys: [{ name: "label", getFn: valueAccessor }],
        threshold: 0.25
      }
    );
  }, [options, valueAccessor]);

  const typeahead = fuse(value).slice(0, 10);

  const show = React.useMemo(() => {
    if (!value) return false;
    if (typeahead[0] === value) return false;
    return Boolean(typeahead.length);
  }, [value, typeahead]);

  return (
    <div ref={ setRef }
      className="relative"
    >
      <div>
        <input type="text"
          className="w-full px-2 py-1"
          value={ value }
          onChange={ doOnChange }
            onFocus={ onFocus }
            onBlur={ onBlur }/>
      </div>
      { !show || !focus ? null :
        <div className="absolute left-0 z-10">
          { typeahead.map((o, i) => (
              <OptionItem key={ i }
                option={ o }
                onClick={ onClick }
                valueAccessor={ valueAccessor }
                displayAccessor={ displayAccessor }/>
            ))
          }
        </div>
      }
    </div>
  )
}

const OptionItem = ({ option, valueAccessor, displayAccessor, onClick }) => {
  const doOnClick = React.useCallback(() => {
    onClick(valueAccessor(option));
  }, [option, valueAccessor, onClick]);
  return (
    <div style={ { minWidth: "12rem" } }
      className={ `
        px-2 py-1 cursor-pointer bg-gray-200 hover:bg-gray-300
      ` }
      onMouseDown={ doOnClick }
    >
      { displayAccessor(option) }
    </div>
  )
}
