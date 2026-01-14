export default function NotiDrawer() {
  return (
    <div
      className={`
          absolute top-0 left-20 h-full bg-white border-r-2 border-primary z-30 transition-transform duration-300 ease-in-out shadow-[8px_0px_20px_rgba(0,0,0,0.05)]
          ${isNotificationOpen ? 'translate-x-0 w-[400px]' : '-translate-x-full w-[400px] opacity-0 pointer-events-none'}
        `}
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b-2 border-primary/10 flex items-center justify-between">
          <h2 className="text-3xl font-black text-primary">알림</h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          <div className="space-y-4 p-2">
            <div className="text-sm font-bold text-secondary uppercase tracking-wider px-2">이번 주</div>
            {MOCK_NOTIFICATIONS.map((noti) => (
              <div key={noti.id} className="flex flex-col p-3 hover:bg-grayish rounded-xl transition-colors cursor-pointer group relative">
                <div className="flex items-start">
                  {!noti.isRead && <div className="absolute top-5 right-3 w-2 h-2 bg-secondary rounded-full"></div>}
                  <div className="relative mr-4 flex-shrink-0">
                    {noti.type === 'sync' ? (
                      <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center border-2 border-accent">
                        <RefreshCw className="w-6 h-6 text-primary" />
                      </div>
                    ) : (
                      <div className="w-12 h-12">
                        <img
                          src={noti.type === 'user' ? noti.user.avatarUrl : noti.targetImage}
                          alt="noti"
                          className={`w-full h-full object-cover border border-gray-200 ${noti.type === 'user' ? 'rounded-full' : 'rounded-md'}`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-primary leading-snug">
                      <span className="font-bold mr-1">{noti.user.name}</span>
                      {noti.text}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1.5">{noti.createdAt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
