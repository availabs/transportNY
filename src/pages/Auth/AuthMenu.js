import React from "react"
import {useTheme, NavMenu, NavMenuItem, NavMenuSeparator, NavItem, withAuth } from 'modules/avl-components/src'
import {Link} from 'react-router-dom'
// import {NavItem, NavMenu, NavMenuItem, NavMenuSeparator, withAuth} from 'components/avl-components/src'
// import user from "@availabs/ams/dist/reducers/user";

const UserMenu = ({user}) => {
    const theme = useTheme()
    return (
        <div className={`text-sm text-white font-normal tracking-widest flex justify-column align-middle pb-5 pt-5`}>
            <i className="fas fa-user text-md pr-1 pt-1"></i>
            <span>
                <div className='text-s -my-1 text-left text-white'>{user.email ? user.email : ''}</div>
                <div className='text-xs -my-1 text-left text-gray-400'>{user.groups[0] ? user.groups[0] : ''}</div>
            </span>
        </div>
    )
}

const Item = (to, icon, span, condition) => (
    condition === undefined || condition ?
        <React.Fragment>
            <NavMenuSeparator className={'text-gray-600'}/>
            <NavMenuItem to={to}>
                <i className={icon}></i>
                <span>{span}</span>
            </NavMenuItem>
        </React.Fragment> : null
)
export default withAuth(({title, shadowed = true, user, children}) => {
   
    const theme = useTheme()
    // console.log('Auth Menu', theme)
    return (
        <div className="h-full w-full">
            {!user.authed ?
                <Link className={`${theme.topnav({}).navitemTop}`} to="/auth/login">Login</Link> :
                <NavMenu control={<UserMenu user={user}/>} >
                    <div>
                        {<UserMenu user={user}/>}
                    </div>

                    {Item('/admin', 'fas fa-arrow-right pr-1', 'Home' )}
                    {Item('/meta', 'fas fa-arrow-right pr-1', 'Admin Panel', user.authLevel >= 5 )}
                    {Item('/auth/logout', 'fas fa-sign-out-alt pb-2 pr-1 pt-2', 'Logout')}

                </NavMenu>
            }
        </div>
    )
})

// unused routes
/* user.authLevel < 5 ? null :
                        <NavMenuItem to="/auth/project-management">
                        Manage Users
                        </NavMenuItem>
                    */
/*<NavMenuItem to="/auth/profile">
                      Profile
                    </NavMenuItem>*/
