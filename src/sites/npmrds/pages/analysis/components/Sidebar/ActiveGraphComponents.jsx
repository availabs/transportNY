import React from "react"

import get from "lodash/get"
import styled from "styled-components"

import { Header } from "./ActiveRouteComponents"

import {
	OpenCloseButton
} from "./components/parts"

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

	const toggle = React.useCallback(e => {
		e.stopPropagation();
		setOpen(o => !o);
	}, []);

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
					<OpenCloseButton open={ open } onClick={ toggle }/>
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
