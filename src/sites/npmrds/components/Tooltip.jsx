import React from "react"

import styled from 'styled-components';
import ReactTooltip from 'react-tooltip';

export const Tooltip = styled(ReactTooltip)`
  &.__react_component_tooltip {
    font-size: 9.5px;
    font-weight: 500;
    padding: 7px 18px;
    &.type-dark {
      background-color: ${props => props.theme.tooltipBg};
      color: ${props => props.theme.tooltipColor};
      &.place-bottom {
        :after {
          border-bottom-color: ${props => props.theme.tooltipBg};
        }
      }
      &.place-top {
        :after {
          border-top-color: ${props => props.theme.tooltipBg};
        }
      }
      &.place-right {
        :after {
          border-right-color: ${props => props.theme.tooltipBg};
        }
      }
      &.place-left {
        :after {
          border-left-color: ${props => props.theme.tooltipBg};
        }
      }
    }
  }
`;
