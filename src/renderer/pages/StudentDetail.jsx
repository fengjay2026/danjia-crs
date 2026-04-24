import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Row, Col, Tabs, Table, Button, Divider, Modal, Form, Input, Select, InputNumber, message, Space, Empty } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentById, updateStudent } from '../data/store';

const COLORS = {
  primary: '#1E3A5F',
  accent: '#FF6B35',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  textSecondary: '#6B7280',
};

const { Option } = Select;

// 文书状态配置
const DOC_STATUS_OPTIONS = [
  { value: 'collecting', label: '📥 搜集材料', color: 'default' },
  { value: 'in_progress', label: '✍️ 制作中', color: 'processing' },
  { value: 'completed', label: '✅ 已完成', color: 'success' },
  { value: 'student_feedback', label: '💬 学生反馈中', color: 'warning' },
];

// 文书类型配置
const DOC_TYPE_OPTIONS = [
  { value: 'ps', label: 'Personal Statement (PS)' },
  { value: 'cv', label: 'Curriculum Vitae (CV)' },
  { value: 'sop', label: 'Statement of Purpose (SOP)' },
  { value: 'rl1', label: '推荐信 #1' },
  { value: 'rl2', label: '推荐信 #2' },
  { value: 'rl3', label: '推荐信 #3' },
  { value: 'transcript', label: '成绩单' },
  { value: 'enrollment', label: '在读证明' },
  { value: 'passport', label: '护照' },
  { value: 'idcard', label: '身份证' },
  { value: 'hkmPass', label: '港澳通行证' },
  { value: 'portfolio', label: '作品集' },
];

// 文书名称映射
const DOC_NAME_MAP = {
  ps: 'Personal Statement',
  cv: 'CV 简历',
  sop: 'SOP',
  rl1: '推荐信 #1',
  rl2: '推荐信 #2',
  rl3: '推荐信 #3',
  transcript: '成绩单',
  enrollment: '在读证明',
  passport: '护照',
  idcard: '身份证',
  hkmPass: '港澳通行证',
  portfolio: '作品集',
};

// 获取文书状态标签
const getDocStatusTag = (status) => {
  const option = DOC_STATUS_OPTIONS.find(o => o.value === status) || DOC_STATUS_OPTIONS[0];
  return <Tag color={option.color}>{option.label}</Tag>;
};

// 沟通方式配置
const COMM_TYPE_OPTIONS = [
  { value: '电话', label: '📞 电话' },
  { value: '微信', label: '💬 微信' },
  { value: '邮件', label: '📧 邮件' },
  { value: '面谈', label: '🏢 面谈' },
  { value: '视频', label: '📹 视频会议' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: '📝 待提交', color: 'default' },
  { value: 'submitted', label: '📤 已提交', color: 'processing' },
  { value: 'reviewing', label: '🔍 审核中', color: 'warning' },
  { value: 'interview', label: '🎤 已发面试', color: 'orange' },
  { value: 'offer', label: '🎉 Offer', color: 'success' },
  { value: 'reject', label: '❌ 已拒绝', color: 'error' },
  { value: 'waitlist', label: '⏳ Waitlist', color: 'warning' },
];

function StudentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [ieltsModalVisible, setIeltsModalVisible] = useState(false);
  const [appModalVisible, setAppModalVisible] = useState(false);
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [ieltsForm] = Form.useForm();
  const [appForm] = Form.useForm();
  const [docForm] = Form.useForm();
  const [commForm] = Form.useForm();
  const [internForm] = Form.useForm();
  const [researchForm] = Form.useForm();
  const [editingApp, setEditingApp] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [commModalVisible, setCommModalVisible] = useState(false);
  const [internModalVisible, setInternModalVisible] = useState(false);
  const [researchModalVisible, setResearchModalVisible] = useState(false);
  const [editingComm, setEditingComm] = useState(null);
  const [editingIntern, setEditingIntern] = useState(null);
  const [editingResearch, setEditingResearch] = useState(null);

  useEffect(() => {
    if (id) {
      const data = getStudentById(parseInt(id));
      if (data) {
        setStudent(data);
      } else {
        message.error('学生不存在');
        navigate('/students');
      }
    }
  }, [id, navigate]);

  if (!student) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  const refreshStudent = () => {
    const data = getStudentById(parseInt(id));
    setStudent(data);
  };

  // 雅思成绩提交
  const handleIeltsSubmit = (values) => {
    const updated = {
      ...student,
      ielts: {
        status: values.status || 'preparing',
        overall: values.overall ? parseFloat(values.overall) : null,
        listening: values.listening ? parseFloat(values.listening) : null,
        reading: values.reading ? parseFloat(values.reading) : null,
        writing: values.writing ? parseFloat(values.writing) : null,
        speaking: values.speaking ? parseFloat(values.speaking) : null,
        examDate: values.examDate || '',
        expectedDate: values.expectedDate || '',
        target: values.target ? parseFloat(values.target) : 7.0,
        examCenter: values.examCenter || '',
      }
    };
    updateStudent(student.id, updated);
    refreshStudent();
    setIeltsModalVisible(false);
    message.success('雅思成绩已更新');
  };

  // 打开编辑雅思弹窗
  const openIeltsModal = () => {
    const ielts = student.ielts || {};
    ieltsForm.setFieldsValue({
      status: ielts.status || 'preparing',
      overall: ielts.overall || '',
      listening: ielts.listening || '',
      reading: ielts.reading || '',
      writing: ielts.writing || '',
      speaking: ielts.speaking || '',
      examDate: ielts.examDate || '',
      expectedDate: ielts.expectedDate || '',
      target: ielts.target || 7.0,
      examCenter: ielts.examCenter || ''
    });
    setIeltsModalVisible(true);
  };

  // 打开添加/编辑申请目标弹窗
  const openAppModal = (app = null) => {
    if (app) {
      setEditingApp(app);
      appForm.setFieldsValue(app);
    } else {
      setEditingApp(null);
      appForm.resetFields();
    }
    setAppModalVisible(true);
  };

  // 提交申请目标
  const handleAppSubmit = (values) => {
    const appData = {
      id: editingApp ? editingApp.id : Date.now(),
      school: values.school || '',
      program: values.program || '',
      rank: values.rank || '主申',
      status: values.status || 'pending',
      submittedDate: values.submittedDate || '',
      resultDate: values.resultDate || ''
    };

    let updated;
    if (editingApp) {
      updated = {
        ...student,
        applications: student.applications.map(a => a.id === editingApp.id ? appData : a)
      };
    } else {
      updated = {
        ...student,
        applications: [...(student.applications || []), appData]
      };
    }

    updateStudent(student.id, updated);
    refreshStudent();
    setAppModalVisible(false);
    setEditingApp(null);
    appForm.resetFields();
    message.success(editingApp ? '申请目标已更新' : '申请目标已添加');
  };

  // 删除申请目标
  const handleDeleteApp = (appId) => {
    const updated = {
      ...student,
      applications: student.applications.filter(a => a.id !== appId)
    };
    updateStudent(student.id, updated);
    refreshStudent();
    message.success('已删除');
  };

  // 打开文书编辑弹窗
  const openDocModal = (docType = null) => {
    if (docType) {
      setEditingDoc(docType);
      const existingDoc = student.documents?.[docType] || {};
      docForm.setFieldsValue({
        ...existingDoc,
        docType: docType,
      });
    } else {
      setEditingDoc(null);
      docForm.resetFields();
    }
    setDocModalVisible(true);
  };

  // 提交文书
  const handleDocSubmit = (values) => {
    const docType = editingDoc || values.docType;
    const docData = {
      status: values.status || 'collecting',
      version: values.version || '',
      updatedAt: new Date().toISOString().split('T')[0],
      notes: values.notes || '',
    };

    const updated = {
      ...student,
      documents: {
        ...(student.documents || {}),
        [docType]: docData,
      }
    };

    updateStudent(student.id, updated);
    refreshStudent();
    setDocModalVisible(false);
    setEditingDoc(null);
    docForm.resetFields();
    message.success('文书进度已更新');
  };

  // 沟通记录相关
  const openCommModal = (comm = null) => {
    if (comm) {
      setEditingComm(comm);
      commForm.setFieldsValue(comm);
    } else {
      setEditingComm(null);
      commForm.resetFields();
      commForm.setFieldsValue({ date: new Date().toISOString().split('T')[0] });
    }
    setCommModalVisible(true);
  };

  const handleCommSubmit = (values) => {
    const commData = {
      id: editingComm ? editingComm.id : Date.now(),
      date: values.date || '',
      type: values.type || '',
      summary: values.summary || '',
      nextAction: values.nextAction || '',
    };

    let updated;
    if (editingComm) {
      updated = {
        ...student,
        communications: student.communications.map(c => c.id === editingComm.id ? commData : c)
      };
    } else {
      updated = {
        ...student,
        communications: [...(student.communications || []), commData]
      };
    }

    updateStudent(student.id, updated);
    refreshStudent();
    setCommModalVisible(false);
    setEditingComm(null);
    commForm.resetFields();
    message.success(editingComm ? '沟通记录已更新' : '沟通记录已添加');
  };

  const handleDeleteComm = (commId) => {
    const updated = {
      ...student,
      communications: student.communications.filter(c => c.id !== commId)
    };
    updateStudent(student.id, updated);
    refreshStudent();
    message.success('已删除');
  };

  // 实习相关
  const openInternModal = (intern = null) => {
    if (intern) {
      setEditingIntern(intern);
      internForm.setFieldsValue(intern);
    } else {
      setEditingIntern(null);
      internForm.resetFields();
    }
    setInternModalVisible(true);
  };

  const handleInternSubmit = (values) => {
    const internData = {
      id: editingIntern ? editingIntern.id : Date.now(),
      company: values.company || '',
      position: values.position || '',
      startDate: values.startDate || '',
      endDate: values.endDate || '',
      description: values.description || '',
    };

    let updated;
    if (editingIntern) {
      updated = {
        ...student,
        internships: student.internships.map(i => i.id === editingIntern.id ? internData : i)
      };
    } else {
      updated = {
        ...student,
        internships: [...(student.internships || []), internData]
      };
    }

    updateStudent(student.id, updated);
    refreshStudent();
    setInternModalVisible(false);
    setEditingIntern(null);
    internForm.resetFields();
    message.success(editingIntern ? '实习经历已更新' : '实习经历已添加');
  };

  const handleDeleteIntern = (internId) => {
    const updated = {
      ...student,
      internships: student.internships.filter(i => i.id !== internId)
    };
    updateStudent(student.id, updated);
    refreshStudent();
    message.success('已删除');
  };

  // 科研相关
  const openResearchModal = (research = null) => {
    if (research) {
      setEditingResearch(research);
      researchForm.setFieldsValue(research);
    } else {
      setEditingResearch(null);
      researchForm.resetFields();
    }
    setResearchModalVisible(true);
  };

  const handleResearchSubmit = (values) => {
    const researchData = {
      id: editingResearch ? editingResearch.id : Date.now(),
      title: values.title || '',
      professor: values.professor || '',
      institution: values.institution || '',
      startDate: values.startDate || '',
      endDate: values.endDate || '',
      output: values.output || '',
    };

    let updated;
    if (editingResearch) {
      updated = {
        ...student,
        research: student.research.map(r => r.id === editingResearch.id ? researchData : r)
      };
    } else {
      updated = {
        ...student,
        research: [...(student.research || []), researchData]
      };
    }

    updateStudent(student.id, updated);
    refreshStudent();
    setResearchModalVisible(false);
    setEditingResearch(null);
    researchForm.resetFields();
    message.success(editingResearch ? '科研经历已更新' : '科研经历已添加');
  };

  const handleDeleteResearch = (researchId) => {
    const updated = {
      ...student,
      research: student.research.filter(r => r.id !== researchId)
    };
    updateStudent(student.id, updated);
    refreshStudent();
    message.success('已删除');
  };

  const getStatusTag = (status) => {
    const option = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
    return <Tag color={option.color}>{option.label}</Tag>;
  };

  const appColumns = [
    { title: '学校', dataIndex: 'school', key: 'school' },
    { title: '项目', dataIndex: 'program', key: 'program' },
    { title: '类型', dataIndex: 'rank', key: 'rank', render: (text) => <Tag>{text || '主申'}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (text) => getStatusTag(text) },
    { title: '提交日期', dataIndex: 'submittedDate', key: 'submittedDate' },
    { title: '出结果日期', dataIndex: 'resultDate', key: 'resultDate' },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openAppModal(record)}>编辑</Button>
          <Button type="link" danger size="small" onClick={() => handleDeleteApp(record.id)}>删除</Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/students')}>返回列表</Button>
        <Button type="primary" icon={<EditOutlined />} style={{ marginLeft: 16, backgroundColor: COLORS.accent }} onClick={() => navigate(`/students/${id}/edit`)}>编辑学生信息</Button>
      </div>

      <Row gutter={24}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: COLORS.primary, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 600, margin: '0 auto 16px'
              }}>{student.name[0]}</div>
              <h3 style={{ margin: 0 }}>{student.name}</h3>
              <Tag color="blue" style={{ marginTop: 8 }}>{student.season}</Tag>
            </div>
            <Divider />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="学校">{student.school || '-'}</Descriptions.Item>
              <Descriptions.Item label="专业">{student.major || '-'}</Descriptions.Item>
              <Descriptions.Item label="GPA">{student.gpa || '-'}</Descriptions.Item>
              <Descriptions.Item label="目标专业">{student.targetMajor || '-'}</Descriptions.Item>
              <Descriptions.Item label="目标地区">{student.targetCountries?.map(c => <Tag key={c}>{c}</Tag>)}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card style={{ marginTop: 16 }} title="📞 联系方式">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="手机">{student.contact?.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{student.contact?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="微信">{student.contact?.wechat || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card style={{ marginTop: 16 }} title="📊 雅思成绩">
            {/* 顶部状态 */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                {student.ielts?.status === 'scored' ? (
                  <Tag color="success" style={{ fontSize: 14 }}>✅ 已出分</Tag>
                ) : student.ielts?.status === 'pending' ? (
                  <Tag color="warning" style={{ fontSize: 14 }}>⏳ 待出分</Tag>
                ) : (
                  <Tag color="processing" style={{ fontSize: 14 }}>📚 备考中</Tag>
                )}
                {student.ielts?.target && (
                  <Tag color="blue">目标: {student.ielts.target}</Tag>
                )}
              </Space>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={openIeltsModal}>编辑</Button>
            </div>

            {/* 两栏布局：左侧实际成绩 / 右侧目标成绩 */}
            <Row gutter={24}>
              {/* 左栏：实际成绩 */}
              <Col span={12}>
                <div style={{
                  border: '1px solid #E8E8E8',
                  borderRadius: 8,
                  padding: 16,
                  background: student.ielts?.status === 'scored' ? '#F6FFED' : '#FAFAFA',
                  opacity: student.ielts?.status === 'scored' ? 1 : 0.7
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#1E3A5F' }}>
                    📝 实际成绩
                  </div>
                  {student.ielts?.status === 'scored' ? (
                    <div>
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 42, fontWeight: 700, color: '#52C41A' }}>{student.ielts.overall}</span>
                        <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>总分</div>
                      </div>
                      <Row gutter={6}>
                        {[
                          { key: 'listening', label: '听力' },
                          { key: 'reading', label: '阅读' },
                          { key: 'writing', label: '写作' },
                          { key: 'speaking', label: '口语' },
                        ].map(item => (
                          <Col span={6} key={item.key}>
                            <div style={{ textAlign: 'center', background: '#FFF', padding: 6, borderRadius: 4, border: '1px solid #E8E8E8' }}>
                              <div style={{ fontSize: 10, color: COLORS.textSecondary }}>{item.label}</div>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>{student.ielts?.[item.key] || '-'}</div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Tag icon="📅" style={{ fontSize: 11 }}>考试日期：{student.ielts.examDate || '-'}</Tag>
                        {student.ielts.examCenter && (
                          <Tag icon="📍" style={{ fontSize: 11 }}>考试地点：{student.ielts.examCenter}</Tag>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Empty description="暂无实际成绩" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '16px 0' }} />
                  )}
                </div>
              </Col>

              {/* 右栏：目标成绩 */}
              <Col span={12}>
                <div style={{
                  border: '1px solid #E8E8E8',
                  borderRadius: 8,
                  padding: 16,
                  background: student.ielts?.status !== 'scored' ? '#E6F7FF' : '#FAFAFA',
                  opacity: student.ielts?.target ? 1 : 0.7
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#1E3A5F' }}>
                    🎯 目标成绩
                  </div>
                  {student.ielts?.target ? (
                    <div>
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 42, fontWeight: 700, color: '#1890FF' }}>{student.ielts.target}</span>
                        <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>目标总分</div>
                      </div>
                      <Row gutter={6}>
                        {[
                          { key: 'listening', label: '听力' },
                          { key: 'reading', label: '阅读' },
                          { key: 'writing', label: '写作' },
                          { key: 'speaking', label: '口语' },
                        ].map(item => (
                          <Col span={6} key={item.key}>
                            <div style={{ textAlign: 'center', background: '#FFF', padding: 6, borderRadius: 4, border: '1px solid #E8E8E8' }}>
                              <div style={{ fontSize: 10, color: COLORS.textSecondary }}>{item.label}</div>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>{student.ielts?.[item.key] || '-'}</div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Tag icon="📅" style={{ fontSize: 11 }}>预计考试：{student.ielts.expectedDate || '待设置'}</Tag>
                        {student.ielts.examCenter && (
                          <Tag icon="📍" style={{ fontSize: 11 }}>考试地点：{student.ielts.examCenter}</Tag>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Empty description="暂无目标分数" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '16px 0' }} />
                  )}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={16}>
          <Card>
            <Tabs
              defaultActiveKey="applications"
              items={[
                {
                  key: 'applications',
                  label: '🎓 申请目标',
                  children: (
                    <div>
                      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16, backgroundColor: COLORS.primary }} onClick={() => openAppModal()}>添加申请目标</Button>
                      <Table
                        columns={appColumns}
                        dataSource={student.applications || []}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    </div>
                  ),
                },
                {
                  key: 'documents',
                  label: '📄 文书进度',
                  children: (
                    <div>
                      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16, backgroundColor: COLORS.primary }} onClick={() => openDocModal()}>
                        添加/编辑文书
                      </Button>
                      <Table
                        columns={[
                          {
                            title: '文书',
                            dataIndex: 'name',
                            key: 'name',
                            render: (name) => <Tag color="blue">{name}</Tag>
                          },
                          {
                            title: '状态',
                            dataIndex: 'status',
                            key: 'status',
                            render: (status) => getDocStatusTag(status),
                          },
                          { title: '版本', dataIndex: 'version', key: 'version', render: (v) => v || '-' },
                          {
                            title: '最后更新',
                            dataIndex: 'updatedAt',
                            key: 'updatedAt',
                            render: (date) => date || '-',
                          },
                          {
                            title: '备注',
                            dataIndex: 'notes',
                            key: 'notes',
                            ellipsis: true,
                            render: (text) => text || '-',
                          },
                          {
                            title: '操作',
                            key: 'action',
                            width: 100,
                            render: (_, record) => (
                              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openDocModal(record.key)}>
                                编辑
                              </Button>
                            ),
                          },
                        ]}
                        dataSource={[
                          { key: 'ps', name: DOC_NAME_MAP.ps, ...student.documents?.ps },
                          { key: 'cv', name: DOC_NAME_MAP.cv, ...student.documents?.cv },
                          { key: 'sop', name: DOC_NAME_MAP.sop, ...student.documents?.sop },
                          { key: 'rl1', name: DOC_NAME_MAP.rl1, ...student.documents?.rl1 },
                          { key: 'rl2', name: DOC_NAME_MAP.rl2, ...student.documents?.rl2 },
                          { key: 'rl3', name: DOC_NAME_MAP.rl3, ...student.documents?.rl3 },
                          { key: 'transcript', name: DOC_NAME_MAP.transcript, ...student.documents?.transcript },
                          { key: 'enrollment', name: DOC_NAME_MAP.enrollment, ...student.documents?.enrollment },
                          { key: 'passport', name: DOC_NAME_MAP.passport, ...student.documents?.passport },
                          { key: 'idcard', name: DOC_NAME_MAP.idcard, ...student.documents?.idcard },
                          { key: 'hkmPass', name: DOC_NAME_MAP.hkmPass, ...student.documents?.hkmPass },
                          { key: 'portfolio', name: DOC_NAME_MAP.portfolio, ...student.documents?.portfolio },
                        ].filter(d => student.documents?.[d.key])}
                        rowKey="key"
                        pagination={false}
                        size="small"
                      />
                      {(!student.documents || Object.keys(student.documents).length === 0) && (
                        <div style={{ textAlign: 'center', padding: 24, color: COLORS.textSecondary }}>
                          暂无文书记录，点击上方按钮添加
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'communications',
                  label: '📞 沟通记录',
                  children: (
                    <div>
                      <Button type="primary" icon={<PlusOutlined />} size="small" style={{ marginBottom: 12, backgroundColor: COLORS.primary }} onClick={() => openCommModal()}>
                        添加记录
                      </Button>
                      <Table
                        columns={[
                          { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
                          { title: '方式', dataIndex: 'type', key: 'type', width: 80, render: (t) => t || '-' },
                          { title: '摘要', dataIndex: 'summary', key: 'summary', ellipsis: true },
                          { title: '下一步', dataIndex: 'nextAction', key: 'nextAction', ellipsis: true, render: (t) => t || '-' },
                          {
                            title: '操作', key: 'action', width: 100,
                            render: (_, record) => (
                              <Space>
                                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openCommModal(record)} />
                                <Button type="link" danger size="small" onClick={() => handleDeleteComm(record.id)}>删除</Button>
                              </Space>
                            ),
                          },
                        ]}
                        dataSource={student.communications || []}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                      {(!student.communications || student.communications.length === 0) && (
                        <div style={{ textAlign: 'center', padding: 16, color: COLORS.textSecondary }}>暂无沟通记录</div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'internships',
                  label: '💼 实习',
                  children: (
                    <div>
                      <Button type="primary" icon={<PlusOutlined />} size="small" style={{ marginBottom: 12, backgroundColor: COLORS.primary }} onClick={() => openInternModal()}>
                        添加实习
                      </Button>
                      <Table
                        columns={[
                          { title: '公司', dataIndex: 'company', key: 'company' },
                          { title: '职位', dataIndex: 'position', key: 'position' },
                          { title: '开始时间', dataIndex: 'startDate', key: 'startDate', width: 100 },
                          { title: '结束时间', dataIndex: 'endDate', key: 'endDate', width: 100, render: (t) => t || '至今' },
                          { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, render: (t) => t || '-' },
                          {
                            title: '操作', key: 'action', width: 100,
                            render: (_, record) => (
                              <Space>
                                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openInternModal(record)} />
                                <Button type="link" danger size="small" onClick={() => handleDeleteIntern(record.id)}>删除</Button>
                              </Space>
                            ),
                          },
                        ]}
                        dataSource={student.internships || []}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                      {(!student.internships || student.internships.length === 0) && (
                        <div style={{ textAlign: 'center', padding: 16, color: COLORS.textSecondary }}>暂无实习经历</div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'research',
                  label: '🔬 科研',
                  children: (
                    <div>
                      <Button type="primary" icon={<PlusOutlined />} size="small" style={{ marginBottom: 12, backgroundColor: COLORS.primary }} onClick={() => openResearchModal()}>
                        添加科研
                      </Button>
                      <Table
                        columns={[
                          { title: '项目', dataIndex: 'title', key: 'title' },
                          { title: '导师', dataIndex: 'professor', key: 'professor' },
                          { title: '机构', dataIndex: 'institution', key: 'institution' },
                          { title: '开始时间', dataIndex: 'startDate', key: 'startDate', width: 100 },
                          { title: '结束时间', dataIndex: 'endDate', key: 'endDate', width: 100, render: (t) => t || '至今' },
                          { title: '成果', dataIndex: 'output', key: 'output', ellipsis: true, render: (t) => t || '-' },
                          {
                            title: '操作', key: 'action', width: 100,
                            render: (_, record) => (
                              <Space>
                                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openResearchModal(record)} />
                                <Button type="link" danger size="small" onClick={() => handleDeleteResearch(record.id)}>删除</Button>
                              </Space>
                            ),
                          },
                        ]}
                        dataSource={student.research || []}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                      {(!student.research || student.research.length === 0) && (
                        <div style={{ textAlign: 'center', padding: 16, color: COLORS.textSecondary }}>暂无科研经历</div>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 雅思编辑弹窗 */}
      <Modal
        title="📊 雅思成绩"
        open={ieltsModalVisible}
        onCancel={() => setIeltsModalVisible(false)}
        onOk={() => ieltsForm.submit()}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Form form={ieltsForm} layout="vertical" onFinish={handleIeltsSubmit}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="状态" name="status">
                <Select>
                  <Option value="preparing">📚 备考中</Option>
                  <Option value="pending">⏳ 待出分</Option>
                  <Option value="scored">✅ 已出分</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>📝 实际成绩（考完后填写）</Divider>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="总分" name="overall"><InputNumber min={0} max={9} step={0.5} style={{ width: '100%' }} placeholder="例：7.0" /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="听力 L" name="listening"><InputNumber min={0} max={9} step={0.5} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="阅读 R" name="reading"><InputNumber min={0} max={9} step={0.5} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="写作 W" name="writing"><InputNumber min={0} max={9} step={0.5} style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="口语 S" name="speaking"><InputNumber min={0} max={9} step={0.5} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="考试日期" name="examDate"><Input type="date" style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="考试地点" name="examCenter"><Input placeholder="如：北京、上海" /></Form.Item>
            </Col>
          </Row>

          <Divider>🎯 目标成绩（备考目标）</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="目标总分" name="target">
                <Select allowClear placeholder="请选择">
                  {[6, 6.5, 7, 7.5, 8].map(v => <Option key={v} value={v}>{v}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="听力目标" name="listening"><InputNumber min={0} max={9} step={0.5} style={{ width: '100%' }} placeholder="例：7.0" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="阅读目标" name="reading"><InputNumber min={0} max={9} step={0.5} style={{ width: '100%' }} placeholder="例：7.0" /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="写作目标" name="writing"><InputNumber min={0} max={9} step={0.5} style={{ width: '100%' }} placeholder="例：6.5" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="口语目标" name="speaking"><InputNumber min={0} max={9} step={0.5} style={{ width: '100%' }} placeholder="例：6.5" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="预计考试日期" name="expectedDate"><Input type="date" style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 申请目标弹窗 */}
      <Modal
        title={editingApp ? '✏️ 编辑申请目标' : '➕ 添加申请目标'}
        open={appModalVisible}
        onCancel={() => { setAppModalVisible(false); setEditingApp(null); appForm.resetFields(); }}
        onOk={() => appForm.submit()}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Form form={appForm} layout="vertical" onFinish={handleAppSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="学校（必填）" name="school" rules={[{ required: true, message: '请输入学校' }]}>
                <Input placeholder="如：香港大学" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="项目" name="program">
                <Input placeholder="如：CS、Finance" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="类型" name="rank">
                <Select>
                  <Option value="冲刺">冲刺</Option>
                  <Option value="主申">主申</Option>
                  <Option value="保底">保底</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="申请状态" name="status">
                <Select>
                  {STATUS_OPTIONS.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="提交日期" name="submittedDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="出结果日期" name="resultDate">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 文书编辑弹窗 */}
      <Modal
        title={editingDoc ? '✏️ 编辑文书' : '➕ 添加文书'}
        open={docModalVisible}
        onCancel={() => { setDocModalVisible(false); setEditingDoc(null); docForm.resetFields(); }}
        onOk={() => docForm.submit()}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <Form form={docForm} layout="vertical" onFinish={handleDocSubmit}>
          <Form.Item label="文书类型" name="docType" rules={[{ required: !editingDoc, message: '请选择文书类型' }]}>
            <Select placeholder="选择文书类型" disabled={!!editingDoc}>
              {DOC_TYPE_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select placeholder="选择状态">
              {DOC_STATUS_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="当前版本" name="version">
            <Input placeholder="如：V1、V2、定稿版" />
          </Form.Item>
          <Form.Item label="备注" name="notes">
            <Input.TextArea rows={3} placeholder="补充说明..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 沟通记录弹窗 */}
      <Modal
        title={editingComm ? '✏️ 编辑沟通记录' : '➕ 添加沟通记录'}
        open={commModalVisible}
        onCancel={() => { setCommModalVisible(false); setEditingComm(null); commForm.resetFields(); }}
        onOk={() => commForm.submit()}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <Form form={commForm} layout="vertical" onFinish={handleCommSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="日期" name="date">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="沟通方式" name="type">
                <Select placeholder="选择方式">
                  {COMM_TYPE_OPTIONS.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="沟通摘要" name="summary" rules={[{ required: true, message: '请输入沟通摘要' }]}>
            <Input.TextArea rows={3} placeholder="本次沟通的主要内容..." />
          </Form.Item>
          <Form.Item label="下一步计划" name="nextAction">
            <Input.TextArea rows={2} placeholder="下一步需要做的事情..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 实习经历弹窗 */}
      <Modal
        title={editingIntern ? '✏️ 编辑实习经历' : '➕ 添加实习经历'}
        open={internModalVisible}
        onCancel={() => { setInternModalVisible(false); setEditingIntern(null); internForm.resetFields(); }}
        onOk={() => internForm.submit()}
        okText="保存"
        cancelText="取消"
        width={550}
      >
        <Form form={internForm} layout="vertical" onFinish={handleInternSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="公司名称" name="company" rules={[{ required: true, message: '请输入公司名称' }]}>
                <Input placeholder="公司名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="职位" name="position" rules={[{ required: true, message: '请输入职位' }]}>
                <Input placeholder="职位名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="开始时间" name="startDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="结束时间" name="endDate">
                <Input type="date" placeholder="留空表示至今" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="工作描述" name="description">
            <Input.TextArea rows={3} placeholder="主要工作内容和成就..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 科研经历弹窗 */}
      <Modal
        title={editingResearch ? '✏️ 编辑科研经历' : '➕ 添加科研经历'}
        open={researchModalVisible}
        onCancel={() => { setResearchModalVisible(false); setEditingResearch(null); researchForm.resetFields(); }}
        onOk={() => researchForm.submit()}
        okText="保存"
        cancelText="取消"
        width={550}
      >
        <Form form={researchForm} layout="vertical" onFinish={handleResearchSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="项目名称" name="title" rules={[{ required: true, message: '请输入项目名称' }]}>
                <Input placeholder="科研项目名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="导师" name="professor">
                <Input placeholder="导师姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="机构" name="institution">
            <Input placeholder="所在机构/学校" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="开始时间" name="startDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="结束时间" name="endDate">
                <Input type="date" placeholder="留空表示至今" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="研究成果/输出" name="output">
            <Input.TextArea rows={3} placeholder="论文、专利、项目成果等..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default StudentDetail;
