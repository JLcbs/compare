import DiffMatchPatch from 'diff-match-patch';
import { 
  DiffType, 
  DiffItem, 
  DiffStats, 
  DiffOptions,
  NavigationItem 
} from '@/types';
import { tokenize, containsChinese } from './chineseTokenizer';

const dmp = new DiffMatchPatch();

// 配置diff-match-patch参数
dmp.Diff_Timeout = 2.0; // 2秒超时
dmp.Diff_EditCost = 4; // 编辑成本

/**
 * 预处理文本
 */
function preprocessText(text: string, options: DiffOptions): string {
  let processed = text;
  
  if (options.ignoreCase) {
    processed = processed.toLowerCase();
  }
  
  if (options.ignoreWhitespace) {
    // 压缩连续空白为单个空格
    processed = processed.replace(/\s+/g, ' ').trim();
  }
  
  if (options.ignorePunctuation) {
    // 移除标点符号
    processed = processed.replace(/[^\w\s\u4e00-\u9fa5]/g, '');
  }
  
  return processed;
}

/**
 * 计算两个文本的差异
 */
export function computeDiff(
  leftText: string, 
  rightText: string, 
  options: DiffOptions
): { items: DiffItem[], stats: DiffStats, navigation: NavigationItem[] } {
  // 预处理文本
  const processedLeft = preprocessText(leftText, options);
  const processedRight = preprocessText(rightText, options);
  
  // 检测是否包含中文，决定分词策略
  const hasChinese = containsChinese(leftText) || containsChinese(rightText);
  
  let diffItems: DiffItem[] = [];
  let navigationItems: NavigationItem[] = [];
  
  if (options.splitByParagraph || options.splitBySentence) {
    // 使用双层对比策略
    diffItems = computeHierarchicalDiff(
      leftText,
      rightText,
      processedLeft,
      processedRight,
      options,
      hasChinese
    );
  } else {
    // 直接字符级对比
    diffItems = computeCharacterDiff(
      leftText,
      rightText,
      processedLeft,
      processedRight,
      hasChinese
    );
  }
  
  // 生成导航项
  navigationItems = generateNavigationItems(diffItems);
  
  // 计算统计信息
  const stats = calculateStats(diffItems, leftText, rightText);
  
  return { items: diffItems, stats, navigation: navigationItems };
}

/**
 * 双层对比：先段落/句子级，再字符级
 */
function computeHierarchicalDiff(
  _leftText: string,
  _rightText: string,
  processedLeft: string,
  processedRight: string,
  options: DiffOptions,
  _hasChinese: boolean
): DiffItem[] {
  const diffItems: DiffItem[] = [];
  
  // 分词选项
  const tokenizeOptions = {
    splitByParagraph: options.splitByParagraph,
    splitBySentence: options.splitBySentence,
    preserveWhitespace: !options.ignoreWhitespace
  };
  
  // 对原始文本和处理后文本进行分词
  const leftSegments = tokenize(processedLeft, tokenizeOptions);
  const rightSegments = tokenize(processedRight, tokenizeOptions);
  
  // 将分段转换为字符串数组用于diff
  const leftStrings = leftSegments.map(s => s.content);
  const rightStrings = rightSegments.map(s => s.content);
  
  // 计算段落/句子级差异
  const segmentDiffs = dmp.diff_main(
    leftStrings.join('\n'),
    rightStrings.join('\n')
  );
  
  // 清理差异
  dmp.diff_cleanupSemantic(segmentDiffs);
  
  let currentPosition = 0;
  let lineNumber = 1;
  
  for (const [operation, text] of segmentDiffs) {
    const lines = text.split('\n').filter(line => line.length > 0);
    
    for (const line of lines) {
      if (operation === DiffMatchPatch.DIFF_EQUAL) {
        // 相同内容
        diffItems.push({
          id: `diff-${diffItems.length}`,
          type: DiffType.EQUAL,
          content: line,
          lineNumber,
          position: {
            start: currentPosition,
            end: currentPosition + line.length
          }
        });
      } else if (operation === DiffMatchPatch.DIFF_INSERT) {
        // 新增内容
        diffItems.push({
          id: `diff-${diffItems.length}`,
          type: DiffType.ADD,
          content: line,
          lineNumber,
          position: {
            start: currentPosition,
            end: currentPosition + line.length
          }
        });
      } else if (operation === DiffMatchPatch.DIFF_DELETE) {
        // 删除内容
        diffItems.push({
          id: `diff-${diffItems.length}`,
          type: DiffType.REMOVE,
          content: line,
          originalContent: line,
          lineNumber,
          position: {
            start: currentPosition,
            end: currentPosition + line.length
          }
        });
      }
      
      currentPosition += line.length + 1;
      lineNumber++;
    }
  }
  
  // 合并相邻的修改项（删除+新增 = 修改）
  return mergeModifications(diffItems);
}

/**
 * 字符级对比
 */
