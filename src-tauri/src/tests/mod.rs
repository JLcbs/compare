#[cfg(test)]
mod diff_engine_tests {
    use super::super::diff_engine::*;
    use std::time::Duration;

    #[test]
    fn test_patience_diff_basic() {
        let engine = DiffEngine::new(DiffOptions {
            algorithm: DiffAlgorithm::Patience,
            ignore_whitespace: false,
            ignore_case: false,
            semantic_cleanup: false,
            timeout_ms: Some(5000),
        });

        let left = "Hello\nWorld\nRust";
        let right = "Hello\nBeautiful\nWorld\nRust";
        
        let result = engine.compute_diff(left, right);
        
        assert_eq!(result.stats.added_lines, 1);
        assert_eq!(result.stats.removed_lines, 0);
        assert!(result.stats.similarity_percentage > 70.0);
    }

    #[test]
    fn test_lcs_diff() {
        let engine = DiffEngine::new(DiffOptions {
            algorithm: DiffAlgorithm::LCS,
            ignore_whitespace: false,
            ignore_case: false,
            semantic_cleanup: false,
            timeout_ms: Some(5000),
        });

        let left = "ABCDGH";
        let right = "AEDFHR";
        
        let result = engine.compute_diff(left, right);
        
        assert!(result.stats.modified_lines > 0);
        assert_eq!(result.metadata.algorithm_used, "LCS");
    }

    #[test]
    fn test_chinese_text_diff() {
        let engine = DiffEngine::new(DiffOptions {
            algorithm: DiffAlgorithm::Patience,
            ignore_whitespace: false,
            ignore_case: false,
            semantic_cleanup: true,
            timeout_ms: Some(5000),
        });

        let left = "这是一段中文文本。\n包含多个句子。";
        let right = "这是一段修改后的中文文本。\n包含多个句子。";
        
        let result = engine.compute_diff(left, right);
        
        assert!(result.metadata.chinese_optimized);
        assert!(result.stats.similarity_percentage > 80.0);
    }

    #[test]
    fn test_ignore_whitespace() {
        let engine = DiffEngine::new(DiffOptions {
            algorithm: DiffAlgorithm::Patience,
            ignore_whitespace: true,
            ignore_case: false,
            semantic_cleanup: false,
            timeout_ms: Some(5000),
        });

        let left = "Hello   World";
        let right = "Hello World";
        
        let result = engine.compute_diff(left, right);
        
        assert_eq!(result.stats.similarity_percentage, 100.0);
    }

    #[test]
    fn test_ignore_case() {
        let engine = DiffEngine::new(DiffOptions {
            algorithm: DiffAlgorithm::Patience,
            ignore_whitespace: false,
            ignore_case: true,
            semantic_cleanup: false,
            timeout_ms: Some(5000),
        });

        let left = "Hello World";
        let right = "hello world";
        
        let result = engine.compute_diff(left, right);
        
        assert_eq!(result.stats.similarity_percentage, 100.0);
    }

    #[test]
    fn test_large_file_performance() {
        let engine = DiffEngine::new(DiffOptions {
            algorithm: DiffAlgorithm::Patience,
            ignore_whitespace: false,
            ignore_case: false,
            semantic_cleanup: false,
            timeout_ms: Some(10000),
        });

        // Generate large text
        let left: String = (0..10000).map(|i| format!("Line {}\n", i)).collect();
        let mut right = left.clone();
        right.push_str("Additional line\n");
        
        let start = std::time::Instant::now();
        let result = engine.compute_diff(&left, &right);
        let duration = start.elapsed();
        
        assert!(duration < Duration::from_secs(5), "Diff took too long: {:?}", duration);
        assert_eq!(result.stats.added_lines, 1);
    }
}

#[cfg(test)]
mod file_parser_tests {
    use super::super::file_parser::*;
    use std::path::Path;
    use tempfile::TempDir;
    use std::fs;

    #[tokio::test]
    async fn test_parse_text_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        fs::write(&file_path, "Hello, World!").unwrap();

        let parser = FileParser::new(50);
        let result = parser.parse_file(&file_path).await.unwrap();
        
