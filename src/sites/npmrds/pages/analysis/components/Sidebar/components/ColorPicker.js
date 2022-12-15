import React from "react"

import { CustomPicker } from 'react-color'
import { Saturation, Hue } from 'react-color/lib/components/common';

const ColorPicker = props =>
	<div style={ { width: "100%", padding: "10px", background: "#888", borderRadius: "4px" } }>
		<div style={ { position: "relative", height: "200px", cursor: "pointer" } }>
			<Saturation { ...props }
				onChange={ props.onChange }/>
		</div>
		<div style={ { position: "relative", height: "10px", marginTop: "10px", borderRadius: "4px", cursor: "pointer" } }>
			<Hue { ...props }
				direction="horizontal"
				onChange={ props.onChange }
				pointer={ () => <div style={ { width: "6px", height: "16px", background: "#fff", marginTop: "-3px", borderRadius: "3px" } }/> }/>
		</div>
	</div>
export default CustomPicker(ColorPicker);
