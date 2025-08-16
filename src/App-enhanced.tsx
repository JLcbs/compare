import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile } from '@tauri-apps/api/fs';
import { appWindow } from '@tauri-apps/api/window';
import { DualPaneView } from './components/DualPaneView';
import { BatchComparisonQueue } from './components/BatchComparisonQueue';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { 
  FileText, 
  FolderOpen, 
  Settings, 
  Download,
  Upload,
  Languages,
  Moon,
  Sun,
  History,
  Zap,
  Shield,
  Info
} from 'lucide-react';
import './styles/globals.css';

interface AppState {
  leftText: string;
  rightText: string;
  leftTitle: string;
  rightTitle: string;
  theme: 'light' | 'dark';
  language: 'en' | 'zh-CN';
  activeTab: 'compare' | 'batch' | 'history' | 'settings';
  recentFiles: Array<{ path: string; name: string; timestamp: Date }>;
}

function App() {
  const [state, setState] = useState<AppState>({
    leftText: '',
    rightText: '',
    leftTitle: 'Original',
    rightTitle: 'Modified',
    theme: 'light',
    language: 'en',
    activeTab: 'compare',
    recentFiles: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      try {
        // Load saved preferences
        const prefs = await invoke<any>('load_preferences').catch(() => null);
        if (prefs) {
          setState(prev => ({ ...prev, ...prefs }));
        }

        // Get app version
        const version = await invoke<string>('get_app_version').catch(() => '1.0.0');
        setAppVersion(version);

        // Setup keyboard shortcuts
        await setupKeyboardShortcuts();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initApp();
  }, []);

  // Setup keyboard shortcuts
  const setupKeyboardShortcuts = async () => {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + O: Open files
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleFileOpen('left');
      }
      // Ctrl/Cmd + S: Save comparison
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleExportComparison();
      }
      // Ctrl/Cmd + D: Toggle theme
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
      }
    });
  };

  const handleFileOpen = async (side: 'left' | 'right') => {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Documents',
        extensions: ['txt', 'md', 'json', 'xml', 'html', 'docx', 'pdf', 'odt', 'rtf']
      }]
    });

    if (selected && typeof selected === 'string') {
      setIsLoading(true);
      try {
        let content: string;
        const fileName = selected.split('/').pop() || 'Unknown';
        
        // For text files, read directly
        if (selected.match(/\.(txt|md|json|xml|html)$/i)) {
          content = await readTextFile(selected);
        } else {
          // For other formats, use backend parser
          const parsed = await invoke<{ content: string }>('parse_file', { 
            filePath: selected 
          });
          content = parsed.content;
        }
        
        setState(prev => ({
          ...prev,
          [side === 'left' ? 'leftText' : 'rightText']: content,
          [side === 'left' ? 'leftTitle' : 'rightTitle']: fileName,
          recentFiles: [
            { path: selected, name: fileName, timestamp: new Date() },
            ...prev.recentFiles.filter(f => f.path !== selected).slice(0, 9)
          ]
        }));
      } catch (error) {
        console.error('Failed to read file:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePaste = async (side: 'left' | 'right') => {
    try {
      const text = await navigator.clipboard.readText();
      setState(prev => ({
        ...prev,
        [side === 'left' ? 'leftText' : 'rightText']: text,
        [side === 'left' ? 'leftTitle' : 'rightTitle']: 'Pasted Text'
      }));
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  const handleExportComparison = async () => {
    const savePath = await save({
      filters: [{
        name: 'Comparison Report',
        extensions: ['html', 'pdf', 'docx', 'md']
      }]
    });

    if (savePath) {
      try {
        await invoke('export_comparison', {
          leftText: state.leftText,
          rightText: state.rightText,
          leftTitle: state.leftTitle,
          rightTitle: state.rightTitle,
          outputPath: savePath
        });
      } catch (error) {
        console.error('Failed to export:', error);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setState(prev => ({ ...prev, theme: newTheme }));
    document.documentElement.classList.toggle('dark');
  };

  const handleContentChange = (side: 'left' | 'right', content: string) => {
    setState(prev => ({
      ...prev,
      [side === 'left' ? 'leftText' : 'rightText']: content
    }));
  };

  return (
    <div className={`min-h-screen bg-background ${state.theme}`}>
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <FileText className="w-6 h-6" />
            <h1 className="text-xl font-bold">Text Diff Desktop</h1>
            <Badge variant="outline">v{appVersion}</Badge>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setState(prev => ({ 
                ...prev, 
                language: prev.language === 'en' ? 'zh-CN' : 'en' 
              }))}
            >
              <Languages className="w-4 h-4 mr-1" />
              {state.language === 'en' ? 'EN' : '中文'}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleTheme}
            >
              {state.theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </Button>
            
            <Button size="sm" variant="ghost">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs 
          value={state.activeTab} 
          onValueChange={(v) => setState(prev => ({ ...prev, activeTab: v as any }))}
          className="h-full"
        >
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="compare" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Compare
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Batch
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="compare" className="px-4 py-4">
            <div className="space-y-4">
              {/* Quick Actions Bar */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button onClick={() => handleFileOpen('left')}>
                        <Upload className="w-4 h-4 mr-1" />
                        Open Left File
                      </Button>
                      <Button onClick={() => handleFileOpen('right')}>
                        <Upload className="w-4 h-4 mr-1" />
                        Open Right File
                      </Button>
                      <Separator orientation="vertical" className="h-8" />
                      <Button variant="outline" onClick={() => handlePaste('left')}>
                        Paste Left
                      </Button>
                      <Button variant="outline" onClick={() => handlePaste('right')}>
                        Paste Right
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" onClick={handleExportComparison}>
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Dual Pane Comparison */}
              <DualPaneView
                leftContent={state.leftText}
                rightContent={state.rightText}
                leftTitle={state.leftTitle}
                rightTitle={state.rightTitle}
                onContentChange={handleContentChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="batch" className="px-4 py-4 h-full">
            <BatchComparisonQueue
              onComparisonComplete={(item) => {
                console.log('Comparison completed:', item);
              }}
              onViewResult={(item) => {
                console.log('View result:', item);
              }}
            />
          </TabsContent>

          <TabsContent value="history" className="px-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparison History</CardTitle>
                <CardDescription>
                  View and manage your recent comparisons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {state.recentFiles.length > 0 ? (
                    state.recentFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {file.timestamp.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No recent files
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Comparison Settings</CardTitle>
                  <CardDescription>
                    Configure diff algorithm and behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Algorithm</label>
                      <select className="w-full mt-1 p-2 border rounded">
                        <option value="patience">Patience Diff</option>
                        <option value="lcs">LCS (Longest Common Subsequence)</option>
                        <option value="myers">Myers Algorithm</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Ignore Options</label>
                      <div className="space-y-2 mt-1">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" />
                          <span className="text-sm">Ignore whitespace</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" />
                          <span className="text-sm">Ignore case</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" />
                          <span className="text-sm">Semantic cleanup</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                  <CardDescription>
                    Optimize for speed and memory usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Max File Size (MB)</label>
                      <input 
                        type="number" 
                        defaultValue="50" 
                        className="w-full mt-1 p-2 border rounded" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Timeout (seconds)</label>
                      <input 
                        type="number" 
                        defaultValue="30" 
                        className="w-full mt-1 p-2 border rounded" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Worker Threads</label>
                      <input 
                        type="number" 
                        defaultValue="4" 
                        className="w-full mt-1 p-2 border rounded" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>
                    Privacy and data protection settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium">Offline Mode</span>
                      <input type="checkbox" className="toggle" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium">Encrypt Cache</span>
                      <input type="checkbox" className="toggle" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium">Clear on Exit</span>
                      <input type="checkbox" className="toggle" />
                    </label>
                    <Button variant="destructive" className="w-full">
                      <Shield className="w-4 h-4 mr-1" />
                      Clear All Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                  <CardDescription>
                    Application information and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Version</span>
                      <Badge>{appVersion}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Runtime</span>
                      <Badge variant="outline">Tauri + React</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">License</span>
                      <Badge variant="outline">MIT</Badge>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Info className="w-4 h-4 mr-1" />
                      Check for Updates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span>Processing...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default App;