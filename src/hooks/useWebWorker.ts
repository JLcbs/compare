import { useEffect, useRef, useCallback } from 'react';
import type { WorkerMessage } from '@/types';

interface UseWebWorkerOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export function useWebWorker(
  workerPath: string,
  options: UseWebWorkerOptions = {}
) {
  const workerRef = useRef<Worker | null>(null);
  const { onMessage, onError, onProgress } = options;
  
  useEffect(() => {
    // 创建Worker
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL(workerPath, import.meta.url),
          { type: 'module' }
        );
        
        // 设置消息处理器
        workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
          const { type, payload, error, progress } = event.data;
          
          switch (type) {
            case 'RESULT':
              onMessage?.(payload);
              break;
              
            case 'ERROR':
              onError?.(new Error(error || '未知错误'));
              break;
              
            case 'PROGRESS':
              onProgress?.(progress || 0);
              break;
          }
        };
        
        // 错误处理
        workerRef.current.onerror = (error) => {
          console.error('Worker error:', error);
          onError?.(new Error('Worker执行错误'));
        };
        
      } catch (error) {
        console.error('Failed to create worker:', error);
        onError?.(error as Error);
      }
    }
    
    // 清理
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [workerPath, onMessage, onError, onProgress]);
  
  // 发送消息到Worker
  const postMessage = useCallback((message: WorkerMessage) => {
    if (workerRef.current) {
      workerRef.current.postMessage(message);
    } else {
      console.warn('Worker not initialized');
    }
  }, []);
  
  // 终止Worker
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);
  
  return {
    postMessage,
    terminate,
    isSupported: typeof Worker !== 'undefined'
  };
}