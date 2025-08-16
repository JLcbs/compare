import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  TextInput, 
  DiffOptions, 
  AppSettings, 
  DiffItem, 
  DiffStats,
  NavigationItem 
} from '@/types';

interface AppState {
  // 文本状态
  textInput: TextInput;
  setTextInput: (input: Partial<TextInput>) => void;
  swapTexts: () => void;
  clearTexts: () => void;

  // 差异结果
  diffItems: DiffItem[];
  setDiffItems: (items: DiffItem[]) => void;
  diffStats: DiffStats | null;
  setDiffStats: (stats: DiffStats | null) => void;

  // 对比选项
  diffOptions: DiffOptions;
  setDiffOptions: (options: Partial<DiffOptions>) => void;

  // 导航
  navigationItems: NavigationItem[];
  setNavigationItems: (items: NavigationItem[]) => void;
  currentNavigationIndex: number;
  setCurrentNavigationIndex: (index: number) => void;
  navigateToNext: () => void;
  navigateToPrevious: () => void;

  // 应用设置
  appSettings: AppSettings;
  setAppSettings: (settings: Partial<AppSettings>) => void;

  // UI状态
  isComputing: boolean;
  setIsComputing: (computing: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  computeProgress: number;
  setComputeProgress: (progress: number) => void;

  // 历史记录
  history: TextInput[];
  addToHistory: (input: TextInput) => void;
  clearHistory: () => void;
}

const defaultTextInput: TextInput = {
  left: '',
  right: '',
  leftTitle: '原始文本',
  rightTitle: '修改后文本',
};

const defaultDiffOptions: DiffOptions = {
  ignoreCase: false,
  ignoreWhitespace: false,
  ignorePunctuation: false,
  splitByParagraph: true,
  splitBySentence: true,
  useWebWorker: true,
};

const defaultAppSettings: AppSettings = {
  theme: 'light',
  highlightColors: {
    add: '#22c55e',
    remove: '#ef4444',
    modify: '#3b82f6',
  },
  fontSize: 14,
  fontFamily: 'monospace',
  autoSave: false,
  offlineMode: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 文本状态
      textInput: defaultTextInput,
      setTextInput: (input) =>
        set((state) => ({
          textInput: { ...state.textInput, ...input },
        })),
      swapTexts: () =>
        set((state) => ({
          textInput: {
            ...state.textInput,
            left: state.textInput.right,
            right: state.textInput.left,
            leftTitle: state.textInput.rightTitle,
            rightTitle: state.textInput.leftTitle,
          },
        })),
      clearTexts: () =>
        set({
          textInput: defaultTextInput,
          diffItems: [],
          diffStats: null,
          navigationItems: [],
          currentNavigationIndex: -1,
        }),

      // 差异结果
      diffItems: [],
      setDiffItems: (items) => set({ diffItems: items }),
      diffStats: null,
      setDiffStats: (stats) => set({ diffStats: stats }),

      // 对比选项
      diffOptions: defaultDiffOptions,
      setDiffOptions: (options) =>
        set((state) => ({
          diffOptions: { ...state.diffOptions, ...options },
        })),

      // 导航
      navigationItems: [],
      setNavigationItems: (items) => set({ navigationItems: items }),
      currentNavigationIndex: -1,
      setCurrentNavigationIndex: (index) => set({ currentNavigationIndex: index }),
      navigateToNext: () => {
        const { navigationItems, currentNavigationIndex } = get();
        if (currentNavigationIndex < navigationItems.length - 1) {
          set({ currentNavigationIndex: currentNavigationIndex + 1 });
        }
      },
      navigateToPrevious: () => {
        const { currentNavigationIndex } = get();
        if (currentNavigationIndex > 0) {
          set({ currentNavigationIndex: currentNavigationIndex - 1 });
        }
      },

      // 应用设置
      appSettings: defaultAppSettings,
      setAppSettings: (settings) =>
        set((state) => ({
          appSettings: { ...state.appSettings, ...settings },
        })),

      // UI状态
      isComputing: false,
      setIsComputing: (computing) => set({ isComputing: computing }),
      isExportModalOpen: false,
      setIsExportModalOpen: (open) => set({ isExportModalOpen: open }),
      isSettingsModalOpen: false,
      setIsSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),
      computeProgress: 0,
      setComputeProgress: (progress) => set({ computeProgress: progress }),

      // 历史记录
      history: [],
      addToHistory: (input) =>
        set((state) => ({
          history: [input, ...state.history.slice(0, 9)], // 保留最近10条
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'text-diff-storage',
      partialize: (state) => ({
        diffOptions: state.diffOptions,
        appSettings: state.appSettings,
        history: state.history,
      }),
    }
  )
);