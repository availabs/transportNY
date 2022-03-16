import React from "react";
import { useTheme, TopNav, SideNav, FlyoutMenu } from "modules/avl-components/src/";
import { Link } from "react-router-dom";
import AuthMenu from "pages/Auth/AuthMenu"

const transportNYItems = [
  {
    name: 'NPMRDS',
    description: 'Probe speed data analytics platform',
    href: 'https://npmrds.transportny.org',
    icon: 'fa-duotone fa-cars',
  },
  {
    name: 'Freight Atlas',
    description: 'Freight infrastructure and commodity flow.',
    href: '#',
    icon: 'fa-duotone fa-truck-container',
  },
  {
    name: 'Transit',
    description: 'Transit data and accesibility tools for planning.',
    href: 'https://transit.transportny.org',
    icon: 'fa-duotone fa-bus-simple',
  },
  {
    name: 'TSMO',
    description: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
    href: 'https://tsmo.transportny.org',
    icon: 'fa-duotone fa-traffic-light',
  },
]


const Logo = ({sideNav}) => {
	const theme = useTheme()
	const themeOptions = {size: sideNav.size || 'compact',color: sideNav.color || 'dark'}
	return (
		<>
		<Link to="/" className={`${theme.sidenav(themeOptions).logoWrapper} flex flex-col items-center justify-center`}>
			<div>
				<img src='/nys_logo.svg' className='w-full h-12' />
			</div>	
		</Link>
		</>
	)
}



const Layout = ({ children, menus, sideNav, title }) => {
	const theme = useTheme()
	const themeOptions = {size: sideNav.size || 'compact',color: sideNav.color || 'dark'}
	const [flyoutOpen, setFlyoutOpen] = React.useState(false)
	return (
		<div className='flex' >
			<div className='hidden md:block'>
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
			<div className={`flex-1 flex items-start flex-col min-h-screen`}>
				
				<div className="w-full">
					<TopNav
						leftMenu={
							<>
								<div className='flex-1 flex items-center justify-center h-12 shrink'>
									<Link to="/" className={`${sideNav.size === 'none' ? '' : 'md:hidden'}` }>
										<div>
											<img src='/nys_logo_blue.svg' className='w-full h-12' />
										</div>
									</Link>
									<div 
										className={`text-lg font-bold text-gray-800 hover:text-gray-600 cursor-pointer px-4 ${sideNav.size === 'none' ? '' : 'md:ml-14'}`}
										onClick={() => setFlyoutOpen(!flyoutOpen)}
									>
										TSMO <span className='fal fa-angle-down pl-2 relative top-[2px]'/>
									</div>
									<div className={`text-2xl font-thin text-blue-500 truncate shrink` }>
										{title}
									</div>
								</div>
								<div>
									<FlyoutMenu 
										open={flyoutOpen} 
										items={transportNYItems} 
										bottomItems={[
											<div className='flex-1 flex items-center justify-center h-12 shrink'>
												<Link to="/" >
													<div>
														<img src='/nys_logo_blue.svg' className='w-full h-12' />
													</div>
												</Link>
												<div 
													className={`-ml-4 text-lg font-bold text-gray-800 cursor-pointer px-4`}
													onClick={() => setFlyoutOpen(!flyoutOpen)}
												>
													TRANSPORTNY
												</div>
									
											</div>
										]}
									/>
								</div>
							</>
						}
						rightMenu={<AuthMenu />}
						menuItems={[
							{
								name: "Docs",
								path: `/components`,
								icon: "os-icon os-icon-home-10",
							},
							{
								name: "Data Sources",
								path: `/examples`,
								icon: "os-icon os-icon-grid-squares2",
							},
						]}
					/>
				</div>
				<div className={`w-full h-full flex-1 bg-neutral-100 ${theme.sidenav(themeOptions).fixed}`}>{children}</div>
			</div>
		</div>
	);
};

export default Layout;