import React from 'react';
import { X, Moon, Sun, Monitor } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import clsx from 'clsx';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    appSettings,
    setAppSettings
  } = useAppStore();
  
  if (!isSettingsModalOpen) return null;
  
  const themes = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'auto', label: '跟随系统', icon: Monitor }
  ];
  
  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    setAppSettings({ theme });
    
    // 应用主题
    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            设置
          </h2>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-4 space-y-6">
          {/* 主题设置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              主题
            </label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(theme => (
                <button
                  key={theme.value}
                  onClick={() => handleThemeChange(theme.value as any)}
                  className={clsx(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                    appSettings.theme === theme.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                >
                  <theme.icon className={clsx(
                    'w-5 h-5',
                    appSettings.theme === theme.value
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  )} />
                  <span className={clsx(
                    'text-sm',
                    appSettings.theme === theme.value
                      ? 'text-blue-900 dark:text-blue-100 font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  )}>
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 高亮颜色设置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              差异高亮颜色
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-400 w-16">新增</label>
                <input
                  type="color"
                  value={appSettings.highlightColors.add}
                  onChange={(e) => setAppSettings({
                    highlightColors: { ...appSettings.highlightColors, add: e.target.value }
                  })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {appSettings.highlightColors.add}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-400 w-16">删除</label>
                <input
                  type="color"
                  value={appSettings.highlightColors.remove}
                  onChange={(e) => setAppSettings({
                    highlightColors: { ...appSettings.highlightColors, remove: e.target.value }
                  })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {appSettings.highlightColors.remove}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-400 w-16">修改</label>
                <input
                  type="color"
                  value={appSettings.highlightColors.modify}
                  onChange={(e) => setAppSettings({
                    highlightColors: { ...appSettings.highlightColors, modify: e.target.value }
                  })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {appSettings.highlightColors.modify}
                </span>
              </div>
            </div>
          </div>
          
          {/* 其他设置 */}
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={appSettings.offlineMode}
                onChange={(e) => setAppSettings({ offlineMode: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">离线模式（不发送网络请求）</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={appSettings.autoSave}
                onChange={(e) => setAppSettings({ autoSave: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">自动保存历史记录</span>
            </label>
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setAppSettings({
                theme: 'light',
                highlightColors: {
                  add: '#22c55e',
                  remove: '#ef4444',
                  modify: '#3b82f6'
                },
                fontSize: 14,
                fontFamily: 'monospace',
                autoSave: false,
                offlineMode: true
              });
              handleThemeChange('light');
            }}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            恢复默认
          </button>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};