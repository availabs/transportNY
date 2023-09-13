import React from "react";
import { useTheme, TopNav, SideNav, FlyoutMenu } from "~/modules/avl-components/src/";
import { Link } from "react-router-dom";
import AuthMenu from "~/pages/Auth/AuthMenu"
import {getDomain, getSubdomain} from "~/utils"
import get from 'lodash/get'


const dataManagerCats = {
	freightatlas: 'Freight Atlas'
}


const Logo = ({sideNav}) => {
	const theme = useTheme()
	const themeOptions = {size: get(sideNav, 'size','micro') ,color: get(sideNav, 'color','dark')}
	return (
		<>
		<Link to="/" className={`${theme.sidenav(themeOptions).logoWrapper} flex flex-col items-center justify-center`}>
			<div>
				<img src='/nys_logo.svg' className='w-full h-12' alt='New York State Logo' />
			</div>	
		</Link>
		</>
	)
}

const noop = () => '';

	
const Layout = ({ children, menus, sideNav, title, site }) => {
	const TitleComp = title || noop;
	const theme = useTheme()
	const themeOptions = {size: get(sideNav, 'size','micro') ,color: get(sideNav, 'color','dark')}
	const [flyoutOpen, setFlyoutOpen] = React.useState(false)

	const PROJECT_HOST = getDomain(window.location.host)//psl.parse(window.location.host).domain
	const SUBDOMAIN = getSubdomain(window.location.host)

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
			<div className={`flex-1 flex items-start flex-col items-stretch min-h-screen`}>
				
				<div className={`${theme.sidenav(themeOptions).fixed}`}>
					<TopNav
						leftMenu={
							<>
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
										<div className='h-[34px] overflow-hidden'> {title} </div>
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
							</>
						}
						rightMenu={<AuthMenu />}
						menuItems={[
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
						]}
					/>
				</div>
				<div className={`h-full flex-1 bg-slate-100 ${theme.sidenav(themeOptions).fixed}`}>{children}</div>
			</div>
		</div>
	);
};

export default Layout;