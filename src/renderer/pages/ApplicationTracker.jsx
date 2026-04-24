import React, { useState, useEffect } from 'react';
import {
  Card, Button, Tag, Space, Table, Modal, Form, Input, Select,
  DatePicker, Row, Col, Statistic, Progress, Timeline, Tooltip,
  message, Popconfirm, Badge, Empty, Divider, Typography, Avatar
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, TrophyOutlined, FallOutlined, UserOutlined,
  BankOutlined, BookOutlined, FilterOutlined, WarningOutlined,
  FieldTimeOutlined, BellOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStudents } from '../data/store';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 申请状态配置
const STATUS_CONFIG = {
  pending: { label: '未开始', color: 'default', icon: <ClockCircleOutlined />, bg: '#F0F0F0' },
  writing: { label: '文书中', color: 'processing', icon: <EditOutlined />, bg: '#E6F7FF' },
  submitted: { label: '已提交', color: 'blue', icon: <SendOutlined />, bg: '#D9ECFF' },
  waiting: { label: '等待结果', color: 'warning', icon: <SyncOutlined spin />, bg: '#FFF7E6' },
  offer: { label: 'Offer', color: 'success', icon: <TrophyOutlined />, bg: '#F6FFED' },
  reject: { label: 'Reject', color: 'error', icon: <CloseCircleOutlined />, bg: '#FFF1F0' },
  waitlist: { label: 'Waitlist', color: 'purple', icon: <FieldTimeOutlined />, bg: '#F9F0FF' },
};

// 申请类型配置
const TYPE_CONFIG = {
  reach: { label: '冲刺', color: 'red' },
  match: { label: '主申', color: 'orange' },
  safety: { label: '保底', color: 'green' },
};

// 状态流转顺序
const STATUS_FLOW = ['pending', 'writing', 'submitted', 'waiting', 'offer', 'reject', 'waitlist'];

// 模拟申请数据
const mockApplications = [
  { id: 1, student_id: 1, student_name: '张同学', school: '香港大学', program: '计算机科学硕士', type: 'reach', status: 'submitted', submitted_date: '2026-04-01', result_date: '2026-06-15', notes: '第一批申请' },
  { id: 2, student_id: 1, student_name: '张同学', school: '香港中文大学', program: '数据科学硕士', type: 'match', status: 'waiting', submitted_date: '2026-03-28', result_date: '2026-06-01', notes: '' },
  { id: 3, student_id: 1, student_name: '张同学', school: 'NUS', program: 'CS PhD', type: 'reach', status: 'writing', submitted_date: null, result_date: null, notes: '需要陶瓷' },
  { id: 4, student_id: 2, student_name: '李同学', school: '帝国理工学院', program: '金融硕士', type: 'reach', status: 'offer', submitted_date: '2026-01-15', result_date: '2026-04-10', notes: '已录取！' },
  { id: 5, student_id: 2, student_name: '李同学', school: 'LSE', program: '金融与会计', type: 'match', status: 'offer', submitted_date: '2026-01-20', result_date: '2026-04-15', notes: '补交了材料' },
  { id: 6, student_id: 2, student_name: '李同学', school: 'HKUST', program: '金融科技', type: 'safety', status: 'offer', submitted_date: '2026-02-01', result_date: '2026-03-20', notes: '' },
  { id: 7, student_id: 3, student_name: '王同学', school: 'NUS', program: '统计学硕士', type: 'match', status: 'submitted', submitted_date: '2026-04-05', result_date: '2026-06-30', notes: '' },
  { id: 8, student_id: 3, student_name: '王同学', school: 'NTU', program: '数据科学', type: 'safety', status: 'waiting', submitted_date: '2026-03-15', result_date: '2026-05-30', notes: '' },
  { id: 9, student_id: 4, student_name: '赵同学', school: '香港中文大学', program: '商业分析', type: 'match', status: 'offer', submitted_date: '2026-01-10', result_date: '2026-03-25', notes: 'CUHK offer到手！' },
  { id: 10, student_id: 5, student_name: '陈同学', school: '爱丁堡大学', program: '教育学硕士', type: 'match', status: 'writing', submitted_date: null, result_date: null, notes: '等待PS定稿' },
];

