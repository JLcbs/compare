import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readTextFile } from '@tauri-apps/api/fs';
import { DiffViewer } from './components/DiffViewer';
import { ControlPanel } from './components/ControlPanel';
import { StatsPanel } from './components/StatsPanel';
import { NavigationBar } from './components/NavigationBar';
import { useAppStore } from './stores/appStore';
import './styles/globals.css';

function App() {
  const { 
    leftText, 
    rightText, 
    setLeftText, 
    setRightText,
    diffResult,
    setDiffResult,
    isComputing,
    setIsComputing
  } = useAppStore();

  // 计算差异
  const computeDiff = async () => {
    if (!leftText && !rightText) return;
    
    setIsComputing(true);
    try {
      const result = await invoke('compute_diff', {
        leftText,
        rightText,
        options: {
          ignoreCase: false,
          ignoreWhitespace: false,
          ignorePunctuation: false,
          splitBySentence: true,
          useWebWorker: false
        }
      });
      
      setDiffResult(result as any);
    } catch (error) {
      console.error('计算差异失败:', error);
    } finally {
      setIsComputing(false);
    }
  };

  // 打开文件
  const openFile = async (side: 'left' | 'right') => {
    const selected = await open({
      multiple: false,
      filters: [{
        name: '文本文件',
        extensions: ['txt', 'docx', 'pdf', 'md', 'html', 'rtf', 'odt']
      }]
    });

    if (selected && typeof selected === 'string') {
      try {
        // 使用Rust后端解析文件
        const content = await invoke('parse_file', { 
          filePath: selected 
        });
        
        if (side === 'left') {
          setLeftText(content as string);
        } else {
          setRightText(content as string);
        }
        
        // 自动触发对比
        computeDiff();
      } catch (error) {
        console.error('文件解析失败:', error);
      }
    }
  };

  // 导出报告
  const exportReport = async (format: string) => {
    if (!diffResult) return;
    
    const savePath = await open({
      directory: false,
      save: true,
      filters: [{
        name: format.toUpperCase(),
        extensions: [format]
      }]
    });
    
    if (savePath) {
      try {
        await invoke('export_diff', {
          diffResult,
          outputPath: savePath,
          format
        });
        
        console.log('导出成功');
      } catch (error) {
        console.error('导出失败:', error);
      }
    }
  };

  // 监听文本变化
  useEffect(() => {
    const timer = setTimeout(() => {
      if (leftText || rightText) {
        computeDiff();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [leftText, rightText]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部工具栏 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TD</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Text Diff Desktop
            </h1>
            <span className="text-xs text-gray-500 dark:text-gray-400">v1.0.0</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => openFile('left')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              打开左侧文件
            </button>
            <button
              onClick={() => openFile('right')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              打开右侧文件
            </button>
            <button
              onClick={() => exportReport('html')}
              disabled={!diffResult}
              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              导出HTML
            </button>
            <button
              onClick={() => exportReport('pdf')}
              disabled={!diffResult}
              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              导出PDF
            </button>
          </div>
        </div>
      </header>
      
      {/* 控制面板 */}
      <ControlPanel />
      
      {/* 统计面板 */}
      {diffResult && <StatsPanel stats={diffResult.stats} />}
      
      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧输入 */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">原始文本</h3>
          </div>
          <textarea
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            placeholder="粘贴或打开文件..."
            className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none dark:bg-gray-900 dark:text-gray-200"
          />
        </div>
        
        {/* 中间差异显示 */}
        <div className="flex-1">
          {isComputing ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">计算中...</div>
            </div>
          ) : diffResult ? (
            <DiffViewer items={diffResult.items} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">暂无对比结果</p>
                <p className="text-sm">请输入或打开文件开始对比</p>
              </div>
            </div>
          )}
        </div>
        
        {/* 右侧输入 */}
        <div className="w-1/3 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">修改后文本</h3>
          </div>
          <textarea
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            placeholder="粘贴或打开文件..."
            className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none dark:bg-gray-900 dark:text-gray-200"
          />
        </div>
      </div>
      
      {/* 导航栏 */}
      {diffResult && <NavigationBar items={diffResult.items} />}
    </div>
  );
}

export default App;