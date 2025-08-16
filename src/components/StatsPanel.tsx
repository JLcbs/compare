import React from 'react';
import { useAppStore } from '@/stores/appStore';
import { 
  Plus, 
  Minus, 
  Edit, 
  FileText, 
  Hash,
  TrendingUp
} from 'lucide-react';
import clsx from 'clsx';

export const StatsPanel: React.FC = () => {
  const { diffStats } = useAppStore();
  
  if (!diffStats) {
    return null;
  }
  
  const statsItems = [
    {
      label: '总变更',
      value: diffStats.totalChanges,
      icon: FileText,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800'
    },
    {
      label: '新增',
      value: diffStats.additions,
      subValue: `${diffStats.addedWords} 词`,
      icon: Plus,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      label: '删除',
      value: diffStats.deletions,
      subValue: `${diffStats.deletedWords} 词`,
      icon: Minus,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      label: '修改',
      value: diffStats.modifications,
      icon: Edit,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: '相似度',
      value: `${diffStats.similarity.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    }
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {statsItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={clsx('p-2 rounded-lg', item.bgColor)}>
                <item.icon className={clsx('w-4 h-4', item.color)} />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {item.label}
                </div>
                <div className={clsx('text-lg font-semibold', item.color)}>
                  {item.value}
                </div>
                {item.subValue && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {item.subValue}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* 进度条显示相似度 */}
        <div className="w-48">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">相似度</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {diffStats.similarity.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={clsx(
                'h-2 rounded-full transition-all duration-500',
                diffStats.similarity >= 80 ? 'bg-green-500' :
                diffStats.similarity >= 60 ? 'bg-yellow-500' :
                diffStats.similarity >= 40 ? 'bg-orange-500' :
                'bg-red-500'
              )}
              style={{ width: `${diffStats.similarity}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};