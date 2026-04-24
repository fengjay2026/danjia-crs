import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, DatePicker, Progress, Badge, Tooltip, Popconfirm, message, Row, Col, Statistic, Timeline, Divider, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined, TrophyOutlined, WarningOutlined, BellOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const STATUS_CONFIG = {
  preparing: { label: '备考中', color: '#1890ff', bgColor: '#e6f7ff', icon: <ClockCircleOutlined /> },
  waiting:   { label: '待出分', color: '#faad14', bgColor: '#fffbe6', icon: <SyncOutlined spin /> },
  scored:    { label: '已出分', color: '#52c41a', bgColor: '#f6ffed', icon: <TrophyOutlined /> },
};

const mockStudents = [
  { id: '1', name: '张同学' }, { id: '2', name: '李同学' }, { id: '3', name: '王同学' },
  { id: '4', name: '赵同学' }, { id: '5', name: '刘同学' },
];

const initialData = [
  {
    id: '1', studentId: '1', studentName: '张同学', status: 'preparing', targetScore: 7.0,
    examDate: '2026-05-15', plannedExamDate: '2026-05-15',
    listening: null, reading: null, writing: null, speaking: null, overall: null, bestScore: false,
    examCenter: '', transcriptPath: '', notes: '目标港三商科，需总分7小分6.5',
    mockTests: [
      { date: '2026-04-10', listening: 6.0, reading: 6.5, writing: 5.5, speaking: 5.5, overall: 5.9 },
      { date: '2026-04-18', listening: 6.5, reading: 6.5, writing: 6.0, speaking: 6.0, overall: 6.25 },
    ],
  },
  {
    id: '2', studentId: '2', studentName: '李同学', status: 'waiting', targetScore: 6.5,
    examDate: '2026-04-25', plannedExamDate: '2026-04-25',
    listening: null, reading: null, writing: null, speaking: null, overall: null, bestScore: false,
    examCenter: '北京语言大学考点', transcriptPath: '', notes: '申请新加坡管理大学，需总分6.5', mockTests: [],
  },
  {
    id: '3', studentId: '3', studentName: '王同学', status: 'scored', targetScore: 7.5,
    examDate: '2026-03-15', plannedExamDate: '2026-03-15',
    listening: 7.5, reading: 7.5, writing: 7.0, speaking: 7.5, overall: 7.4, bestScore: true,
    examCenter: '上海外国语大学考点', transcriptPath: '/transcripts/wang_ielts_20260315.pdf',
    notes: '首考即达7.5，满足所有申请要求', mockTests: [],
  },
  {
    id: '4', studentId: '4', studentName: '赵同学', status: 'preparing', targetScore: 7.0,
    examDate: null, plannedExamDate: null,
    listening: null, reading: null, writing: null, speaking: null, overall: null, bestScore: false,
    examCenter: '', transcriptPath: '', notes: '尚未报名考试，需要催促', mockTests: [],
  },
  {
    id: '5', studentId: '5', studentName: '刘同学', status: 'preparing', targetScore: 6.5,
    examDate: '2026-05-20', plannedExamDate: '2026-05-20',
    listening: null, reading: null, writing: null, speaking: null, overall: null, bestScore: false,
    examCenter: '广州考点', transcriptPath: '', notes: '目标6.5，重点加强写作', mockTests: [],
  },
];

const scoreTag = (score) => {
  if (score === null) return <Tag color="default">-</Tag>;
  if (score >= 8.0) return <Tag color="#52c41a" style={{ color: '#fff', fontWeight: 600 }}>{score}</Tag>;
  if (score >= 7.0) return <Tag color="#1890ff" style={{ fontWeight: 600 }}>{score}</Tag>;
  if (score >= 6.0) return <Tag color="#faad14">{score}</Tag>;
  return <Tag color="#f5222d" style={{ fontWeight: 600 }}>{score}</Tag>;
};

