import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { computeDiffAsync } from '@/utils/diffEngine';
import { debounce } from '@/utils/helpers';
import type { DiffOptions } from '@/types';

export function useDiff() {
  const {
    textInput,
    diffOptions,
    setDiffItems,
    setDiffStats,
    setNavigationItems,
    setIsComputing,
    setComputeProgress
  } = useAppStore();
  
  const workerRef = useRef<Worker | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 初始化Web Worker
  useEffect(() => {
    if (diffOptions.useWebWorker && typeof Worker !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/diff.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      workerRef.current.onmessage = (event) => {
        const { type, payload, progress } = event.data;
        
        switch (type) {
          case 'RESULT':
            setDiffItems(payload.items);
            setDiffStats(payload.stats);
            setNavigationItems(payload.navigation);
            setIsComputing(false);
            setComputeProgress(100);
            break;
            
          case 'PROGRESS':
            setComputeProgress(progress);
            break;
            
          case 'ERROR':
            console.error('Worker error:', event.data.error);
            setIsComputing(false);
            break;
        }
      };
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [diffOptions.useWebWorker]);
  
  // 计算差异
  const calculateDiff = useCallback(async (
    leftText: string,
    rightText: string,
    options: DiffOptions
  ) => {
    // 取消之前的计算
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 如果两边都为空，清空结果
    if (!leftText.trim() && !rightText.trim()) {
      setDiffItems([]);
      setDiffStats(null);
      setNavigationItems([]);
      return;
    }
    
    setIsComputing(true);
    setComputeProgress(0);
    abortControllerRef.current = new AbortController();
    
    try {
      // 检查文本长度决定是否使用Web Worker
      const shouldUseWorker = 
        options.useWebWorker && 
        workerRef.current && 
        (leftText.length > 10000 || rightText.length > 10000);
      
      if (shouldUseWorker && workerRef.current) {
        // 使用Web Worker
        workerRef.current.postMessage({
          type: 'COMPUTE_DIFF',
          payload: { leftText, rightText, options }
        });
      } else {
        // 直接计算（小文本或Worker不可用）
        const result = await computeDiffAsync(
          leftText,
          rightText,
          options,
          (progress) => setComputeProgress(progress)
        );
        
        if (!abortControllerRef.current?.signal.aborted) {
          setDiffItems(result.items);
          setDiffStats(result.stats);
          setNavigationItems(result.navigation);
        }
        
        setIsComputing(false);
        setComputeProgress(100);
      }
    } catch (error) {
      console.error('计算差异失败:', error);
      setIsComputing(false);
      setComputeProgress(0);
    }
  }, [setDiffItems, setDiffStats, setNavigationItems, setIsComputing, setComputeProgress]);
  
  // 防抖计算
  const debouncedCalculate = useCallback(
    debounce(calculateDiff, 300),
    [calculateDiff]
  );
  
  // 监听文本变化
  useEffect(() => {
    if (textInput.left || textInput.right) {
      debouncedCalculate(textInput.left, textInput.right, diffOptions);
    }
  }, [textInput.left, textInput.right, diffOptions, debouncedCalculate]);
  
  return {
    calculateDiff,
    debouncedCalculate
  };
}