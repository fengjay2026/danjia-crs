import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Row, Col, Button, Space, Input, Select,
  Modal, Form, DatePicker, message, Typography,
  Empty, Divider, Progress, Badge, Timeline
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined,
  ClockCircleOutlined, CheckCircleOutlined, WarningOutlined,
  BellOutlined, SearchOutlined, FilterOutlined, StarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStudents } from '../data/store';
import { pushScheduleToFirebase, removeScheduleFromFirebase } from '../data/firebase-sync';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 任务优先级配置
const PRIORITY_CONFIG = {
  high: { label: '紧急', color: 'red', icon: <WarningOutlined /> },
  medium: { label: '重要', color: 'orange', icon: <BellOutlined /> },
  low: { label: '一般', color: 'blue', icon: <ClockCircleOutlined /> },
};

// 任务类型配置
const TASK_TYPE_CONFIG = {
  followup: { label: '跟进', color: '#1E3A5F' },
  ielts: { label: '雅思', color: '#722ED1' },
  document: { label: '文书', color: '#52C41A' },
  application: { label: '申请', color: '#1890FF' },
  meeting: { label: '会议', color: '#FA8C16' },
  other: { label: '其他', color: '#8C8C8C' },
};

// localStorage keys
const SCHEDULE_STORAGE_KEY = 'danjia_schedule_items';

// 从 localStorage 加载日程数据
const loadScheduleItems = () => {
  try {
    const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('加载日程数据失败:', e);
  }
  return [];
};

// 保存日程数据到 localStorage
const saveScheduleItems = (items) => {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('保存日程数据失败:', e);
  }
};

// 模拟日程数据（首次使用时的示例数据）
const mockScheduleItems = [
  {
    id: 1, studentId: 1, studentName: '张同学',
    title: '跟进PS定稿',
    type: 'document',
    priority: 'high',
    dueDate: '2026-04-25',
    status: 'pending',
    description: '张同学的PS第三稿需要反馈',
    createdAt: '2026-04-15',
  },
  {
    id: 2, studentId: 2, studentName: '李同学',
    title: '雅思口语陪练预约',
    type: 'ielts',
    priority: 'medium',
    dueDate: '2026-04-28',
    status: 'pending',
    description: '预约下周三下午的口语陪练',
    createdAt: '2026-04-18',
  },
];

