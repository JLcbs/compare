import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// 检查浏览器兼容性
const checkBrowserCompatibility = () => {
  const warnings = [];
  
  // 检查Web Worker支持
  if (typeof Worker === 'undefined') {
    warnings.push('您的浏览器不支持Web Worker，大文本处理性能可能受影响');
  }
  
  // 检查localStorage支持
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
  } catch (e) {
    warnings.push('您的浏览器不支持本地存储，设置将无法保存');
  }
  
  // 显示警告
  if (warnings.length > 0) {
    console.warn('浏览器兼容性警告:', warnings);
  }
};



// 初始化
checkBrowserCompatibility();

// 渲染应用
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);