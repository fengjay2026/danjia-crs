import React, { useState } from 'react';
import {
  Card, Button, Tag, Space, Table, Modal, Form, Input, Select,
  DatePicker, Row, Col, Statistic, Timeline, Tooltip, Progress,
  message, Popconfirm, Empty, Divider, Typography, Avatar, Badge,
  Upload, Timeline as AntTimeline, Alert, StatisticCard
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
  ClockCircleOutlined, BulbOutlined, FileTextOutlined, DiffOutlined,
  CheckCircleOutlined, SendOutlined, WarningOutlined, SyncOutlined,
  UserOutlined, BellOutlined, HistoryOutlined, EyeOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(isSameOrBefore);
dayjs.extend(relativeTime);

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

// 文书类型配置
const DOC_TYPE_CONFIG = {
  // 核心文书
  PS: { label: 'Personal Statement', shortLabel: 'PS', icon: <FileTextOutlined />, color: '#1E3A5F', category: 'core' },
  CV: { label: 'Curriculum Vitae', shortLabel: 'CV', icon: <UserOutlined />, color: '#722ED1', category: 'core' },
  SOP: { label: 'Statement of Purpose', shortLabel: 'SOP', icon: <FileTextOutlined />, color: '#0891B2', category: 'core' },
  // 推荐信
  RL1: { label: '推荐信 #1', shortLabel: 'RL1', icon: <UserOutlined />, color: '#52C41A', category: 'reference' },
  RL2: { label: '推荐信 #2', shortLabel: 'RL2', icon: <UserOutlined />, color: '#13C2C2', category: 'reference' },
  RL3: { label: '推荐信 #3', shortLabel: 'RL3', icon: <UserOutlined />, color: '#FA8C16', category: 'reference' },
  // 学术材料
  Transcript: { label: '成绩单', shortLabel: '成绩单', icon: <FileTextOutlined />, color: '#EB2F96', category: 'academic' },
  EnrollmentLetter: { label: '在读证明', shortLabel: '在读证明', icon: <FileTextOutlined />, color: '#722ED1', category: 'academic' },
  // 身份材料
  Passport: { label: '护照', shortLabel: '护照', icon: <FileTextOutlined />, color: '#1890FF', category: 'identity' },
  IDCard: { label: '身份证', shortLabel: '身份证', icon: <FileTextOutlined />, color: '#13C2C2', category: 'identity' },
  HKMP: { label: '港澳通行证', shortLabel: '通行证', icon: <FileTextOutlined />, color: '#FA8C16', category: 'identity' },
  // 作品集
  Portfolio: { label: '作品集', shortLabel: '作品集', icon: <DiffOutlined />, color: '#F5222D', category: 'portfolio' },
};

// 文书状态配置
const DOC_STATUS_CONFIG = {
  collecting: { label: '搜集材料', color: 'default', bg: '#F0F0F0', icon: <ClockCircleOutlined /> },
  in_progress: { label: '制作中', color: 'processing', bg: '#E6F7FF', icon: <EditOutlined /> },
  completed: { label: '已完成', color: 'success', bg: '#F6FFED', icon: <CheckCircleOutlined /> },
  student_feedback: { label: '学生反馈中', color: 'warning', bg: '#FFF7E6', icon: <BulbOutlined /> },
};

// 状态流转
const STATUS_FLOW = ['collecting', 'in_progress', 'completed', 'student_feedback'];

// 模拟文书数据
const mockDocuments = [
  {
    id: 1, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'PS', status: 'in_progress', current_version: 'V3', deadline: '2026-04-30',
    updated_at: '2026-04-08',
    versions: [
      { version: 'V1', date: '2026-03-10', note: '初稿完成', file: 'PS_V1.docx' },
      { version: 'V2', date: '2026-03-25', note: '第二稿，修改了动机部分', file: 'PS_V2.docx' },
      { version: 'V3', date: '2026-04-08', note: '第三稿，顾问反馈修改中', file: 'PS_V3.docx' },
    ],
    notes: '港大申请需要特定结构',
  },
  {
    id: 2, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'CV', status: 'completed', current_version: 'V2', deadline: '2026-04-25',
    updated_at: '2026-03-20',
    versions: [
      { version: 'V1', date: '2026-03-01', note: '初稿', file: 'CV_V1.docx' },
      { version: 'V2', date: '2026-03-20', note: '定稿版', file: 'CV_V2.docx' },
    ],
    notes: '',
  },
  {
    id: 3, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'SOP', status: 'collecting', current_version: null, deadline: '2026-05-15',
    updated_at: '2026-04-10',
    versions: [],
    notes: 'NUS PhD申请专用',
  },
  {
    id: 4, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'RL1', status: 'student_feedback', current_version: 'V1', deadline: '2026-03-20',
    updated_at: '2026-04-12',
    versions: [
      { version: 'V1', date: '2026-03-15', note: '教授签字版', file: 'RL1_final.pdf' },
    ],
    notes: 'Professor Wang 推荐信',
  },
  {
    id: 5, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'RL2', status: 'completed', current_version: 'V1', deadline: '2026-04-01',
    updated_at: '2026-03-28',
    versions: [
      { version: 'V1', date: '2026-03-28', note: '定稿', file: 'RL2_final.pdf' },
    ],
    notes: '实习导师推荐信',
  },
  {
    id: 6, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'RL3', status: 'collecting', current_version: null, deadline: '2026-05-01',
    updated_at: '2026-04-15',
    versions: [],
    notes: '实习主管推荐信，需联系',
  },
  // 学术材料
  {
    id: 7, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'Transcript', status: 'completed', current_version: 'V1', deadline: '2026-04-15',
    updated_at: '2026-04-10',
    versions: [
      { version: 'V1', date: '2026-04-10', note: '中英文成绩单', file: 'transcript.pdf' },
    ],
    notes: '教务处开具，需公证',
  },
  {
    id: 8, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'EnrollmentLetter', status: 'collecting', current_version: null, deadline: '2026-04-20',
    updated_at: '2026-04-15',
    versions: [],
    notes: '在读证明，正在申请',
  },
  // 身份材料
  {
    id: 9, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'Passport', status: 'completed', current_version: 'V1', deadline: '2026-04-10',
    updated_at: '2026-04-05',
    versions: [
      { version: 'V1', date: '2026-04-05', note: '护照扫描件', file: 'passport.pdf' },
    ],
    notes: '有效期至2029年',
  },
  {
    id: 10, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'IDCard', status: 'completed', current_version: 'V1', deadline: '2026-04-15',
    updated_at: '2026-04-05',
    versions: [
      { version: 'V1', date: '2026-04-05', note: '身份证正反面', file: 'idcard.pdf' },
    ],
    notes: '',
  },
  {
    id: 11, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'HKMP', status: 'collecting', current_version: null, deadline: '2026-05-01',
    updated_at: '2026-04-15',
    versions: [],
    notes: '尚未办理，需预约',
  },
  // 作品集
  {
    id: 12, student_id: 1, student_name: '张同学', target_major: 'CS',
    doc_type: 'Portfolio', status: 'in_progress', current_version: 'V2', deadline: '2026-05-15',
    updated_at: '2026-04-14',
    versions: [
      { version: 'V1', date: '2026-04-01', note: '初版作品集', file: 'portfolio_v1.pdf' },
      { version: 'V2', date: '2026-04-14', note: '新增项目案例', file: 'portfolio_v2.pdf' },
    ],
    notes: '设计类项目展示',
  },
  {
    id: 13, student_id: 2, student_name: '李同学', target_major: 'Finance',
    doc_type: 'PS', status: 'completed', current_version: 'V4', deadline: '2026-01-31',
    updated_at: '2026-01-28',
    versions: [
      { version: 'V1', date: '2026-01-05', note: '初稿' },
      { version: 'V2', date: '2026-01-12', note: '加入实习经历' },
      { version: 'V3', date: '2026-01-20', note: '精简字数' },
      { version: 'V4', date: '2026-01-28', note: '定稿提交' },
    ],
    notes: '已用于IC、LSE申请',
  },
  {
    id: 14, student_id: 2, student_name: '李同学', target_major: 'Finance',
    doc_type: 'CV', status: 'completed', current_version: 'V2', deadline: '2026-01-20',
    updated_at: '2026-01-18',
    versions: [
      { version: 'V1', date: '2026-01-10', note: '初稿' },
      { version: 'V2', date: '2026-01-18', note: '定稿' },
    ],
    notes: '',
  },
  {
    id: 15, student_id: 2, student_name: '李同学', target_major: 'Finance',
    doc_type: 'Transcript', status: 'completed', current_version: 'V1', deadline: '2026-01-15',
    updated_at: '2026-01-10',
    versions: [
      { version: 'V1', date: '2026-01-10', note: '中英文成绩单', file: 'transcript.pdf' },
    ],
    notes: '',
  },
  {
    id: 16, student_id: 3, student_name: '王同学', target_major: 'DS',
    doc_type: 'PS', status: 'in_progress', current_version: 'V2', deadline: '2026-04-28',
    updated_at: '2026-04-15',
    versions: [
      { version: 'V1', date: '2026-04-01', note: '初稿完成' },
      { version: 'V2', date: '2026-04-15', note: '第二稿，待反馈' },
    ],
    notes: 'NUS申请',
  },
  {
    id: 17, student_id: 3, student_name: '王同学', target_major: 'DS',
    doc_type: 'RL1', status: 'collecting', current_version: null, deadline: '2026-05-01',
    updated_at: '2026-04-15',
    versions: [],
    notes: '导师推荐信，需催促',
  },
];

const DocumentManager = () => {
  const [documents, setDocuments] = useState(mockDocuments);
  const [modalVisible, setModalVisible] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('all');
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  // 计算统计数据
  const stats = {
    total: documents.length,
    collecting: documents.filter(d => d.status === 'collecting').length,
    in_progress: documents.filter(d => d.status === 'in_progress').length,
    completed: documents.filter(d => d.status === 'completed').length,
    student_feedback: documents.filter(d => d.status === 'student_feedback').length,
  };

  // 即将截止的文书
  const upcomingDeadlines = documents
    .filter(d => d.deadline && dayjs(d.deadline).isSameOrBefore(dayjs().add(14, 'day')) && d.status !== 'submitted')
    .sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)))
    .slice(0, 5);

  // 过滤后的文书
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = search === '' ||
      doc.student_name.toLowerCase().includes(search.toLowerCase()) ||
      doc.target_major?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = docTypeFilter === 'all' || doc.doc_type === docTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // 打开新增/编辑弹窗
  const openModal = (doc = null) => {
    setEditingDoc(doc);
    if (doc) {
      form.setFieldsValue({
        ...doc,
        deadline: doc.deadline ? dayjs(doc.deadline) : null,
        updated_at: doc.updated_at ? dayjs(doc.updated_at) : null,
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
      const docData = {
        ...values,
        deadline: values.deadline?.format('YYYY-MM-DD') || null,
        updated_at: values.updated_at?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
        student_id: editingDoc?.student_id || 1,
        student_name: editingDoc?.student_name || '张同学',
        target_major: editingDoc?.target_major || 'CS',
      };

      if (editingDoc) {
        setDocuments(prev => prev.map(d => d.id === editingDoc.id ? { ...d, ...docData } : d));
        message.success('文书信息已更新');
      } else {
        const newDoc = { ...docData, id: Date.now(), versions: [], current_version: null };
        setDocuments(prev => [...prev, newDoc]);
        message.success('文书已添加');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (err) {
      console.error('表单验证失败:', err);
    }
  };

  // 删除文书
  const handleDelete = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    message.success('文书已删除');
  };

  // 上传新版本
  const handleUploadVersion = (doc) => {
    setViewingDoc(doc);
    setVersionModalVisible(true);
  };

  const handleVersionSubmit = (versionNote) => {
    if (!viewingDoc) return;
    const versionCount = (viewingDoc.versions?.length || 0) + 1;
    const newVersion = {
      version: `V${versionCount}`,
      date: dayjs().format('YYYY-MM-DD'),
      note: versionNote,
      file: `文档_V${versionCount}.docx`,
    };
    setDocuments(prev => prev.map(d =>
      d.id === viewingDoc.id
        ? { ...d, versions: [...(d.versions || []), newVersion], current_version: `V${versionCount}`, updated_at: dayjs().format('YYYY-MM-DD') }
        : d
    ));
    message.success(`已上传新版本 V${versionCount}`);
    setVersionModalVisible(false);
  };

  // 渲染状态进度
  const renderDocStatusProgress = (status) => {
    const currentIndex = STATUS_FLOW.indexOf(status);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {STATUS_FLOW.map((s, idx) => {
          const config = DOC_STATUS_CONFIG[s];
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <Tooltip key={s} title={config.label}>
              <div style={{
                width: 20,
                height: 6,
                borderRadius: 3,
                background: isCompleted || isCurrent ? config.color : '#E0E0E0',
                border: isCurrent ? '1px solid #333' : 'none',
                transition: 'all 0.3s',
              }} />
            </Tooltip>
          );
        })}
      </div>
    );
  };

  // 渲染状态标签
  const renderStatusTag = (status) => {
    const config = DOC_STATUS_CONFIG[status] || DOC_STATUS_CONFIG.not_started;
    return (
      <Tag icon={config.icon} color={config.color} style={{ margin: 0 }}>
        {config.label}
      </Tag>
    );
  };

  // 渲染截止日期警告
  const renderDeadlineWarning = (doc) => {
    if (!doc.deadline || doc.status === 'completed') return null;
    const daysUntil = dayjs(doc.deadline).diff(dayjs(), 'day');
    if (daysUntil < 0) {
      return <Tag icon={<ExclamationCircleOutlined />} color="error">已过期</Tag>;
    }
    if (daysUntil <= 3) {
      return <Tag icon={<WarningOutlined />} color="error">{daysUntil}天后截止</Tag>;
    }
    if (daysUntil <= 7) {
      return <Tag icon={<BellOutlined />} color="warning">{daysUntil}天后截止</Tag>;
    }
    return <Tag icon={<ClockCircleOutlined />} color="default">{daysUntil}天后</Tag>;
  };

  // 按学生分组
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const key = `${doc.student_name}-${doc.target_major}`;
    if (!acc[key]) acc[key] = { student_name: doc.student_name, target_major: doc.target_major, docs: [] };
    acc[key].docs.push(doc);
    return acc;
  }, {});

  // 表格列定义
  const columns = [
    {
      title: '文书类型',
      dataIndex: 'doc_type',
      key: 'doc_type',
      width: 120,
      render: (type) => {
        const config = DOC_TYPE_CONFIG[type] || {};
        return (
          <Space>
            <Tag icon={config.icon} style={{ background: config.color + '20', color: config.color, borderColor: config.color }}>
              {config.shortLabel || type}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: '学生',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 100,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '当前版本',
      dataIndex: 'current_version',
      key: 'current_version',
      width: 100,
      align: 'center',
      render: (v) => v ? <Badge count={v} style={{ backgroundColor: '#1E3A5F' }} /> : <Text type="secondary">—</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <div>
          {renderStatusTag(status)}
          <div style={{ marginTop: 4 }}>{renderDocStatusProgress(status)}</div>
        </div>
      ),
    },
    {
      title: '版本数',
      key: 'version_count',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Badge count={record.versions?.length || 0} showZero color="#1E3A5F" />
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 110,
      render: (date, record) => (
        <div>
          <Text>{date || '—'}</Text>
          <div>{renderDeadlineWarning(record)}</div>
        </div>
      ),
    },
    {
      title: '最后更新',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 100,
      render: (date) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {date ? dayjs(date).format('MM/DD') : '—'}
        </Text>
      ),
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" size="small" icon={<HistoryOutlined />} onClick={() => { setViewingDoc(record); setCompareModalVisible(true); }} />
          <Button type="primary" size="small" icon={<UploadOutlined />} onClick={() => handleUploadVersion(record)}>
            上传版本
          </Button>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openModal(record)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
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
          <Title level={4} style={{ margin: 0, color: '#1F2937' }}>文书材料管理</Title>
          <Text type="secondary">管理PS、CV、SOP、推荐信等文书材料</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          新增文书
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={4}>
          <Card size="small">
            <Statistic title="文书总数" value={stats.total} valueStyle={{ color: '#1E3A5F' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="搜集材料" value={stats.collecting} valueStyle={{ color: '#8C8C8C' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="制作中" value={stats.in_progress} valueStyle={{ color: '#1890FF' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#52C41A' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="学生反馈中" value={stats.student_feedback} valueStyle={{ color: '#FA8C16' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: upcomingDeadlines.length > 0 ? '#FFF2E6' : '#FAFAFA' }}>
            <Statistic title="即将截止" value={upcomingDeadlines.length} valueStyle={{ color: upcomingDeadlines.length > 0 ? '#FF4D4F' : '#52C41A' }} suffix={upcomingDeadlines.length > 0 ? <WarningOutlined /> : null} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 左侧：筛选和列表 */}
        <Col span={18}>
          {/* 筛选区 */}
          <Card size="small" style={{ marginBottom: '16px' }}>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Input
                  placeholder="搜索学生/专业..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={6}>
                <Select placeholder="文书状态" value={statusFilter} onChange={setStatusFilter} style={{ width: '100%' }} allowClear>
                  <Option value="all">全部状态</Option>
                  {Object.entries(DOC_STATUS_CONFIG).map(([key, val]) => (
                    <Option key={key} value={key}>{val.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Select placeholder="文书类型" value={docTypeFilter} onChange={setDocTypeFilter} style={{ width: '100%' }} allowClear>
                  <Option value="all">全部类型</Option>
                  {Object.entries(DOC_TYPE_CONFIG).map(([key, val]) => (
                    <Option key={key} value={key}>{val.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Text type="secondary">共 {filteredDocs.length} 条</Text>
              </Col>
            </Row>
          </Card>

          {/* 文书列表 */}
          <Card>
            {filteredDocs.length === 0 ? (
              <Empty description="暂无文书记录" />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredDocs}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
                scroll={{ x: 1100 }}
                size="middle"
              />
            )}
          </Card>
        </Col>

        {/* 右侧：截止提醒 & 状态说明 */}
        <Col span={6}>
          {/* 截止日期提醒 */}
          <Card
            size="small"
            title={<><WarningOutlined style={{ color: '#FA8C16' }} /> 截止日期提醒</>}
            style={{ marginBottom: '16px' }}
          >
            {upcomingDeadlines.length === 0 ? (
              <Empty description="暂无临近截止" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Timeline
                items={upcomingDeadlines.map(doc => ({
                  color: dayjs(doc.deadline).diff(dayjs(), 'day') <= 3 ? 'red' : 'orange',
                  children: (
                    <div key={doc.id}>
                      <Text strong style={{ fontSize: '12px' }}>{doc.student_name}</Text>
                      <Tag style={{ marginLeft: 4 }}>{DOC_TYPE_CONFIG[doc.doc_type]?.shortLabel}</Tag>
                      <div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {doc.deadline} · {dayjs(doc.deadline).fromNow()}
                        </Text>
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>

          {/* 状态说明 */}
          <Card size="small" title="📋 状态说明">
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(DOC_STATUS_CONFIG).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag icon={val.icon} color={val.color} style={{ minWidth: 80, textAlign: 'center' }}>
                    {val.label}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {key === 'collecting' && '收集材料中'}
                    {key === 'in_progress' && '制作中'}
                    {key === 'completed' && '已完成'}
                    {key === 'student_feedback' && '等待学生反馈'}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>

          {/* 材料类型说明 */}
          <Card size="small" title="📄 材料类型" style={{ marginTop: '16px' }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: '11px', color: '#1E3A5F' }}>核心文书</Text>
            </div>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 8 }}>
              {['PS', 'CV', 'SOP'].map(key => {
                const val = DOC_TYPE_CONFIG[key];
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag style={{ background: val.color + '20', color: val.color, borderColor: val.color, minWidth: 50, textAlign: 'center', fontSize: '11px' }}>
                      {val.shortLabel}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{val.label}</Text>
                  </div>
                );
              })}
            </Space>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: '11px', color: '#52C41A' }}>推荐信</Text>
            </div>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 8 }}>
              {['RL1', 'RL2', 'RL3'].map(key => {
                const val = DOC_TYPE_CONFIG[key];
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag style={{ background: val.color + '20', color: val.color, borderColor: val.color, minWidth: 50, textAlign: 'center', fontSize: '11px' }}>
                      {val.shortLabel}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{val.label}</Text>
                  </div>
                );
              })}
            </Space>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: '11px', color: '#722ED1' }}>学术材料</Text>
            </div>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 8 }}>
              {['Transcript', 'EnrollmentLetter'].map(key => {
                const val = DOC_TYPE_CONFIG[key];
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag style={{ background: val.color + '20', color: val.color, borderColor: val.color, minWidth: 50, textAlign: 'center', fontSize: '11px' }}>
                      {val.shortLabel}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{val.label}</Text>
                  </div>
                );
              })}
            </Space>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: '11px', color: '#1890FF' }}>身份材料</Text>
            </div>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 8 }}>
              {['Passport', 'IDCard', 'HKMP'].map(key => {
                const val = DOC_TYPE_CONFIG[key];
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag style={{ background: val.color + '20', color: val.color, borderColor: val.color, minWidth: 50, textAlign: 'center', fontSize: '11px' }}>
                      {val.shortLabel}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{val.label}</Text>
                  </div>
                );
              })}
            </Space>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: '11px', color: '#F5222D' }}>其他</Text>
            </div>
            <Space direction="vertical" style={{ width: '100%' }}>
              {['Portfolio'].map(key => {
                const val = DOC_TYPE_CONFIG[key];
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag style={{ background: val.color + '20', color: val.color, borderColor: val.color, minWidth: 50, textAlign: 'center', fontSize: '11px' }}>
                      {val.shortLabel}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{val.label}</Text>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingDoc ? '编辑文书' : '新增文书'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        okText={editingDoc ? '保存' : '添加'}
        cancelText="取消"
        width={550}
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
              <Form.Item name="target_major" label="申请专业">
                <Input placeholder="如：CS、Finance" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="doc_type" label="材料类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="选择材料类型">
                  {Object.entries(DOC_TYPE_CONFIG).map(([key, val]) => (
                    <Option key={key} value={key}>{val.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  {Object.entries(DOC_STATUS_CONFIG).map(([key, val]) => (
                    <Option key={key} value={key}>{val.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deadline" label="截止日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="updated_at" label="最后更新">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="选择日期" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="补充说明..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 版本历史弹窗 */}
      <Modal
        title={`📋 版本历史 - ${viewingDoc?.student_name} ${DOC_TYPE_CONFIG[viewingDoc?.doc_type]?.shortLabel}`}
        open={versionModalVisible}
        onCancel={() => setVersionModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Dragger
            showUploadList={false}
            beforeUpload={() => {
              message.success('文件已选择（演示模式）');
              return false;
            }}
          >
            <p><UploadOutlined style={{ fontSize: 32, color: '#1E3A5F' }} /></p>
            <p>点击或拖拽上传新版本</p>
          </Dragger>
        </div>
        <Input.TextArea
          id="versionNote"
          placeholder="版本说明（如：修改了PS动机段落）"
          rows={2}
          style={{ marginBottom: 12 }}
        />
        <Button type="primary" block onClick={() => {
          const note = document.getElementById('versionNote')?.value || '新版本';
          handleVersionSubmit(note);
        }}>
          确认上传
        </Button>

        <Divider>版本记录</Divider>
        {viewingDoc?.versions?.length > 0 ? (
          <Timeline
            items={[...viewingDoc.versions].reverse().map(v => ({
              color: '#1E3A5F',
              children: (
                <div>
                  <Space>
                    <Badge count={v.version} style={{ backgroundColor: '#1E3A5F' }} />
                    <Text strong>{v.date}</Text>
                    {v.file && <Tag>{v.file}</Tag>}
                  </Space>
                  <div><Text type="secondary">{v.note}</Text></div>
                </div>
              ),
            }))}
          />
        ) : (
          <Empty description="暂无版本记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>

      {/* 版本对比弹窗 */}
      <Modal
        title={`📊 版本对比 - ${viewingDoc?.student_name} ${DOC_TYPE_CONFIG[viewingDoc?.doc_type]?.shortLabel}`}
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        footer={null}
        width={700}
      >
        {viewingDoc?.versions?.length >= 2 ? (
          <div>
            <Alert
              message="版本对比功能"
              description="此功能可直观展示两个版本之间的内容差异（可集成diff-match-patch库实现精确对比）"
              type="info"
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title={`版本 ${viewingDoc.versions[viewingDoc.versions.length - 2]?.version}`}>
                  <Text type="secondary">{viewingDoc.versions[viewingDoc.versions.length - 2]?.date}</Text>
                  <Paragraph style={{ marginTop: 8 }} ellipsis={{ rows: 6 }}>
                    {viewingDoc.versions[viewingDoc.versions.length - 2]?.note}
                  </Paragraph>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title={`版本 ${viewingDoc.versions[viewingDoc.versions.length - 1]?.version}`} style={{ borderColor: '#52C41A' }}>
                  <Text type="secondary">{viewingDoc.versions[viewingDoc.versions.length - 1]?.date}</Text>
                  <Paragraph style={{ marginTop: 8 }} ellipsis={{ rows: 6 }}>
                    {viewingDoc.versions[viewingDoc.versions.length - 1]?.note}
                  </Paragraph>
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Timeline
                items={viewingDoc.versions.map(v => ({
                  color: '#1E3A5F',
                  children: (
                    <Space>
                      <Badge count={v.version} style={{ backgroundColor: '#1E3A5F' }} />
                      <Text>{v.date} — {v.note}</Text>
                    </Space>
                  ),
                }))}
              />
            </div>
          </div>
        ) : (
          <Empty description="需要至少2个版本才能对比" />
        )}
      </Modal>
    </div>
  );
};

export default DocumentManager;
