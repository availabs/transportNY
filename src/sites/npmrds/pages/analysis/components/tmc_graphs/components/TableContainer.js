import React from "react"

import styled from "styled-components"

const TableContainer = styled.div`
	height: 100%;
	padding: 10px 20px;
	overflow-y: auto;

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
		<table className="table table-sm">
			{ children }
		</table>
	</TableContainer>;