function computeCharacterDiff(
  _leftText: string,
  _rightText: string,
  processedLeft: string,
  processedRight: string,
  _hasChinese: boolean
): DiffItem[] {
  const diffItems: DiffItem[] = [];
  
  // 使用diff-match-patch进行字符级对比
  const diffs = dmp.diff_main(processedLeft, processedRight);
  
  // 语义优化
  dmp.diff_cleanupSemantic(diffs);
  
  let currentPosition = 0;
  let lineNumber = 1;
  
  for (const [operation, text] of diffs) {
    let diffType: DiffType;
    
    switch (operation) {
      case DiffMatchPatch.DIFF_EQUAL:
        diffType = DiffType.EQUAL;
        break;
      case DiffMatchPatch.DIFF_INSERT:
        diffType = DiffType.ADD;
        break;
      case DiffMatchPatch.DIFF_DELETE:
        diffType = DiffType.REMOVE;
        break;
      default:
        continue;
    }
    
    // 按行分割以便更好地显示
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (i > 0) {
        lineNumber++;
        currentPosition++; // 换行符
      }
      
      if (line.length > 0 || diffType !== DiffType.EQUAL) {
        diffItems.push({
          id: `diff-${diffItems.length}`,
          type: diffType,
          content: line,
          originalContent: diffType === DiffType.REMOVE ? line : undefined,
          lineNumber,
          position: {
            start: currentPosition,
            end: currentPosition + line.length
          }
        });
      }
      
      currentPosition += line.length;
    }
  }
  
  return mergeModifications(diffItems);
}

/**
 * 合并相邻的删除和新增为修改
 */
function mergeModifications(items: DiffItem[]): DiffItem[] {
  const merged: DiffItem[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const current = items[i];
    const next = items[i + 1];
    
    // 检测删除后紧跟新增的模式
    if (
      current.type === DiffType.REMOVE &&
      next &&
      next.type === DiffType.ADD &&
      Math.abs(current.lineNumber! - next.lineNumber!) <= 1
    ) {
      // 合并为修改
      merged.push({
        id: `diff-${merged.length}`,
        type: DiffType.MODIFY,
        content: next.content,
        originalContent: current.content,
        lineNumber: current.lineNumber,
        position: current.position
      });
      i++; // 跳过下一个项
    } else {
      merged.push(current);
    }
  }
  
  return merged;
}

/**
 * 生成导航项
 */
function generateNavigationItems(items: DiffItem[]): NavigationItem[] {
  return items
    .filter(item => item.type !== DiffType.EQUAL)
    .map(item => ({
      id: item.id,
      type: item.type,
      lineNumber: item.lineNumber || 0,
      preview: item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '')
    }));
}

/**
 * 计算统计信息
 */
function calculateStats(items: DiffItem[], leftText: string, rightText: string): DiffStats {
  let additions = 0;
  let deletions = 0;
  let modifications = 0;
  let addedWords = 0;
  let deletedWords = 0;
  let addedLines = 0;
  let deletedLines = 0;
  
  for (const item of items) {
    switch (item.type) {
      case DiffType.ADD:
        additions++;
        addedWords += item.content.split(/\s+/).filter(w => w.length > 0).length;
        addedLines += item.content.split('\n').length;
        break;
      case DiffType.REMOVE:
        deletions++;
        deletedWords += item.content.split(/\s+/).filter(w => w.length > 0).length;
        deletedLines += item.content.split('\n').length;
        break;
      case DiffType.MODIFY:
        modifications++;
        addedWords += item.content.split(/\s+/).filter(w => w.length > 0).length;
        deletedWords += (item.originalContent || '').split(/\s+/).filter(w => w.length > 0).length;
        break;
    }
  }
  
  // 计算相似度
  const maxLength = Math.max(leftText.length, rightText.length);
  const changedChars = items
    .filter(item => item.type !== DiffType.EQUAL)
    .reduce((sum, item) => sum + item.content.length, 0);
  const similarity = maxLength > 0 ? ((maxLength - changedChars) / maxLength) * 100 : 100;
  
  return {
    totalChanges: additions + deletions + modifications,
    additions,
    deletions,
    modifications,
    addedWords,
    deletedWords,
    addedLines,
    deletedLines,
    similarity: Math.max(0, Math.min(100, similarity))
  };
}

/**
 * 处理大文本的优化函数
 */
export async function computeDiffAsync(
  leftText: string,
  rightText: string,
  options: DiffOptions,
  onProgress?: (progress: number) => void
): Promise<{ items: DiffItem[], stats: DiffStats, navigation: NavigationItem[] }> {
  const chunkSize = 10000; // 每块10000字符
  const totalSize = Math.max(leftText.length, rightText.length);
  
  if (totalSize <= chunkSize) {
    // 小文本直接处理
    return computeDiff(leftText, rightText, options);
  }
  
  // 大文本分块处理
  const results: DiffItem[] = [];
  let processed = 0;
  
  for (let i = 0; i < totalSize; i += chunkSize) {
    const leftChunk = leftText.substring(i, i + chunkSize);
    const rightChunk = rightText.substring(i, i + chunkSize);
    
    const chunkResult = computeDiff(leftChunk, rightChunk, options);
    results.push(...chunkResult.items);
    
    processed += chunkSize;
    if (onProgress) {
      onProgress(Math.min(100, (processed / totalSize) * 100));
    }
    
    // 让出执行权，避免阻塞UI
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  const navigation = generateNavigationItems(results);
  const stats = calculateStats(results, leftText, rightText);
  
  return { items: results, stats, navigation };
}