import React from "react"

import styled from "styled-components"

import { group } from "d3-array"

import { GRAPH_TYPES } from "../tmc_graphs"

const GraphTypeGroup = styled.div`
	margin-bottom: 10px;
`

const GroupHeader = styled.h4`
	color: ${ props => props.theme.textColorHl };
	border-bottom: 2px solid ${ props => props.theme.textColorHl };
	margin-bottom: 0px;
	font-size: 1.25rem;
	font-weight: bold;
`

const GraphItem = styled.div`
	color: ${ props => props.theme.textColor };
	padding: 4px 0px 2px 10px;
	cursor: pointer;
	transition: background-color 0.15s, color 0.15s;

	:hover {
		background-color: ${ props => props.theme.textColor };
		color: ${ props => props.theme.sidePanelBg };
		border-radius: 4px;
	}
`

class GraphSelector extends React.Component {
	render() {
		const types = [];
		group(GRAPH_TYPES, d=> d.category)
			.forEach((group, category) => {
				types.push(
					<GraphTypeGroup key={ category }>
						<GroupHeader>
							{ category }
						</GroupHeader>
						{
							group.sort((a, b) => a.type < b.type ? -1 : 1)
								.map(gt =>
									<GraphItem key={ gt.type }
										onClick={ e => this.props.addGraph(gt.type) }>
										{ gt.type }
									</GraphItem>
								)
						}
					</GraphTypeGroup>
				)
			})
		return (
			<div style={ { padding: "10px" } }>
				{ types }
			</div>
		)
	}
}
export default GraphSelector
