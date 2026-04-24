import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input, Button, Avatar, Dropdown, AutoComplete, Space, Tag, Modal, Divider, Form, message, Table, Badge, Alert } from 'antd';
import {
  SearchOutlined, BellOutlined, PlusOutlined, UserOutlined,
  LogoutOutlined, TeamOutlined, PlusCircleOutlined, EyeOutlined, CrownOutlined
} from '@ant-design/icons';
import { getStudents } from '../data/store';
import { getCurrentUser, logout, getUsers, addUser, isAdmin, switchToUser } from '../data/userStore';

const pageTitles = {
  '/dashboard': '仪表盘',
  '/students': '学生管理',
  '/students/:id': '学生详情',
  '/applications': '申请追踪',
  '/documents': '材料中心',
  '/schedule': '日程管理',
};

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [addUserModalVisible, setAddUserModalVisible] = useState(false);
  const [addUserForm] = Form.useForm();

  // 监听登录状态变化
  useEffect(() => {
    const interval = setInterval(() => {
      const user = getCurrentUser();
      if (user) {
        setCurrentUser({ ...user });
      } else {
        navigate('/login', { replace: true });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 登出
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // 添加用户
  const handleAddUser = async (values) => {
    const result = addUser(values);
    if (result.success) {
      message.success(`用户 ${values.nickname} 添加成功`);
      setAddUserModalVisible(false);
      addUserForm.resetFields();
    } else {
      message.error(result.error);
    }
  };

  // 切换到其他用户系统
  const handleSwitchUser = (targetUsername) => {
    const result = switchToUser(targetUsername);
    if (result.success) {
      message.success('已切换到该用户系统');
      window.location.reload();
    } else {
      message.error(result.error);
    }
  };

  // 返回自己的系统
  const handleReturnToOwn = () => {
    switchToUser('nehfgze911');
    message.success('已返回冯老师的系统');
    window.location.reload();
  };

  const getTitle = () => {
    const path = location.pathname;
    if (path.includes('/students/') && path !== '/students') {
      return '学生详情';
    }
    return pageTitles[path] || '丹加留学顾问';
  };

  // 搜索学生
  const handleSearch = (value) => {
    setSearchText(value);
    if (value.length >= 1) {
      const students = getStudents();
      const results = students
        .filter(s =>
          s.name.toLowerCase().includes(value.toLowerCase()) ||
          (s.school && s.school.toLowerCase().includes(value.toLowerCase())) ||
          (s.major && s.major.toLowerCase().includes(value.toLowerCase()))
        )
        .slice(0, 5)
        .map(s => ({
          value: s.id.toString(),
          label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space>
                <Tag color="blue">{s.season || '26Fall'}</Tag>
                <span style={{ fontWeight: 500 }}>{s.name}</span>
              </Space>
              <span style={{ color: '#8C8C8C', fontSize: 12 }}>
                {s.school} · {s.major}
              </span>
            </div>
          ),
        }));
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelect = (value) => {
    setSearchText('');
    setSearchResults([]);
    navigate(`/students/${value}`);
  };

  const userMenuItems = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0', minWidth: 160 }}>
          <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            {currentUser?.nickname || '用户'}
            {currentUser?.isAdmin && <CrownOutlined style={{ color: '#FAAD14', fontSize: 12 }} />}
          </div>
          <div style={{ fontSize: 11, color: '#8C8C8C' }}>@{currentUser?.username}</div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
  ];

  // 仅管理员可见账号管理
  if (isAdmin()) {
    userMenuItems.push({
      key: 'users',
      label: '👥 账号管理',
      icon: <TeamOutlined />,
      onClick: () => setUserModalVisible(true),
    });
  }

  userMenuItems.push({
    key: 'logout',
    label: '退出登录',
    icon: <LogoutOutlined />,
    danger: true,
    onClick: handleLogout,
  });

  const userMenu = { items: userMenuItems };

  const userListData = getUsers();

  return (
    <>
      {/* 管理员切换提示横幅 */}
      {currentUser?.isViewingAs && (
        <Alert
          message={
            <Space>
              <EyeOutlined />
              当前正在查看 <strong>{currentUser.nickname}</strong> 的系统
              <Button
                size="small"
                type="link"
                onClick={handleReturnToOwn}
                style={{ padding: 0, height: 'auto', color: '#fff', textDecoration: 'underline' }}
              >
                返回冯老师系统
              </Button>
            </Space>
          }
          type="warning"
          showIcon
          style={{
            borderRadius: 0,
            border: 'none',
            background: '#FA8C16',
            color: '#fff',
          }}
        />
      )}

      <header className="header">
        <h2 className="header-title">{getTitle()}</h2>

        <div className="header-actions">
          <AutoComplete
            style={{ width: 280 }}
            value={searchText}
            options={searchResults}
            onSearch={handleSearch}
            onSelect={handleSelect}
            onClear={() => setSearchResults([])}
            placeholder="搜索学生、申请..."
            allowClear
          >
            <Input prefix={<SearchOutlined />} />
          </AutoComplete>

          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/students/new')}>
            新建学生
          </Button>

          <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#64748b' }} />

          <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#1E3A5F', cursor: 'pointer' }} size={36}>
                {currentUser?.nickname?.charAt(0) || '?'}
              </Avatar>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {currentUser?.nickname}
              </span>
            </Space>
          </Dropdown>
        </div>

        {/* 账号管理弹窗 */}
        <Modal
          title={
            <Space>
              <TeamOutlined />
              账号管理
              <Badge count={userListData.length} style={{ backgroundColor: '#1E3A5F' }} />
            </Space>
          }
          open={userModalVisible}
          onCancel={() => setUserModalVisible(false)}
          footer={null}
          width={600}
        >
          <div style={{ marginBottom: 12 }}>
            <Space style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                共注册 <strong>{userListData.length}</strong> 个账号
              </span>
            </Space>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => setAddUserModalVisible(true)}
              >
                添加账号
              </Button>
            </div>
          </div>

          <Table
            dataSource={userListData.map(u => ({ ...u, key: u.username }))}
            columns={[
              {
                title: '昵称',
                dataIndex: 'nickname',
                key: 'nickname',
                render: (nickname, record) => (
                  <Space>
                    <span style={{ fontWeight: 500 }}>{nickname}</span>
                    {record.isAdmin && (
                      <Tag color="gold" icon={<CrownOutlined />} style={{ fontSize: 11 }}>
                        管理员
                      </Tag>
                    )}
                    {currentUser?.username === record.username && (
                      <Tag color="blue" style={{ fontSize: 11 }}>当前登录</Tag>
                    )}
                  </Space>
                ),
              },
              {
                title: '用户名',
                dataIndex: 'username',
                key: 'username',
                render: v => <Tag color="blue">@{v}</Tag>,
              },
              {
                title: '创建日期',
                dataIndex: 'createdAt',
                key: 'createdAt',
              },
              {
                title: '操作',
                key: 'action',
                width: 120,
                render: (_, record) => {
                  const isOwn = currentUser?.username === record.username;
                  const isCurrent = currentUser?.isViewingAs && !isOwn;
                  return (
                    <Button
                      size="small"
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleSwitchUser(record.username)}
                      disabled={isOwn || isCurrent}
                    >
                      {isOwn ? '当前账号' : isCurrent ? '查看中' : '进入系统'}
                    </Button>
                  );
                },
              },
            ]}
            pagination={false}
            size="small"
          />
        </Modal>

        {/* 添加账号弹窗 */}
        <Modal
          title="➕ 添加账号"
          open={addUserModalVisible}
          onCancel={() => { setAddUserModalVisible(false); addUserForm.resetFields(); }}
          footer={null}
          width={400}
        >
          <Form form={addUserForm} layout="vertical" onFinish={handleAddUser}>
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3位' }
              ]}
            >
              <Input placeholder="设置登录用户名" />
            </Form.Item>
            <Form.Item
              name="nickname"
              label="昵称"
              rules={[{ required: true, message: '请输入昵称' }]}
            >
              <Input placeholder="设置显示昵称" />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 4, message: '密码至少4位' }
              ]}
            >
              <Input.Password placeholder="设置登录密码" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              添加账号
            </Button>
          </Form>
        </Modal>
      </header>
    </>
  );
}

export default Header;
