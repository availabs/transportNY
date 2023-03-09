import React from "react"

import get from "lodash.get"
import styled from "styled-components"

import { Header } from "./ActiveRouteComponents"

// const Header = styled.div`
// 	border-bottom: 2px solid ${ props => props.theme.textColorHl };
// 	cursor: pointer;
// 	display: flex;
// 	flex-grow: 1;
//
// 	h4 {
// 		color: ${ props => props.theme.textColorHl };
// 		margin-bottom: 0px;
// 		font-size: 1.5rem;
// 		font-weight: bold;
// 	}
//
// 	span.fa {
// 		color: ${ props => props.theme.textColorHl };
// 		font-size: 18px;
// 		border-radius: 4px;
// 		padding: 5px 4px 3px 5px;
// 		transition: background-color 0.15s;
// 	}
// `
const HeaderInner = styled.div`
	display: flex;
	flex-grow: 1;
	:hover span.fa {
		color: ${ props => props.theme.sidePanelBg };
		background-color: ${ props => props.theme.textColorHl };
	}
`

const ActiveGraphItem = styled.div`
	color: ${ props => props.theme.textColor };
	padding: 3px 10px;
`
const OpenCloseButton = styled.div`
	width: 30px;
	span.fa {
		padding: 5px;
	}
	:hover span.fa {
		color: ${ props => props.theme.sidePanelBg };
		background-color: ${ props => props.theme.textColorHl };
	}
`

const Icon = styled.span`
	color: ${ props => props.theme.textColor };
	border-radius: 4px;
	padding: 5px;
	cursor: pointer;
	float: right;
	transition: color 0.15s,
		background-color 0.15s;

	:hover {
		color: ${ props => props.theme.sidePanelBg };
		background-color: ${ props => props.theme.textColor };
	}

`

const ActiveGraphComponents = props => {
	const [open, setOpen] = React.useState(true);

	const [headerRef, setHeaderRef] = React.useState();
	const height = React.useMemo(() => {
		if (!headerRef) return "100%";
		const headerHeight = get(headerRef, "clientHeight", 0);
		return `calc(100% - ${ headerHeight }px)`;
	}, [headerRef]);

	return (
		<div style={ {
			padding: "0px 10px",
			whiteSpace: "nowrap",
			position: "relative",
			height: "100%",
			maxHeight: "100%"
		} }>

			<div id="graph-comps-header"
				ref={ setHeaderRef }
			>
				<Header onClick={ e => props.extendColorSelector() }
					style={ { marginBottom: "5px" } }>
					<OpenCloseButton />
					<HeaderInner>
						<div style={ { flexGrow: 1 } }>
							<h4>Colors</h4>
						</div>
						<div style={ { flexGrow: 0 } }>
							<span className="fa fa-chevron-right extend"/>
						</div>
					</HeaderInner>
				</Header>

				<Header onClick={ e => props.extendGraphSelector() }>
					<OpenCloseButton>
						<span onClick={ e => {
							e.stopPropagation();
							setOpen(!open);
						} } className={ `fa fa-${ open ? "minus" : "plus" }` }/>
					</OpenCloseButton>
					<HeaderInner>
						<div style={ { flexGrow: 1 } }>
							<h4>Graphs</h4>
						</div>
						<div style={ { flexGrow: 0 } }>
							<span className="fa fa-chevron-right extend"/>
						</div>
					</HeaderInner>
				</Header>
			</div>

			<div
				style={ {
					height: open ? height : "0px",
					maxHeight: height,
					overflow: open ? "auto" : "hidden"
				} }
			>
				<div id="graph-comps-container">
					{ props.graphs.map((graph, i) =>
							<ActiveGraphItem key={ graph.id }>
								{ graph.type }
								<Icon className="fa fa-minus"
									onClick={ e => props.removeGraphComp(i, graph.id) }/>
								<Icon className="fa fa-plus"
									onClick={ e => props.addGraphComp(graph.type) }/>
							</ActiveGraphItem>
						)
					}
				</div>
			</div>
		</div>
	)
}
export default ActiveGraphComponents
