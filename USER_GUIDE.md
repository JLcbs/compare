# 📖 Text Diff Desktop - User Guide

## 🌟 Quick Start

### Installation
1. Download the installer for your platform from [Releases](https://github.com/yourusername/text-diff-desktop/releases)
2. Run the installer and follow the setup wizard
3. Launch Text Diff Desktop from your applications menu

### First Comparison
1. **Open Files**: Click "Open Left File" and "Open Right File" buttons
2. **Or Paste Text**: Use "Paste Left" and "Paste Right" for clipboard content
3. **View Results**: The comparison appears automatically
4. **Export**: Click "Export" to save the comparison report

## 🎯 Core Features

### 1. Text Input Methods

#### File Opening
- **Supported Formats**: TXT, MD, DOCX, PDF, ODT, RTF, HTML, JSON, XML
- **Drag & Drop**: Drag files directly onto the input panels
- **Recent Files**: Access recently opened files from the History tab

#### Direct Input
- **Paste**: Ctrl/Cmd+V or click "Paste" buttons
- **Type**: Enter text directly in the input panels
- **Edit**: Modify text in real-time with instant comparison updates

### 2. Comparison Views

#### Side-by-Side View
- Traditional dual-pane layout
- Synchronized scrolling
- Line number display
- Color-coded differences

#### Unified View
- Single-pane with inline changes
- Compact representation
- Ideal for reviewing changes

#### Inline View
- Changes highlighted within context
- Best for minor modifications
- Character-level precision

### 3. Diff Algorithms

#### Patience Diff (Default)
- Optimized for structured text
- Handles moved blocks well
- Best for code and documentation

#### LCS (Longest Common Subsequence)
- Character-level precision
- Minimal diff calculation
- Good for small texts

#### Chinese Optimization
- Automatic detection of Chinese text
- Sentence-based segmentation
- Punctuation-aware comparison

## 🔧 Advanced Features

### Batch Comparison

1. **Switch to Batch Tab**: Click the "Batch" tab
2. **Add Files**: 
   - Click "Add Files" to select multiple file pairs
   - Click "Add Folder" to compare entire directories
3. **Start Processing**: Click "Start" to begin batch comparison
4. **View Results**: Click "View" on any completed comparison
5. **Export All**: Export all results to a single report

### Search and Navigation

- **Search**: Ctrl/Cmd+F to find text in comparisons
- **Next/Previous**: Navigate between differences
- **Jump to Line**: Go to specific line numbers
- **Minimap**: Overview of entire document

### Customization Options

#### Comparison Settings
- **Ignore Whitespace**: Skip space/tab differences
- **Ignore Case**: Case-insensitive comparison
- **Semantic Cleanup**: Improve readability of diffs
- **Timeout**: Set maximum processing time

#### Display Settings
- **Font Size**: Zoom in/out with Ctrl/Cmd+Plus/Minus
- **Word Wrap**: Toggle text wrapping
- **Theme**: Light/Dark mode (Ctrl/Cmd+D)
- **Syntax Highlighting**: Auto-detect for code files

## 📊 Export Options

### HTML Report
- Interactive web page
- Preserves colors and formatting
- Includes statistics and metadata
- Shareable via email/web

### PDF Document
- Print-ready format
- Professional appearance
- Page breaks and headers
- Suitable for archiving

### Word Document (DOCX)
- Editable format
- Track changes compatible
- Comments and annotations
- Corporate documentation

### Markdown
- Plain text format
- Version control friendly
- GitHub/GitLab compatible
- Technical documentation

## ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|--------------|-------|
| Open File | Ctrl+O | Cmd+O |
| Save/Export | Ctrl+S | Cmd+S |
| Copy | Ctrl+C | Cmd+C |
| Paste | Ctrl+V | Cmd+V |
| Find | Ctrl+F | Cmd+F |
| Toggle Theme | Ctrl+D | Cmd+D |
| Zoom In | Ctrl+Plus | Cmd+Plus |
| Zoom Out | Ctrl+Minus | Cmd+Minus |
| Quit | Ctrl+Q | Cmd+Q |

## 🌐 Language Support

### Interface Languages
- English (EN)
- Simplified Chinese (简体中文)
- More languages coming soon

### Text Encoding
- UTF-8 (default)
- UTF-16
- GBK/GB2312 (Chinese)
- Auto-detection

## 🔒 Security & Privacy

### Offline Mode
- All processing done locally
- No data sent to servers
- Complete privacy protection

### Data Handling
- Files processed in memory
- No permanent storage
- Cache cleared on exit
- Optional encryption

## 🎆 Use Cases

### 1. Document Review
**Scenario**: Reviewing contract changes
1. Open original contract (left)
2. Open revised contract (right)
3. Review highlighted changes
4. Export to PDF for records

### 2. Code Comparison
**Scenario**: Comparing code versions
1. Open old version (left)
2. Open new version (right)
3. Enable syntax highlighting
4. Review line-by-line changes

### 3. Translation Verification
**Scenario**: Checking translation accuracy
1. Load source text (left)
2. Load translation (right)
3. Use side-by-side view
4. Export bilingual report

### 4. Content Audit
**Scenario**: Website content updates
1. Use batch mode
2. Add all HTML files
3. Process comparisons
4. Generate audit report

### 5. Academic Writing
**Scenario**: Thesis revision tracking
1. Import original chapter
2. Import revised chapter
3. Review supervisor changes
4. Export with annotations

## 🐛 Troubleshooting

### Common Issues

**Q: Large files load slowly**
A: Enable chunked processing in Settings > Performance

**Q: Chinese text not comparing correctly**
A: Ensure UTF-8 encoding and Chinese optimization is enabled

**Q: Export fails**
A: Check disk space and file permissions

**Q: Synchronized scrolling not working**
A: Toggle sync button in toolbar

### Performance Tips

1. **For Large Files (>10MB)**:
   - Increase timeout in settings
   - Use streaming mode
   - Consider splitting files

2. **For Many Files**:
   - Use batch mode
   - Process in smaller groups
   - Export results incrementally

3. **For Complex Documents**:
   - Pre-process to plain text
   - Remove formatting
   - Use appropriate algorithm

## 📧 Support

### Getting Help
- **Documentation**: https://docs.textdiff.com
- **GitHub Issues**: Report bugs and request features
- **Email Support**: support@textdiff.com
- **Community Forum**: https://forum.textdiff.com

### Feedback
We value your feedback! Please:
- Rate us on your platform's app store
- Share feature requests on GitHub
- Join our beta testing program

## 🔄 Updates

### Auto-Update
- Enabled by default
- Notifications for new versions
- One-click installation
- Changelog display

### Manual Update
1. Check current version in Settings > About
2. Visit releases page
3. Download latest version
4. Run installer

---

*Thank you for using Text Diff Desktop! We're committed to making text comparison fast, accurate, and easy.*