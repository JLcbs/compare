// 导出模块
use std::fs::File;
use std::io::Write;
use std::path::Path;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use crate::diff_engine::{DiffItem, DiffStats, DiffType};

#[derive(Error, Debug)]
pub enum ExportError {
    #[error("导出失败: {0}")]
    ExportFailed(String),
    
    #[error("文件写入失败: {0}")]
    WriteError(#[from] std::io::Error),
    
    #[error("模板渲染失败: {0}")]
    TemplateError(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportOptions {
    pub format: ExportFormat,
    pub include_stats: bool,
    pub include_timestamp: bool,
    pub include_metadata: bool,
    pub template: Option<String>,
    pub styles: ExportStyles,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportFormat {
    Html,
    Pdf,
    Docx,
    Text,
    Json,
    Markdown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportStyles {
    pub add_color: String,
    pub remove_color: String,
    pub modify_color: String,
    pub font_family: String,
    pub font_size: String,
}

impl Default for ExportStyles {
    fn default() -> Self {
        Self {
            add_color: "#22c55e",
            remove_color: "#ef4444",
            modify_color: "#3b82f6",
            font_family: "system-ui, -apple-system, sans-serif",
            font_size: "14px",
        }
    }
}

/// 导出器主接口
pub struct Exporter {
    options: ExportOptions,
}

impl Exporter {
    pub fn new(options: ExportOptions) -> Self {
        Self { options }
    }
    
    /// 导出差异报告
    pub async fn export(
        &self,
        items: &[DiffItem],
        stats: &DiffStats,
        output_path: &Path,
    ) -> Result<(), ExportError> {
        match self.options.format {
            ExportFormat::Html => self.export_html(items, stats, output_path).await,
            ExportFormat::Pdf => self.export_pdf(items, stats, output_path).await,
            ExportFormat::Docx => self.export_docx(items, stats, output_path).await,
            ExportFormat::Text => self.export_text(items, stats, output_path).await,
            ExportFormat::Json => self.export_json(items, stats, output_path).await,
            ExportFormat::Markdown => self.export_markdown(items, stats, output_path).await,
        }
    }
    
    /// 导出为HTML
    async fn export_html(
        &self,
        items: &[DiffItem],
        stats: &DiffStats,
        output_path: &Path,
    ) -> Result<(), ExportError> {
        let mut html = String::new();
        
        // HTML头部
        html.push_str(&format!(r#"<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文本对比报告</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: {};
            font-size: {};
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
        }}
        
        .header h1 {{
            font-size: 28px;
            margin-bottom: 10px;
        }}
        
        .timestamp {{
            opacity: 0.9;
            font-size: 14px;
        }}
        
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #fafafa;
            border-bottom: 1px solid #e0e0e0;
        }}
        
        .stat-item {{
            text-align: center;
        }}
        
        .stat-value {{
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }}
        
        .stat-label {{
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-top: 5px;
        }}
        
        .content {{
            padding: 30px;
        }}
        
        .diff-item {{
            margin: 10px 0;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
        }}
        
        .diff-add {{
            background: #e6ffed;
            border-left: 3px solid {};
        }}
        
        .diff-remove {{
            background: #ffebe9;
            border-left: 3px solid {};
            text-decoration: line-through;
            opacity: 0.8;
        }}
        
        .diff-modify {{
            background: #e0f2fe;
            border-left: 3px solid {};
        }}
        
        .diff-equal {{
            color: #666;
            font-size: 12px;
            opacity: 0.6;
        }}
        
        .line-number {{
            display: inline-block;
            width: 50px;
            color: #999;
            text-align: right;
            margin-right: 10px;
            user-select: none;
        }}
        
        .footer {{
            padding: 20px 30px;
            background: #fafafa;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 12px;
        }}
        
        @media print {{
            body {{
                background: white;
                padding: 0;
            }}
            
            .container {{
                box-shadow: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 文本对比报告</h1>"#,
            self.options.styles.font_family,
            self.options.styles.font_size,
            self.options.styles.add_color,
            self.options.styles.remove_color,
            self.options.styles.modify_color
        ));
        
        // 时间戳
        if self.options.include_timestamp {
            let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
            html.push_str(&format!(r#"
            <div class="timestamp">生成时间: {}</div>"#, timestamp));
        }
        
        html.push_str(r#"
        </div>"#);
        
        // 统计信息
        if self.options.include_stats {
            html.push_str(&format!(r#"
        <div class="stats">
            <div class="stat-item">
                <div class="stat-value">{}</div>
                <div class="stat-label">总变更</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">{}</div>
                <div class="stat-label">新增</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">{}</div>
                <div class="stat-label">删除</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">{}</div>
                <div class="stat-label">修改</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">{:.1}%</div>
                <div class="stat-label">相似度</div>
            </div>
        </div>"#,
                stats.total_changes,
                stats.additions,
                stats.deletions,
                stats.modifications,
                stats.similarity
            ));
        }
        
        // 差异内容
        html.push_str(r#"
        <div class="content">"#);
        
        for item in items {
            let class = match item.diff_type {
                DiffType::Add => "diff-add",
                DiffType::Remove => "diff-remove",
                DiffType::Modify => "diff-modify",
                DiffType::Equal => "diff-equal",
            };
            
            let line_number = item.line_number
                .map(|n| format!(r#"<span class="line-number">{}</span>"#, n))
                .unwrap_or_default();
            
            let content = html_escape::encode_text(&item.content);
            
            html.push_str(&format!(r#"
            <div class="diff-item {}">
                {}{}
            </div>"#, class, line_number, content));
        }
        
        html.push_str(r#"
        </div>
        <div class="footer">
            <p>Generated by Text Diff Desktop | Powered by Tauri</p>
        </div>
    </div>
</body>
</html>"#);
        
        // 写入文件
        let mut file = File::create(output_path)?;
        file.write_all(html.as_bytes())?;
        
        Ok(())
    }
    
    /// 导出为PDF
    async fn export_pdf(
        &self,
        items: &[DiffItem],
        stats: &DiffStats,
        output_path: &Path,
    ) -> Result<(), ExportError> {
        // 先生成HTML
        let html_path = output_path.with_extension("html");
        self.export_html(items, stats, &html_path).await?;
        
        // 使用wkhtmltopdf或headless chrome转换
        #[cfg(feature = "pdf")]
        {
            use headless_chrome::{Browser, LaunchOptionsBuilder};
            
            let browser = Browser::new(
                LaunchOptionsBuilder::default()
                    .build()
                    .map_err(|e| ExportError::ExportFailed(e.to_string()))?
            ).map_err(|e| ExportError::ExportFailed(e.to_string()))?;
            
            let tab = browser.wait_for_initial_tab()
                .map_err(|e| ExportError::ExportFailed(e.to_string()))?;
            
            tab.navigate_to(&format!("file://{}", html_path.display()))
                .map_err(|e| ExportError::ExportFailed(e.to_string()))?;
            
            tab.wait_until_navigated()
                .map_err(|e| ExportError::ExportFailed(e.to_string()))?;
            
            let pdf_data = tab.print_to_pdf(None)
                .map_err(|e| ExportError::ExportFailed(e.to_string()))?;
            
            let mut file = File::create(output_path)?;
            file.write_all(&pdf_data)?;
            
            // 清理临时HTML文件
            std::fs::remove_file(html_path).ok();
        }
        
        Ok(())
    }
    
    /// 导出为DOCX（带修订痕迹）
    async fn export_docx(
        &self,
        items: &[DiffItem],
        _stats: &DiffStats,
        output_path: &Path,
    ) -> Result<(), ExportError> {
        use docx_rs::*;
        
        let mut docx = Docx::new();
        
        // 添加标题
        let title = Paragraph::new()
            .add_run(Run::new().add_text("文本对比报告").size(32).bold())
            .align(AlignmentType::Center);
        
        docx = docx.add_paragraph(title);
        
        // 添加时间戳
        if self.options.include_timestamp {
            let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
            let timestamp_para = Paragraph::new()
                .add_run(Run::new().add_text(&format!("生成时间: {}", timestamp)).size(20))
                .align(AlignmentType::Center);
            
            docx = docx.add_paragraph(timestamp_para);
        }
        
        // 添加空行
        docx = docx.add_paragraph(Paragraph::new());
        
        // 添加差异内容
        for item in items {
            let mut paragraph = Paragraph::new();
            
            // 添加行号
            if let Some(line_num) = item.line_number {
                paragraph = paragraph.add_run(
                    Run::new()
                        .add_text(&format!("{}: ", line_num))
                        .color("666666")
                );
            }
            
            // 根据差异类型设置样式
            let run = match item.diff_type {
                DiffType::Add => {
                    Run::new()
                        .add_text(&item.content)
                        .color("22c55e")
                        .underline("single")
                }
                DiffType::Remove => {
                    Run::new()
                        .add_text(&item.content)
                        .color("ef4444")
                        .strike()
                }
                DiffType::Modify => {
                    let mut run = Run::new();
                    
                    // 显示原始内容（删除线）
                    if let Some(ref original) = item.original_content {
                        run = run.add_text(original)
                            .color("ef4444")
                            .strike()
                            .add_text(" → ");
                    }
                    
                    // 显示新内容
                    run.add_text(&item.content)
                        .color("3b82f6")
                        .underline("single")
                }
                DiffType::Equal => {
                    // 相同内容使用较小字体和灰色
                    Run::new()
                        .add_text(&item.content)
                        .color("999999")
                        .size(20)
                }
            };
            
            paragraph = paragraph.add_run(run);
            docx = docx.add_paragraph(paragraph);
        }
        
        // 保存文档
        let file = File::create(output_path)?;
        docx.build().pack(file)
            .map_err(|e| ExportError::ExportFailed(e.to_string()))?;
        
        Ok(())
    }
    
    /// 导出为纯文本
    async fn export_text(
        &self,
        items: &[DiffItem],
        stats: &DiffStats,
        output_path: &Path,
    ) -> Result<(), ExportError> {
        let mut text = String::new();
        
        text.push_str("文本对比报告\n");
        text.push_str(&"=".repeat(50));
        text.push('\n');
        
        if self.options.include_timestamp {
            let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
            text.push_str(&format!("生成时间: {}\n\n", timestamp));
        }
        
        if self.options.include_stats {
            text.push_str("统计信息\n");
            text.push_str(&"-".repeat(30));
            text.push('\n');
            text.push_str(&format!("总变更数: {}\n", stats.total_changes));
            text.push_str(&format!("新增: {} 项, {} 词\n", stats.additions, stats.added_words));
            text.push_str(&format!("删除: {} 项, {} 词\n", stats.deletions, stats.deleted_words));
            text.push_str(&format!("修改: {} 项\n", stats.modifications));
            text.push_str(&format!("相似度: {:.2}%\n\n", stats.similarity));
        }
        
        text.push_str("详细差异\n");
        text.push_str(&"-".repeat(30));
        text.push('\n');
        
        let mut index = 0;
        for item in items {
            if matches!(item.diff_type, DiffType::Equal) {
                continue;
            }
            
            index += 1;
            let line_info = item.line_number
                .map(|n| format!("[行 {}] ", n))
                .unwrap_or_default();
            
            let type_label = match item.diff_type {
                DiffType::Add => "[新增]",
                DiffType::Remove => "[删除]",
                DiffType::Modify => "[修改]",
                DiffType::Equal => "[相同]",
            };
            
            text.push_str(&format!("{}. {}{}\n", index, line_info, type_label));
            
            if item.diff_type == DiffType::Modify {
                if let Some(ref original) = item.original_content {
                    text.push_str(&format!("   原文: {}\n", original));
                    text.push_str(&format!("   现文: {}\n", item.content));
                }
            } else {
                text.push_str(&format!("   内容: {}\n", item.content));
            }
            
            text.push('\n');
        }
        
        let mut file = File::create(output_path)?;
        file.write_all(text.as_bytes())?;
        
        Ok(())
    }
    
    /// 导出为JSON
    async fn export_json(
        &self,
        items: &[DiffItem],
        stats: &DiffStats,
        output_path: &Path,
    ) -> Result<(), ExportError> {
        #[derive(Serialize)]
        struct JsonExport {
            metadata: Metadata,
            stats: Option<DiffStats>,
            differences: Vec<DiffItem>,
        }
        
        #[derive(Serialize)]
        struct Metadata {
            timestamp: Option<String>,
            version: String,
            generator: String,
        }
        
        let export = JsonExport {
            metadata: Metadata {
                timestamp: if self.options.include_timestamp {
                    Some(chrono::Local::now().to_rfc3339())
                } else {
                    None
                },
                version: "1.0.0".to_string(),
                generator: "Text Diff Desktop".to_string(),
            },
            stats: if self.options.include_stats {
                Some(stats.clone())
            } else {
                None
            },
            differences: items.iter()
                .filter(|item| !matches!(item.diff_type, DiffType::Equal))
                .cloned()
                .collect(),
        };
        
        let json = serde_json::to_string_pretty(&export)
            .map_err(|e| ExportError::ExportFailed(e.to_string()))?;
        
        let mut file = File::create(output_path)?;
        file.write_all(json.as_bytes())?;
        
        Ok(())
    }
    
    /// 导出为Markdown
    async fn export_markdown(
        &self,
        items: &[DiffItem],
        stats: &DiffStats,
        output_path: &Path,
    ) -> Result<(), ExportError> {
        let mut markdown = String::new();
        
        markdown.push_str("# 文本对比报告\n\n");
        
        if self.options.include_timestamp {
            let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
            markdown.push_str(&format!("*生成时间: {}*\n\n", timestamp));
        }
        
        if self.options.include_stats {
            markdown.push_str("## 统计信息\n\n");
            markdown.push_str("| 指标 | 数值 |\n");
            markdown.push_str("|------|------|\n");
            markdown.push_str(&format!("| 总变更数 | {} |\n", stats.total_changes));
            markdown.push_str(&format!("| 新增 | {} 项 ({} 词) |\n", stats.additions, stats.added_words));
            markdown.push_str(&format!("| 删除 | {} 项 ({} 词) |\n", stats.deletions, stats.deleted_words));
            markdown.push_str(&format!("| 修改 | {} 项 |\n", stats.modifications));
            markdown.push_str(&format!("| 相似度 | {:.2}% |\n\n", stats.similarity));
        }
        
        markdown.push_str("## 详细差异\n\n");
        
        for item in items {
            if matches!(item.diff_type, DiffType::Equal) {
                continue;
            }
            
            let type_emoji = match item.diff_type {
                DiffType::Add => "➕",
                DiffType::Remove => "➖",
                DiffType::Modify => "✏️",
                DiffType::Equal => "✅",
            };
            
            let line_info = item.line_number
                .map(|n| format!(" (行 {})", n))
                .unwrap_or_default();
            
            markdown.push_str(&format!("### {} {}{}\n\n", 
                type_emoji,
                match item.diff_type {
                    DiffType::Add => "新增",
                    DiffType::Remove => "删除",
                    DiffType::Modify => "修改",
                    DiffType::Equal => "相同",
                },
                line_info
            ));
            
            if item.diff_type == DiffType::Modify {
                if let Some(ref original) = item.original_content {
                    markdown.push_str(&format!("**原文:**\n```\n{}\n```\n\n", original));
                    markdown.push_str(&format!("**现文:**\n```\n{}\n```\n\n", item.content));
                }
            } else {
                markdown.push_str(&format!("```\n{}\n```\n\n", item.content));
            }
        }
        
        let mut file = File::create(output_path)?;
        file.write_all(markdown.as_bytes())?;
        
        Ok(())
    }
}