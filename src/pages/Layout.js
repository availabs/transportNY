import React from "react";
import { /*useTheme,*/ TopNav } from "modules/avl-components/src/";
import { Link } from "react-router-dom";
// import AuthMenu from 'pages/Auth/AuthMenu'

const Layout = ({ children }) => {
	// const theme = useTheme()
	return (
		<div className={`flex items-start flex-col min-h-screen`}>
			<div className="w-full fixed bg-white z-10">
				<TopNav
					leftMenu={
						<Link to="/" className="flex items-center justify-center h-12">
							<span className="text-lg font-medium uppercase px-4">
								AVL Design
							</span>
						</Link>
					}
					menuItems={[
						{
							name: "Components",
							path: `/components`,
							icon: "os-icon os-icon-home-10",
						},
						{
							name: "Examples",
							path: `/examples`,
							icon: "os-icon os-icon-grid-squares2",
						},
					]}
				/>
			</div>
			<div className={`w-full h-full flex-1 mt-12 bg-gray-100`}>{children}</div>
		</div>
	);
};

export default Layout;