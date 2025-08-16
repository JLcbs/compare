// Diff引擎核心模块
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DiffType {
    Add,
    Remove,
    Modify,
    Equal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffItem {
    pub id: String,
    pub diff_type: DiffType,
    pub content: String,
    pub original_content: Option<String>,
    pub line_number: Option<usize>,
    pub position: Position,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffOptions {
    pub ignore_case: bool,
    pub ignore_whitespace: bool,
    pub ignore_punctuation: bool,
    pub split_by_paragraph: bool,
    pub split_by_sentence: bool,
    pub use_web_worker: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffStats {
    pub total_changes: usize,
    pub additions: usize,
    pub deletions: usize,
    pub modifications: usize,
    pub added_words: usize,
    pub deleted_words: usize,
    pub similarity: f32,
}

/// 主Diff引擎
pub struct DiffEngine {
    options: DiffOptions,
}

impl DiffEngine {
    pub fn new(options: DiffOptions) -> Self {
        Self { options }
    }

    /// 计算两个文本的差异
    pub fn compute_diff(&self, left_text: &str, right_text: &str) -> DiffResult {
        // 预处理文本
        let processed_left = self.preprocess_text(left_text);
        let processed_right = self.preprocess_text(right_text);
        
        // 检测是否包含中文
        let has_chinese = self.contains_chinese(left_text) || self.contains_chinese(right_text);
        
        let diff_items = if self.options.split_by_paragraph || self.options.split_by_sentence {
            self.hierarchical_diff(&processed_left, &processed_right, has_chinese)
        } else {
            self.character_diff(&processed_left, &processed_right, has_chinese)
        };
        
        let stats = self.calculate_stats(&diff_items, left_text, right_text);
        
        DiffResult {
            items: diff_items,
            stats,
        }
    }
    
    /// 流式增量对比
    pub async fn compute_diff_stream(
        &self,
        left_text: &str,
        right_text: &str,
        chunk_size: usize,
    ) -> impl futures::Stream<Item = DiffChunk> {
        use futures::stream::{self, StreamExt};
        
        let chunks = self.split_into_chunks(left_text, right_text, chunk_size);
        
        stream::iter(chunks).map(move |chunk| {
            let result = self.compute_diff(&chunk.left, &chunk.right);
            DiffChunk {
                index: chunk.index,
                total: chunk.total,
                items: result.items,
                partial_stats: result.stats,
            }
        })
    }
    
    fn preprocess_text(&self, text: &str) -> String {
        let mut processed = text.to_string();
        
        if self.options.ignore_case {
            processed = processed.to_lowercase();
        }
        
        if self.options.ignore_whitespace {
            processed = processed.split_whitespace().collect::<Vec<_>>().join(" ");
        }
        
        if self.options.ignore_punctuation {
            processed = processed.chars()
                .filter(|c| c.is_alphanumeric() || c.is_whitespace() || self.is_chinese_char(*c))
                .collect();
        }
        
        processed
    }
    
    fn contains_chinese(&self, text: &str) -> bool {
        text.chars().any(|c| self.is_chinese_char(c))
    }
    
    fn is_chinese_char(&self, c: char) -> bool {
        (c >= '\u{4e00}' && c <= '\u{9fff}') ||
        (c >= '\u{3400}' && c <= '\u{4dbf}') ||
        (c >= '\u{20000}' && c <= '\u{2a6df}')
    }
    
    fn hierarchical_diff(&self, left: &str, right: &str, has_chinese: bool) -> Vec<DiffItem> {
        // 双层对比策略实现
        let segments_left = if has_chinese {
            self.segment_chinese_text(left)
        } else {
            self.segment_text(left)
        };
        
        let segments_right = if has_chinese {
            self.segment_chinese_text(right)
        } else {
            self.segment_text(right)
        };
        
        // 使用Patience Diff算法
        self.patience_diff(&segments_left, &segments_right)
    }
    
    fn character_diff(&self, left: &str, right: &str, _has_chinese: bool) -> Vec<DiffItem> {
        // 字符级对比实现
        self.lcs_diff(left, right)
    }
    
    fn segment_chinese_text(&self, text: &str) -> Vec<String> {
        // 中文分词实现
        let mut segments = Vec::new();
        let mut current = String::new();
        
        for c in text.chars() {
            if "。！？；".contains(c) {
                current.push(c);
                segments.push(current.clone());
                current.clear();
            } else {
                current.push(c);
            }
        }
        
        if !current.is_empty() {
            segments.push(current);
        }
        
        segments
    }
    
    fn segment_text(&self, text: &str) -> Vec<String> {
        text.split_terminator(&['.', '!', '?', ';'][..])
            .map(|s| s.to_string())
            .collect()
    }
    
    fn patience_diff(&self, left: &[String], right: &[String]) -> Vec<DiffItem> {
        // Patience Diff算法实现
        // 这里是简化版本，实际应使用完整的Patience算法
        let mut items = Vec::new();
        let mut left_idx = 0;
        let mut right_idx = 0;
        
        while left_idx < left.len() || right_idx < right.len() {
            if left_idx >= left.len() {
                // 右侧有剩余，都是新增
                items.push(DiffItem {
                    id: format!("diff-{}", items.len()),
                    diff_type: DiffType::Add,
                    content: right[right_idx].clone(),
                    original_content: None,
                    line_number: Some(right_idx + 1),
                    position: Position {
                        start: right_idx,
                        end: right_idx + 1,
                    },
                });
                right_idx += 1;
            } else if right_idx >= right.len() {
                // 左侧有剩余，都是删除
                items.push(DiffItem {
                    id: format!("diff-{}", items.len()),
                    diff_type: DiffType::Remove,
                    content: left[left_idx].clone(),
                    original_content: Some(left[left_idx].clone()),
                    line_number: Some(left_idx + 1),
                    position: Position {
                        start: left_idx,
                        end: left_idx + 1,
                    },
                });
                left_idx += 1;
            } else if left[left_idx] == right[right_idx] {
                // 相同
                items.push(DiffItem {
                    id: format!("diff-{}", items.len()),
                    diff_type: DiffType::Equal,
                    content: left[left_idx].clone(),
                    original_content: None,
                    line_number: Some(left_idx + 1),
                    position: Position {
                        start: left_idx,
                        end: left_idx + 1,
                    },
                });
                left_idx += 1;
                right_idx += 1;
            } else {
                // 不同，检查是修改还是新增/删除
                items.push(DiffItem {
                    id: format!("diff-{}", items.len()),
                    diff_type: DiffType::Modify,
                    content: right[right_idx].clone(),
                    original_content: Some(left[left_idx].clone()),
                    line_number: Some(left_idx + 1),
                    position: Position {
                        start: left_idx,
                        end: left_idx + 1,
                    },
                });
                left_idx += 1;
                right_idx += 1;
            }
        }
        
        items
    }
    
    fn lcs_diff(&self, left: &str, right: &str) -> Vec<DiffItem> {
        // LCS (Longest Common Subsequence) 算法实现
        let left_chars: Vec<char> = left.chars().collect();
        let right_chars: Vec<char> = right.chars().collect();
        
        let m = left_chars.len();
        let n = right_chars.len();
        
        // 构建LCS表
        let mut lcs_table = vec![vec![0; n + 1]; m + 1];
        
        for i in 1..=m {
            for j in 1..=n {
                if left_chars[i - 1] == right_chars[j - 1] {
                    lcs_table[i][j] = lcs_table[i - 1][j - 1] + 1;
                } else {
                    lcs_table[i][j] = lcs_table[i - 1][j].max(lcs_table[i][j - 1]);
                }
            }
        }
        
        // 回溯构建diff
        let mut items = Vec::new();
        let mut i = m;
        let mut j = n;
        
        while i > 0 || j > 0 {
            if i == 0 {
                // 新增
                items.push(DiffItem {
                    id: format!("diff-{}", items.len()),
                    diff_type: DiffType::Add,
                    content: right_chars[j - 1].to_string(),
                    original_content: None,
                    line_number: Some(j),
                    position: Position { start: j - 1, end: j },
                });
                j -= 1;
            } else if j == 0 {
                // 删除
                items.push(DiffItem {
                    id: format!("diff-{}", items.len()),
                    diff_type: DiffType::Remove,
                    content: left_chars[i - 1].to_string(),
                    original_content: Some(left_chars[i - 1].to_string()),
                    line_number: Some(i),
                    position: Position { start: i - 1, end: i },
                });
                i -= 1;
            } else if left_chars[i - 1] == right_chars[j - 1] {
                // 相同
                items.push(DiffItem {
                    id: format!("diff-{}", items.len()),
                    diff_type: DiffType::Equal,
                    content: left_chars[i - 1].to_string(),
                    original_content: None,
                    line_number: Some(i),
                    position: Position { start: i - 1, end: i },
                });
                i -= 1;
                j -= 1;
            } else if lcs_table[i - 1][j] > lcs_table[i][j - 1] {
                // 删除
                items.push(DiffItem {
                    id: format!("diff-{}", items.len()),
                    diff_type: DiffType::Remove,
                    content: left_chars[i - 1].to_string(),
                    original_content: Some(left_chars[i - 1].to_string()),
                    line_number: Some(i),
                    position: Position { start: i - 1, end: i },
                });
                i -= 1;
            } else {
                // 新增
                items.push(DiffItem {
                    id: format!("diff-{}", items.len()),
                    diff_type: DiffType::Add,
                    content: right_chars[j - 1].to_string(),
                    original_content: None,
                    line_number: Some(j),
                    position: Position { start: j - 1, end: j },
                });
                j -= 1;
            }
        }
        
        items.reverse();
        items
    }
    
    fn calculate_stats(&self, items: &[DiffItem], left_text: &str, right_text: &str) -> DiffStats {
        let mut stats = DiffStats {
            total_changes: 0,
            additions: 0,
            deletions: 0,
            modifications: 0,
            added_words: 0,
            deleted_words: 0,
            similarity: 0.0,
        };
        
        for item in items {
            match item.diff_type {
                DiffType::Add => {
                    stats.additions += 1;
                    stats.added_words += item.content.split_whitespace().count();
                }
                DiffType::Remove => {
                    stats.deletions += 1;
                    stats.deleted_words += item.content.split_whitespace().count();
                }
                DiffType::Modify => {
                    stats.modifications += 1;
                    stats.added_words += item.content.split_whitespace().count();
                    if let Some(ref original) = item.original_content {
                        stats.deleted_words += original.split_whitespace().count();
                    }
                }
                DiffType::Equal => {}
            }
        }
        
        stats.total_changes = stats.additions + stats.deletions + stats.modifications;
        
        // 计算相似度
        let total_chars = left_text.len().max(right_text.len()) as f32;
        let changed_chars = items.iter()
            .filter(|item| !matches!(item.diff_type, DiffType::Equal))
            .map(|item| item.content.len())
            .sum::<usize>() as f32;
        
        stats.similarity = if total_chars > 0.0 {
            ((total_chars - changed_chars) / total_chars * 100.0).max(0.0).min(100.0)
        } else {
            100.0
        };
        
        stats
    }
    
    fn split_into_chunks(&self, left: &str, right: &str, chunk_size: usize) -> Vec<TextChunk> {
        let mut chunks = Vec::new();
        let left_lines: Vec<&str> = left.lines().collect();
        let right_lines: Vec<&str> = right.lines().collect();
        
        let total_lines = left_lines.len().max(right_lines.len());
        let total_chunks = (total_lines + chunk_size - 1) / chunk_size;
        
        for i in 0..total_chunks {
            let start = i * chunk_size;
            let end = ((i + 1) * chunk_size).min(total_lines);
            
            let left_chunk = left_lines[start.min(left_lines.len())..end.min(left_lines.len())]
                .join("\n");
            let right_chunk = right_lines[start.min(right_lines.len())..end.min(right_lines.len())]
                .join("\n");
            
            chunks.push(TextChunk {
                index: i,
                total: total_chunks,
                left: left_chunk,
                right: right_chunk,
            });
        }
        
        chunks
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffResult {
    pub items: Vec<DiffItem>,
    pub stats: DiffStats,
}

#[derive(Debug, Clone)]
struct TextChunk {
    index: usize,
    total: usize,
    left: String,
    right: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffChunk {
    pub index: usize,
    pub total: usize,
    pub items: Vec<DiffItem>,
    pub partial_stats: DiffStats,
}

// WASM导出
#[wasm_bindgen]
pub struct WasmDiffEngine {
    engine: DiffEngine,
}

#[wasm_bindgen]
impl WasmDiffEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(options_json: &str) -> Result<WasmDiffEngine, JsValue> {
        let options: DiffOptions = serde_json::from_str(options_json)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
        Ok(WasmDiffEngine {
            engine: DiffEngine::new(options),
        })
    }
    
    #[wasm_bindgen]
    pub fn compute_diff(&self, left: &str, right: &str) -> Result<String, JsValue> {
        let result = self.engine.compute_diff(left, right);
        serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic_diff() {
        let options = DiffOptions {
            ignore_case: false,
            ignore_whitespace: false,
            ignore_punctuation: false,
            split_by_paragraph: false,
            split_by_sentence: false,
            use_web_worker: false,
        };
        
        let engine = DiffEngine::new(options);
        let result = engine.compute_diff("hello world", "hello rust");
        
        assert!(result.stats.total_changes > 0);
        assert!(result.stats.similarity < 100.0);
    }
    
    #[test]
    fn test_chinese_diff() {
        let options = DiffOptions {
            ignore_case: false,
            ignore_whitespace: false,
            ignore_punctuation: false,
            split_by_paragraph: false,
            split_by_sentence: true,
            use_web_worker: false,
        };
        
        let engine = DiffEngine::new(options);
        let result = engine.compute_diff(
            "这是第一段。这是第二段。",
            "这是第一段。这是修改后的第二段。"
        );
        
        assert_eq!(result.stats.modifications, 1);
    }
}