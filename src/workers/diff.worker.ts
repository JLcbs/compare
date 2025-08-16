import { computeDiff } from '../utils/diffEngine';
import type { WorkerMessage, DiffOptions } from '../types';

// Web Worker消息处理
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'COMPUTE_DIFF':
      try {
        const { leftText, rightText, options } = payload as {
          leftText: string;
          rightText: string;
          options: DiffOptions;
        };
        
        // 分块处理大文本
        const chunkSize = 50000;
        const totalSize = Math.max(leftText.length, rightText.length);
        
        if (totalSize > chunkSize) {
          // 大文本分块处理并报告进度
          let progress = 0;
          const chunks = Math.ceil(totalSize / chunkSize);
          
          for (let i = 0; i < chunks; i++) {
            progress = ((i + 1) / chunks) * 100;
            
            self.postMessage({
              type: 'PROGRESS',
              progress
            } as WorkerMessage);
            
            // 模拟处理延迟
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        // 执行diff计算
        const result = computeDiff(leftText, rightText, options);
        
        // 返回结果
        self.postMessage({
          type: 'RESULT',
          payload: result
        } as WorkerMessage);
        
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          error: error instanceof Error ? error.message : '计算差异时发生错误'
        } as WorkerMessage);
      }
      break;
      
    case 'CANCEL':
      // 取消操作（如果需要）
      break;
      
    default:
      self.postMessage({
        type: 'ERROR',
        error: `未知消息类型: ${type}`
      } as WorkerMessage);
  }
});

export {};