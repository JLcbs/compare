import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { 
  FileText, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Download,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface ComparisonItem {
  id: string;
  leftPath: string;
  rightPath: string;
  leftName: string;
  rightName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    similarity: number;
    addedLines: number;
    removedLines: number;
    modifiedLines: number;
  };
  error?: string;
  selected: boolean;
  addedAt: Date;
  completedAt?: Date;
}

interface BatchComparisonQueueProps {
  onComparisonComplete?: (item: ComparisonItem) => void;
  onViewResult?: (item: ComparisonItem) => void;
}

export const BatchComparisonQueue: React.FC<BatchComparisonQueueProps> = ({
  onComparisonComplete,
  onViewResult
}) => {
  const [items, setItems] = useState<ComparisonItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  // Add files to queue
  const handleAddFiles = useCallback(async () => {
    try {
      const leftFiles = await open({
        multiple: true,
        filters: [{
          name: 'Text Files',
          extensions: ['txt', 'md', 'json', 'xml', 'html', 'docx', 'pdf', 'odt', 'rtf']
        }]
      });

      if (!leftFiles) return;

      const rightFiles = await open({
        multiple: true,
        filters: [{
          name: 'Text Files',
          extensions: ['txt', 'md', 'json', 'xml', 'html', 'docx', 'pdf', 'odt', 'rtf']
        }]
      });

      if (!rightFiles) return;

      const filesToAdd = Array.isArray(leftFiles) ? leftFiles : [leftFiles];
      const rightFilesArray = Array.isArray(rightFiles) ? rightFiles : [rightFiles];

      const newItems: ComparisonItem[] = filesToAdd.map((leftPath, index) => {
        const rightPath = rightFilesArray[Math.min(index, rightFilesArray.length - 1)];
        return {
          id: `${Date.now()}-${index}`,
          leftPath,
          rightPath,
          leftName: leftPath.split('/').pop() || 'Unknown',
          rightName: rightPath.split('/').pop() || 'Unknown',
          status: 'pending',
          progress: 0,
          selected: false,
          addedAt: new Date()
        };
      });

      setItems(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error('Failed to add files:', error);
    }
  }, []);

  // Add folder comparison
  const handleAddFolder = useCallback(async () => {
    try {
      const leftFolder = await open({
        directory: true
      });

      if (!leftFolder) return;

      const rightFolder = await open({
        directory: true
      });

      if (!rightFolder) return;

      // Scan folders for matching files
      const files = await invoke<Array<{ leftPath: string; rightPath: string; name: string }>>(
        'scan_folders_for_comparison',
        { leftFolder, rightFolder }
      );

      const newItems: ComparisonItem[] = files.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        leftPath: file.leftPath,
        rightPath: file.rightPath,
        leftName: file.name,
        rightName: file.name,
        status: 'pending',
        progress: 0,
        selected: false,
        addedAt: new Date()
      }));

      setItems(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error('Failed to add folder:', error);
    }
  }, []);

  // Process queue
  const processQueue = useCallback(async () => {
    const pendingItems = items.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) {
      setIsProcessing(false);
      return;
    }

    const item = pendingItems[0];
    setCurrentItemId(item.id);

    try {
      // Update status to processing
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'processing', progress: 10 } : i
      ));

      // Parse files
      const [leftDoc, rightDoc] = await Promise.all([
        invoke('parse_file', { filePath: item.leftPath }),
        invoke('parse_file', { filePath: item.rightPath })
      ]);

      // Update progress
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, progress: 50 } : i
      ));

      // Compute diff
      const result = await invoke<any>('compute_diff', {
        leftText: leftDoc,
        rightText: rightDoc,
        options: {
          algorithm: 'patience',
          ignore_whitespace: false,
          ignore_case: false,
          semantic_cleanup: true,
          timeout_ms: 30000
        }
      });

      // Update with result
      const completedItem = {
        ...item,
        status: 'completed' as const,
        progress: 100,
        result: {
          similarity: result.stats.similarity_percentage,
          addedLines: result.stats.added_lines,
          removedLines: result.stats.removed_lines,
          modifiedLines: result.stats.modified_lines
        },
        completedAt: new Date()
      };

      setItems(prev => prev.map(i => 
        i.id === item.id ? completedItem : i
      ));

      onComparisonComplete?.(completedItem);

    } catch (error) {
      // Handle error
      setItems(prev => prev.map(i => 
        i.id === item.id ? { 
          ...i, 
          status: 'failed', 
          progress: 0, 
          error: String(error) 
        } : i
      ));
    }

    setCurrentItemId(null);
  }, [items, onComparisonComplete]);

  // Process queue automatically when processing is enabled
  useEffect(() => {
    if (isProcessing && !currentItemId) {
      processQueue();
    }
  }, [isProcessing, currentItemId, processQueue]);

  // Toggle selection
  const toggleSelection = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  // Toggle select all
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setItems(prev => prev.map(item => ({ ...item, selected: !selectAll })));
  };

  // Remove selected items
  const removeSelected = () => {
    setItems(prev => prev.filter(item => !item.selected));
    setSelectAll(false);
  };

  // Export results
  const exportResults = async () => {
    const completedItems = items.filter(item => item.status === 'completed');
    if (completedItems.length === 0) return;

    try {
      await invoke('export_batch_results', {
        items: completedItems.map(item => ({
          leftName: item.leftName,
          rightName: item.rightName,
          similarity: item.result?.similarity,
          addedLines: item.result?.addedLines,
          removedLines: item.result?.removedLines,
          modifiedLines: item.result?.modifiedLines
        }))
      });
    } catch (error) {
      console.error('Failed to export results:', error);
    }
  };

  // Get filtered items
  const filteredItems = items.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  // Calculate statistics
  const stats = {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    processing: items.filter(i => i.status === 'processing').length,
    completed: items.filter(i => i.status === 'completed').length,
    failed: items.filter(i => i.status === 'failed').length
  };

  const getStatusIcon = (status: ComparisonItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ComparisonItem['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'completed': return 'success';
      case 'failed': return 'destructive';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Batch Comparison Queue</CardTitle>
            <CardDescription>
              Manage and process multiple file comparisons
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">Total: {stats.total}</Badge>
            <Badge variant="secondary">Pending: {stats.pending}</Badge>
            <Badge variant="success">Completed: {stats.completed}</Badge>
            {stats.failed > 0 && (
              <Badge variant="destructive">Failed: {stats.failed}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleAddFiles}>
              <Plus className="w-4 h-4 mr-1" />
              Add Files
            </Button>
            <Button size="sm" variant="outline" onClick={handleAddFolder}>
              <FolderOpen className="w-4 h-4 mr-1" />
              Add Folder
            </Button>
            
            {items.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant={isProcessing ? "destructive" : "default"}
                  onClick={() => setIsProcessing(!isProcessing)}
                >
                  {isProcessing ? (
                    <><Pause className="w-4 h-4 mr-1" /> Pause</>
                  ) : (
                    <><Play className="w-4 h-4 mr-1" /> Start</>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={removeSelected}
                  disabled={!items.some(i => i.selected)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove Selected
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              className="text-sm border rounded px-2 py-1"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Items</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            
            {stats.completed > 0 && (
              <Button size="sm" variant="outline" onClick={exportResults}>
                <Download className="w-4 h-4 mr-1" />
                Export Results
              </Button>
            )}
          </div>
        </div>
        
        {/* Queue List */}
        <ScrollArea className="flex-1 border rounded-lg">
          <div className="p-4 space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No comparisons in queue</p>
                <p className="text-sm mt-2">Add files or folders to start comparing</p>
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
                
                {/* Items */}
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => toggleSelection(item.id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                          <span className="font-medium text-sm">
                            {item.leftName} ↔ {item.rightName}
                          </span>
                          <Badge variant={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        
                        {item.status === 'completed' && item.result && (
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="font-medium">
                              {item.result.similarity.toFixed(1)}% similar
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onViewResult?.(item)}
                            >
                              View
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {item.status === 'processing' && (
                        <Progress value={item.progress} className="h-1 mt-2" />
                      )}
                      
                      {item.status === 'failed' && item.error && (
                        <p className="text-xs text-red-500 mt-1">{item.error}</p>
                      )}
                      
                      {item.status === 'completed' && item.result && (
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                          <span>+{item.result.addedLines}</span>
                          <span>-{item.result.removedLines}</span>
                          <span>~{item.result.modifiedLines}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};