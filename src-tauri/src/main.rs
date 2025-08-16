// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod diff_engine;
mod file_parser;
mod exporter;
mod plugin_system;
mod database;
mod security;

use std::path::Path;
use tauri::{Manager, State};
use serde_json::Value;

use diff_engine::{DiffEngine, DiffOptions};
use file_parser::FileParser;
use exporter::{Exporter, ExportOptions, ExportFormat};

// 应用状态
struct AppState {
    diff_engine: DiffEngine,
    file_parser: FileParser,
}

// Tauri命令

#[tauri::command]
async fn compute_diff(
    left_text: String,
    right_text: String,
    options: DiffOptions,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    let engine = DiffEngine::new(options);
    let result = engine.compute_diff(&left_text, &right_text);
    
    serde_json::to_value(&result)
        .map_err(|e| format!("序列化失败: {}", e))
}

#[tauri::command]
async fn parse_file(
    file_path: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let path = Path::new(&file_path);
    
    match state.file_parser.parse_file(path).await {
        Ok(document) => Ok(document.content),
        Err(e) => Err(format!("文件解析失败: {}", e)),
    }
}

#[tauri::command]
async fn export_diff(
    diff_result: Value,
    output_path: String,
    format: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let export_format = match format.as_str() {
        "html" => ExportFormat::Html,
        "pdf" => ExportFormat::Pdf,
        "docx" => ExportFormat::Docx,
        "text" => ExportFormat::Text,
        "json" => ExportFormat::Json,
        "markdown" => ExportFormat::Markdown,
        _ => return Err(format!("不支持的导出格式: {}", format)),
    };
    
    let options = ExportOptions {
        format: export_format,
        include_stats: true,
        include_timestamp: true,
        include_metadata: true,
        template: None,
        styles: Default::default(),
    };
    
    let exporter = Exporter::new(options);
    
    // 解析diff_result
    let items: Vec<diff_engine::DiffItem> = serde_json::from_value(
        diff_result.get("items").unwrap_or(&Value::Null).clone()
    ).map_err(|e| format!("解析差异项失败: {}", e))?;
    
    let stats: diff_engine::DiffStats = serde_json::from_value(
        diff_result.get("stats").unwrap_or(&Value::Null).clone()
    ).map_err(|e| format!("解析统计信息失败: {}", e))?;
    
    let path = Path::new(&output_path);
    
    exporter.export(&items, &stats, path).await
        .map_err(|e| format!("导出失败: {}", e))
}

#[tauri::command]
async fn batch_compare(
    file_pairs: Vec<(String, String)>,
    options: DiffOptions,
) -> Result<Vec<Value>, String> {
    let mut results = Vec::new();
    let engine = DiffEngine::new(options);
    
    for (left_path, right_path) in file_pairs {
        let parser = FileParser::new();
        
        // 解析文件
        let left_doc = parser.parse_file(Path::new(&left_path)).await
            .map_err(|e| format!("解析左侧文件失败: {}", e))?;
        let right_doc = parser.parse_file(Path::new(&right_path)).await
            .map_err(|e| format!("解析右侧文件失败: {}", e))?;
        
        // 计算差异
        let result = engine.compute_diff(&left_doc.content, &right_doc.content);
        
        let value = serde_json::to_value(&result)
            .map_err(|e| format!("序列化失败: {}", e))?;
        
        results.push(value);
    }
    
    Ok(results)
}

#[tauri::command]
async fn load_plugin(plugin_path: String) -> Result<String, String> {
    plugin_system::load_plugin(&plugin_path)
        .map_err(|e| format!("加载插件失败: {}", e))
}

#[tauri::command]
async fn get_system_info() -> Result<Value, String> {
    use sysinfo::{System, SystemExt, CpuExt, DiskExt};
    
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let info = serde_json::json!({
        "total_memory": sys.total_memory(),
        "used_memory": sys.used_memory(),
        "total_swap": sys.total_swap(),
        "used_swap": sys.used_swap(),
        "cpu_count": sys.cpus().len(),
        "cpu_usage": sys.global_cpu_info().cpu_usage(),
        "os_name": sys.name().unwrap_or_default(),
        "os_version": sys.os_version().unwrap_or_default(),
        "host_name": sys.host_name().unwrap_or_default(),
    });
    
    Ok(info)
}

#[tauri::command]
async fn save_to_history(
    left_text: String,
    right_text: String,
    diff_result: Value,
) -> Result<i64, String> {
    database::save_comparison(&left_text, &right_text, &diff_result)
        .map_err(|e| format!("保存历史记录失败: {}", e))
}

