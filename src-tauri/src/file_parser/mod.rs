// 文件解析模块
use std::fs::File;
use std::io::Read;
use std::path::Path;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ParseError {
    #[error("不支持的文件格式: {0}")]
    UnsupportedFormat(String),
    
    #[error("文件读取失败: {0}")]
    ReadError(#[from] std::io::Error),
    
    #[error("解析失败: {0}")]
    ParseFailed(String),
    
    #[error("文件过大: {0} MB (最大: {1} MB)")]
    FileTooLarge(usize, usize),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedDocument {
    pub format: DocumentFormat,
    pub content: String,
    pub metadata: DocumentMetadata,
    pub styles: Option<Vec<StyleInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DocumentFormat {
    PlainText,
    Docx,
    Pdf,
    Odt,
    Rtf,
    Html,
    Markdown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub created_date: Option<String>,
    pub modified_date: Option<String>,
    pub word_count: usize,
    pub page_count: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StyleInfo {
    pub start: usize,
    pub end: usize,
    pub style_type: StyleType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StyleType {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Heading(u8),
    Link(String),
}

/// 文件解析器主接口
pub struct FileParser {
    max_file_size_mb: usize,
}

impl FileParser {
    pub fn new() -> Self {
        Self {
            max_file_size_mb: 50, // 默认50MB限制
        }
    }
    
    pub fn with_max_size(max_size_mb: usize) -> Self {
        Self {
            max_file_size_mb: max_size_mb,
        }
    }
    
    /// 解析文件
    pub async fn parse_file(&self, file_path: &Path) -> Result<ParsedDocument, ParseError> {
        // 检查文件大小
        let metadata = std::fs::metadata(file_path)?;
        let file_size_mb = metadata.len() as usize / (1024 * 1024);
        
        if file_size_mb > self.max_file_size_mb {
            return Err(ParseError::FileTooLarge(file_size_mb, self.max_file_size_mb));
        }
        
        // 根据扩展名选择解析器
        let extension = file_path
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();
        
        match extension.as_str() {
            "txt" | "text" => self.parse_text_file(file_path).await,
            "docx" => self.parse_docx_file(file_path).await,
            "pdf" => self.parse_pdf_file(file_path).await,
            "odt" => self.parse_odt_file(file_path).await,
            "rtf" => self.parse_rtf_file(file_path).await,
            "html" | "htm" => self.parse_html_file(file_path).await,
            "md" | "markdown" => self.parse_markdown_file(file_path).await,
            _ => Err(ParseError::UnsupportedFormat(extension)),
        }
    }
    
    /// 解析纯文本文件
    async fn parse_text_file(&self, file_path: &Path) -> Result<ParsedDocument, ParseError> {
        let mut file = File::open(file_path)?;
        let mut content = String::new();
        file.read_to_string(&mut content)?;
        
        let word_count = content.split_whitespace().count();
        
        Ok(ParsedDocument {
            format: DocumentFormat::PlainText,
            content,
            metadata: DocumentMetadata {
                title: file_path.file_name().and_then(|n| n.to_str()).map(String::from),
                author: None,
                created_date: None,
                modified_date: None,
                word_count,
                page_count: None,
            },
            styles: None,
        })
    }
    
    /// 解析DOCX文件
    async fn parse_docx_file(&self, file_path: &Path) -> Result<ParsedDocument, ParseError> {
        use docx_rs::{read_docx, Docx};
        
        let file = File::open(file_path)?;
        let mut reader = std::io::BufReader::new(file);
        
        let docx = read_docx(&mut reader)
            .map_err(|e| ParseError::ParseFailed(e.to_string()))?;
        
        // 提取文本内容
        let mut content = String::new();
        let mut styles = Vec::new();
        let mut current_pos = 0;
        
        // 遍历文档内容（简化版本）
        for child in docx.document.children.iter() {
            match child {
                docx_rs::DocumentChild::Paragraph(p) => {
                    for run in p.children.iter() {
                        if let docx_rs::ParagraphChild::Run(r) = run {
                            for text_child in r.children.iter() {
                                if let docx_rs::RunChild::Text(t) = text_child {
                                    let text = t.text.clone();
                                    let text_len = text.len();
                                    
                                    // 记录样式信息
                                    if let Some(prop) = &r.property {
                                        if prop.bold.is_some() {
                                            styles.push(StyleInfo {
                                                start: current_pos,
                                                end: current_pos + text_len,
                                                style_type: StyleType::Bold,
                                            });
                                        }
                                        if prop.italic.is_some() {
                                            styles.push(StyleInfo {
                                                start: current_pos,
                                                end: current_pos + text_len,
                                                style_type: StyleType::Italic,
                                            });
                                        }
                                        if prop.underline.is_some() {
                                            styles.push(StyleInfo {
                                                start: current_pos,
                                                end: current_pos + text_len,
                                                style_type: StyleType::Underline,
                                            });
                                        }
                                    }
                                    
                                    content.push_str(&text);
                                    current_pos += text_len;
                                }
                            }
                        }
                    }
                    content.push('\n');
                    current_pos += 1;
                }
                _ => {}
            }
        }
        
        let word_count = content.split_whitespace().count();
        
        Ok(ParsedDocument {
            format: DocumentFormat::Docx,
            content,
            metadata: DocumentMetadata {
                title: self.extract_docx_property(&docx, "title"),
                author: self.extract_docx_property(&docx, "creator"),
                created_date: self.extract_docx_property(&docx, "created"),
                modified_date: self.extract_docx_property(&docx, "modified"),
                word_count,
                page_count: None,
            },
            styles: Some(styles),
        })
    }
    
    /// 解析PDF文件
    async fn parse_pdf_file(&self, file_path: &Path) -> Result<ParsedDocument, ParseError> {
        use lopdf::{Document, Object};
        
        let doc = Document::load(file_path)
            .map_err(|e| ParseError::ParseFailed(e.to_string()))?;
        
        let mut content = String::new();
        let pages = doc.get_pages();
        
        for (_, page_id) in pages.iter() {
            let page_content = doc.extract_text(&[*page_id])
                .map_err(|e| ParseError::ParseFailed(e.to_string()))?;
            content.push_str(&page_content);
            content.push('\n');
        }
        
        let word_count = content.split_whitespace().count();
        
        // 提取PDF元数据
        let metadata = if let Ok(info) = doc.trailer.get(b"Info") {
            if let Ok(info_dict) = info.as_dict() {
                DocumentMetadata {
                    title: self.extract_pdf_string(info_dict, b"Title"),
                    author: self.extract_pdf_string(info_dict, b"Author"),
                    created_date: self.extract_pdf_string(info_dict, b"CreationDate"),
                    modified_date: self.extract_pdf_string(info_dict, b"ModDate"),
                    word_count,
                    page_count: Some(pages.len()),
                }
            } else {
                DocumentMetadata {
                    title: None,
                    author: None,
                    created_date: None,
                    modified_date: None,
                    word_count,
                    page_count: Some(pages.len()),
                }
            }
        } else {
            DocumentMetadata {
                title: None,
                author: None,
                created_date: None,
                modified_date: None,
                word_count,
                page_count: Some(pages.len()),
            }
        };
        
        Ok(ParsedDocument {
            format: DocumentFormat::Pdf,
            content,
            metadata,
            styles: None,
        })
    }
    
    /// 解析ODT文件
    async fn parse_odt_file(&self, file_path: &Path) -> Result<ParsedDocument, ParseError> {
        use zip::ZipArchive;
        
        let file = File::open(file_path)?;
        let mut archive = ZipArchive::new(file)
            .map_err(|e| ParseError::ParseFailed(e.to_string()))?;
        
        // 读取content.xml
        let mut content_file = archive.by_name("content.xml")
            .map_err(|e| ParseError::ParseFailed(e.to_string()))?;
        
        let mut xml_content = String::new();
        content_file.read_to_string(&mut xml_content)?;
        
        // 简单的XML文本提取（实际应使用XML解析器）
        let content = self.extract_text_from_xml(&xml_content);
        let word_count = content.split_whitespace().count();
        
        Ok(ParsedDocument {
            format: DocumentFormat::Odt,
            content,
            metadata: DocumentMetadata {
                title: file_path.file_name().and_then(|n| n.to_str()).map(String::from),
                author: None,
                created_date: None,
                modified_date: None,
                word_count,
                page_count: None,
            },
            styles: None,
        })
    }
    
    /// 解析RTF文件
    async fn parse_rtf_file(&self, file_path: &Path) -> Result<ParsedDocument, ParseError> {
        let mut file = File::open(file_path)?;
        let mut rtf_content = String::new();
        file.read_to_string(&mut rtf_content)?;
        
        // 简单的RTF文本提取（移除控制字符）
        let content = self.extract_text_from_rtf(&rtf_content);
        let word_count = content.split_whitespace().count();
        
        Ok(ParsedDocument {
            format: DocumentFormat::Rtf,
            content,
            metadata: DocumentMetadata {
                title: file_path.file_name().and_then(|n| n.to_str()).map(String::from),
                author: None,
                created_date: None,
                modified_date: None,
                word_count,
                page_count: None,
            },
            styles: None,
        })
    }
    
    /// 解析HTML文件
    async fn parse_html_file(&self, file_path: &Path) -> Result<ParsedDocument, ParseError> {
        use scraper::{Html, Selector};
        
        let mut file = File::open(file_path)?;
        let mut html_content = String::new();
        file.read_to_string(&mut html_content)?;
        
        let document = Html::parse_document(&html_content);
        
        // 提取文本内容
        let body_selector = Selector::parse("body").unwrap();
        let mut content = String::new();
        
        if let Some(body) = document.select(&body_selector).next() {
            content = body.text().collect::<Vec<_>>().join(" ");
        }
        
        // 提取标题
        let title_selector = Selector::parse("title").unwrap();
        let title = document.select(&title_selector)
            .next()
            .map(|el| el.text().collect::<String>());
        
        let word_count = content.split_whitespace().count();
        
        Ok(ParsedDocument {
            format: DocumentFormat::Html,
            content,
            metadata: DocumentMetadata {
                title,
                author: None,
                created_date: None,
                modified_date: None,
                word_count,
                page_count: None,
            },
            styles: None,
        })
    }
    
    /// 解析Markdown文件
    async fn parse_markdown_file(&self, file_path: &Path) -> Result<ParsedDocument, ParseError> {
        use pulldown_cmark::{Parser, Event, Tag};
        
        let mut file = File::open(file_path)?;
        let mut markdown_content = String::new();
        file.read_to_string(&mut markdown_content)?;
        
        let parser = Parser::new(&markdown_content);
        let mut content = String::new();
        let mut styles = Vec::new();
        let mut current_pos = 0;
        
        for event in parser {
            match event {
                Event::Start(tag) => {
                    match tag {
                        Tag::Heading(level, ..) => {
                            let level_num = match level {
                                pulldown_cmark::HeadingLevel::H1 => 1,
                                pulldown_cmark::HeadingLevel::H2 => 2,
                                pulldown_cmark::HeadingLevel::H3 => 3,
                                pulldown_cmark::HeadingLevel::H4 => 4,
                                pulldown_cmark::HeadingLevel::H5 => 5,
                                pulldown_cmark::HeadingLevel::H6 => 6,
                            };
                            styles.push(StyleInfo {
                                start: current_pos,
                                end: current_pos,
                                style_type: StyleType::Heading(level_num),
                            });
                        }
                        Tag::Emphasis => {
                            styles.push(StyleInfo {
                                start: current_pos,
                                end: current_pos,
                                style_type: StyleType::Italic,
                            });
                        }
                        Tag::Strong => {
                            styles.push(StyleInfo {
                                start: current_pos,
                                end: current_pos,
                                style_type: StyleType::Bold,
                            });
                        }
                        _ => {}
                    }
                }
                Event::Text(text) => {
                    content.push_str(&text);
                    current_pos += text.len();
                }
                Event::Code(code) => {
                    content.push_str(&code);
                    current_pos += code.len();
                }
                Event::SoftBreak | Event::HardBreak => {
                    content.push('\n');
                    current_pos += 1;
                }
                _ => {}
            }
        }
        
        let word_count = content.split_whitespace().count();
        
        Ok(ParsedDocument {
            format: DocumentFormat::Markdown,
            content,
            metadata: DocumentMetadata {
                title: file_path.file_name().and_then(|n| n.to_str()).map(String::from),
                author: None,
                created_date: None,
                modified_date: None,
                word_count,
                page_count: None,
            },
            styles: Some(styles),
        })
    }
    
    // 辅助函数
    fn extract_docx_property(&self, _docx: &docx_rs::Docx, _key: &str) -> Option<String> {
        // 实际实现需要访问docx的core properties
        None
    }
    
    fn extract_pdf_string(&self, dict: &lopdf::Dictionary, key: &[u8]) -> Option<String> {
        dict.get(key).ok().and_then(|obj| {
            if let Object::String(bytes, _) = obj {
                String::from_utf8(bytes.clone()).ok()
            } else {
                None
            }
        })
    }
    
    fn extract_text_from_xml(&self, xml: &str) -> String {
        // 简单的XML文本提取
        let mut result = String::new();
        let mut in_tag = false;
        
        for ch in xml.chars() {
            match ch {
                '<' => in_tag = true,
                '>' => in_tag = false,
                _ if !in_tag => result.push(ch),
                _ => {}
            }
        }
        
        result
    }
    
    fn extract_text_from_rtf(&self, rtf: &str) -> String {
        // 简单的RTF文本提取
        let mut result = String::new();
        let mut in_control = false;
        let mut brace_depth = 0;
        
        for ch in rtf.chars() {
            match ch {
                '{' => brace_depth += 1,
                '}' => brace_depth -= 1,
                '\\' if brace_depth > 0 => in_control = true,
                ' ' | '\n' | '\r' if in_control => in_control = false,
                _ if !in_control && brace_depth > 0 => result.push(ch),
                _ => {}
            }
        }
        
        result
    }
}

/// OCR接口（预留）
pub trait OcrEngine: Send + Sync {
    async fn extract_text(&self, image_path: &Path) -> Result<String, ParseError>;
}

/// Tesseract OCR实现（可选）
#[cfg(feature = "ocr")]
pub struct TesseractOcr {
    lang: String,
}

#[cfg(feature = "ocr")]
impl TesseractOcr {
    pub fn new(lang: &str) -> Self {
        Self {
            lang: lang.to_string(),
        }
    }
}

#[cfg(feature = "ocr")]
impl OcrEngine for TesseractOcr {
    async fn extract_text(&self, image_path: &Path) -> Result<String, ParseError> {
        use tesseract::Tesseract;
        
        let output = Tesseract::new()
            .map_err(|e| ParseError::ParseFailed(e.to_string()))?
            .lang(&self.lang)
            .image(image_path.to_str().unwrap())
            .map_err(|e| ParseError::ParseFailed(e.to_string()))?
            .get_text()
            .map_err(|e| ParseError::ParseFailed(e.to_string()))?;
        
        Ok(output)
    }
}