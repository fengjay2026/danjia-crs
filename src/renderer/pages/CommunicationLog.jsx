import React, { useState, useMemo } from 'react';
import {
  Card, Table, Button, Space, Select, DatePicker, Tag, Modal, Form,
  Input, Upload, Timeline, Badge, Tooltip, Popconfirm, message, Row, Col, Statistic
} from 'antd';
import {
  PlusOutlined, PhoneOutlined, VideoCameraOutlined,
  MessageOutlined, MailOutlined, TeamOutlined, SearchOutlined,
  AlertOutlined, CheckCircleOutlined, PaperClipOutlined, EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

// 沟通类型配置
const COMM_TYPES = [
  { key: 'phone', label: '电话', icon: <PhoneOutlined />, color: '#1890ff' },
  { key: 'video', label: '视频', icon: <VideoCameraOutlined />, color: '#722ed1' },
  { key: 'face', label: '面谈', icon: <TeamOutlined />, color: '#13c2c2' },
  { key: 'wechat', label: '微信', icon: <MessageOutlined />, color: '#52c41a' },
  { key: 'email', label: '邮件', icon: <MailOutlined />, color: '#fa8c16' },
];

const commTypeMap = Object.fromEntries(COMM_TYPES.map(t => [t.key, t]));

// 模拟学生数据
const mockStudents = [
  { id: '1', name: '张同学' },
  { id: '2', name: '李同学' },
  { id: '3', name: '王同学' },
  { id: '4', name: '赵同学' },
  { id: '5', name: '刘同学' },
];

// 模拟沟通记录数据
const initialRecords = [
  {
    id: '1',
    studentId: '1',
    studentName: '张同学',
    commType: 'phone',
    commTime: '2026-04-20 14:30',
    summary: '沟通了最新的文书进展，确认了PS第二稿的修改方向，需要补充实习经历的量化描述。',
    nextAction: '4月23日前完成PS二稿修改',
    attachments: ['PS初稿.docx'],
    createdAt: '2026-04-20 14:30',
  },
  {
    id: '2',
    studentId: '1',
    studentName: '张同学',
    commType: 'wechat',
    commTime: '2026-04-15 10:00',
    summary: '学生确认了推荐人信息，王教授同意推荐，需要发送推荐信模板。',
    nextAction: '发送推荐信模板给王教授',
    attachments: [],
    createdAt: '2026-04-15 10:00',
  },
  {
    id: '3',
    studentId: '2',
    studentName: '李同学',
    commType: 'face',
    commTime: '2026-04-18 16:00',
    summary: '面谈讨论了选校方案，学生对港三方案比较满意，但对NUS的竞争有顾虑。分析了往年录取数据来打消疑虑。',
    nextAction: '整理NUS近三年录取数据发给李同学',
    attachments: ['选校方案v2.pdf'],
    createdAt: '2026-04-18 16:00',
  },
  {
    id: '4',
    studentId: '3',
    studentName: '王同学',
    commType: 'video',
    commTime: '2026-04-10 20:00',
    summary: '视频沟通了雅思备考情况，学生模考6.5，口语需要加强。建议报一个口语强化班。',
    nextAction: '推荐口语强化班课程',
    attachments: [],
    createdAt: '2026-04-10 20:00',
  },
  {
    id: '5',
    studentId: '4',
    studentName: '赵同学',
    commType: 'email',
    commTime: '2026-04-05 09:30',
    summary: '发送了CV修改版和学生确认，等待反馈。',
    nextAction: '跟进CV反馈',
    attachments: ['CV_v3.docx'],
    createdAt: '2026-04-05 09:30',
  },
  {
    id: '6',
    studentId: '5',
    studentName: '刘同学',
    commType: 'phone',
    commTime: '2026-04-22 11:00',
    summary: '确认了材料递交时间线，提醒学生在5月前完成所有标准化考试。',
    nextAction: '跟进雅思考试报名情况',
    attachments: [],
    createdAt: '2026-04-22 11:00',
  },
];

const CommunicationLog = () => {
  const [records, setRecords] = useState(initialRecords);
  const [filteredStudent, setFilteredStudent] = useState(undefined);
  const [filteredType, setFilteredType] = useState(undefined);
  const [filteredDateRange, setFilteredDateRange] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [form] = Form.useForm();

  // 判断是否超7天未联系
  const isOverdue = (commTime) => {
    return dayjs().diff(dayjs(commTime), 'day') > 7;
  };

  // 筛选逻辑
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (filteredStudent && record.studentId !== filteredStudent) return false;
      if (filteredType && record.commType !== filteredType) return false;
      if (filteredDateRange && filteredDateRange.length === 2) {
        const recordDate = dayjs(record.commTime);
        if (recordDate.isBefore(filteredDateRange[0], 'day') || recordDate.isAfter(filteredDateRange[1], 'day')) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => dayjs(b.commTime).valueOf() - dayjs(a.commTime).valueOf());
  }, [records, filteredStudent, filteredType, filteredDateRange]);

  // 统计数据
  const stats = useMemo(() => {
    const total = records.length;
    const overdueCount = records.filter(r => isOverdue(r.commTime)).length;
    const thisWeekCount = records.filter(r => dayjs().diff(dayjs(r.commTime), 'day') <= 7).length;
    return { total, overdueCount, thisWeekCount };
  }, [records]);

  // 按学生分组的时间线数据
  const timelineByStudent = useMemo(() => {
    const grouped = {};
    records
      .filter(r => filteredStudent ? r.studentId === filteredStudent : true)
      .forEach(record => {
        if (!grouped[record.studentId]) {
          grouped[record.studentId] = {
            studentId: record.studentId,
            studentName: record.studentName,
            records: [],
          };
        }
        grouped[record.studentId].records.push(record);
      });
    // 每组内按时间降序
    Object.values(grouped).forEach(group => {
      group.records.sort((a, b) => dayjs(b.commTime).valueOf() - dayjs(a.commTime).valueOf());
    });
    return Object.values(grouped);
  }, [records, filteredStudent]);

  // 新增/编辑记录
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const student = mockStudents.find(s => s.id === values.studentId);
      const newRecord = {
        id: editingRecord ? editingRecord.id : String(Date.now()),
        studentId: values.studentId,
        studentName: student?.name || '',
        commType: values.commType,
        commTime: values.commTime ? values.commTime.format('YYYY-MM-DD HH:mm') : dayjs().format('YYYY-MM-DD HH:mm'),
        summary: values.summary,
        nextAction: values.nextAction,
        attachments: values.attachments || [],
        createdAt: editingRecord ? editingRecord.createdAt : dayjs().format('YYYY-MM-DD HH:mm'),
      };

      if (editingRecord) {
        setRecords(prev => prev.map(r => r.id === editingRecord.id ? newRecord : r));
        message.success('沟通记录已更新');
      } else {
        setRecords(prev => [newRecord, ...prev]);
        message.success('沟通记录已添加');
      }

      setModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
    });
  };

  // 编辑记录
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      commTime: dayjs(record.commTime),
    });
    setModalVisible(true);
  };

  // 删除记录
  const handleDelete = (id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    message.success('记录已删除');
  };

  // 查看详情
  const handleViewDetail = (record) => {
    setViewingRecord(record);
    setDetailModalVisible(true);
  };

  // 标记完成下一步行动
  const handleCompleteAction = (id) => {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, nextAction: '✅ ' + r.nextAction } : r
    ));
    message.success('已标记完成');
  };

  const columns = [
    {
      title: '学生',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      fixed: 'left',
      render: (text, record) => (
        <Badge dot color={isOverdue(record.commTime) ? '#ff4d4f' : '#52c41a'}>
          <span style={{ color: isOverdue(record.commTime) ? '#ff4d4f' : undefined, fontWeight: 600 }}>
            {text}
          </span>
        </Badge>
      ),
    },
    {
      title: '沟通类型',
      dataIndex: 'commType',
      key: 'commType',
      width: 100,
      render: (type) => {
        const config = commTypeMap[type];
        return config ? (
          <Tag icon={config.icon} color={config.color}>
            {config.label}
          </Tag>
        ) : type;
      },
    },
    {
      title: '沟通时间',
      dataIndex: 'commTime',
      key: 'commTime',
      width: 150,
      sorter: (a, b) => dayjs(a.commTime).valueOf() - dayjs(b.commTime).valueOf(),
      defaultSortOrder: 'descend',
      render: (time) => (
        <span style={{ color: isOverdue(time) ? '#ff4d4f' : undefined }}>
          {time}
          {isOverdue(time) && <Tooltip title="超过7天未联系"><AlertOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} /></Tooltip>}
        </span>
      ),
    },
    {
      title: '沟通摘要',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: { showTitle: false },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: '下一步行动',
      dataIndex: 'nextAction',
      key: 'nextAction',
      width: 200,
      ellipsis: { showTitle: false },
      render: (text, record) => (
        <Space>
          <Tooltip title={text}>
            <span style={{
              color: text.startsWith('✅') ? '#52c41a' : '#fa8c16',
              textDecoration: text.startsWith('✅') ? 'line-through' : 'none',
            }}>
              {text}
            </span>
          </Tooltip>
          {!text.startsWith('✅') && (
            <Tooltip title="标记完成">
              <CheckCircleOutlined
                style={{ color: '#52c41a', cursor: 'pointer' }}
                onClick={() => handleCompleteAction(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '附件',
      dataIndex: 'attachments',
      key: 'attachments',
      width: 80,
      render: (attachments) => attachments?.length > 0 ? (
        <Tooltip title={attachments.join(', ')}>
          <Tag icon={<PaperClipOutlined />} color="default">
            {attachments.length} 个
          </Tag>
        </Tooltip>
      ) : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除这条记录？" onConfirm={() => handleDelete(record.id)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总沟通记录"
              value={stats.total}
              suffix="条"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="本周沟通"
              value={stats.thisWeekCount}
              suffix="条"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="需跟进（超7天）"
              value={stats.overdueCount}
              suffix="人"
              valueStyle={{ color: stats.overdueCount > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={stats.overdueCount > 0 ? <AlertOutlined /> : <CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Space>
            <span style={{ fontWeight: 500 }}>筛选：</span>
            <Select
              placeholder="按学生筛选"
              allowClear
              style={{ width: 150 }}
              value={filteredStudent}
              onChange={setFilteredStudent}
              options={mockStudents.map(s => ({ label: s.name, value: s.id }))}
            />
            <Select
              placeholder="按沟通类型筛选"
              allowClear
              style={{ width: 150 }}
              value={filteredType}
              onChange={setFilteredType}
              options={COMM_TYPES.map(t => ({
                label: (
                  <Space>
                    {t.icon} {t.label}
                  </Space>
                ),
                value: t.key,
              }))}
            />
            <RangePicker
              value={filteredDateRange}
              onChange={setFilteredDateRange}
              placeholder={['开始日期', '结束日期']}
            />
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRecord(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            新增沟通记录
          </Button>
        </Space>
      </Card>

      {/* 沟通记录表格 */}
      <Card
        title={
          <Space>
            <SearchOutlined />
            <span>沟通记录列表</span>
            <Tag>{filteredRecords.length} 条结果</Tag>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
          rowClassName={(record) => isOverdue(record.commTime) ? 'row-overdue' : ''}
        />
      </Card>

      {/* 沟通时间线 */}
      <Card
        title="沟通时间线"
        style={{ marginTop: 24 }}
      >
        {timelineByStudent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无沟通记录</div>
        ) : (
          timelineByStudent.map(group => (
            <Card
              key={group.studentId}
              type="inner"
              title={
                <Space>
                  <Badge
                    status={group.records.some(r => isOverdue(r.commTime)) ? 'error' : 'success'}
                  />
                  <span style={{ fontWeight: 600 }}>{group.studentName}</span>
                  <Tag color="default">共 {group.records.length} 条记录</Tag>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Timeline
                items={group.records.map(record => {
                  const config = commTypeMap[record.commType];
                  return {
                    color: isOverdue(record.commTime) ? 'red' : config?.color || 'blue',
                    dot: config?.icon,
                    children: (
                      <div>
                        <Space style={{ marginBottom: 4 }}>
                          <strong>{record.commTime}</strong>
                          <Tag icon={config?.icon} color={config?.color}>
                            {config?.label}
                          </Tag>
                        </Space>
                        <p style={{ margin: '4px 0', color: '#333' }}>{record.summary}</p>
                        {record.nextAction && (
                          <p style={{ margin: '4px 0', color: '#fa8c16' }}>
                            <strong>下一步：</strong>
                            <span style={{
                              textDecoration: record.nextAction.startsWith('✅') ? 'line-through' : 'none',
                              color: record.nextAction.startsWith('✅') ? '#52c41a' : '#fa8c16',
                            }}>
                              {record.nextAction}
                            </span>
                          </p>
                        )}
                        {record.attachments?.length > 0 && (
                          <Space style={{ marginTop: 4 }}>
                            {record.attachments.map((att, i) => (
                              <Tag key={i} icon={<PaperClipOutlined />} color="default">{att}</Tag>
                            ))}
                          </Space>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            </Card>
          ))
        )}
      </Card>

      {/* 新增/编辑沟通记录弹窗 */}
      <Modal
        title={editingRecord ? '编辑沟通记录' : '新增沟通记录'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentId"
                label="学生"
                rules={[{ required: true, message: '请选择学生' }]}
              >
                <Select
                  placeholder="请选择学生"
                  options={mockStudents.map(s => ({ label: s.name, value: s.id }))}
                  disabled={!!editingRecord}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="commType"
                label="沟通类型"
                rules={[{ required: true, message: '请选择沟通类型' }]}
              >
                <Select placeholder="请选择沟通类型">
                  {COMM_TYPES.map(t => (
                    <Select.Option key={t.key} value={t.key}>
                      <Space>{t.icon} {t.label}</Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="commTime"
            label="沟通时间"
            rules={[{ required: true, message: '请选择沟通时间' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder="请选择沟通时间"
            />
          </Form.Item>
          <Form.Item
            name="summary"
            label="沟通摘要"
            rules={[{ required: true, message: '请输入沟通摘要' }]}
          >
            <TextArea rows={4} placeholder="请详细描述沟通内容..." maxLength={500} showCount />
          </Form.Item>
          <Form.Item
            name="nextAction"
            label="下一步行动"
          >
            <Input placeholder="请输入下一步行动计划..." />
          </Form.Item>
          <Form.Item name="attachments" label="附件">
            <Upload.Dragger multiple>
              <p style={{ textAlign: 'center' }}>
                <PaperClipOutlined style={{ fontSize: 24, color: '#999' }} />
              </p>
              <p style={{ textAlign: 'center', color: '#999' }}>点击或拖拽文件上传</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情弹窗 */}
      <Modal
        title="沟通记录详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="edit" type="primary" onClick={() => {
            setDetailModalVisible(false);
            handleEdit(viewingRecord);
          }}>
            编辑
          </Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
        ]}
        width={600}
      >
        {viewingRecord && (
          <div style={{ padding: '16px 0' }}>
            <Row gutter={[16, 16]}>
              <Col span={8}><strong>学生：</strong></Col>
              <Col span={16}>{viewingRecord.studentName}</Col>
              <Col span={8}><strong>沟通类型：</strong></Col>
              <Col span={16}>
                <Tag icon={commTypeMap[viewingRecord.commType]?.icon} color={commTypeMap[viewingRecord.commType]?.color}>
                  {commTypeMap[viewingRecord.commType]?.label}
                </Tag>
              </Col>
              <Col span={8}><strong>沟通时间：</strong></Col>
              <Col span={16}>
                <span style={{ color: isOverdue(viewingRecord.commTime) ? '#ff4d4f' : undefined }}>
                  {viewingRecord.commTime}
                </span>
              </Col>
              <Col span={24}>
                <strong>沟通摘要：</strong>
                <p style={{ marginTop: 4, lineHeight: 1.8, background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
                  {viewingRecord.summary}
                </p>
              </Col>
              <Col span={24}>
                <strong>下一步行动：</strong>
                <p style={{ marginTop: 4, color: '#fa8c16' }}>{viewingRecord.nextAction}</p>
              </Col>
              {viewingRecord.attachments?.length > 0 && (
                <Col span={24}>
                  <strong>附件：</strong>
                  <div style={{ marginTop: 4 }}>
                    {viewingRecord.attachments.map((att, i) => (
                      <Tag key={i} icon={<PaperClipOutlined />} color="blue" style={{ marginBottom: 4 }}>
                        {att}
                      </Tag>
                    ))}
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* 全局样式 */}
      <style>{`
        .row-overdue {
          background-color: #fff2f0 !important;
        }
        .row-overdue:hover td {
          background-color: #ffedeb !important;
        }
      `}</style>
    </div>
  );
};

export default CommunicationLog;
