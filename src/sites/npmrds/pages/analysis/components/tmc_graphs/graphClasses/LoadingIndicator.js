import React from "react"

export default () =>
	<div style={ {
			position: "absolute",
			left: 0,
			right: 0,
			top: 0,
			bottom: 0,
			backgroundColor: "rgba(0, 0, 0, 0.1)",
			zIndex: 10000
		} }>
		<div style={ {
			position: "absolute",
			left: 0,
			right: 0,
			top: "calc(50% - 24px)",
			textAlign: "center"
		} }>
			<h1 style={ { color: "#000" } }>LOADING...</h1>
		</div>
	</div>