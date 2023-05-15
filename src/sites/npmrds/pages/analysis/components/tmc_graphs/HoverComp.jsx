import React from "react"

class HoverComp extends React.Component {
	state = {
		width: 0,
		height: 0
	}
	componentDidMount() {
		const div = document.getElementById('tmc-hover-comp'),
			rect = div.getBoundingClientRect(),
			width = rect.bottom - rect.top,
			height = rect.right - rect.left;
		this.setState({ width, height })
	}
	componentDidUpdate(oldProps, oldState) {
		const div = document.getElementById('tmc-hover-comp'),
			rect = div.getBoundingClientRect(),
			height = rect.bottom - rect.top,
			width = rect.right - rect.left;
		if ((height !== oldState.height) || (width !== oldState.width)) {
			this.setState({ width, height })
		}
	}
	render() {
		const { width, height } = this.state,
			{ x, y, rows } = this.props,
			// left = x + 10 + width > window.innerWidth ? x - width - 10 : x + 10,
			// top = y + 10 + height > window.innerHeight ? window.innerHeight - height : y + 10,
			left = x + 10 + width > document.body.clientWidth ? x - width - 10 : x + 10,
			top = y + 10 + height > document.body.clientHeight ? document.body.clientHeight - height : y + 10,
			style = {
				position: "fixed",
				left, top,
				backgroundColor: "rgba(255, 255, 255, 0.8)",
				padding: "10px",
				borderRadius: "4px",
				zIndex: 2000,
				pointerEvents: "none"
			};
		return (
			<div id="tmc-hover-comp" style={ style }>
				<table style={ {
						border: "none",
						borderCollapse: "collapse"
					} }>
					<tbody>
						{ 
							rows.map((row, i) =>
								<tr key={ i }>
									{
										row.map((d, i) =>
											<td key={ i } colSpan={ row.length === 1 ? 2 : 1 }
												style={ {
													textAlign: i === 1 ? "right" : "left",
													padding: "2px 8px",
													border: "none"
												} }>
												{ d }
											</td>
										)
									}
								</tr>
							)
						}
					</tbody>
				</table>
			</div>
		)
	}
}

export default HoverComp