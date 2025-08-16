import React from 'react';
import { 
  Settings, 
  Download, 
  RefreshCw, 
  ArrowUpDown,
  ToggleLeft,
  ToggleRight,
  HelpCircle
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import clsx from 'clsx';

export const ControlPanel: React.FC = () => {
  const {
    diffOptions,
    setDiffOptions,
    swapTexts,
    clearTexts,
    setIsExportModalOpen,
    setIsSettingsModalOpen,
    isComputing
  } = useAppStore();
  
  const toggleOption = (key: keyof typeof diffOptions) => {
    setDiffOptions({ [key]: !diffOptions[key] });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        {/* 左侧选项 */}
        <div className="flex items-center gap-4">
          {/* 忽略选项 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleOption('ignoreCase')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                diffOptions.ignoreCase
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {diffOptions.ignoreCase ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              忽略大小写
            </button>
            
            <button
              onClick={() => toggleOption('ignoreWhitespace')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                diffOptions.ignoreWhitespace
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {diffOptions.ignoreWhitespace ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              忽略空白
            </button>
            
            <button
              onClick={() => toggleOption('ignorePunctuation')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                diffOptions.ignorePunctuation
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {diffOptions.ignorePunctuation ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              忽略标点
            </button>
          </div>
          
          {/* 分割选项 */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleOption('splitBySentence')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                diffOptions.splitBySentence
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              句子级对比
            </button>
            
            <button
              onClick={() => toggleOption('useWebWorker')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                diffOptions.useWebWorker
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
              title="使用Web Worker进行异步计算"
            >
              异步计算
            </button>
          </div>
        </div>
        
        {/* 右侧操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 计算状态指示器 */}
          {isComputing && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400">
              <div className="loader w-4 h-4" />
              计算中...
            </div>
          )}
          
          <button
            onClick={swapTexts}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="交换左右文本 (Alt+X)"
          >
            <ArrowUpDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={clearTexts}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="清空所有文本 (Ctrl+Delete)"
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="导出报告 (Ctrl+S)"
          >
            <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="设置 (Ctrl+,)"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={() => alert('按 Shift+? 查看所有快捷键')}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="帮助"
          >
            <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};