// import { CustomDurationModal } from '@/components/analytics/CustomDurationModal';
// import LocationBar from '@/components/LocationBar';
// import { MAP_SIGNALS } from '@/map/MapData';
// import React from 'react'
// import { FiEdit2, FiEye, FiList, FiPlus, FiTrash2 } from 'react-icons/fi';
// import { IoMdRefresh } from 'react-icons/io';

// const page = () => {
//   return (
//         <div className="max-w-full dark:bg-[#131314]">
//           <CustomDurationModal
//             isOpen={isCustomModalOpen}
//             customStart={customStart}
//             customEnd={customEnd}
//             onCustomStartChange={setCustomStart}
//             onCustomEndChange={setCustomEnd}
//             onClose={closeCustomModal}
//             onApply={handleCustomApply}
//           />
    
//           {/* Added relative and z-[60] here to fix dropdown overlap issues */}
//           <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl relative z-[60]">
//             <div className="flex items-center min-w-170 flex-1">
//               <div>
//                 <p className="text-[#ffffff] font-mono text-xl ml-4">System Logs</p>
//               </div>
              
//               <div className="flex items-center gap-1 ml-0 pl-4">
//                 <div 
//                   onClick={startCreatingList}
//                   className={`group flex items-center gap-1 px-3 justify-center rounded-sm transition-all cursor-pointer ${isListMode && !editingListId ? 'bg-[#202124]' : 'hover:bg-[#202124]'}`}
//                 >
//                   <FiPlus className="h-4 w-4 text-[#669DF6] group-hover:text-[#AECBFA]" />
//                         <button className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg">
//                     Create list
//                   </button>
//                 </div>
    
//                 <div className="relative" ref={viewListsRef}>
//                   <div 
//                     onClick={() => setIsViewListsOpen(!isViewListsOpen)}
//                     className={`group flex items-center gap-1 px-3 justify-center rounded-sm transition-all cursor-pointer ${isViewListsOpen ? 'bg-[#202124]' : 'hover:bg-[#202124]'}`}
//                   >
//                     <FiList className="h-4 w-4 text-[#669DF6] group-hover:text-[#AECBFA]" />
//                     <button className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg">
//                       View lists
//                     </button>
//                   </div>
    
//                   {/* View Lists Dropdown Menu */}
//                   {isViewListsOpen && (
//                     <div className="absolute top-full left-0 mt-2 w-72 bg-[#1e1e1e] border border-[#3c4043] rounded-md shadow-2xl z-[100] overflow-hidden">
//                       <div className="px-4 py-2 bg-[#292a2d] border-b border-[#3c4043] font-medium text-[#e8eaed] text-sm">
//                         Saved Lists
//                       </div>
//                       {savedLists.length === 0 ? (
//                         <div className="p-4 text-sm text-[#9aa0a6] text-center">No lists created yet.</div>
//                       ) : (
//                         <ul className="max-h-60 overflow-y-auto py-1">
//                           {savedLists.map(list => (
//                             <li key={list.id} className="flex px-4 py-2 hover:bg-[#303134] flex items-center justify-between group border-b border-[#3c4043]/40 last:border-0 transition-colors">
//                               <div className="flex gap-2 items-center overflow-hidden mr-2">
//                                 <p className="text-sm text-[#e8eaed] truncate max-w-[140px]" title={list.name}>{list.name}</p>
//                                 <p className="text-xs text-[#9aa0a6]">{list.logs.length} item(s)</p>
//                               </div>
//                               <div className="flex items-center gap-3 text-[#9aa0a6] transition-opacity">
//                                 <FiEye className="hover:text-[#8AB4F8] cursor-pointer" onClick={() => { setViewingList(list); setIsViewListsOpen(false); }} title="View list"/>
//                                 <FiEdit2 className="hover:text-[#8AB4F8] cursor-pointer" onClick={() => startEditingList(list)} title="Edit list" />
//                                 <FiTrash2 className="hover:text-red-400 cursor-pointer" onClick={() => handleDeleteList(list.id)} title="Delete list" />
//                               </div>
//                             </li>
//                           ))}
//                         </ul>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
    
//             <div className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all"
//               onClick={handleRefresh}
//             >
//               <IoMdRefresh
//                 className={`h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA] ${
//                   sectionRefreshing ? 'animate-spin' : ''
//                 }`}
//               />
//               <button
//                 type="button"
//                 disabled={sectionRefreshing}
//                 className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg disabled:opacity-50"
//               >
//                 Refresh
//               </button>
//             </div>
//           </div>
          
//           {/* 1. MAP MODAL: Moved outside of the z-0 wrapper so it can float above all navbars */}
//           {isMapOpen && (
//             <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
//               <div className="bg-[#131314] w-[95vw] h-[94vh] border-2 border-[#3c4043] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
                
//                 <div className="h-12 border-b border-[#3c4043] bg-black flex items-center justify-between px-5 z-10 shrink-0">
//                   <h2 className="text-[#8AB4F8] font-mono text-lg flex items-center gap-3">
//                     <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
//                     Global Signal Radar
//                   </h2>
//                   <button 
//                     onClick={() => setIsMapOpen(false)}
//                     className="text-[#9aa0a6] hover:text-white transition-colors font-bold text-xl"
//                   >
//                     ✕
//                   </button>
//                 </div>
    
//                 <div className="flex-1 relative z-0">
//                   <DynamicMap 
//                     signals={MAP_SIGNALS} 
//                     pathSegments={pathSegments} 
//                     onPinClick={handleMapPinClick} 
//                   />
//                 </div>
    
//               </div>
//             </div>
//           )}
    
//           {/* 2. LOCATION BAR: Left in its original wrapper */}
//           <div className="w-full relative font-sans z-[55]">
//             <LocationBar />
//           </div>
//         </div>
//   )
// }

// export default page
import React from 'react'

const page = () => {
  return (
    <div>page</div>
  )
}

export default page