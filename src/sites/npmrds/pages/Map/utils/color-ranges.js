import React from "react"

import colorbrewer from "colorbrewer"

import styled from "styled-components"
import get from "lodash.get"

const ColorRanges = {}

for (const type in colorbrewer.schemeGroups) {
	colorbrewer.schemeGroups[type].forEach(name => {
		const group = colorbrewer[name];
		for (const length in group) {
			if (!(length in ColorRanges)) {
				ColorRanges[length] = [];
			}
			ColorRanges[length].push({
				type: `${ type[0].toUpperCase() }${ type.slice(1) }`,
				name,
				category: "Colorbrewer",
				colors: group[length]
			})
		}
	})
}

export { ColorRanges };
console.log("ColorRanges", ColorRanges);

export const getColorRange = (size, name) =>
	get(ColorRanges, [size], [])
		.reduce((a, c) => c.name === name ? c.colors : a, []).slice();

const ColorBarContainer =styled.div`
  > *:first-child {
    border-top-left-radius: 0.25rem;
    border-bottom-left-radius: 0.25rem;
  }
  > *:last-child {
    border-top-right-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
  }
`
export const ColorBar = ({ colors, small = false }) => {
  return (
    <ColorBarContainer className={ `grid grid-cols-${ colors.length }` }>
      { colors.map((c, i) =>
          <div key={ i }
						style={ {
							backgroundColor: c,
							transition: "background-color 0.5s"
						} }
            className={ `col-span-1 ${ small ? "h-2" : "h-3" }` }/>
        )
      }
    </ColorBarContainer>
  )
}
