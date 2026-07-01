'use client'
import React from 'react'
import { CgMenuGridR } from "react-icons/cg";
import { useWindowSize } from '@/hooks/useWindowSize';
const Sidebar = () => {
  const {width} =useWindowSize();
  return (

    <div className="h-full w-12 border-r dark:border-[#3c4043] dark:bg-[#131314]">
      {width>=1150 ?
        <div>
          <div className="flex pr-1 h-[48.99px] border-b dark:border-[#3c4043] items-center justify-center">
              <CgMenuGridR className="h-8 w-8 text-gray-300"/>
          </div>
          <div>

          </div>
        </div>
        :
        <div> Please use larger screen</div>
      }
        
    </div>
  )
}

export default Sidebar