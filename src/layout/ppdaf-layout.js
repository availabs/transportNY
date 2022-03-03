import React from "react";
import { useTheme, TopNav, SideNav } from "modules/avl-components/src/";
import { Link } from "react-router-dom";
import AuthMenu from "pages/Auth/AuthMenu"


const Logo = ({sideNav}) => {
	const theme = useTheme()
	const themeOptions = {size: sideNav.size || 'compact',color: sideNav.color || 'dark'}
	return (
		<Link to="/" className={`${theme.sidenav(themeOptions).logoWrapper} flex flex-col items-center justify-center`}>
			
				<div>
					<img src='/nys_logo.svg' className='w-full h-12' />
				</div>
				<div className='text-sm font-medium uppercase'>TSMO</div>
				
			
		</Link>
	)
}



const Layout = ({ children, menus, sideNav }) => {
	const theme = useTheme()
	const themeOptions = {size: sideNav.size || 'compact',color: sideNav.color || 'dark'}
	console.log('layout', menus)
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
							<Link to="/" className={`${sideNav.size === 'none' ? '' : 'md:hidden'} flex items-center justify-center h-12`}>
								<div>
									<img src='/nys_logo_blue.svg' className='w-full h-12' />
								</div>
								<span className="text-lg font-medium uppercase">
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
				<div className={`w-full h-full flex-1 bg-neutral-100 ${theme.sidenav(themeOptions).fixed}`}>{children}</div>
			</div>
		</div>
	);
};

export default Layout;