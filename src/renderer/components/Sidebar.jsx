import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Modal, Button, message, Upload, Space } from 'antd';
import { DownloadOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { isAdmin } from '../data/userStore';

const menuItems = [
  { key: '/dashboard', label: '仪表盘', icon: '📊' },
  { key: '/students', label: '学生管理', icon: '👥' },
  { key: '/applications', label: '申请追踪', icon: '🎓' },
  { key: '/documents', label: '材料中心', icon: '📁' },
  { key: '/schedule', label: '日程管理', icon: '📅' },
];

// 全局申请季状态管理
const SEASON_STORAGE_KEY = 'selectedSeasons';
const DATA_STORAGE_KEY = 'danjia_crs_students';

function Sidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState([]);
  const [allSeasons, setAllSeasons] = useState([]);
  const [selectedSeasons, setSelectedSeasons] = useState(['26Fall']);
  const [backupModalVisible, setBackupModalVisible] = useState(false);

  useEffect(() => {
    loadSeasonsFromStudents();
    
    // 从localStorage恢复选择状态
    const saved = localStorage.getItem(SEASON_STORAGE_KEY);
    if (saved) {
      try {
        setSelectedSeasons(JSON.parse(saved));
      } catch (e) {
        console.log('Failed to parse saved seasons');
      }
    }
  }, []);

  // 监听学生数据变化
  useEffect(() => {
    const handleStudentsChange = () => {
      loadSeasonsFromStudents();
    };
    window.addEventListener('studentsUpdated', handleStudentsChange);
    return () => {
      window.removeEventListener('studentsUpdated', handleStudentsChange);
    };
  }, []);

  // 当选择改变时，保存到 localStorage 并通知其他组件
  useEffect(() => {
    localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(selectedSeasons));
    // 触发自定义事件通知其他组件
    window.dispatchEvent(new CustomEvent('seasonFilterChange', { detail: selectedSeasons }));
  }, [selectedSeasons]);

  // 从学生数据加载所有申请季
  const loadSeasonsFromStudents = () => {
    try {
      // 从 store 获取学生数据
      const students = getStudentsFromStore();
      const seasonSet = new Set(['26Fall', '27Fall', '28Fall']); // 默认值
      
      students.forEach(s => {
        if (s.season) {
          seasonSet.add(s.season);
        }
      });
      
      const sortedSeasons = Array.from(seasonSet).sort((a, b) => {
        // 按年份和类型排序
        const yearA = parseInt(a.match(/\d+/)?.[0] || '0');
        const yearB = parseInt(b.match(/\d+/)?.[0] || '0');
        if (yearA !== yearB) return yearA - yearB;
        const typeA = a.includes('Fall') ? 0 : 1;
        const typeB = b.includes('Fall') ? 0 : 1;
        return typeA - typeB;
      });
      
      setSeasons(sortedSeasons);
      setAllSeasons(sortedSeasons);
      
      // 如果当前选择的不在列表中，添加到列表
      const newSelected = selectedSeasons.filter(s => sortedSeasons.includes(s));
      if (newSelected.length === 0 && sortedSeasons.length > 0) {
        setSelectedSeasons([sortedSeasons[0]]);
      } else if (newSelected.length !== selectedSeasons.length) {
        setSelectedSeasons(newSelected);
      }
    } catch (err) {
      console.log('Failed to load seasons from students');
      setSeasons(['26Fall', '27Fall', '28Fall']);
    }
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (onNavigate) onNavigate();
  };

  // 切换申请季选择
  const toggleSeason = (seasonId) => {
    setSelectedSeasons(prev => {
      if (prev.includes(seasonId)) {
        // 如果是唯一的，取消选择时默认选一个
        if (prev.length === 1) {
          return [seasons[0] || '26Fall'];
        }
        return prev.filter(s => s !== seasonId);
      } else {
        return [...prev, seasonId];
      }
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>🎓 丹加留学顾问</h1>
        <span>CRM 系统</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">主导航</div>
          {menuItems.map(item => (
            <div
              key={item.key}
              className={`nav-item ${isActive(item.key) ? 'active' : ''}`}
              onClick={() => handleNavClick(item.key)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">申请季筛选</div>
          <div className="season-tags">
            {seasons.map(season => (
              <span
                key={season}
                className={`season-tag ${selectedSeasons.includes(season) ? 'active' : ''}`}
                onClick={() => toggleSeason(season)}
                style={{ cursor: 'pointer' }}
              >
                {selectedSeasons.includes(season) ? '✓ ' : ''}{season}
              </span>
            ))}
            <span className="season-tag" style={{ opacity: 0.5 }}>📦 归档</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            已选择 {selectedSeasons.length}/{seasons.length} 个申请季
          </div>
        </div>
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {/* 数据备份区域 - 仅管理员可见 */}
        {isAdmin() && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>👑 系统管理</div>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={exportData}
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 11 }}
              >
                导出备份
              </Button>
              <Upload
                beforeUpload={(file) => {
                  importData(file);
                  return false; // 阻止自动上传
                }}
                showUploadList={false}
                accept=".json"
              >
                <Button
                size="small"
                icon={<UploadOutlined />}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              >
                导入恢复
              </Button>
            </Upload>
          </Space>
        </div>
        )}
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
          v1.0.0 · 数据存储于本地
        </div>
      </div>
    </div>
  );
}

// 从 store 获取学生数据的辅助函数
function getStudentsFromStore() {
  try {
    const data = localStorage.getItem(DATA_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {}
  return [];
}

// 导出数据为 JSON 文件
const exportData = async () => {
  try {
    const students = getStudentsFromStore();
    const exportObj = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      students: students
    };
    const content = JSON.stringify(exportObj, null, 2);
    const defaultName = `丹加留学数据备份_${new Date().toISOString().split('T')[0]}.json`;

    if (window.electronAPI?.saveDialog) {
      // Electron 模式：弹出保存对话框选择位置
      const result = await window.electronAPI.saveDialog(defaultName, content);
      if (result.canceled) return;
      if (result.success) {
        message.success(`已导出到：${result.path}`);
      } else {
        message.error('导出失败：' + result.error);
      }
    } else {
      // 浏览器模式：直接下载
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success(`已导出 ${students.length} 条学生数据`);
    }
  } catch (err) {
    message.error('导出失败');
  }
};

// 导入数据（覆盖）
const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target.result);
        // 兼容旧格式（直接是数组）和新格式（有 version 包装）
        const students = content.students || content;
        if (!Array.isArray(students)) {
          message.error('文件格式错误');
          reject(new Error('Invalid format'));
          return;
        }
        localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(students));
        // 通知所有页面刷新数据
        window.dispatchEvent(new CustomEvent('studentsUpdated'));
        window.dispatchEvent(new CustomEvent('seasonFilterChange', { detail: ['26Fall'] }));
        message.success(`成功导入 ${students.length} 条学生数据`);
        // 刷新页面以加载新数据
        setTimeout(() => window.location.reload(), 800);
        resolve(true);
      } catch (err) {
        message.error('导入失败：文件格式不正确');
        reject(err);
      }
    };
    reader.onerror = () => {
      message.error('读取文件失败');
      reject(new Error('Read error'));
    };
    reader.readAsText(file);
  });
};

export default Sidebar;
