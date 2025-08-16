import React, { useEffect } from 'react';
import { TextInput } from './components/TextInput';
import { DiffViewer } from './components/DiffViewer';
import { ControlPanel } from './components/ControlPanel';
import { StatsPanel } from './components/StatsPanel';
import { NavigationBar } from './components/NavigationBar';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { useDiff } from './hooks/useDiff';
import { useKeyboard } from './hooks/useKeyboard';
import { useAppStore } from './stores/appStore';

function App() {
  const { appSettings } = useAppStore();
  
  // 初始化Hooks
  useDiff();
  useKeyboard();
  
  // 应用主题
  useEffect(() => {
    const applyTheme = () => {
      if (appSettings.theme === 'dark' || 
          (appSettings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    applyTheme();
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (appSettings.theme === 'auto') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [appSettings.theme]);
  
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部标题栏 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TD</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              文本对比工具
            </h1>
            <span className="text-xs text-gray-500 dark:text-gray-400">v1.0.0</span>
          </div>
          
          {appSettings.offlineMode && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded">
              离线模式
            </span>
          )}
        </div>
      </header>
      
      {/* 控制面板 */}
      <ControlPanel />
      
      {/* 统计面板 */}
      <StatsPanel />
      
      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧输入 */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
          <TextInput
            side="left"
            title="原始文本"
            placeholder="粘贴或输入原始文本..."
          />
        </div>
        
        {/* 中间差异显示 */}
        <div className="flex-1">
          <DiffViewer />
        </div>
        
        {/* 右侧输入 */}
        <div className="w-1/3 border-l border-gray-200 dark:border-gray-700">
          <TextInput
            side="right"
            title="修改后文本"
            placeholder="粘贴或输入修改后的文本..."
          />
        </div>
      </div>
      
      {/* 导航栏 */}
      <NavigationBar />
      
      {/* 模态框 */}
      <ExportModal />
      <SettingsModal />
    </div>
  );
}

export default App;