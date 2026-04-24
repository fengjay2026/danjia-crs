import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { MenuOutlined } from '@ant-design/icons';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 - 移动端可收起 */}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="main-content">
        {/* 移动端顶部汉堡菜单 */}
        <div className="mobile-header">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MenuOutlined />
          </button>
          <span className="mobile-title">丹加留学顾问</span>
        </div>

        <Header />
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;
