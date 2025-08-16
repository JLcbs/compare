import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboard() {
  const {
    navigateToNext,
    navigateToPrevious,
    swapTexts,
    clearTexts,
    setIsExportModalOpen,
    setIsSettingsModalOpen,
    currentNavigationIndex,
    navigationItems
  } = useAppStore();
  
  // 定义快捷键
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'j',
      action: navigateToNext,
      description: '下一个差异'
    },
    {
      key: 'k',
      action: navigateToPrevious,
      description: '上一个差异'
    },
    {
      key: 's',
      ctrl: true,
      action: () => setIsExportModalOpen(true),
      description: '导出报告'
    },
    {
      key: ',',
      ctrl: true,
      action: () => setIsSettingsModalOpen(true),
      description: '打开设置'
    },
    {
      key: 'x',
      alt: true,
      action: swapTexts,
      description: '交换文本'
    },
    {
      key: 'Delete',
      ctrl: true,
      action: clearTexts,
      description: '清空文本'
    },
    {
      key: 'ArrowDown',
      action: navigateToNext,
      description: '下一个差异'
    },
    {
      key: 'ArrowUp',
      action: navigateToPrevious,
      description: '上一个差异'
    },
    {
      key: 'Home',
      action: () => {
        if (navigationItems.length > 0) {
          const firstDiff = document.getElementById(navigationItems[0].id);
          firstDiff?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      description: '跳到第一个差异'
    },
    {
      key: 'End',
      action: () => {
        if (navigationItems.length > 0) {
          const lastDiff = document.getElementById(navigationItems[navigationItems.length - 1].id);
          lastDiff?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      description: '跳到最后一个差异'
    },
    {
      key: '?',
      shift: true,
      action: () => {
        // 显示快捷键帮助
        alert(getShortcutHelp());
      },
      description: '显示快捷键帮助'
    }
  ];
  
  const getShortcutHelp = useCallback(() => {
    return shortcuts
      .map(s => {
        const keys = [];
        if (s.ctrl) keys.push('Ctrl');
        if (s.alt) keys.push('Alt');
        if (s.shift) keys.push('Shift');
        keys.push(s.key);
        return `${keys.join('+')} - ${s.description}`;
      })
      .join('\n');
  }, [shortcuts]);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 如果焦点在输入框中，不触发快捷键
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true') {
      return;
    }
    
    // 查找匹配的快捷键
    const shortcut = shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !s.ctrl || event.ctrlKey || event.metaKey;
      const altMatch = !s.alt || event.altKey;
      const shiftMatch = !s.shift || event.shiftKey;
      
      return keyMatch && ctrlMatch && altMatch && shiftMatch;
    });
    
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [shortcuts]);
  
  // 注册和清理事件监听器
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // 滚动到当前导航项
  useEffect(() => {
    if (currentNavigationIndex >= 0 && navigationItems[currentNavigationIndex]) {
      const element = document.getElementById(navigationItems[currentNavigationIndex].id);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 添加高亮动画
      element?.classList.add('diff-highlight-animation');
      setTimeout(() => {
        element?.classList.remove('diff-highlight-animation');
      }, 1500);
    }
  }, [currentNavigationIndex, navigationItems]);
  
  return {
    shortcuts,
    getShortcutHelp
  };
}