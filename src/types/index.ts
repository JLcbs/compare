// 差异类型枚举
export enum DiffType {
  ADD = 'add',
  REMOVE = 'remove',
  MODIFY = 'modify',
  EQUAL = 'equal',
}

// 差异项接口
export interface DiffItem {
  id: string;
  type: DiffType;
  content: string;
  originalContent?: string;
  lineNumber?: number;
  position: {
    start: number;
    end: number;
  };
}

// 差异统计接口
export interface DiffStats {
  totalChanges: number;
  additions: number;
  deletions: number;
  modifications: number;
  addedWords: number;
  deletedWords: number;
  addedLines: number;
  deletedLines: number;
  similarity: number; // 相似度百分比
}

// 对比选项接口
export interface DiffOptions {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
  ignorePunctuation: boolean;
  splitByParagraph: boolean;
  splitBySentence: boolean;
  useWebWorker: boolean;
}

// 导出选项接口
export interface ExportOptions {
  format: 'html' | 'text' | 'json' | 'docx' | 'pdf';
  includeStats: boolean;
  includeTimestamp: boolean;
  highlightStyle: 'inline' | 'sideBySide';
}

// 应用设置接口
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  highlightColors: {
    add: string;
    remove: string;
    modify: string;
  };
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  offlineMode: boolean;
}

// 文本输入接口
export interface TextInput {
  left: string;
  right: string;
  leftTitle?: string;
  rightTitle?: string;
  timestamp?: Date;
}

// 导航项接口
export interface NavigationItem {
  id: string;
  type: DiffType;
  lineNumber: number;
  preview: string;
}

// Web Worker消息接口
export interface WorkerMessage {
  type: 'COMPUTE_DIFF' | 'CANCEL' | 'RESULT' | 'ERROR' | 'PROGRESS';
  payload?: any;
  error?: string;
  progress?: number;
}