#[tauri::command]
async fn load_history(limit: usize) -> Result<Vec<Value>, String> {
    database::load_recent_comparisons(limit)
        .map_err(|e| format!("加载历史记录失败: {}", e))
}

#[tauri::command]
async fn check_for_updates() -> Result<Value, String> {
    // 检查更新逻辑
    Ok(serde_json::json!({
        "has_update": false,
        "version": "1.0.0",
        "download_url": ""
    }))
}

fn main() {
    // 初始化日志
    env_logger::init();
    
    // 初始化数据库
    database::init().expect("数据库初始化失败");
    
    // 构建Tauri应用
    tauri::Builder::default()
        .manage(AppState {
            diff_engine: DiffEngine::new(DiffOptions::default()),
            file_parser: FileParser::new(),
        })
        .invoke_handler(tauri::generate_handler![
            compute_diff,
            parse_file,
            export_diff,
            batch_compare,
            load_plugin,
            get_system_info,
            save_to_history,
            load_history,
            check_for_updates,
        ])
        .setup(|app| {
            // 设置系统托盘
            #[cfg(desktop)]
            {
                use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayMenuItem};
                
                let quit = CustomMenuItem::new("quit".to_string(), "退出");
                let hide = CustomMenuItem::new("hide".to_string(), "隐藏");
                let show = CustomMenuItem::new("show".to_string(), "显示");
                
                let tray_menu = SystemTrayMenu::new()
                    .add_item(show)
                    .add_item(hide)
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(quit);
                
                let system_tray = SystemTray::new()
                    .with_menu(tray_menu);
                
                app.system_tray(system_tray);
            }
            
            // 注册全局快捷键
            #[cfg(desktop)]
            {
                use tauri::GlobalShortcutManager;
                
                let mut shortcut_manager = app.global_shortcut_manager();
                
                shortcut_manager
                    .register("CommandOrControl+Shift+D", move || {
                        println!("快捷键触发");
                    })
                    .unwrap();
            }
            
            Ok(())
        })
        .on_system_tray_event(|app, event| {
            use tauri::{SystemTrayEvent, Manager};
            
            match event {
                SystemTrayEvent::LeftClick { .. } => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "quit" => {
                            std::process::exit(0);
                        }
                        "hide" => {
                            let window = app.get_window("main").unwrap();
                            window.hide().unwrap();
                        }
                        "show" => {
                            let window = app.get_window("main").unwrap();
                            window.show().unwrap();
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// 插件系统模块
mod plugin_system {
    use std::error::Error;
    
    pub fn load_plugin(path: &str) -> Result<String, Box<dyn Error>> {
        // 插件加载逻辑
        Ok(format!("插件已加载: {}", path))
    }
}

// 数据库模块
mod database {
    use rusqlite::{Connection, Result};
    use serde_json::Value;
    use std::sync::Mutex;
    
    lazy_static::lazy_static! {
        static ref DB: Mutex<Option<Connection>> = Mutex::new(None);
    }
    
    pub fn init() -> Result<()> {
        let conn = Connection::open("text_diff.db")?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS comparisons (
                id INTEGER PRIMARY KEY,
                left_text TEXT NOT NULL,
                right_text TEXT NOT NULL,
                diff_result TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        *DB.lock().unwrap() = Some(conn);
        Ok(())
    }
    
    pub fn save_comparison(left: &str, right: &str, result: &Value) -> Result<i64> {
        let conn = DB.lock().unwrap();
        let conn = conn.as_ref().unwrap();
        
        conn.execute(
            "INSERT INTO comparisons (left_text, right_text, diff_result) VALUES (?1, ?2, ?3)",
            [left, right, &result.to_string()],
        )?;
        
        Ok(conn.last_insert_rowid())
    }
    
    pub fn load_recent_comparisons(limit: usize) -> Result<Vec<Value>> {
        let conn = DB.lock().unwrap();
        let conn = conn.as_ref().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT diff_result FROM comparisons ORDER BY created_at DESC LIMIT ?1"
        )?;
        
        let results = stmt.query_map([limit], |row| {
            let json_str: String = row.get(0)?;
            Ok(serde_json::from_str(&json_str).unwrap_or(Value::Null))
        })?;
        
        Ok(results.collect::<Result<Vec<_>, _>>()?)
    }
}

// 安全模块
mod security {
    pub fn validate_input(input: &str) -> bool {
        // 输入验证逻辑
        !input.is_empty() && input.len() < 10_000_000
    }
    
    pub fn sanitize_path(path: &str) -> String {
        // 路径清理逻辑
        path.replace("..", "").replace("~", "")
    }
}