const getCountdown = (examDate) => {
  if (!examDate) return null;
  const diff = dayjs(examDate).diff(dayjs(), 'day');
  if (diff < 0) return '已过期';
  if (diff === 0) return '今天';
  return `${diff} 天`;
};

const IELTSManager = () => {
  const [data, setData] = useState(initialData);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [mockModalVisible, setMockModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [mockTestItem, setMockTestItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState(undefined);
  const [form] = Form.useForm();
  const [mockForm] = Form.useForm();

  const stats = useMemo(() => ({
    total: data.length,
    preparing: data.filter(i => i.status === 'preparing').length,
    waiting: data.filter(i => i.status === 'waiting').length,
    scored: data.filter(i => i.status === 'scored').length,
    needToRegister: data.filter(i => i.status === 'preparing' && !i.plannedExamDate).length,
    avgScore: (() => {
      const scored = data.filter(i => i.overall !== null);
      return scored.length ? (scored.reduce((s, i) => s + i.overall, 0) / scored.length).toFixed(1) : '-';
    })(),
  }), [data]);

  const filteredData = useMemo(() =>
    filterStatus ? data.filter(i => i.status === filterStatus) : data,
    [data, filterStatus]
  );

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const student = mockStudents.find(s => s.id === values.studentId);
      let status = 'preparing';
      if (values.examDate && dayjs(values.examDate).diff(dayjs(), 'day') <= 0 && values.overall) status = 'scored';
      else if (values.examDate && dayjs(values.examDate).diff(dayjs(), 'day') <= 0) status = 'waiting';

      const newItem = {
        id: editingItem ? editingItem.id : String(Date.now()),
        studentId: values.studentId, studentName: student?.name || '',
        status, targetScore: values.targetScore || null,
        examDate: values.examDate || null, plannedExamDate: values.plannedExamDate || values.examDate || null,
        listening: values.listening ?? null, reading: values.reading ?? null,
        writing: values.writing ?? null, speaking: values.speaking ?? null,
        overall: values.overall ?? null, bestScore: !!values.bestScore,
        examCenter: values.examCenter || '', transcriptPath: values.transcriptPath || '',
        notes: values.notes || '', mockTests: editingItem?.mockTests || [],
      };
      if (editingItem) setData(prev => prev.map(i => i.id === editingItem.id ? newItem : i));
      else setData(prev => [...prev, newItem]);
      message.success(editingItem ? '已更新' : '已添加');
      setModalVisible(false); setEditingItem(null); form.resetFields();
    });
  };

  const handleEdit = (item) => { setEditingItem(item); form.setFieldsValue({ ...item, examDate: item.examDate ? dayjs(item.examDate) : null, plannedExamDate: item.plannedExamDate ? dayjs(item.plannedExamDate) : null }); setModalVisible(true); };
  const handleDelete = (id) => { setData(prev => prev.filter(i => i.id !== id)); message.success('已删除'); };
  const handleView = (item) => { setViewingItem(item); setDetailVisible(true); };
  const handleBestScore = (id) => { setData(prev => prev.map(i => ({ ...i, bestScore: i.id === id ? !i.bestScore : (i.status === 'scored' ? false : i.bestScore) }))); message.success('Best Score已更新'); };

  const handleAddMock = () => {
    mockForm.validateFields().then(values => {
      const overall = parseFloat(((values.listening + values.reading + values.writing + values.speaking) / 4).toFixed(2));
      const newMock = { date: values.mockDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'), listening: values.listening, reading: values.reading, writing: values.writing, speaking: values.speaking, overall };
      setData(prev => prev.map(i => i.id === mockTestItem.id ? { ...i, mockTests: [...i.mockTests, newMock].sort((a, b) => dayjs(b.date) - dayjs(a.date)) } : i));
      message.success('模考成绩已添加');
      setMockModalVisible(false); setMockTestItem(null); mockForm.resetFields();
    });
  };

  const handleDeleteMock = (ieltsId, mockDate) => {
    setData(prev => prev.map(i => i.id === ieltsId ? { ...i, mockTests: i.mockTests.filter(m => m.date !== mockDate) } : i));
    message.success('模考记录已删除');
  };

  const columns = [
    { title: '学生', dataIndex: 'studentName', key: 'studentName', width: 100, fixed: 'left', render: (text, item) => <Space direction="vertical" size={0}>{item.bestScore && <Tag color="gold" icon={<TrophyOutlined />} style={{ fontSize: 10 }}>Best</Tag>}<span style={{ fontWeight: 600 }}>{text}</span></Space> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110, render: (s) => { const c = STATUS_CONFIG[s]; return <Tag icon={c.icon} color={c.color} style={{ backgroundColor: c.bgColor, border: `1px solid ${c.color}`, color: c.color, fontWeight: 600 }}>{c.label}</Tag>; } },
    { title: '目标', dataIndex: 'targetScore', key: 'targetScore', width: 80, align: 'center', render: s => s ? <Tag color="purple">目标 {s}</Tag> : '-' },
    { title: '考试日期', dataIndex: 'examDate', key: 'examDate', width: 130, render: (date, item) => !date ? <Tag icon={<WarningOutlined />} color="warning">未报名</Tag> : (
      <Space direction="vertical" size={0}>
        <span>{date}</span>
        {item.status === 'preparing' && <span style={{ fontSize: 11, color: dayjs(date).diff(dayjs(), 'day') <= 7 ? '#faad14' : '#1890ff' }}><ClockCircleOutlined /> {getCountdown(date)}</span>}
        {item.status === 'waiting' && <span style={{ fontSize: 11, color: '#faad14' }}><SyncOutlined spin /> 等待出分</span>}
      </Space>
    ) },
    { title: '听力', dataIndex: 'listening', key: 'listening', width: 70, align: 'center', render: scoreTag },
    { title: '阅读', dataIndex: 'reading', key: 'reading', width: 70, align: 'center', render: scoreTag },
    { title: '写作', dataIndex: 'writing', key: 'writing', width: 70, align: 'center', render: scoreTag },
    { title: '口语', dataIndex: 'speaking', key: 'speaking', width: 70, align: 'center', render: scoreTag },
    { title: '总分', dataIndex: 'overall', key: 'overall', width: 80, align: 'center', sorter: (a, b) => (a.overall || 0) - (b.overall || 0), defaultSortOrder: 'descend', render: (s, item) => s === null ? <span style={{ color: '#ccc' }}>-</span> : <strong style={{ color: s >= item.targetScore ? '#52c41a' : '#f5222d', fontSize: 16 }}>{s}</strong> },
    { title: '操作', key: 'action', width: 200, fixed: 'right', render: (_, item) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(item)} />
        {item.status === 'preparing' && <Button type="link" icon={<FileTextOutlined />} size="small" onClick={() => { setMockTestItem(item); mockForm.resetFields(); setMockModalVisible(true); }} />}
        {item.status === 'scored' && <Button type="link" icon={<TrophyOutlined />} size="small" style={{ color: item.bestScore ? '#faad14' : undefined }} onClick={() => handleBestScore(item.id)} />}
        <Button type="link" size="small" onClick={() => handleEdit(item)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(item.id)} okText="删除" cancelText="取消"><Button type="link" size="small" danger>删除</Button></Popconfirm>
      </Space>
    ) },
  ];

  return (
    <div style={{ padding: 24 }}>
      {stats.needToRegister > 0 && (
        <Alert message={`⚠️ 有 ${stats.needToRegister} 位同学尚未报名雅思考试，请及时催促！`} type="warning" showIcon icon={<BellOutlined />} style={{ marginBottom: 16 }}
          action={<Button size="small" onClick={() => setFilterStatus('preparing')}>查看未报名学生</Button>}
        />
      )}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { title: '总人数', value: stats.total, color: '#1890ff' },
          { title: '备考中', value: stats.preparing, color: '#1890ff', icon: <ClockCircleOutlined /> },
          { title: '待出分', value: stats.waiting, color: '#faad14', icon: <SyncOutlined /> },
          { title: '已出分', value: stats.scored, color: '#52c41a', icon: <TrophyOutlined /> },
          { title: '平均分', value: stats.avgScore, color: '#722ed1' },
          { title: '待报名', value: stats.needToRegister, color: stats.needToRegister > 0 ? '#f5222d' : '#52c41a' },
        ].map((s, i) => (
          <Col span={4} key={i}>
            <Card><Statistic title={s.title} value={s.value} valueStyle={{ color: s.color }} prefix={s.icon} /></Card>
          </Col>
        ))}
      </Row>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select placeholder="按状态筛选" allowClear style={{ width: 140 }} value={filterStatus} onChange={setFilterStatus}
            options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ label: <Space>{v.icon} {v.label}</Space>, value: k }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalVisible(true); }}>添加IELTS记录</Button>
        </Space>
      </Card>
      <Card title={<Space><span>IELTS成绩管理</span><Badge count={filteredData.length} style={{ backgroundColor: '#1890ff' }} /></Space>}>
        <Table columns={columns} dataSource={filteredData} rowKey="id" scroll={{ x: 1400 }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal title={<Space>{viewingItem && <><Tag icon={STATUS_CONFIG[viewingItem.status]?.icon} color={STATUS_CONFIG[viewingItem.status]?.color}>{STATUS_CONFIG[viewingItem.status]?.label}</Tag> IELTS详情</>}</Space>}
        open={detailVisible} onCancel={() => setDetailVisible(false)}
        footer={<><Button type="primary" onClick={() => { setDetailVisible(false); handleEdit(viewingItem); }}>编辑</Button><Button onClick={() => setDetailVisible(false)}>关闭</Button></>}
        width={700}>
        {viewingItem && (
          <div>
            <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
              <Col span={8}><strong>学生：</strong>{viewingItem.studentName}</Col>
              <Col span={8}><strong>目标：</strong>{viewingItem.targetScore || '-'}</Col>
              <Col span={8}><strong>考试日期：</strong>{viewingItem.examDate || '未报名'}</Col>
              <Col span={8}><strong>考试中心：</strong>{viewingItem.examCenter || '-'}</Col>
              <Col span={8}><strong>Best Score：</strong>{viewingItem.bestScore ? <Tag color="gold" icon={<TrophyOutlined />}>是</Tag> : '否'}</Col>
            </Row>
            {viewingItem.status === 'scored' && (
              <>
                <Divider>正式成绩</Divider>
                <Row gutter={[12, 8]} style={{ marginBottom: 12 }}>
                  {[['听力', viewingItem.listening], ['阅读', viewingItem.reading], ['写作', viewingItem.writing], ['口语', viewingItem.speaking]].map(([k, v]) => (
                    <Col span={6} key={k}><Card size="small" style={{ textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>{v || '-'}</div><div style={{ color: '#999', fontSize: 12 }}>{k}</div></Card></Col>
                  ))}
                </Row>
                <Card size="small" style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: viewingItem.overall >= viewingItem.targetScore ? '#52c41a' : '#f5222d' }}>{viewingItem.overall || '-'}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>总分</div>
                </Card>
                {viewingItem.transcriptPath && <Tag icon={<FileTextOutlined />} color="blue">{viewingItem.transcriptPath}</Tag>}
              </>
            )}
            {viewingItem.status === 'preparing' && viewingItem.plannedExamDate && (
              <><Divider>备考进度</Divider><Progress percent={Math.max(0, Math.min(100, 100 - Math.round(dayjs(viewingItem.plannedExamDate).diff(dayjs(), 'day') / 90 * 100)))} status="active" strokeColor="#1890ff" format={p => `备考进度 ${p}%`} style={{ marginBottom: 16 }} /></>
            )}
            {viewingItem.mockTests?.length > 0 && (
              <><Divider>模考成绩（共 {viewingItem.mockTests.length} 次）</Divider><Timeline items={viewingItem.mockTests.map(m => ({
                color: m.overall >= viewingItem.targetScore ? 'green' : 'blue',
                children: (
                  <Space split={<Divider type="vertical" />} wrap>
                    <strong>{m.date}</strong>
                    <span>听 {scoreTag(m.listening)}</span><span>阅 {scoreTag(m.reading)}</span><span>写 {scoreTag(m.writing)}</span><span>口 {scoreTag(m.speaking)}</span>
                    <strong style={{ color: m.overall >= viewingItem.targetScore ? '#52c41a' : '#f5222d' }}>总 {m.overall}</strong>
                    <Popconfirm title="删除？" onConfirm={() => handleDeleteMock(viewingItem.id, m.date)}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
                  </Space>
                ),
              }))} /></>
            )}
            {viewingItem.notes && <><Divider>备注</Divider><p style={{ lineHeight: 1.8 }}>{viewingItem.notes}</p></>}
          </div>
        )}
      </Modal>

      {/* 新增/编辑弹窗 */}
      <Modal title={editingItem ? '编辑IELTS记录' : '新增IELTS记录'} open={modalVisible} onOk={handleSubmit}
        onCancel={() => { setModalVisible(false); setEditingItem(null); form.resetFields(); }} width={640} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="studentId" label="学生" rules={[{ required: true, message: '请选择学生' }]}><Select placeholder="请选择学生" options={mockStudents.map(s => ({ label: s.name, value: s.id }))} disabled={!!editingItem} /></Form.Item></Col>
            <Col span={12}><Form.Item name="targetScore" label="目标分数"><InputNumber min={5} max={9} step={0.5} precision={1} style={{ width: '100%' }} placeholder="如 7.0" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="plannedExamDate" label="计划考试日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="examDate" label="实际考试日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="examCenter" label="考试中心"><Input placeholder="如 北京语言大学考点" /></Form.Item></Col>
            <Col span={12}><Form.Item name="bestScore" label="Best Score"><Select placeholder="是否Best Score" allowClear><Select.Option value={true}>是</Select.Option><Select.Option value={false}>否</Select.Option></Select></Form.Item></Col>
          </Row>
          <Divider>各科成绩（出分后填写）</Divider>
          <Row gutter={16}>
            {['listening', 'reading', 'writing', 'speaking'].map(k => <Col span={6} key={k}><Form.Item name={k} label={{ listening: '听力', reading: '阅读', writing: '写作', speaking: '口语' }[k]}><InputNumber min={0} max={9} step={0.5} precision={1} style={{ width: '100%' }} /></Form.Item></Col>)}
          </Row>
          <Form.Item name="overall" label="总分"><InputNumber min={0} max={9} step={0.5} precision={1} style={{ width: '100%' }} placeholder="留空自动计算" /></Form.Item>
          <Form.Item name="transcriptPath" label="成绩单路径"><Input placeholder="/transcripts/xxx.pdf" /></Form.Item>
          <Form.Item name="notes" label="备注"><TextArea rows={3} placeholder="如 目标港三商科，需总分7小分6.5" /></Form.Item>
        </Form>
      </Modal>

      {/* 模考成绩弹窗 */}
      <Modal title={`添加模考成绩 - ${mockTestItem?.studentName || ''}`} open={mockModalVisible} onOk={handleAddMock}
        onCancel={() => { setMockModalVisible(false); setMockTestItem(null); mockForm.resetFields(); }} width={500}>
        <Form form={mockForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="mockDate" label="模考日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Row gutter={16}>
            {[['listening', '听力'], ['reading', '阅读'], ['writing', '写作'], ['speaking', '口语']].map(([k, label]) => (
              <Col span={6} key={k}><Form.Item name={k} label={label} rules={[{ required: true }]}><InputNumber min={0} max={9} step={0.5} precision={1} style={{ width: '100%' }} /></Form.Item></Col>
            ))}
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default IELTSManager;
