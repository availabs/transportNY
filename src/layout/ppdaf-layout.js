import React from "react";
import { useTheme, TopNav, SideNav } from "modules/avl-components/src/";
import { Link } from "react-router-dom";
import AuthMenu from "pages/Auth/AuthMenu"




const Layout = ({ children, menus, sideNav }) => {
	const theme = useTheme()
	const themeOptions = {size: sideNav.size || 'compact',color: sideNav.color || 'dark'}
	console.log('layout', menus)
	return (
		<div className='flex' >
			<div className='hidden md:block'>
				<SideNav 
					topMenu={
						<Link to="/" className={`${theme.sidenav(themeOptions).logoWrapper} flex items-center justify-center h-12`}>
							<span className="text-lg font-medium uppercase px-4 ">
								TISMO
							</span>
						</Link>
					}
					themeOptions={themeOptions}
					menuItems={menus}
				/>
			</div>
			<div className={`flex-1 flex items-start flex-col min-h-screen`}>
				
				<div className="w-full">
					<TopNav
						leftMenu={
							<Link to="/" className={`${sideNav.size === 'none' ? '' : 'md:hidden'} flex items-center justify-center h-12`}>
								<span className="text-lg font-medium uppercase px-4">
									TISMO
								</span>
							</Link>
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
				<div className={`w-full h-full flex-1 bg-neutral-100`}>{children}</div>
			</div>
		</div>
	);
};

export default Layout;