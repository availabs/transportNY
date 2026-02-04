/**
 * @deprecated This layout is deprecated. Use Layout.jsx with DMS pattern instead.
 * This file is kept for reference only during migration.
 * TODO: Remove this file after migration is verified complete.
 */
import React from "react";
import { useTheme, TopNav, SideNav, FlyoutMenu } from "~/modules/avl-components/src/";
import { Link } from "react-router";
import AuthMenu from "~/pages/Auth/AuthMenu"
import {getDomain, getSubdomain} from "~/utils"
import { get, cloneDeep } from 'lodash-es'


const dataManagerCats = {
	freightatlas: 'Freight Atlas'
}


export const Logo = ({sideNav}) => {
	const theme = useTheme()
	const color = get(sideNav, 'color','white')
	const size =  get(sideNav, 'size','full') 
	const themeOptions = {size, color}
	// console.log('logo sideNav',sideNav, )
	// console.log('logo', color, size)
	return (
		<>
		<Link to="/" className={` ${theme.sidenav(themeOptions).logoWrapper} flex flex-col items-center justify-center`}>
			<div className='flex items-center '>
				<img src={`${color === 'dark' ? `/nys_logo.svg` : `/nys_logo_blue.svg`}`} className='w-full h-12 justify-between' alt='New York State Logo' />
				{/*<div> TransportNY </div>*/}
			</div>	
		</Link>
		</>
	)
}



const noop = () => <></>;

const PROJECT_HOST = getDomain(window.location.host)//psl.parse(window.location.host).domain
const SUBDOMAIN = getSubdomain(window.location.host)


const defaultMenuItems = [
	{
		name: "Docs",
		path: `/docs`,
		icon: "os-icon os-icon-home-10",
	},
	{
		name: "Data Sources",
		path: `/datasources${dataManagerCats[SUBDOMAIN] ? '/cat/'+dataManagerCats[SUBDOMAIN] : ''}`,
		icon: "os-icon os-icon-grid-squares2",
	},
]

const transportNYItems = [
    {
      title: 'NPMRDS',
      description: 'Probe speed data analytics platform',
      href: `http://npmrds.${PROJECT_HOST}`,
      icon: 'fa-duotone fa-cars',
    },
    {
      title: 'Freight Atlas',
      description: 'Freight infrastructure and commodity flow.',
      href: `http://freightatlas.${PROJECT_HOST}`,
      icon: 'fa-duotone fa-truck-container',
    },
    {
      title: 'Transit',
      description: 'Transit data and accesibility tools for planning.',
      href: `http://transit.${PROJECT_HOST}`,
      icon: 'fa-duotone fa-bus-simple',
    },
    {
      title: 'TSMO',
      description: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
      href: `http://tsmo.${PROJECT_HOST}`,
      icon: 'fa-duotone fa-traffic-light',
    },
  ]

	
const Layout = ({ children, menus, sideNav={},topNav={}, Title='', site }) => {

	const sideNavOptions = {
		size: sideNav?.size || 'none',
		color: sideNav?.color || 'dark',
		menuItems: sideNav?.menuItems || menus
	}

	// console.log('ppdaf layout', topNav)

	const topNavOptions = {
		position: topNav?.position || 'block',
		size: topNav?.size || 'compact',
		menu: topNav?.menu || 'left',
		subMenuStyle: topNav?.subMenuStyle || 'row',
		menuItems: (topNav?.menuItems || cloneDeep(defaultMenuItems)).filter(page => !page.hideInNav),
		logo: topNav?.logo || (
			<div className='flex items-center justify-center h-12'>
				<div to="/" className={`${['none'].includes(sideNavOptions.size)  ? '' : 'md:hidden'}` }>
					<Logo sideNav={{size:'mini', color:'white'}}/>
				</div>
				{typeof Title === 'function' ? <Title /> : Title}
			</div>
		)
	}

	//console.log('topNavOptions', topNavOptions)
	
	const theme = useTheme()
	const themeOptions = {size: get(sideNav, 'size','micro') ,color: get(sideNav, 'color','dark')}
	const [flyoutOpen, setFlyoutOpen] = React.useState(false)

	

	

  // console.log('layout menus', menus, themeOptions)

	return (
		<div className='flex' >
			<div className={`hidden md:block`}>
				<div className='fixed h-screen'>
					<SideNav 
						topMenu={
							<Logo sideNav={sideNav}/>
						}
						themeOptions={themeOptions}
						menuItems={menus}
					/>
				</div>
			</div>
			<div className={`flex-1 flex items-start flex-col items-stretch min-h-screen` }>
				
				<div className={`${theme.sidenav(themeOptions).fixed} `}>
					{
						topNavOptions.size === 'none' ? '' : (<>
							<div className={`${
								topNavOptions?.position === 'fixed' ? 
									`sticky top-0 z-20 w-full h-[51px]` 
									: ''
								}`}>
									<TopNav
										themeOptions={topNavOptions}
										// subMenuActivate={'onHover'}
										leftMenu={<>
								<div className='flex items-center justify-center h-12'>
									<Link to="/" className={`${themeOptions.size === 'none' ? '' : 'md:hidden'}` }>
										<div>
											<img src='/nys_logo_blue.svg' className='w-full h-12' alt='New York State Logo' />
										</div>
									</Link>
									<div 
										className={`text-lg font-bold text-gray-800 hover:text-gray-600 cursor-pointer px-4 `}
										onClick={() => setFlyoutOpen(!flyoutOpen)}
									>
										{site} <span className='fal fa-angle-down pl-2 relative top-[2px]'/>
									</div>
									<div className={`text-2xl font-thin text-blue-500  flex-1` }>
										<div className='overflow-hidden -ml-4 text-lg font-bold text-gray-800 cursor-pointer px-4'> {typeof Title === 'function' ? <Title /> : Title} </div>
									</div>
								</div>
								<div>
									<FlyoutMenu 
										open={flyoutOpen} 
										items={transportNYItems} 
										bottomItems={[
											
												<a href={`http://${PROJECT_HOST}`} className='flex-1 flex items-center justify-center h-12 shrink' >
													<div>
														<img src='/nys_logo_blue.svg' className='w-full h-12' alt='New York State Logo' />
													</div>
												
													<div 
														className={`-ml-4 text-lg font-bold text-gray-800 cursor-pointer px-4`}
														onClick={() => setFlyoutOpen(!flyoutOpen)}
													>
														TransportNY
													</div>
												</a>
											
										]}
									/>
								</div>
							</>}
										menuItems={topNavOptions.menuItems}
										rightMenu={<AuthMenu />}
										
									/>
							</div>
						</>)
					}
				</div>
				<div className={`h-full flex-1 bg-slate-100 ${theme.sidenav(themeOptions).fixed}`}>{children}</div>
			</div>
		</div>
	);
};

export default Layout;