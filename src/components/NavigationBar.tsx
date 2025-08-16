import React from 'react';
import { ChevronUp, ChevronDown, Home, Square } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { DiffType } from '@/types';
import clsx from 'clsx';

export const NavigationBar: React.FC = () => {
  const {
    navigationItems,
    currentNavigationIndex,
    setCurrentNavigationIndex,
    navigateToNext,
    navigateToPrevious
  } = useAppStore();
  
  const handleNavigateToFirst = () => {
    if (navigationItems.length > 0) {
      setCurrentNavigationIndex(0);
    }
  };
  
  const handleNavigateToLast = () => {
    if (navigationItems.length > 0) {
      setCurrentNavigationIndex(navigationItems.length - 1);
    }
  };
  
  const getTypeColor = (type: DiffType) => {
    switch (type) {
      case DiffType.ADD:
        return 'text-green-600 dark:text-green-400';
      case DiffType.REMOVE:
        return 'text-red-600 dark:text-red-400';
      case DiffType.MODIFY:
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };
  
  const getTypeLabel = (type: DiffType) => {
    switch (type) {
      case DiffType.ADD:
        return '新增';
      case DiffType.REMOVE:
        return '删除';
      case DiffType.MODIFY:
        return '修改';
      default:
        return '';
    }
  };
  
  if (navigationItems.length === 0) {
    return null;
  }
  
  const currentItem = navigationItems[currentNavigationIndex];
  
  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between">
        {/* 导航信息 */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            差异导航: {currentNavigationIndex + 1} / {navigationItems.length}
          </span>
          
          {currentItem && (
            <>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
              <span className={clsx('text-sm font-medium', getTypeColor(currentItem.type))}>
                {getTypeLabel(currentItem.type)}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                行 {currentItem.lineNumber}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500 truncate max-w-xs">
                {currentItem.preview}
              </span>
            </>
          )}
        </div>
        
        {/* 导航按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleNavigateToFirst}
            disabled={currentNavigationIndex === 0}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="第一个差异 (Home)"
          >
            <Home className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={navigateToPrevious}
            disabled={currentNavigationIndex <= 0}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="上一个差异 (K / ↑)"
          >
            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={navigateToNext}
            disabled={currentNavigationIndex >= navigationItems.length - 1}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="下一个差异 (J / ↓)"
          >
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={handleNavigateToLast}
            disabled={currentNavigationIndex === navigationItems.length - 1}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="最后一个差异 (End)"
          >
            <Square className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};