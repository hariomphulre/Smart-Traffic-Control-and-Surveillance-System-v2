'use client'
import Link from 'next/link';
import React from 'react'
import { CgMenuGridR } from "react-icons/cg";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { IoMdListBox } from 'react-icons/io';
import { MdOutlineMonitor } from 'react-icons/md';
import { GoPasskeyFill } from "react-icons/go";
import { RiKeyFill, RiShieldKeyholeFill, RiShieldUserFill } from 'react-icons/ri';
import { useRouter } from "next/navigation";

const Sidebar = () => {
  const router=useRouter();

  const handleIAM=async ()=>{
    router.push('/iam');
  }
  const handleSessions=async ()=>{
    router.push('/sessions');
    
  }
  const handleAuditLogs=async ()=>{
    router.push('/audit-logs');

  }

  return (
    <div className="h-full w-12 border-r dark:border-[#3c4043] dark:bg-[#131314]">
      <div className="flex pr-0.5 h-[48.99px] border-b dark:border-[#3c4043] items-center justify-center">
          <CgMenuGridR className="h-8 w-8 text-gray-300"/>
      </div>
      <div className="flex justify-center">
        <nav className="pr-0.5">
          <ul>
            <li>
              <RiShieldUserFill onClick={handleIAM} className="mt-4.5 h-5 w-5" title="IAM"/>
            </li>
            <li>
              <MdOutlineMonitor onClick={handleSessions} className="mt-4.5 h-5 w-5" title="Sessions"/>
            </li>
            <li>
              <IoMdListBox onClick={handleAuditLogs} className="mt-4.5 h-5 w-5" title="Audit Logs"/>
            </li>
            <li>
              <RiKeyFill className="mt-4.5 h-5 w-5" title="Passkeys"/>
            </li>
    
          </ul>
        </nav>
      </div>      
    </div>
    
  )
}

export default Sidebar