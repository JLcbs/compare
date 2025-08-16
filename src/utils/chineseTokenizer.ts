/**
 * 中文分词器
 * 用于将文本按照中文标点、段落等进行智能分割
 */

// 中文标点符号集合
const CHINESE_PUNCTUATION = [
  '。', '！', '？', '；', '：', '，', '、',
  '（', '）', '【', '】', '《', '》', '"', '"', 
  '…', '—', '·', '～', '￥', '％'
];

// 英文标点符号集合
const ENGLISH_PUNCTUATION = [
  '.', '!', '?', ';', ':', ',',
  '(', ')', '[', ']', '{', '}', '"', "'",
  '...', '-', '_', '~', '$', '%', '&', '*', '@', '#'
];

// 句子结束标点
const SENTENCE_ENDINGS = ['。', '！', '？', '.', '!', '?', '；', ';'];

// 段落分隔符
const PARAGRAPH_SEPARATORS = ['\n\n', '\r\n\r\n'];

export interface TokenizeOptions {
  splitByParagraph?: boolean;
  splitBySentence?: boolean;
  preserveWhitespace?: boolean;
  minSegmentLength?: number;
}

export interface TextSegment {
  content: string;
  type: 'paragraph' | 'sentence' | 'word' | 'punctuation' | 'whitespace';
  index: number;
  start: number;
  end: number;
}

/**
 * 检测文本是否包含中文字符
 */
export function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * 按段落分割文本
 */
export function splitByParagraph(text: string): string[] {
  // 先按双换行符分割
  let paragraphs = text.split(/\n\s*\n|\r\n\s*\r\n/);
  
  // 过滤空段落
  paragraphs = paragraphs.filter(p => p.trim().length > 0);
  
  // 如果没有段落分隔，将整个文本作为一个段落
  if (paragraphs.length === 0 && text.trim().length > 0) {
    paragraphs = [text];
  }
  
  return paragraphs;
}

/**
 * 按句子分割文本
 */
export function splitBySentence(text: string): string[] {
  const sentences: string[] = [];
  let currentSentence = '';
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1] || '';
    
    currentSentence += char;
    
    // 处理引号
    if ((char === '"' || char === '"' || char === '"' || char === '\'') && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
    }
    
    // 检查是否为句子结束
    if (!inQuote && SENTENCE_ENDINGS.includes(char)) {
      // 检查下一个字符是否为引号结束
      if (nextChar === '"' || nextChar === '"' || nextChar === '\'') {
        currentSentence += nextChar;
        i++;
      }
      
      // 添加句子
      if (currentSentence.trim().length > 0) {
        sentences.push(currentSentence.trim());
        currentSentence = '';
      }
    }
  }
  
  // 添加最后的句子
  if (currentSentence.trim().length > 0) {
    sentences.push(currentSentence.trim());
  }
  
  return sentences;
}

/**
 * 智能分词（字符级别）
 */
export function tokenizeByCharacter(text: string): string[] {
  const tokens: string[] = [];
  let currentToken = '';
  let lastType: 'chinese' | 'english' | 'number' | 'punctuation' | 'whitespace' | null = null;
  
  for (const char of text) {
    let currentType: typeof lastType = null;
    
    if (/[\u4e00-\u9fa5]/.test(char)) {
      currentType = 'chinese';
    } else if (/[a-zA-Z]/.test(char)) {
      currentType = 'english';
    } else if (/[0-9]/.test(char)) {
      currentType = 'number';
    } else if (/\s/.test(char)) {
      currentType = 'whitespace';
    } else {
      currentType = 'punctuation';
    }
    
    // 中文字符单独成词
    if (currentType === 'chinese') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(char);
      lastType = currentType;
    }
    // 英文和数字连续
    else if ((currentType === 'english' || currentType === 'number') && 
             (lastType === 'english' || lastType === 'number')) {
      currentToken += char;
    }
    // 类型改变时分割
    else if (currentType !== lastType) {
      if (currentToken) {
        tokens.push(currentToken);
      }
      currentToken = char;
      lastType = currentType;
    } else {
      currentToken += char;
    }
  }
  
  if (currentToken) {
    tokens.push(currentToken);
  }
  
  return tokens;
}

/**
 * 主分词函数
 */
export function tokenize(text: string, options: TokenizeOptions = {}): TextSegment[] {
  const {
    splitByParagraph: splitPara = true,
    splitBySentence: splitSent = true,
    preserveWhitespace = false,
    minSegmentLength = 1
  } = options;
  
  const segments: TextSegment[] = [];
  let globalIndex = 0;
  let globalPosition = 0;
  
  if (splitPara) {
    const paragraphs = splitByParagraph(text);
    
    for (const paragraph of paragraphs) {
      const paragraphStart = text.indexOf(paragraph, globalPosition);
      
      if (splitSent) {
        const sentences = splitBySentence(paragraph);
        
        for (const sentence of sentences) {
          const sentenceStart = text.indexOf(sentence, paragraphStart);
          
          segments.push({
            content: sentence,
            type: 'sentence',
            index: globalIndex++,
            start: sentenceStart,
            end: sentenceStart + sentence.length
          });
        }
      } else {
        segments.push({
          content: paragraph,
          type: 'paragraph',
          index: globalIndex++,
          start: paragraphStart,
          end: paragraphStart + paragraph.length
        });
      }
      
      globalPosition = paragraphStart + paragraph.length;
    }
  } else if (splitSent) {
    const sentences = splitBySentence(text);
    
    for (const sentence of sentences) {
      const sentenceStart = text.indexOf(sentence, globalPosition);
      
      segments.push({
        content: sentence,
        type: 'sentence',
        index: globalIndex++,
        start: sentenceStart,
        end: sentenceStart + sentence.length
      });
      
      globalPosition = sentenceStart + sentence.length;
    }
  } else {
    // 字符级分词
    const tokens = tokenizeByCharacter(text);
    let position = 0;
    
    for (const token of tokens) {
      if (!preserveWhitespace && token.trim().length === 0) {
        position += token.length;
        continue;
      }
      
      if (token.length >= minSegmentLength) {
        segments.push({
          content: token,
          type: 'word',
          index: globalIndex++,
          start: position,
          end: position + token.length
        });
      }
      
      position += token.length;
    }
  }
  
  return segments;
}

/**
 * 优化大文本处理
 */
export function* tokenizeStream(text: string, options: TokenizeOptions = {}) {
  const segments = tokenize(text, options);
  const batchSize = 100;
  
  for (let i = 0; i < segments.length; i += batchSize) {
    yield segments.slice(i, i + batchSize);
  }
}