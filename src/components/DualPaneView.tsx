import React, { useState, useRef, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import MonacoEditor from '@monaco-editor/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { FileText, Copy, Download, Search, ZoomIn, ZoomOut, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface DiffResult {
  items: DiffItem[];
  stats: DiffStats;
  metadata: DiffMetadata;
}

interface DiffItem {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  content: string;
  line_number_left?: number;
  line_number_right?: number;
  similarity?: number;
}

interface DiffStats {
  total_lines_left: number;
  total_lines_right: number;
  added_lines: number;
  removed_lines: number;
  modified_lines: number;
  unchanged_lines: number;
  similarity_percentage: number;
}

interface DiffMetadata {
  algorithm_used: string;
  comparison_time_ms: number;
  chinese_optimized: boolean;
}

interface DualPaneViewProps {
  leftContent: string;
  rightContent: string;
  leftTitle?: string;
  rightTitle?: string;
  onContentChange?: (side: 'left' | 'right', content: string) => void;
}

export const DualPaneView: React.FC<DualPaneViewProps> = ({
  leftContent,
  rightContent,
  leftTitle = 'Original',
  rightTitle = 'Modified',
  onContentChange
}) => {
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified' | 'inline'>('side-by-side');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(false);
  const [highlightMode, setHighlightMode] = useState<'char' | 'word' | 'line'>('word');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isComparing, setIsComparing] = useState(false);
  const leftEditorRef = useRef<any>(null);
  const rightEditorRef = useRef<any>(null);

  // Synchronized scrolling
  const handleScroll = useCallback((side: 'left' | 'right') => {
    if (viewMode !== 'side-by-side') return;
    
    const sourceEditor = side === 'left' ? leftEditorRef.current : rightEditorRef.current;
    const targetEditor = side === 'left' ? rightEditorRef.current : leftEditorRef.current;
    
    if (sourceEditor && targetEditor) {
      const scrollTop = sourceEditor.getScrollTop();
      targetEditor.setScrollTop(scrollTop);
    }
  }, [viewMode]);

  // Compute diff when content changes
  useEffect(() => {
    const computeDiff = async () => {
      if (!leftContent && !rightContent) return;
      
      setIsComparing(true);
      try {
        const result = await invoke<DiffResult>('compute_diff', {
          leftText: leftContent,
          rightText: rightContent,
          options: {
            algorithm: 'patience',
            ignore_whitespace: false,
            ignore_case: false,
            semantic_cleanup: true,
            timeout_ms: 5000
          }
        });
        setDiffResult(result);
      } catch (error) {
        console.error('Failed to compute diff:', error);
      } finally {
        setIsComparing(false);
      }
    };

    const debounceTimer = setTimeout(computeDiff, 300);
    return () => clearTimeout(debounceTimer);
  }, [leftContent, rightContent]);

  // Search functionality
  const handleSearch = useCallback(() => {
    if (!searchTerm) return;
    
    const matches: Array<{ line: number; column: number; side: 'left' | 'right' }> = [];
    
    // Search in both editors
    if (leftEditorRef.current) {
      const model = leftEditorRef.current.getModel();
      const searchResults = model.findMatches(searchTerm, true, false, false, null, true);
      matches.push(...searchResults.map((r: any) => ({ 
        line: r.range.startLineNumber, 
        column: r.range.startColumn, 
        side: 'left' as const 
      })));
    }
    
    if (rightEditorRef.current) {
      const model = rightEditorRef.current.getModel();
      const searchResults = model.findMatches(searchTerm, true, false, false, null, true);
      matches.push(...searchResults.map((r: any) => ({ 
        line: r.range.startLineNumber, 
        column: r.range.startColumn, 
        side: 'right' as const 
      })));
    }
    
    setTotalMatches(matches.length);
    if (matches.length > 0) {
      setCurrentMatch(0);
      navigateToMatch(matches[0]);
    }
  }, [searchTerm]);

  const navigateToMatch = (match: { line: number; column: number; side: 'left' | 'right' }) => {
    const editor = match.side === 'left' ? leftEditorRef.current : rightEditorRef.current;
    if (editor) {
      editor.revealLineInCenter(match.line);
      editor.setPosition({ lineNumber: match.line, column: match.column });
    }
  };

  const handleExport = async (format: 'html' | 'pdf' | 'docx' | 'markdown') => {
    if (!diffResult) return;
    
    try {
      await invoke('export_diff', {
        diffResult,
        format,
        outputPath: `comparison_${Date.now()}.${format}`
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const renderDiffStats = () => {
    if (!diffResult) return null;
    
    const { stats } = diffResult;
    return (
      <div className="flex items-center space-x-4 text-sm">
        <Badge variant="success">+{stats.added_lines} added</Badge>
        <Badge variant="destructive">-{stats.removed_lines} removed</Badge>
        <Badge variant="secondary">~{stats.modified_lines} modified</Badge>
        <Badge variant="outline">{stats.unchanged_lines} unchanged</Badge>
        <div className="ml-auto">
          <span className="font-medium">{stats.similarity_percentage.toFixed(1)}% similar</span>
        </div>
      </div>
    );
  };

  const renderSideBySideView = () => (
    <div className="grid grid-cols-2 gap-4 h-full">
      <Card className="overflow-hidden">
        <div className="p-2 border-b bg-muted/50">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {leftTitle}
          </h3>
        </div>
        <MonacoEditor
          height="calc(100vh - 300px)"
          language="plaintext"
          value={leftContent}
          onChange={(value) => onContentChange?.('left', value || '')}
          onMount={(editor) => {
            leftEditorRef.current = editor;
            editor.onDidScrollChange(() => handleScroll('left'));
          }}
          options={{
            fontSize,
            wordWrap: wordWrap ? 'on' : 'off',
            minimap: { enabled: false },
            lineNumbers: 'on',
            renderSideBySide: false,
            readOnly: false
          }}
        />
      </Card>
      
      <Card className="overflow-hidden">
        <div className="p-2 border-b bg-muted/50">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {rightTitle}
          </h3>
        </div>
        <MonacoEditor
          height="calc(100vh - 300px)"
          language="plaintext"
          value={rightContent}
          onChange={(value) => onContentChange?.('right', value || '')}
          onMount={(editor) => {
            rightEditorRef.current = editor;
            editor.onDidScrollChange(() => handleScroll('right'));
          }}
          options={{
            fontSize,
            wordWrap: wordWrap ? 'on' : 'off',
            minimap: { enabled: false },
            lineNumbers: 'on',
            renderSideBySide: false,
            readOnly: false
          }}
        />
      </Card>
    </div>
  );

  const renderUnifiedView = () => {
    if (!diffResult) return null;
    
    const unifiedContent = diffResult.items.map(item => {
      const prefix = item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' ';
      return `${prefix} ${item.content}`;
    }).join('\n');
    
    return (
      <Card className="overflow-hidden">
        <div className="p-2 border-b bg-muted/50">
          <h3 className="font-semibold">Unified Diff View</h3>
        </div>
        <MonacoEditor
          height="calc(100vh - 300px)"
          language="diff"
          value={unifiedContent}
          options={{
            fontSize,
            wordWrap: wordWrap ? 'on' : 'off',
            minimap: { enabled: false },
            lineNumbers: 'on',
            readOnly: true
          }}
        />
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
              <TabsTrigger value="unified">Unified</TabsTrigger>
              <TabsTrigger value="inline">Inline</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Separator orientation="vertical" className="mx-2 h-6" />
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFontSize(Math.max(10, fontSize - 2))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{fontSize}px</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFontSize(Math.min(24, fontSize + 2))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWordWrap(!wordWrap)}
          >
            Word Wrap
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="px-2 py-1 text-sm border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {totalMatches > 0 && (
              <span className="text-xs text-muted-foreground">
                {currentMatch + 1} / {totalMatches}
              </span>
            )}
          </div>
          
          <Separator orientation="vertical" className="mx-2 h-6" />
          
          <Button size="sm" variant="ghost" onClick={() => handleExport('html')}>
            <Download className="w-4 h-4 mr-1" />
            HTML
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleExport('docx')}>
            <Download className="w-4 h-4 mr-1" />
            DOCX
          </Button>
        </div>
      </div>
      
      {/* Stats Bar */}
      {diffResult && (
        <div className="px-4 py-2 border-b bg-muted/30">
          {renderDiffStats()}
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {isComparing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Comparing texts...</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'side-by-side' && renderSideBySideView()}
            {viewMode === 'unified' && renderUnifiedView()}
            {viewMode === 'inline' && renderUnifiedView()} {/* Inline view would be similar to unified for MVP */}
          </>
        )}
      </div>
    </div>
  );
};