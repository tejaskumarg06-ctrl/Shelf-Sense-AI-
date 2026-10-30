import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ShieldAlert,
  TrendingUp,
  Bot,
  Settings,
  Sparkles,
  Store as StoreIcon,
  X
} from 'lucide-react';

export type NavTab = 'overview' | 'inventory' | 'risk_actions' | 'forecasts' | 'assistant' | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  urgentCount?: number;
  pendingRecsCount?: number;
  aiConfigured?: boolean;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  urgentCount = 0,
  pendingRecsCount = 0,
  aiConfigured = false,
  mobileMenuOpen = false,
  onCloseMobileMenu
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory' as NavTab, label: 'Inventory', icon: Boxes },
    {
      id: 'risk_actions' as NavTab,
      label: 'Risk & Actions',
      icon: ShieldAlert,
      badge: urgentCount > 0 ? urgentCount : undefined,
      badgeColor: 'bg-[#C65353] text-white'
    },
    { id: 'forecasts' as NavTab, label: 'Forecasts & Insights', icon: TrendingUp },
    {
      id: 'assistant' as NavTab,
      label: 'AI Assistant',
      icon: Bot,
      pill: 'NVIDIA'
    },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings }
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#163D32] text-white">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#245244] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F7F8F4] flex items-center justify-center text-[#163D32] shadow-sm">
            <Sparkles className="w-5 h-5 text-[#163D32]" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-lg text-[#F7F8F4] flex items-center gap-1.5">
              ShelfSense<span className="text-[#D99A37] text-xs px-1.5 py-0.5 rounded bg-[#245244] font-mono">AI</span>
            </div>
            <div className="text-[11px] text-[#A3C4B6] font-medium tracking-wide">
              Inventory Intelligence
            </div>
          </div>
        </div>
        {onCloseMobileMenu && (
          <button
            onClick={onCloseMobileMenu}
            className="md:hidden p-1 text-[#A3C4B6] hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-wider text-[#7FA695] font-semibold px-3 mb-2">
          Store Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobileMenu) onCloseMobileMenu();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#245244] text-[#F7F8F4] shadow-xs'
                  : 'text-[#C5DCD1] hover:bg-[#1E483B] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#D99A37]' : 'text-[#8DB4A3]'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.pill && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0E2821] text-[#9EE5C5] border border-[#2B5A4B]">
                    {item.pill}
                  </span>
                )}
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold leading-none ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Model & Store Status */}
      <div className="p-4 border-t border-[#245244] bg-[#12332A]">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-2 h-2 rounded-full ${
              aiConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-xs font-medium text-[#C5DCD1]">
            {aiConfigured ? 'NVIDIA Nemotron Active' : 'Deterministic Engine'}
          </span>
        </div>
        <div className="text-[11px] text-[#8DB4A3] truncate">
          {aiConfigured ? 'Token Factory connected' : 'Live model key optional'}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-[#E2E8E2] z-30 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={onCloseMobileMenu} />
          <div className="relative w-72 h-full z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
