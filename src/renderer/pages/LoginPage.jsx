import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const COLORS = {
  primary: '#1E3A5F',
  accent: '#FF6B35',
};

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // 已登录则跳转
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (isRegister) {
        await register(values.email, values.password);
        message.success('注册成功！');
        navigate('/dashboard', { replace: true });
      } else {
        await login(values.email, values.password);
        message.success('登录成功！');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      const errorMap = {
        'auth/user-not-found': '用户不存在，请先注册',
        'auth/wrong-password': '密码错误',
        'auth/invalid-credential': '邮箱或密码错误',
        'auth/email-already-in-use': '该邮箱已被注册',
        'auth/weak-password': '密码长度至少6位',
        'auth/invalid-email': '邮箱格式不正确',
        'auth/too-many-requests': '操作过于频繁，请稍后再试',
      };
      const msg = errorMap[error.code] || error.message || '操作失败，请重试';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
          width: 400,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        bodyStyle={{ padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <Title level={3} style={{ color: COLORS.primary, margin: 0 }}>
            丹加留学顾问 CRS
          </Title>
          <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
            {isRegister ? '创建新账户' : '登录以继续使用'}
          </Text>
        </div>

        <Form
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#999' }} />}
              placeholder="邮箱地址"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="密码"
            />
          </Form.Item>

          {isRegister && (
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
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="确认密码"
              />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 12 }}>
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
              {isRegister ? '注册' : '登录'}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Button
            type="link"
            onClick={() => setIsRegister(!isRegister)}
            style={{ color: COLORS.accent }}
          >
            {isRegister ? '已有账户？去登录' : '没有账户？去注册'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
