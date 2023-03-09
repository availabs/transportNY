import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
// import {ArrowRight} from 'components/common/icons';

import get from "lodash.get"

const StyledSidePanelContainer = styled.div`
  transition: width 250ms;
  display: flex;
  position: fixed;
  z-index: 40;
  left: 3.5rem;
  top: 50px;
  bottom: 0px;
`

const SideBarContainer = styled.div`
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: left 250ms, right 250ms;
  left: ${props => props.left}px;
  align-items: stretch;
  flex-grow: 1;
`;

const SideBarInner = styled.div`
  border-radius: 1px;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: ${ props => props.isOpen ? props.width : 0 }px;
  transition: width 250ms;
  white-space: nowrap;
  overflow-x: ${ props => props.hideInner ? "hidden" : "visible" };
`;

const CollapseButton = styled.div`
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  justify-content: center;
  border-radius: 1px;
  display: flex;
  height: 20px;
  position: absolute;
  right: -5px;
  top: 5px;
  width: 20px;
  cursor: pointer;
  z-index: 0;
`;

const SidebarExtension = styled.div`
  width: ${ props => props.isOpen ? props.width : 0 }px;
  transition: width 250ms;
  height: 100%;
  position: absolute;
  top: 0px;
  left: ${ props => props.width }px;
  white-space: nowrap;
  overflow-x: ${ props => props.hideExtended ? "hidden" : "visible" };
`

class SideBar extends Component {
  static defaultProps = {
    width: 300,
    minifiedWidth: 0,
    isOpen: 1,
    onOpenOrClose: () => {},
    extendedComp: null
  };

  state = {
    transitioning: false,
    from: null,
    to: null
  };
  componentDidUpdate(oldProps, oldState) {
    if (oldProps.isOpen !== this.props.isOpen) {
      this.setState({
        transitioning: true,
        from: oldProps.isOpen,
        to: this.props.isOpen
      });
      setTimeout(() => this.setState({ transitioning: false }), 250);
    }
  }

  static propTypes = {
    width: PropTypes.number,
    isOpen: PropTypes.number,
    minifiedWidth: PropTypes.number,
    onOpenOrClose: PropTypes.func
  };

  _onOpenOrClose = () => {
    const openOrClose = this.props.isOpen === 0 ? 1 : -1;
    this.props.onOpenOrClose(openOrClose);
  };

  handleClickOutside(e) {
    if (this.props.isOpen == 2) {
     this.props.onOpenOrClose(-1);
    }
  }

  render() {
    const { isOpen, minifiedWidth, width, theme } = this.props;
    const horizontalOffset = isOpen ? 0 : (minifiedWidth - width);

    const {
      transitioning,
      to,
      from
    } = this.state

    const hideInner = (isOpen < 1) || (transitioning && (to === 1) && (from === 0));

    const hideExtended = isOpen < 2 || (transitioning && (to === 2));

    return (
      <StyledSidePanelContainer
        isOpen={ isOpen }
        style={ {
          width: `${ isOpen ? width * isOpen : 50 }px`
        } }>

        <SideBarContainer
          className="side-bar"
          style={ { width: `${ width }px` } }
          left={ horizontalOffset }>

            <SideBarInner className="bg-gray-100"
              width={ width }
              isOpen={ isOpen > 0 }
              hideInner={ hideInner }>

              <div style={ { width: "100%", height: "100%" } }>
                { this.props.children }
              </div>

            </SideBarInner>

            <SidebarExtension className="bg-gray-100"
              width={ width }
              isOpen={ isOpen == 2 }
              hideExtended={ hideExtended }>

              <div style={ { width: `${ width }px` } }>
                { this.props.extendedComp }
              </div>

            </SidebarExtension>

          <CollapseButton className="bg-gray-100 hover:bg-gray-200"
            onClick={ e => { e.stopPropagation(); this._onOpenOrClose(); } }>

            <span className="fa fa-arrow-right"
              style={ { transform: `rotate(${isOpen ? 180 : 0}deg)` } }/>

          </CollapseButton>

        </SideBarContainer>
      </StyledSidePanelContainer>
    );
  }
}

// export default onClickOutside(SideBar)
export default SideBar
