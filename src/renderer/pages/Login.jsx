import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SmileOutlined } from '@ant-design/icons';
import { validateLogin, getCurrentUser, addUser } from '../data/userStore';
import './Login.css';

const { Title, Text } = Typography;

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginForm] = Form.useForm();
  const [regForm] = Form.useForm();

  // 如果已登录直接跳转
  React.useEffect(() => {
    if (getCurrentUser()) {
      navigate('/dashboard', { replace: true });
    }
  }, []);

  const handleLogin = async (values) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const result = validateLogin(values.username, values.password);
    setLoading(false);

    if (result.success) {
      message.success(`欢迎回来，${result.user.nickname}！`);
      navigate('/dashboard', { replace: true });
    } else {
      message.error(result.error);
      loginForm.setFields([
        { name: 'password', errors: [result.error] }
      ]);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const result = addUser(values);
    setLoading(false);

    if (result.success) {
      message.success(`注册成功，欢迎 ${values.nickname}！`);
      // 自动登录
      const loginResult = validateLogin(values.username, values.password);
      if (loginResult.success) {
        navigate('/dashboard', { replace: true });
      }
    } else {
      message.error(result.error);
    }
  };

  return (
    <div className="login-page">
      {/* 背景装饰元素 */}
      <div className="login-particles">
        <div className="particle p1">✈️</div>
        <div className="particle p2">🎓</div>
        <div className="particle p3">🌏</div>
        <div className="particle p4">📚</div>
        <div className="particle p5">🏛️</div>
        <div className="particle p6">🌏</div>
        <div className="particle p7">🎓</div>
        <div className="particle p8">✈️</div>
      </div>

      {/* 顶部横幅 */}
      <div className="login-banner">
        <div className="banner-content">
          <div className="banner-logo">🎓</div>
          <div className="banner-text">
            <Title level={3} style={{ margin: 0, color: '#fff' }}>丹加留学顾问</Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              专业港新留学申请管理系统
            </Text>
          </div>
        </div>
        <div className="banner-tagline">
          <span>🎯 精准定位</span>
          <span className="sep">|</span>
          <span>📋 高效管理</span>
          <span className="sep">|</span>
          <span>🚀 助力名校</span>
        </div>
      </div>

      {/* 登录卡片 */}
      <Card className="login-card" bordered={false}>
        <div className="card-inner">
          <div className="card-brand">
            <div className="brand-icon">🎓</div>
            <Title level={4} style={{ margin: '8px 0 0', color: '#1E3A5F' }}>
              丹加留学顾问
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>CRM 管理系统</Text>
          </div>

          <Tabs
            defaultActiveKey="login"
            centered
            size="large"
            items={[
              {
                key: 'login',
                label: '🔐 登录',
                children: (
                  <Form
                    form={loginForm}
                    layout="vertical"
                    onFinish={handleLogin}
                    size="large"
                    requiredMark={false}
                  >
                    <Form.Item
                      name="username"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    >
                      <Input
                        prefix={<UserOutlined style={{ color: '#1E3A5F' }} />}
                        placeholder="用户名"
                        autoComplete="username"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: '请输入密码' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#1E3A5F' }} />}
                        placeholder="密码"
                        autoComplete="current-password"
                        size="large"
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      className="login-btn"
                      size="large"
                    >
                      登录系统
                    </Button>
                  </Form>
                ),
              },
              {
                key: 'register',
                label: '📝 注册',
                children: (
                  <Form
                    form={regForm}
                    layout="vertical"
                    onFinish={handleRegister}
                    size="large"
                    requiredMark={false}
                  >
                    <Form.Item
                      name="username"
                      label="用户名"
                      rules={[
                        { required: true, message: '请输入用户名' },
                        { min: 3, message: '用户名至少3位' }
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined style={{ color: '#1E3A5F' }} />}
                        placeholder="设置登录用户名"
                        autoComplete="username"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="nickname"
                      label="昵称"
                      rules={[{ required: true, message: '请输入昵称' }]}
                    >
                      <Input
                        prefix={<SmileOutlined style={{ color: '#1E3A5F' }} />}
                        placeholder="设置显示昵称"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label="密码"
                      rules={[
                        { required: true, message: '请输入密码' },
                        { min: 4, message: '密码至少4位' }
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#1E3A5F' }} />}
                        placeholder="设置登录密码"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirm"
                      label="确认密码"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: '请确认密码' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次密码不一致'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#1E3A5F' }} />}
                        placeholder="再次输入密码"
                        size="large"
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      className="login-btn"
                      size="large"
                    >
                      注册账号
                    </Button>
                  </Form>
                ),
              },
            ]}
          />

          <div className="login-footer">
            <Text type="secondary" style={{ fontSize: 11 }}>
              数据存储于本地 · 请妥善保管账号信息
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Login;