        assert_eq!(result.content, "Hello, World!");
        assert_eq!(result.format, FileFormat::PlainText);
        assert_eq!(result.metadata.char_count, 13);
        assert_eq!(result.metadata.word_count, 2);
        assert_eq!(result.metadata.line_count, 1);
    }

    #[tokio::test]
    async fn test_parse_markdown_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.md");
        fs::write(&file_path, "# Title\n\nParagraph with **bold** text.").unwrap();

        let parser = FileParser::new(50);
        let result = parser.parse_file(&file_path).await.unwrap();
        
        assert_eq!(result.format, FileFormat::Markdown);
        assert!(result.content.contains("Title"));
        assert!(result.content.contains("Paragraph"));
    }

    #[tokio::test]
    async fn test_parse_html_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.html");
        fs::write(&file_path, "<html><body><h1>Title</h1><p>Content</p></body></html>").unwrap();

        let parser = FileParser::new(50);
        let result = parser.parse_file(&file_path).await.unwrap();
        
        assert_eq!(result.format, FileFormat::Html);
        assert!(result.content.contains("Title"));
        assert!(result.content.contains("Content"));
    }

    #[tokio::test]
    async fn test_file_size_limit() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("large.txt");
        
        // Create a file larger than 1MB (our test limit)
        let large_content = "a".repeat(2 * 1024 * 1024); // 2MB
        fs::write(&file_path, large_content).unwrap();

        let parser = FileParser::new(1); // 1MB limit
        let result = parser.parse_file(&file_path).await;
        
        assert!(result.is_err());
        if let Err(ParseError::FileTooLarge { size_mb, max_mb }) = result {
            assert!(size_mb > max_mb);
        } else {
            panic!("Expected FileTooLarge error");
        }
    }

    #[tokio::test]
    async fn test_unsupported_format() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.xyz");
        fs::write(&file_path, "content").unwrap();

        let parser = FileParser::new(50);
        let result = parser.parse_file(&file_path).await;
        
        // Should treat unknown format as plain text
        assert!(result.is_ok());
        if let Ok(doc) = result {
            assert_eq!(doc.format, FileFormat::PlainText);
        }
    }
}

#[cfg(test)]
mod exporter_tests {
    use super::super::exporter::*;
    use super::super::diff_engine::{DiffItem, DiffStats};
    use tempfile::TempDir;
    use std::path::Path;

    #[tokio::test]
    async fn test_export_html() {
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("output.html");
        
        let items = vec![
            DiffItem {
                item_type: DiffItemType::Unchanged,
                content: "Same line".to_string(),
                line_number_left: Some(1),
                line_number_right: Some(1),
                similarity: Some(100.0),
            },
            DiffItem {
                item_type: DiffItemType::Added,
                content: "New line".to_string(),
                line_number_left: None,
                line_number_right: Some(2),
                similarity: None,
            },
        ];
        
        let stats = DiffStats {
            total_lines_left: 1,
            total_lines_right: 2,
            added_lines: 1,
            removed_lines: 0,
            modified_lines: 0,
            unchanged_lines: 1,
            similarity_percentage: 50.0,
        };
        
        let exporter = Exporter::new(ExportOptions {
            include_stats: true,
            include_metadata: true,
            highlight_changes: true,
            side_by_side: false,
        });
        
        exporter.export(&items, &stats, &output_path, ExportFormat::Html).await.unwrap();
        
        assert!(output_path.exists());
        let content = std::fs::read_to_string(&output_path).unwrap();
        assert!(content.contains("<html"));
        assert!(content.contains("Same line"));
        assert!(content.contains("New line"));
    }

    #[tokio::test]
    async fn test_export_markdown() {
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("output.md");
        
        let items = vec![
            DiffItem {
                item_type: DiffItemType::Removed,
                content: "Removed line".to_string(),
                line_number_left: Some(1),
                line_number_right: None,
                similarity: None,
            },
        ];
        
        let stats = DiffStats {
            total_lines_left: 1,
            total_lines_right: 0,
            added_lines: 0,
            removed_lines: 1,
            modified_lines: 0,
            unchanged_lines: 0,
            similarity_percentage: 0.0,
        };
        
        let exporter = Exporter::new(ExportOptions::default());
        
        exporter.export(&items, &stats, &output_path, ExportFormat::Markdown).await.unwrap();
        
        assert!(output_path.exists());
        let content = std::fs::read_to_string(&output_path).unwrap();
        assert!(content.contains("# Text Comparison Report"));
        assert!(content.contains("Removed line"));
    }

    #[tokio::test]
    async fn test_export_json() {
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("output.json");
        
        let items = vec![
            DiffItem {
                item_type: DiffItemType::Modified,
                content: "Modified line".to_string(),
                line_number_left: Some(1),
                line_number_right: Some(1),
                similarity: Some(75.0),
            },
        ];
        
        let stats = DiffStats {
            total_lines_left: 1,
            total_lines_right: 1,
            added_lines: 0,
            removed_lines: 0,
            modified_lines: 1,
            unchanged_lines: 0,
            similarity_percentage: 75.0,
        };
        
        let exporter = Exporter::new(ExportOptions::default());
        
        exporter.export(&items, &stats, &output_path, ExportFormat::Json).await.unwrap();
        
        assert!(output_path.exists());
        let content = std::fs::read_to_string(&output_path).unwrap();
        let json: serde_json::Value = serde_json::from_str(&content).unwrap();
        
        assert_eq!(json["stats"]["modified_lines"], 1);
        assert_eq!(json["items"][0]["content"], "Modified line");
    }
}