const ApplicationTracker = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState(mockApplications);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedSeasons, setSelectedSeasons] = useState(['26Fall']);
  const [form] = Form.useForm();

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

  const loadStudents = () => {
    const data = getStudents();
    setStudents(data);
  };

  // 根据申请季获取学生
  const getFilteredStudents = () => {
    return students.filter(s => selectedSeasons.includes(s.season));
  };

  // 过滤后的申请
  const filteredApps = applications.filter(app => {
    // 根据申请季筛选学生
    const targetStudent = students.find(s => s.id === app.student_id);
    const matchesSeason = !targetStudent || selectedSeasons.includes(targetStudent.season);
    
    const matchesSearch = searchText === '' ||
      app.school.toLowerCase().includes(searchText.toLowerCase()) ||
      app.program.toLowerCase().includes(searchText.toLowerCase()) ||
      app.student_name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesType = typeFilter === 'all' || app.type === typeFilter;
    const matchesStudent = studentFilter === 'all' || app.student_id.toString() === studentFilter || app.student_name === studentFilter;
    return matchesSearch && matchesStatus && matchesType && matchesStudent && matchesSeason;
  });

  // 计算统计数据
  const stats = {
    total: filteredApps.length,
    pending: filteredApps.filter(a => a.status === 'pending').length,
    writing: filteredApps.filter(a => a.status === 'writing').length,
    submitted: filteredApps.filter(a => a.status === 'submitted').length,
    waiting: filteredApps.filter(a => a.status === 'waiting').length,
    offer: filteredApps.filter(a => a.status === 'offer').length,
    reject: filteredApps.filter(a => a.status === 'reject').length,
    waitlist: filteredApps.filter(a => a.status === 'waitlist').length,
  };

  // 按学校统计
  const schoolStats = applications.reduce((acc, app) => {
    acc[app.school] = acc[app.school] || { total: 0, offer: 0, reject: 0, waiting: 0 };
    acc[app.school].total++;
    if (app.status === 'offer') acc[app.school].offer++;
    if (app.status === 'reject') acc[app.school].reject++;
    if (app.status === 'waiting') acc[app.school].waiting++;
    return acc;
  }, {});

  // 打开新增/编辑弹窗
  const openModal = (app = null) => {
    setEditingApp(app);
    if (app) {
      form.setFieldsValue({
        ...app,
        submitted_date: app.submitted_date ? dayjs(app.submitted_date) : null,
        result_date: app.result_date ? dayjs(app.result_date) : null,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const appData = {
        ...values,
        submitted_date: values.submitted_date?.format('YYYY-MM-DD') || null,
        result_date: values.result_date?.format('YYYY-MM-DD') || null,
        student_id: editingApp?.student_id || 1,
        student_name: editingApp?.student_name || '张同学',
      };

      if (editingApp) {
        setApplications(prev => prev.map(a => a.id === editingApp.id ? { ...a, ...appData } : a));
        message.success('申请目标已更新');
      } else {
        const newApp = { ...appData, id: Date.now(), status: 'pending' };
        setApplications(prev => [...prev, newApp]);
        message.success('申请目标已添加');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (err) {
      console.error('表单验证失败:', err);
    }
  };

  // 删除申请
  const handleDelete = (id) => {
    setApplications(prev => prev.filter(a => a.id !== id));
    message.success('申请目标已删除');
  };

  // 批量状态更新
  const handleStatusChange = (id, newStatus) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    message.success(`状态已更新为 ${STATUS_CONFIG[newStatus]?.label}`);
  };

  // 渲染状态标签
  const renderStatusTag = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <Tag icon={config.icon} color={config.color} style={{ margin: 0 }}>
        {config.label}
      </Tag>
    );
  };

  // 渲染跟催进度
  const renderFollowUpProgress = (app) => {
    const steps = [
      { label: '材料', done: true },
      { label: '文书', done: app.status !== 'pending' },
      { label: '提交', done: app.status === 'submitted' || app.status === 'waiting' || app.status === 'offer' || app.status === 'reject' },
      { label: '跟进', done: app.status === 'waiting' || app.status === 'offer' || app.status === 'reject' },
      { label: '结果', done: app.status === 'offer' || app.status === 'reject' },
    ];
    
    const doneCount = steps.filter(s => s.done).length;
    const percent = Math.round((doneCount / steps.length) * 100);
    
    return (
      <Tooltip title={
        <div>
          {steps.map((step, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              {step.done ? '✓' : '○'} {step.label}
            </div>
          ))}
        </div>
      }>
        <div style={{ minWidth: 80 }}>
          <Progress percent={percent} size="small" steps={5} strokeColor="#52C41A" />
          <div style={{ fontSize: 10, color: '#8C8C8C', textAlign: 'center' }}>{percent}%</div>
        </div>
      </Tooltip>
    );
  };

  // 渲染状态流转时间线
  const renderStatusTimeline = (app) => {
    const currentIndex = STATUS_FLOW.indexOf(app.status);
    const steps = [
      { status: 'pending', label: '未开始', date: null },
      { status: 'writing', label: '文书中', date: null },
      { status: 'submitted', label: '已提交', date: app.submitted_date },
      { status: 'waiting', label: '等待结果', date: null },
      { status: 'offer', label: 'Offer', date: app.status === 'offer' ? app.result_date : null },
      { status: 'reject', label: 'Reject', date: app.status === 'reject' ? app.result_date : null },
    ];

    return (
      <Timeline
        items={steps.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const isEnd = app.status === 'offer' ? step.status === 'offer' :
                        app.status === 'reject' ? step.status === 'reject' :
                        step.status === STATUS_FLOW[currentIndex];
          return {
            color: isCompleted ? '#1E3A5F' : 'gray',
            children: (
              <div style={{
                opacity: isCompleted ? 1 : 0.4,
                fontSize: isCurrent ? '13px' : '12px',
                fontWeight: isCurrent ? 600 : 400,
              }}>
                <div>{step.label}</div>
                {step.date && <Text type="secondary" style={{ fontSize: '11px' }}>{step.date}</Text>}
              </div>
            ),
          };
        })}
      />
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '学生',
      key: 'student',
      width: 100,
      render: (_, record) => (
        <Tag
          color="blue"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/students/${record.student_id}`)}
        >
          {record.student_name}
        </Tag>
      ),
    },
    {
      title: '学校名称',
      dataIndex: 'school',
      key: 'school',
      width: 150,
      render: (text) => <Text><BankOutlined style={{ marginRight: 4, color: '#1E3A5F' }} />{text}</Text>,
    },
    {
      title: '专业名称',
      dataIndex: 'program',
      key: 'program',
      width: 160,
      render: (text) => <Text><BookOutlined style={{ marginRight: 4, color: '#722ED1' }} />{text}</Text>,
    },
    {
      title: '申请类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      align: 'center',
      render: (type) => <Tag color={TYPE_CONFIG[type]?.color}>{TYPE_CONFIG[type]?.label}</Tag>,
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => renderStatusTag(status),
    },
    {
      title: '跟催进度',
      key: 'followup',
      width: 130,
      render: (_, record) => renderFollowUpProgress(record),
    },
    {
      title: '提交日期',
      dataIndex: 'submitted_date',
      key: 'submitted_date',
      width: 110,
      render: (date) => date || <Text type="secondary">—</Text>,
    },
    {
      title: '结果日期',
      dataIndex: 'result_date',
      key: 'result_date',
      width: 110,
      render: (date) => date || <Text type="secondary">—</Text>,
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 140,
      ellipsis: true,
      render: (text) => text ? <Tooltip title={text}><Text style={{ fontSize: '12px' }}>{text}</Text></Tooltip> : <Text type="secondary">—</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Select
            value={record.status}
            onChange={(val) => handleStatusChange(record.id, val)}
            size="small"
            style={{ width: 100 }}
            onClick={(e) => e.stopPropagation()}
          >
            {STATUS_FLOW.map(s => (
              <Option key={s} value={s}>{STATUS_CONFIG[s].label}</Option>
            ))}
          </Select>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openModal(record); }} />
          <Popconfirm title="确定删除？" onConfirm={(e) => { e.stopPropagation(); handleDelete(record.id); }} onCancel={(e) => e.stopPropagation()}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#F8FAFC', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1F2937' }}>申请追踪</Title>
          <Text type="secondary">管理所有申请目标与状态</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          新增申请目标
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={4}>
          <Card size="small">
            <Statistic title="总申请数" value={stats.total} valueStyle={{ color: '#1E3A5F', fontSize: '28px' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="待提交" value={stats.pending + stats.writing} valueStyle={{ color: '#FA8C16', fontSize: '28px' }} suffix={<EditOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="已提交" value={stats.submitted + stats.waiting} valueStyle={{ color: '#1890FF', fontSize: '28px' }} suffix={<SendOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Offer" value={stats.offer} valueStyle={{ color: '#52C41A', fontSize: '28px' }} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Reject" value={stats.reject} valueStyle={{ color: '#FF4D4F', fontSize: '28px' }} prefix={<FallOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Waitlist" value={stats.waitlist} valueStyle={{ color: '#722ED1', fontSize: '28px' }} suffix={<FieldTimeOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* 筛选区 */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={5}>
            <Select
              placeholder="按学生筛选"
              value={studentFilter}
              onChange={setStudentFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="all">全部学生</Option>
              {getFilteredStudents().map(s => (
                <Option key={s.id} value={s.id.toString()}>{s.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Input
              placeholder="搜索学校/项目..."
              prefix={<FilterOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select placeholder="状态筛选" value={statusFilter} onChange={setStatusFilter} style={{ width: '100%' }} allowClear>
              <Option value="all">全部状态</Option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <Option key={key} value={key}>{val.label}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select placeholder="申请类型" value={typeFilter} onChange={setTypeFilter} style={{ width: '100%' }} allowClear>
              <Option value="all">全部类型</Option>
              {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                <Option key={key} value={key}>{val.label}</Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Text type="secondary">共 {filteredApps.length} 条申请记录</Text>
          </Col>
        </Row>
      </Card>

      {/* 学校统计 */}
      <Card size="small" title="📊 各校申请统计" style={{ marginBottom: '16px' }}>
        <Row gutter={[12, 12]}>
          {Object.entries(schoolStats).map(([school, data]) => (
            <Col span={6} key={school}>
              <Card size="small" style={{ background: '#FAFAFA' }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{school}</div>
                <Space split={<span style={{ color: '#CCC' }}>|</span>} size="small">
                  <Tag color="blue">总计 {data.total}</Tag>
                  <Tag color="success">Offer {data.offer}</Tag>
                  <Tag color="warning">等待 {data.waiting}</Tag>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 申请列表 */}
      <Card>
        {filteredApps.length === 0 ? (
          <Empty description="暂无申请记录" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredApps}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 1200 }}
            onRow={(record) => ({
              onClick: () => openModal(record),
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingApp ? '编辑申请目标' : '新增申请目标'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        okText={editingApp ? '保存' : '添加'}
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" size="middle">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="student_name" label="学生姓名" rules={[{ required: true, message: '请输入学生姓名' }]}>
                <Input placeholder="学生姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="申请类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="选择申请类型">
                  {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                    <Option key={key} value={key}>{val.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="school" label="学校名称" rules={[{ required: true, message: '请输入学校名称' }]}>
                <Input placeholder="如：香港大学" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="program" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
                <Input placeholder="如：计算机科学硕士" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="submitted_date" label="提交日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="result_date" label="出结果日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="申请状态">
            <Select>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <Option key={key} value={key}>{val.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="补充说明..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApplicationTracker;
