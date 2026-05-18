import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentDetail from './pages/StudentDetail';
import StudentForm from './pages/StudentForm';
import DocumentCenter from './pages/DocumentCenter';
import ApplicationTracker from './pages/ApplicationTracker';
import ScheduleManager from './pages/ScheduleManager';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const theme = {
  token: {
    colorPrimary: '#1E3A5F',
    borderRadius: 8,
  },
};

// 需要登录的路由守卫
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <span>加载中...</span>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/students" element={<StudentList />} />
                <Route path="/students/new" element={<StudentForm />} />
                <Route path="/students/:id" element={<StudentDetail />} />
                <Route path="/students/:id/edit" element={<StudentForm />} />
                <Route path="/documents" element={<DocumentCenter />} />
                <Route path="/applications" element={<ApplicationTracker />} />
                <Route path="/schedule" element={<ScheduleManager />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
