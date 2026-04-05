
import React from 'react';
import { Home, Users, Settings } from 'lucide-react';
import { ViewState } from '../types';

interface TabBarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ currentView, onChangeView }) => {
  const getTabClass = (view: ViewState) => {
    // Check if the current view matches the tab or is a sub-view of that tab
    const isActive = 
      (view === 'DASHBOARD' && currentView === 'DASHBOARD') ||
      (view === 'CLIENTS_LIST' && ['CLIENTS_LIST', 'CLIENT_DETAILS', 'ADD_DEBT', 'EDIT_DEBT', 'ADD_CLIENT', 'RECORD_PAYMENT'].includes(currentView)) ||
      (view === 'SETTINGS' && currentView === 'SETTINGS');

    return `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
      isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
    }`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 pb-5 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-full max-w-md mx-auto px-4">
        <button className={getTabClass('DASHBOARD')} onClick={() => onChangeView('DASHBOARD')}>
          <Home size={24} strokeWidth={currentView === 'DASHBOARD' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">الرئيسية</span>
        </button>
        
        <button className={getTabClass('CLIENTS_LIST')} onClick={() => onChangeView('CLIENTS_LIST')}>
          <Users size={24} strokeWidth={currentView === 'CLIENTS_LIST' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">العملاء</span>
        </button>

        <button className={getTabClass('SETTINGS')} onClick={() => onChangeView('SETTINGS')}>
          <Settings size={24} strokeWidth={currentView === 'SETTINGS' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">الإعدادات</span>
        </button>
      </div>
    </div>
  );
};
