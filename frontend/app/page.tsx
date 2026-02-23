export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-2">
          Traffic Management Platform
        </h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
          Comprehensive traffic control and surveillance system
        </p>
      </div>

      {/* Quick Actions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <a href="/analytics" className="gcloud-card p-6 hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-colors cursor-pointer group">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#e8f0fe] dark:bg-[#1a73e8]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#1a73e8] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-1 group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition-colors">Analytics</h2>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">View traffic analytics and insights</p>
            </div>
          </div>
        </a>

        <a href="/logs" className="gcloud-card p-6 hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-colors cursor-pointer group">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#e8f0fe] dark:bg-[#1a73e8]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#1a73e8] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-1 group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition-colors">Logs</h2>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Access system logs and activity records</p>
            </div>
          </div>
        </a>

        <a href="/challan-records" className="gcloud-card p-6 hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-colors cursor-pointer group">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#e8f0fe] dark:bg-[#1a73e8]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#1a73e8] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-1 group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition-colors">Challan Records</h2>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Manage challan records</p>
            </div>
          </div>
        </a>

        <a href="/accident-reports" className="gcloud-card p-6 hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-colors cursor-pointer group">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#fce8e6] dark:bg-[#ea4335]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#d93025] dark:text-[#f28b82]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-1">Accident Reports</h2>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Monitor accident and fire incidents</p>
            </div>
          </div>
        </a>

        <a href="/images" className="gcloud-card p-6 hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-colors cursor-pointer group">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#e8f0fe] dark:bg-[#1a73e8]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#1a73e8] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-1 group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition-colors">Images</h2>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">View traffic camera images</p>
            </div>
          </div>
        </a>

        <a href="/ambulance/sign-in" className="gcloud-card p-6 hover:border-[#ea4335] dark:hover:border-[#f28b82] transition-colors cursor-pointer group">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#fce8e6] dark:bg-[#ea4335]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#d93025] dark:text-[#f28b82]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-8 4h8M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#202124] dark:text-[#e8eaed] mb-1 group-hover:text-[#d93025] dark:group-hover:text-[#f28b82] transition-colors">Ambulance Driver</h2>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Emergency routing & signal control</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}

