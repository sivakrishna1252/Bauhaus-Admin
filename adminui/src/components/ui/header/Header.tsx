import React from 'react'
import { SidebarTrigger } from '../sidebar'

const Header = () => {
  return (
    <div className=' w-full border-b border-border h-14 flex items-center px-4 justify-between'>

<SidebarTrigger />


<div className="bg-red-500 w-10 h-10 rounded-full"></div>
    </div>
  )
}

export default Header