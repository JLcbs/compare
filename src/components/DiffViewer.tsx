import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { DiffType } from '@/types';
import clsx from 'clsx';

export const DiffViewer: React.FC = () => {
  const { diffItems, currentNavigationIndex, navigationItems } = useAppStore();
  const viewerRef = useRef<HTMLDivElement>(null);
  
  // 同步滚动
  useEffect(() => {
    if (currentNavigationIndex >= 0 && navigationItems[currentNavigationIndex]) {
      const targetId = navigationItems[currentNavigationIndex].id;
      const element = document.getElementById(targetId);
      
      if (element && viewerRef.current) {
        const rect = element.getBoundingClientRect();
        const containerRect = viewerRef.current.getBoundingClientRect();
        const scrollTop = viewerRef.current.scrollTop + rect.top - containerRect.top - 100;
        
        viewerRef.current.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
        
        // 添加高亮动画
        element.classList.add('diff-highlight-animation');
        setTimeout(() => {
          element.classList.remove('diff-highlight-animation');
        }, 1500);
      }
    }
  }, [currentNavigationIndex, navigationItems]);
  
  const renderDiffItem = (item: typeof diffItems[0]) => {
    const isCurrentNavigation = navigationItems.some(
      nav => nav.id === item.id && navigationItems.indexOf(nav) === currentNavigationIndex
    );
    
    const className = clsx(
      'px-4 py-1 font-mono text-sm whitespace-pre-wrap break-all',
      {
        'diff-add': item.type === DiffType.ADD,
        'diff-remove': item.type === DiffType.REMOVE,
        'diff-modify': item.type === DiffType.MODIFY,
        'text-gray-600 dark:text-gray-400': item.type === DiffType.EQUAL,
        'ring-2 ring-blue-500 ring-offset-2': isCurrentNavigation
      }
    );
    
    return (
      <div
        key={item.id}
        id={item.id}
        className={className}
        data-line={item.lineNumber}
      >
        {/* 行号 */}
        {item.lineNumber && (
          <span className="inline-block w-12 text-xs text-gray-500 dark:text-gray-500 select-none mr-4">
            {item.lineNumber}
          </span>
        )}
        
        {/* 内容 */}
        {item.type === DiffType.MODIFY && item.originalContent ? (
          <>
            <span className="line-through opacity-60">{item.originalContent}</span>
            <span className="ml-2">→</span>
            <span className="ml-2">{item.content}</span>
          </>
        ) : (
          <span>{item.content}</span>
        )}
      </div>
    );
  };
  
  if (diffItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
        <div className="text-center">
          <p className="text-lg mb-2">暂无对比结果</p>
          <p className="text-sm">请在左右两侧输入文本以开始对比</p>
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={viewerRef}
      className="h-full overflow-auto custom-scrollbar bg-white dark:bg-gray-900"
    >
      <div className="min-h-full">
        {diffItems.map((item) => renderDiffItem(item))}
      </div>
    </div>
  );
};