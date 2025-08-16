import React, { useCallback, useRef } from 'react';
import { Upload, Copy, Trash2, FileText } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { copyToClipboard, calculateTextStats } from '@/utils/helpers';

interface TextInputProps {
  side: 'left' | 'right';
  title: string;
  placeholder?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ 
  side, 
  title, 
  placeholder = '在此粘贴或输入文本...' 
}) => {
  const { textInput, setTextInput } = useAppStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const text = side === 'left' ? textInput.left : textInput.right;
  const stats = calculateTextStats(text);
  
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput({
      [side]: e.target.value
    });
  }, [side, setTextInput]);
  
  const handleClear = useCallback(() => {
    setTextInput({
      [side]: ''
    });
    textareaRef.current?.focus();
  }, [side, setTextInput]);
  
  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(text);
    if (success) {
      // 可以添加toast提示
      console.log('已复制到剪贴板');
    }
  }, [text]);
  
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextInput({
        [side]: content
      });
    };
    reader.readAsText(file);
    
    // 清空input以允许重复选择同一文件
    e.target.value = '';
  }, [side, setTextInput]);
  
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    // 处理粘贴事件，可以在这里做额外处理
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      // 默认行为即可，这里可以添加额外逻辑
    }
  }, []);
  
  return (
    <div className="flex flex-col h-full">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {/* 统计信息 */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {stats.characters} 字符 | {stats.words} 词 | {stats.lines} 行
          </span>
          
          {/* 操作按钮 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="上传文件"
          >
            <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="复制文本"
            disabled={!text}
          >
            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={handleClear}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="清空文本"
            disabled={!text}
          >
            <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* 文本输入区 */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="w-full h-full p-4 resize-none font-mono text-sm 
                     bg-white dark:bg-gray-900 
                     text-gray-800 dark:text-gray-200
                     border-0 focus:outline-none focus:ring-2 focus:ring-blue-500
                     custom-scrollbar selection-highlight"
          spellCheck={false}
        />
        
        {/* 拖放提示 */}
        {!text && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400 dark:text-gray-600">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">粘贴文本或拖放文件到此处</p>
            </div>
          </div>
        )}
      </div>
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.json,.xml,.html,.css,.js,.ts,.tsx"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};