const ScheduleManager = () => {
  const navigate = useNavigate();
  const [scheduleItems, setScheduleItems] = useState(loadScheduleItems);
  const [students, setStudents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [selectedSeasons, setSelectedSeasons] = useState(['26Fall', '27Fall']);
  const [form] = Form.useForm();
  const [editingScheduleCell, setEditingScheduleCell] = useState(null); // { id, field } 内联编辑

  useEffect(() => {
    loadStudents();
    // 监听申请季筛选变化
    const handleSeasonChange = (e) => {
      setSelectedSeasons(e.detail);
    };
    window.addEventListener('seasonFilterChange', handleSeasonChange);
    
    // 初始加载
    const saved = localStorage.getItem('selectedSeasons');
    if (saved) {
      try {
        setSelectedSeasons(JSON.parse(saved));
      } catch (e) {}
    }
    
    return () => {
      window.removeEventListener('seasonFilterChange', handleSeasonChange);
    };
  }, []);

  // 数据持久化：scheduleItems 变化时自动保存到 localStorage
  useEffect(() => {
    saveScheduleItems(scheduleItems);
  }, [scheduleItems]);

  const loadStudents = () => {
    const data = getStudents();
    setStudents(data);
  };

  // 根据申请季筛选学生
  const getFilteredStudents = () => {
    if (selectedSeasons.length === 0) return students;
    return students.filter(s => selectedSeasons.includes(s.season));
  };

  // 过滤后的日程
  const filteredItems = scheduleItems.filter(item => {
    const matchesSearch = searchText === '' ||
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesStudent = studentFilter === 'all' || item.studentId?.toString() === studentFilter;
    
    // 截止日期筛选
    let matchesDate = true;
    if (dueDateFilter !== 'all') {
      const today = dayjs().startOf('day');
      const dueDate = dayjs(item.dueDate);
      
      switch (dueDateFilter) {
        case 'today':
          matchesDate = dueDate.isSame(today, 'day');
          break;
        case 'tomorrow':
          matchesDate = dueDate.isSame(today.add(1, 'day'), 'day');
          break;
        case 'thisWeek':
          matchesDate = dueDate.isSame(today, 'week');
          break;
        case 'thisMonth':
          matchesDate = dueDate.isSame(today, 'month');
          break;
        case 'overdue':
          matchesDate = dueDate.isBefore(today, 'day') && item.status !== 'completed';
          break;
        case 'noDate':
          matchesDate = !item.dueDate;
          break;
        default:
          matchesDate = true;
      }
    }
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesStudent && matchesDate;
  });

  // 统计数据
  const stats = {
    total: scheduleItems.length,
    pending: scheduleItems.filter(i => i.status === 'pending').length,
    overdue: scheduleItems.filter(i => i.status === 'overdue').length,
    completed: scheduleItems.filter(i => i.status === 'completed').length,
    today: scheduleItems.filter(i => i.dueDate === dayjs().format('YYYY-MM-DD')).length,
  };

  // 打开新增/编辑弹窗
  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue({
        ...item,
        dueDate: item.dueDate ? dayjs(item.dueDate) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        dueDate: dayjs().add(7, 'day'),
        priority: 'medium',
        type: 'followup',
        status: 'pending',
      });
    }
    setModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const itemData = {
        ...values,
        dueDate: values.dueDate?.format('YYYY-MM-DD') || '',
        studentId: values.studentId ? parseInt(values.studentId) : null,
        studentName: students.find(s => s.id.toString() === values.studentId)?.name || '',
        status: values.status || 'pending',
      };

      if (editingItem) {
        const updated = { ...editingItem, ...itemData };
        setScheduleItems(prev => prev.map(i => i.id === editingItem.id ? updated : i));
        pushScheduleToFirebase(updated);
        message.success('日程已更新');
      } else {
        const newItem = { ...itemData, id: Date.now(), createdAt: dayjs().format('YYYY-MM-DD') };
        setScheduleItems(prev => [...prev, newItem]);
        pushScheduleToFirebase(newItem);
        message.success('日程已添加');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (err) {
      console.error('表单验证失败:', err);
    }
  };

  // 删除日程
  const handleDelete = (id) => {
    setScheduleItems(prev => prev.filter(i => i.id !== id));
    removeScheduleFromFirebase(id);
    message.success('日程已删除');
  };

  // 内联编辑：开始编辑
  const startScheduleEdit = (id, field) => {
    setEditingScheduleCell({ id, field });
  };

  // 内联编辑：保存
  const saveScheduleEdit = (newValue) => {
    if (!editingScheduleCell) return;
    const { id, field } = editingScheduleCell;
    const updatedItems = scheduleItems.map(item =>
      item.id === id ? { ...item, [field]: newValue } : item
    );
    setScheduleItems(updatedItems);
    setEditingScheduleCell(null);
    // 找到刚更新的项同步到 Firebase
    const updated = updatedItems.find(i => i.id === id);
    if (updated) pushScheduleToFirebase(updated);
    message.success('已更新');
  };

  // 获取状态标签
  const getStatusTag = (status) => {
    if (status === 'completed') {
      return <Tag icon={<CheckCircleOutlined />} color="success">已完成</Tag>;
    }
    if (status === 'overdue') {
      return <Tag icon={<WarningOutlined />} color="error">已逾期</Tag>;
    }
    return <Tag icon={<ClockCircleOutlined />} color="processing">待处理</Tag>;
  };

  // 获取优先级标签
  const getPriorityTag = (priority) => {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;
    return (
      <Tag icon={config.icon} color={config.color}>
        {config.label}
      </Tag>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '状态',
      key: 'status',
      width: 60,
      render: (_, record) => (
        <span
          style={{ cursor: 'pointer', display: 'inline-block' }}
          onClick={() => handleDelete(record.id)}
          title="点击删除此任务"
        >
          {getStatusTag(record.status)}
        </span>
      ),
    },
    {
      title: '待办事项',
      key: 'title',
      render: (_, record) => {
        const isEditing = editingScheduleCell?.id === record.id && editingScheduleCell?.field === 'title';
        return isEditing ? (
          <Input
            autoFocus size="small" defaultValue={record.title}
            onBlur={(e) => saveScheduleEdit(e.target.value)}
            onPressEnter={(e) => saveScheduleEdit(e.target.value)}
            style={{ width: 180 }}
          />
        ) : (
          <span
            onClick={() => startScheduleEdit(record.id, 'title')}
            style={{
              fontWeight: 500, cursor: 'pointer',
              textDecoration: record.status === 'completed' ? 'line-through' : 'none',
              color: record.status === 'completed' ? '#8C8C8C' : '#333',
            }}
            title="点击修改"
          >
            {record.title}
          </span>
        );
      },
    },
    {
      title: '内容详情',
      key: 'description',
      render: (_, record) => {
        const isEditing = editingScheduleCell?.id === record.id && editingScheduleCell?.field === 'description';
        return isEditing ? (
          <Input
            autoFocus size="small" defaultValue={record.description || ''}
            onBlur={(e) => saveScheduleEdit(e.target.value)}
            onPressEnter={(e) => saveScheduleEdit(e.target.value)}
            style={{ width: 250 }}
            placeholder="添加详情..."
          />
        ) : (
          <span
            onClick={() => startScheduleEdit(record.id, 'description')}
            style={{ cursor: 'pointer', fontSize: 13, color: record.description ? '#555' : '#ccc' }}
            title="点击修改"
          >
            {record.description || <span style={{ fontStyle: 'italic' }}>无详情</span>}
          </span>
        );
      },
    },
    {
      title: '关联学生',
      key: 'student',
      width: 100,
      render: (_, record) => record.studentName ? (
        <Tag
          color="blue"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/students/${record.studentId}`)}
        >
          {record.studentName}
        </Tag>
      ) : <Text type="secondary">-</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => (
        <Tag color={TASK_TYPE_CONFIG[type]?.color || '#8C8C8C'}>
          {TASK_TYPE_CONFIG[type]?.label || '其他'}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => getPriorityTag(priority),
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 100,
      render: (date, record) => {
        if (!date) return <Text type="secondary">-</Text>;
        const isOverdue = record.status !== 'completed' && dayjs(date).isBefore(dayjs(), 'day');
        return (
          <Text type={isOverdue ? 'danger' : 'secondary'}>
            {date}
          </Text>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openModal(record)} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1F2937' }}>📅 日程管理</Title>
          <Text type="secondary">管理待办事项和日程安排</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          添加待办
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1E3A5F' }}>{stats.total}</div>
              <div style={{ fontSize: 14, color: '#8C8C8C' }}>总任务</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1890FF' }}>{stats.pending}</div>
              <div style={{ fontSize: 14, color: '#8C8C8C' }}>待处理</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: stats.overdue > 0 ? '#FFF1F0' : undefined }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: stats.overdue > 0 ? '#FF4D4F' : '#8C8C8C' }}>{stats.overdue}</div>
              <div style={{ fontSize: 14, color: '#8C8C8C' }}>已逾期</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#52C41A' }}>{stats.completed}</div>
              <div style={{ fontSize: 14, color: '#8C8C8C' }}>已完成</div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: stats.today > 0 ? '#FA8C16' : '#8C8C8C' }}>{stats.today}</div>
              <div style={{ fontSize: 14, color: '#8C8C8C' }}>今日截止</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选区域 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col span={5}>
            <Input
              placeholder="搜索待办事项..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select placeholder="按学生筛选" value={studentFilter} onChange={setStudentFilter} style={{ width: '100%' }} allowClear>
              <Option value="all">全部学生</Option>
              {getFilteredStudents().map(s => (
                <Option key={s.id} value={s.id.toString()}>{s.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select placeholder="任务类型" value={typeFilter} onChange={setTypeFilter} style={{ width: '100%' }} allowClear>
              <Option value="all">全部类型</Option>
              {Object.entries(TASK_TYPE_CONFIG).map(([key, val]) => (
                <Option key={key} value={key}>{val.label}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select placeholder="优先级" value={priorityFilter} onChange={setPriorityFilter} style={{ width: '100%' }} allowClear>
              <Option value="all">全部优先级</Option>
              {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                <Option key={key} value={key}>{val.label}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select placeholder="截止日期" value={dueDateFilter} onChange={setDueDateFilter} style={{ width: '100%' }} allowClear>
              <Option value="all">全部日期</Option>
              <Option value="today">今天</Option>
              <Option value="tomorrow">明天</Option>
              <Option value="thisWeek">本周</Option>
              <Option value="thisMonth">本月</Option>
              <Option value="overdue">已逾期</Option>
              <Option value="noDate">未设置日期</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select placeholder="状态" value={statusFilter} onChange={setStatusFilter} style={{ width: '100%' }} allowClear>
              <Option value="all">全部状态</Option>
              <Option value="pending">待处理</Option>
              <Option value="overdue">已逾期</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Text type="secondary">共 {filteredItems.length} 条</Text>
            <div style={{ fontSize: 11, color: '#8C8C8C' }}>
              申请季: {selectedSeasons.join(', ')}
            </div>
          </Col>
        </Row>
      </Card>

      {/* 待办列表 */}
      <Card>
        {filteredItems.length === 0 ? (
          <Empty description="暂无待办事项" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              添加第一个待办
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredItems}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            size="middle"
          />
        )}
      </Card>

      {/* 添加/编辑弹窗 */}
      <Modal
        title={editingItem ? '✏️ 编辑待办' : '➕ 添加待办'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="待办事项"
            rules={[{ required: true, message: '请输入待办事项' }]}
          >
            <Input placeholder="输入待办内容..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="studentId" label="关联学生">
                <Select placeholder="选择学生（可选）" allowClear>
                  {students.map(s => (
                    <Option key={s.id} value={s.id.toString()}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="任务类型">
                <Select placeholder="选择类型">
                  {Object.entries(TASK_TYPE_CONFIG).map(([key, val]) => (
                    <Option key={key} value={key}>{val.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级">
                <Select placeholder="选择优先级">
                  {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                    <Option key={key} value={key}>{val.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="截止日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="详细描述">
            <TextArea rows={3} placeholder="补充说明..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleManager;
