import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, message, Typography, Divider, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { addUser } from '../data/userStore';

const { Title, Text } = Typography;

const COLORS = {
  primary: '#1E3A5F',
  accent: '#FF6B35',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginForm] = Form.useForm();
  const [regForm] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const result = login(values.username, values.password);
      if (result.success) {
        message.success('登录成功！');
        navigate('/dashboard', { replace: true });
      } else {
        message.error(result.error || '登录失败');
      }
    } catch (e) {
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const result = addUser({
        username: values.username,
        password: values.password,
        nickname: values.nickname || values.username
      });
      if (result.success) {
        message.success('注册成功，请登录');
        loginForm.setFieldsValue({ username: values.username });
        setActiveTab('login');
      } else {
        message.error(result.error || '注册失败');
      }
    } catch (e) {
      message.error('注册失败');
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState('login');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1E3A5F 0%, #2C5F8A 50%, #1E3A5F 100%)',
      padding: 24,
    }}>
      <Card
        style={{
          width: 420,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        bodyStyle={{ padding: 32 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <Title level={3} style={{ color: COLORS.primary, margin: 0 }}>
            丹加留学顾问 CRS
          </Title>
          <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
            {activeTab === 'login' ? '登录以继续使用' : '创建新账户'}
          </Text>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form
                  form={loginForm}
                  layout="vertical"
                  onFinish={handleLogin}
                  size="large"
                  autoComplete="off"
                >
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input
                      id="login-username"
                      prefix={<UserOutlined style={{ color: '#999' }} />}
                      placeholder="用户名"
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      id="login-password"
                      prefix={<LockOutlined style={{ color: '#999' }} />}
                      placeholder="密码"
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      style={{
                        height: 44,
                        backgroundColor: COLORS.primary,
                        borderColor: COLORS.primary,
                        borderRadius: 8,
                        fontSize: 16,
                      }}
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form
                  form={regForm}
                  layout="vertical"
                  onFinish={handleRegister}
                  size="large"
                  autoComplete="off"
                >
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input
                      id="reg-username"
                      prefix={<UserOutlined style={{ color: '#999' }} />}
                      placeholder="用户名"
                    />
                  </Form.Item>
                  <Form.Item name="nickname">
                    <Input
                      id="reg-nickname"
                      prefix={<MailOutlined style={{ color: '#999' }} />}
                      placeholder="昵称（可选，默认为用户名）"
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 4, message: '密码至少4位' }
                    ]}
                  >
                    <Input.Password
                      id="reg-password"
                      prefix={<LockOutlined style={{ color: '#999' }} />}
                      placeholder="密码"
                    />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      id="reg-confirm-password"
                      prefix={<LockOutlined style={{ color: '#999' }} />}
                      placeholder="确认密码"
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      style={{
                        height: 44,
                        backgroundColor: COLORS.primary,
                        borderColor: COLORS.primary,
                        borderRadius: 8,
                        fontSize: 16,
                      }}
                    >
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
