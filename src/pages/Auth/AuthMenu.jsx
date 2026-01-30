import React from "react"
//import {useTheme, Dropdown } from '~/modules/avl-components/src'
// import { withAuth } from "@availabs/ams"
import { useAuth } from "~/modules/dms/packages/dms/src"
import {Link} from 'react-router'
import { use } from "react"
// import {NavItem, NavMenu, NavMenuItem, NavMenuSeparator, withAuth} from 'components/avl-components/src'
// import user from "@availabs/ams/dist/reducers/user";

const UserMenu = ({user}) => {
    // const theme = useTheme()
    return (
        <div className={`flex justify-column align-middle py-1 px-4`}>
            <div className='pt-[4px]'>
                <span className={`rounded-full border-2 border-blue-400
                    inline-flex items-center justify-center
                    h-6 w-6 sm:h-8 sm:w-8 ring-white text-white
                    bg-blue-500 overflow-hidden`}>
                    <i className="fa-duotone fa-user fa-fw pt-2 text-2xl" aria-hidden="true"></i>
                </span>
            </div>

            <span className='pl-2'>
                <div className='text-md font-thin tracking-tighter  text-left text-blue-600 group-hover:text-white '>{user.email ? user.email : ''}</div>
                <div className='text-xs font-medium -mt-1 tracking-widest text-left text-gray-500 group-hover:text-gray-200'>{user.groups[0] ? user.groups[0] : ''}</div>
            </span>
        </div>
    )
}

export const useClickOutside = handleClick => {
  const [node, setNode] = React.useState(null);

  React.useEffect(() => {
    const checkOutside = e => {
      if (node.contains(e.target)) {
        return;
      }
      (typeof handleClick === "function") && handleClick(e);
    }
    node && document.addEventListener("mousedown", checkOutside);
    return () => document.removeEventListener("mousedown", checkOutside);
  }, [node, handleClick])

  return [setNode, node];
}

// import { useTheme } from "../../wrappers/with-theme"

const Dropdown = ({ control, children, className, openType='hover' }) => {
    const [open, setOpen] = React.useState(false),
        clickedOutside = React.useCallback(() => setOpen(false), []),
        [setRef] = useClickOutside(clickedOutside);
        // console.log('openType', openType)
    return (
        <div ref={ setRef }
             className={`h-full relative cursor-pointer ${className}` }
             onMouseEnter={ e => {
                if(openType === 'hover') {
                 setOpen(true)
                }
            }}
            onMouseLeave={ e => setOpen(false) }
            onClick={ e => {
                 //e.preventDefault();
                 setOpen(!open)
             } }
        >
            {control}
            {open ?
                <div className={ `shadow fixed w-full max-w-[200px] rounded-b-lg ${open ? `block` : `hidden`} z-10` }>
                    { children }
                </div> : ''

            }
        </div>
    )
}

export const Item = (to, icon, span, condition) => (
    condition === undefined || condition ?
        <Link to={ to } >
            <div className='px-6 py-2 bg-blue-500 text-white hover:text-blue-100'>
                <div className='hover:translate-x-2 transition duration-100 ease-out hover:ease-in'>
                    <i className={`${icon} `} />
                    <span className='pl-2'>{span}</span>
                </div>
            </div>
        </Link>
    : null
)


export default ({title, shadowed = true, children}) => {
    const { user } = useAuth()
    //const theme = useTheme()
    // console.log('Auth Menu', theme)
    return (
        <div className="h-full w-full">
            {!user?.authed ?
                <Link className={`
                  group font-sans
                  flex items-center text-sm px-4 border-r h-12 text-neutral-500 border-neutral-100
                  hover:bg-blue-500 hover:text-white
                  focus:outline-none focus:text-gray-800 focus:bg-gray-50 focus:border-gray-300
                  transition cursor-pointer
              `} to="/auth/login">Login</Link> :
                <Dropdown control={<UserMenu user={user}/>} className={`hover:bg-blue-500 group z-50`} >
                    <div key={'x'} className='p-1 bg-blue-500'>
                        { user.authLevel >= 5 ?
                        <>
                            <div key={'docs'} className=''>
                                {Item('/docs/edit', 'fa fa-file-pen flex-shrink-0  pr-1', 'Edit Docs')}
                            </div>
                            <div key={'tracking'} className=''>
                                {Item('/docs/tracking', 'fa fa-list-check flex-shrink-0  pr-1', 'Tracking')}
                            </div>
                        </>
                         : ''}
                        <div key={'logout'} className='py-1 border-t border-blue-400'>
                            {Item('/auth/logout', 'fad fa-sign-out-alt pb-2 pr-1', 'Logout')}
                        </div>
                    </div>
                </Dropdown>
            }
        </div>
    )
}

// unused routes
/* user.authLevel < 5 ? null :
                        <NavMenuItem to="/auth/project-management">
                        Manage Users
                        </NavMenuItem>
                    */
/*<NavMenuItem to="/auth/profile">
                      Profile
                    </NavMenuItem>*/
