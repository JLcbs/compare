import { saveAs } from 'file-saver';
import { DiffItem, DiffStats, DiffType, ExportOptions } from '@/types';
import { formatTimestamp } from './helpers';

/**
 * 导出为HTML格式
 */
export function exportToHTML(
  items: DiffItem[],
  stats: DiffStats,
  options: ExportOptions
): void {
  const timestamp = options.includeTimestamp ? formatTimestamp() : '';
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>文本对比报告 - ${timestamp}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header .timestamp {
      opacity: 0.9;
      font-size: 14px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-top: 5px;
    }
    
    .content {
      padding: 30px;
    }
    
    .diff-item {
      margin: 10px 0;
      padding: 10px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    
    .diff-add {
      background: #e6ffed;
      border-left: 3px solid #22c55e;
    }
    
    .diff-remove {
      background: #ffebe9;
      border-left: 3px solid #ef4444;
      text-decoration: line-through;
      opacity: 0.8;
    }
    
    .diff-modify {
      background: #e0f2fe;
      border-left: 3px solid #3b82f6;
    }
    
    .diff-equal {
      color: #666;
      font-size: 12px;
      opacity: 0.6;
    }
    
    .line-number {
      display: inline-block;
      width: 50px;
      color: #999;
      text-align: right;
      margin-right: 10px;
      user-select: none;
    }
    
    .footer {
      padding: 20px 30px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
      }
    }
    
    @media (max-width: 768px) {
      .stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 文本对比报告</h1>
      ${timestamp ? `<div class="timestamp">生成时间: ${timestamp}</div>` : ''}
    </div>
    
    ${options.includeStats ? `
    <div class="stats">
      <div class="stat-item">
        <div class="stat-value">${stats.totalChanges}</div>
        <div class="stat-label">总变更</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${stats.additions}</div>
        <div class="stat-label">新增</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${stats.deletions}</div>
        <div class="stat-label">删除</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${stats.modifications}</div>
        <div class="stat-label">修改</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${stats.similarity.toFixed(1)}%</div>
        <div class="stat-label">相似度</div>
      </div>
    </div>
    ` : ''}
    
    <div class="content">
      ${items.map(item => {
        const typeClass = `diff-${item.type}`;
        const lineNumber = item.lineNumber ? `<span class="line-number">${item.lineNumber}</span>` : '';
        
        if (item.type === DiffType.EQUAL && items.length > 50) {
          // 对于大量相同内容，只显示摘要
          return '';
        }
        
        let content = escapeHtml(item.content);
        
        if (item.type === DiffType.MODIFY && item.originalContent) {
          content = `<del style="opacity: 0.5">${escapeHtml(item.originalContent)}</del><br><ins>${content}</ins>`;
        }
        
        return `<div class="${typeClass} diff-item">${lineNumber}${content}</div>`;
      }).join('')}
    </div>
    
    <div class="footer">
      <p>Generated by Text Diff MVP | ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`;
  
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `diff-report-${Date.now()}.html`);
}

/**
 * 导出为纯文本格式
 */
export function exportToText(
  items: DiffItem[],
  stats: DiffStats,
  options: ExportOptions
): void {
  let text = '文本对比报告\n';
  text += '='.repeat(50) + '\n\n';
  
  if (options.includeTimestamp) {
    text += `生成时间: ${formatTimestamp()}\n\n`;
  }
  
  if (options.includeStats) {
    text += '统计信息\n';
    text += '-'.repeat(30) + '\n';
    text += `总变更数: ${stats.totalChanges}\n`;
    text += `新增: ${stats.additions} 项, ${stats.addedWords} 词\n`;
    text += `删除: ${stats.deletions} 项, ${stats.deletedWords} 词\n`;
    text += `修改: ${stats.modifications} 项\n`;
    text += `相似度: ${stats.similarity.toFixed(2)}%\n\n`;
  }
  
  text += '详细差异\n';
  text += '-'.repeat(30) + '\n\n';
  
  items.forEach((item, index) => {
    if (item.type === DiffType.EQUAL) return;
    
    const lineInfo = item.lineNumber ? `[行 ${item.lineNumber}] ` : '';
    const typeLabel = {
      [DiffType.ADD]: '[新增]',
      [DiffType.REMOVE]: '[删除]',
      [DiffType.MODIFY]: '[修改]'
    }[item.type];
    
    text += `${index + 1}. ${lineInfo}${typeLabel}\n`;
    
    if (item.type === DiffType.MODIFY && item.originalContent) {
      text += `   原文: ${item.originalContent}\n`;
      text += `   现文: ${item.content}\n`;
    } else {
      text += `   内容: ${item.content}\n`;
    }
    
    text += '\n';
  });
  
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `diff-report-${Date.now()}.txt`);
}

/**
 * 导出为JSON格式
 */
export function exportToJSON(
  items: DiffItem[],
  stats: DiffStats,
  options: ExportOptions
): void {
  const data = {
    metadata: {
      timestamp: options.includeTimestamp ? new Date().toISOString() : undefined,
      version: '1.0.0',
      generator: 'Text Diff MVP'
    },
    stats: options.includeStats ? stats : undefined,
    differences: items.filter(item => item.type !== DiffType.EQUAL).map(item => ({
      type: item.type,
      content: item.content,
      originalContent: item.originalContent,
      lineNumber: item.lineNumber,
      position: item.position
    }))
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  saveAs(blob, `diff-report-${Date.now()}.json`);
}

/**
 * HTML转义
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * 导出主函数
 */
export function exportDiff(
  items: DiffItem[],
  stats: DiffStats,
  options: ExportOptions
): void {
  switch (options.format) {
    case 'html':
      exportToHTML(items, stats, options);
      break;
    case 'text':
      exportToText(items, stats, options);
      break;
    case 'json':
      exportToJSON(items, stats, options);
      break;
    default:
      console.warn(`不支持的导出格式: ${options.format}`);
  }
}