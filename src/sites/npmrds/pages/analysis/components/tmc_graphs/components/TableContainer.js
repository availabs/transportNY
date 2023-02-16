import React from "react"

import styled from "styled-components"

const TableContainer = styled.div`
	height: 100%;
	padding: 10px 20px;
	overflow-y: auto;

	th {
		text-align: left;
	}

  ::-webkit-scrollbar {
    height: 10px;
    width: 10px;
  }

  ::-webkit-scrollbar-corner {
    background: none;
  }

  ::-webkit-scrollbar-track {
    background: none;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 5px;
    background: #ccc;
    border: none;

    :vertical:hover {
      background: #999;
      cursor: pointer;
    }

    :horizontal:hover {
      background: #999;
      cursor: pointer;
    }
  }
`

export default ({ children }) =>
	<TableContainer>
		<table className="w-full">
			{ children }
		</table>
	</TableContainer>;
