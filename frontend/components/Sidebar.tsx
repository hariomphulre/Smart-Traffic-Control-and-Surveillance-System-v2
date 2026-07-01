'use client'
import Link from 'next/link';
import React from 'react'
import { CgMenuGridR } from "react-icons/cg";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { IoMdListBox } from 'react-icons/io';
import { MdOutlineMonitor } from 'react-icons/md';

const Sidebar = () => {
  return (
    <div className="h-full w-12 border-r dark:border-[#3c4043] dark:bg-[#131314]">
      <div className="flex pr-1 h-[48.99px] border-b dark:border-[#3c4043] items-center justify-center">
          <CgMenuGridR className="h-8 w-8 text-gray-300"/>
      </div>
      <div className="">
        <nav>
          <ul>
            <li>
              <HiOutlineClipboardDocumentList className="h-5 w-5"/>
            </li>
            <li>
              <MdOutlineMonitor className="h-5 w-5"/>
            </li>
            <li>
              <IoMdListBox className="h-5 w-5"/>
            </li>
          </ul>
        </nav>
      </div>      
    </div>
    
  )
}

export default Sidebar