import React from "react"
import { PublicNav, Pattern } from 'pages/Landing'

const makeBlue = [
  "login",
  "signup",
  "reset-password",
  "verify-email",
  "verify-request",
  "set-password",
  "accept-invite"
]

const AuthContainer = ({ children, action }) => {
  const bgColor = makeBlue.includes(action) ? "bg-gray-800" : "bg-transparent";
  return (
    <div className='min-h-screen  h-full flex-1 flex flex-col text-white'>
      <Pattern />
      <div class="relative">
        <PublicNav />
      </div>
      <div className={ `
          w-full h-full flex-1 flex flex-col justify-center ${ bgColor }
        ` }>
        <div className="flex flex-col flex-1 max-w-6xl mx-auto relative">
         
          { children }
          
        </div>
      </div>
    </div>
  )
}

export default AuthContainer
