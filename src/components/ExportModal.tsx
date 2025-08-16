import React, { useState } from 'react';
import { X, Download, FileText, Code, FileJson } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { exportDiff } from '@/utils/exporters';
import type { ExportOptions } from '@/types';
import clsx from 'clsx';

export const ExportModal: React.FC = () => {
  const { 
    isExportModalOpen, 
    setIsExportModalOpen,
    diffItems,
    diffStats
  } = useAppStore();
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'html',
    includeStats: true,
    includeTimestamp: true,
    highlightStyle: 'inline'
  });
  
  if (!isExportModalOpen) return null;
  
  const handleExport = () => {
    if (diffItems.length === 0 || !diffStats) {
      alert('没有可导出的差异内容');
      return;
    }
    
    exportDiff(diffItems, diffStats, exportOptions);
    setIsExportModalOpen(false);
  };
  
  const formats = [
    { value: 'html', label: 'HTML报告', icon: FileText, description: '包含样式的完整报告' },
    { value: 'text', label: '纯文本', icon: FileText, description: '简单的文本格式' },
    { value: 'json', label: 'JSON', icon: FileJson, description: '结构化数据格式' }
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            导出差异报告
          </h2>
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-4 space-y-4">
          {/* 格式选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              导出格式
            </label>
            <div className="space-y-2">
              {formats.map(format => (
                <button
                  key={format.value}
                  onClick={() => setExportOptions({ ...exportOptions, format: format.value as any })}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                    exportOptions.format === format.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                >
                  <format.icon className={clsx(
                    'w-5 h-5',
                    exportOptions.format === format.value
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  )} />
                  <div className="flex-1">
                    <div className={clsx(
                      'font-medium',
                      exportOptions.format === format.value
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-gray-700 dark:text-gray-300'
                    )}>
                      {format.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* 选项 */}
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={exportOptions.includeStats}
                onChange={(e) => setExportOptions({ ...exportOptions, includeStats: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">包含统计信息</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={exportOptions.includeTimestamp}
                onChange={(e) => setExportOptions({ ...exportOptions, includeTimestamp: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">包含时间戳</span>
            </label>
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>
    </div>
  );
};