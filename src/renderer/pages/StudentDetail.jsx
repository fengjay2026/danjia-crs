import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Row, Col, Tabs, Table, Button, Divider, Modal, Form, Input, Select, InputNumber, message, Space, Empty, Tooltip, Upload } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlusOutlined, UploadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getStudentById, updateStudent } from '../data/store';
import * as XLSX from 'xlsx';

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

// 任务类型配置（与日程管理一致）
const PLAN_TASK_TYPE_OPTIONS = [
  { value: 'followup', label: '跟进' },
  { value: 'ielts', label: '雅思' },
  { value: 'document', label: '文书' },
  { value: 'application', label: '申请' },
  { value: 'meeting', label: '会议' },
  { value: 'other', label: '其他' },
];

// 优先级配置（与日程管理一致）
const PLAN_PRIORITY_OPTIONS = [
  { value: 'high', label: '🔴 紧急' },
  { value: 'medium', label: '🟠 重要' },
  { value: 'low', label: '🔵 一般' },
];

const SCHEDULE_STORAGE_KEY = 'danjia_schedule_items';

const STATUS_OPTIONS = [
  { value: 'material_prep', label: '📋 材料准备中', color: 'cyan' },
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
  const [searchParams] = useSearchParams();
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'applications');
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
  const [editingCell, setEditingCell] = useState(null); // { appId, field }
  const [cellValue, setCellValue] = useState(null);
  const [editingDocCell, setEditingDocCell] = useState(null); // { docType, field } 文书内联编辑
  const [editingCommCell, setEditingCommCell] = useState(null); // { commId, field } 沟通记录内联编辑
  const [commModalVisible, setCommModalVisible] = useState(false);
  const [internModalVisible, setInternModalVisible] = useState(false);
  const [researchModalVisible, setResearchModalVisible] = useState(false);
  const [editingComm, setEditingComm] = useState(null);
  const [editingIntern, setEditingIntern] = useState(null);
  const [editingResearch, setEditingResearch] = useState(null);
  const [excelPreviewVisible, setExcelPreviewVisible] = useState(false);
  const [excelPreviewData, setExcelPreviewData] = useState({ rows: [], matchedCols: [], totalRows: 0 });

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
      resultDate: values.resultDate || '',
      faculty: values.faculty || '',
      link: values.link || '',
      deadline: values.deadline || '',
      expectedSubmitDate: values.expectedSubmitDate || '',
      languageRequirement: values.languageRequirement || '',
      notes: values.notes || ''
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

  // 上下移动申请目标
  const moveAppItem = (appId, direction) => {
    const apps = [...(student.applications || [])];
    const idx = apps.findIndex(a => a.id === appId);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= apps.length) return;

    // 交换位置
    [apps[idx], apps[targetIdx]] = [apps[targetIdx], apps[idx]];
    const updated = { ...student, applications: apps };
    updateStudent(student.id, updated);
    refreshStudent();
  };

  // ===== Excel 导入逻辑 =====
  const EXCEL_COLUMN_MAP = [
    { keywords: ['学校', '大学', '院校', 'school', 'university'], field: 'school', required: true },
    { keywords: ['申请专业', '专业名称', '专业名', '项目名称', '项目名', 'program', 'major', 'programme'], field: 'program' },
    { keywords: ['学院', '系所', 'faculty', 'department', 'school', 'institute'], field: 'faculty' },
    { keywords: ['链接', '网址', 'url', 'link', 'website'], field: 'link' },
    { keywords: ['类型', '档次', '定位', 'rank', 'level'], field: 'rank' },
    { keywords: ['截止', 'ddl', 'deadline', 'dead line', 'dead_line'], field: 'deadline' },
    { keywords: ['预计提交', '提交日期', '预计', 'expected submit', 'plan submit', 'submitted date'], field: 'expectedSubmitDate' },
    { keywords: ['语言', '雅思', '托福', 'english', 'language', '申请要求', 'requirement'], field: 'languageRequirement' },
    { keywords: ['状态', 'status', 'stage'], field: 'status' },
    { keywords: ['备注', '注释', 'note', 'notes', 'remark'], field: 'notes' },
  ];

  /** 根据列名智能匹配对应的字段名 */
  const matchColumn = (header) => {
    const h = header.trim().toLowerCase();
    for (const rule of EXCEL_COLUMN_MAP) {
      if (rule.keywords.some(kw => h.includes(kw))) {
        return rule.field;
      }
    }
    return null;
  };

  /** 解析Excel文件 */
  const handleExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (jsonData.length === 0) {
          message.warning('Excel文件为空');
          return;
        }

        // 解析表头映射
        const headers = Object.keys(jsonData[0]);
        const colMapping = {};
        const matchedCols = [];

        headers.forEach(h => {
          const field = matchColumn(h);
          if (field) {
            colMapping[h] = field;
            matchedCols.push({ excelHeader: h, field });
          }
        });

        // 检查是否有必填字段（学校）
        const hasSchoolMatch = matchedCols.some(m => m.field === 'school');
        if (!hasSchoolMatch) {
          message.error('未找到「学校」列，请确保Excel包含学校/大学名称列');
          return;
        }

        // 转换为applications数据
        const rows = jsonData.map((row, idx) => {
          const app = { id: Date.now() + idx };

          Object.entries(colMapping).forEach(([excelHeader, field]) => {
            const val = String(row[excelHeader] || '').trim();
            if (val) {
              app[field] = val;
            }
          });

          // 补充默认值
          if (!app.rank) app.rank = '主申';
          if (!app.status) app.status = 'pending';
          return app;
        });

        setExcelPreviewData({ rows, matchedCols, totalRows: rows.length });
        setExcelPreviewVisible(true);

      } catch (err) {
        message.error('文件解析失败：' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // 阻止Upload自动上传
  };

  /** 确认导入Excel数据 */
  const confirmExcelImport = () => {
    const { rows } = excelPreviewData;
    if (rows.length === 0) return;

    const updated = {
      ...student,
      applications: rows
    };
    updateStudent(student.id, updated);
    refreshStudent();
    setExcelPreviewVisible(false);
    setExcelPreviewData({ rows: [], matchedCols: [], totalRows: 0 });
    message.success(`成功导入 ${rows.length} 条申请目标`);
  };

  // ===== 行内编辑 =====
  const startCellEdit = (appId, field, currentValue) => {
    setEditingCell({ appId, field });
    setCellValue(currentValue);
  };

  // 行内编辑：保存（支持传入新值解决异步问题）
  const saveCellEdit = (newValue) => {
    if (!editingCell) return;
    const { appId, field } = editingCell;
    const valueToSave = newValue !== undefined ? newValue : cellValue;
    const updated = {
      ...student,
      applications: student.applications.map(a =>
        a.id === appId ? { ...a, [field]: valueToSave } : a
      )
    };
    updateStudent(student.id, updated);
    refreshStudent();
    setEditingCell(null);
    setCellValue(null);
    message.success('已保存');
  };

  // 行内编辑：取消
  const cancelCellEdit = () => {
    setEditingCell(null);
    setCellValue(null);
  };

  const cancelDocCellEdit = () => {
    setEditingDocCell(null);
  };

  // 文书表格内联编辑保存（直接传值，绕过 state 异步问题）
  const saveDocCellEdit = (newValue) => {
    if (!editingDocCell) return;
    const { docType, field } = editingDocCell;
    const doc = student.documents?.[docType] || {};
    const timestamp = new Date().toISOString().split('T')[0];
    const updatedDoc = { ...doc, [field]: newValue };
    // 只有编辑非 updatedAt 字段时，才自动更新最后更新日期
    if (field !== 'updatedAt') {
      updatedDoc.updatedAt = timestamp;
    }
    const updated = {
      ...student,
      documents: { ...(student.documents || {}), [docType]: updatedDoc }
    };
    updateStudent(student.id, updated);
    refreshStudent();
    setEditingDocCell(null);
    message.success('已保存');
  };

  // 文书内联编辑：开始编辑
  const startDocCellEdit = (docType, field, currentValue) => {
    setEditingDocCell({ docType, field });
  };

  // 沟通记录内联编辑：保存
  const saveCommCellEdit = (newValue) => {
    if (!editingCommCell) return;
    const { commId, field } = editingCommCell;
    const updated = {
      ...student,
      communications: (student.communications || []).map(c =>
        c.id === commId ? { ...c, [field]: newValue } : c
      )
    };
    updateStudent(student.id, updated);
    refreshStudent();
    setEditingCommCell(null);
    message.success('已保存');
  };

  // 沟通记录内联编辑：开始编辑
  const startCommCellEdit = (commId, field, currentValue) => {
    setEditingCommCell({ commId, field });
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

  // 从 localStorage 加载日程数据
  const loadScheduleItems = () => {
    try {
      const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return [];
  };

  // 保存日程数据到 localStorage
  const saveScheduleItems = (items) => {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
  };

  // 创建或更新日程任务
  const syncScheduleTask = (commData, isEdit) => {
    const scheduleItems = loadScheduleItems();

    if (isEdit && commData.planSyncTaskId) {
      // 编辑：更新已关联的日程任务
      const updated = scheduleItems.map(item =>
        item.id === commData.planSyncTaskId
          ? {
              ...item,
              title: commData.nextAction || '待办事项',
              type: commData.planTaskType || 'followup',
              priority: commData.planPriority || 'medium',
              dueDate: commData.planDueDate || '',
              description: commData.planDescription || '',
              studentId: student.id,
              studentName: student.name,
            }
          : item
      );
      saveScheduleItems(updated);
    } else if (!isEdit && (commData.nextAction || commData.planDueDate)) {
      // 新增且有下一步计划：创建日程任务
      const newTask = {
        id: Date.now(),
        studentId: student.id,
        studentName: student.name,
        title: commData.nextAction || '待办事项',
        type: commData.planTaskType || 'followup',
        priority: commData.planPriority || 'medium',
        dueDate: commData.planDueDate || '',
        status: 'pending',
        description: commData.planDescription || '',
        createdAt: commData.date || new Date().toISOString().split('T')[0],
        sourceCommId: commData.id,
      };
      saveScheduleItems([...scheduleItems, newTask]);
      // 将任务ID保存回沟通记录，方便后续编辑/删除
      commData.planSyncTaskId = newTask.id;
    }
  };

  const handleCommSubmit = (values) => {
    const commData = {
      id: editingComm ? editingComm.id : Date.now(),
      date: values.date || '',
      type: values.type || '',
      summary: values.summary || '',
      nextAction: values.nextAction || '',
      planTaskType: values.planTaskType || '',
      planPriority: values.planPriority || '',
      planDueDate: values.planDueDate || '',
      planDescription: values.planDescription || '',
    };

    // 保存时携带原有的 planSyncTaskId（编辑场景）
    if (editingComm && editingComm.planSyncTaskId) {
      commData.planSyncTaskId = editingComm.planSyncTaskId;
    }

    // 同步到日程管理（在更新学生数据前，因为 sync 可能会修改 commData.planSyncTaskId）
    syncScheduleTask(commData, !!editingComm);

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
    {
      title: '#', key: 'index', width: 40,
      render: (_, __, idx) => (
        <span style={{ color: '#999', fontSize: 12 }}>{idx + 1}</span>
      ),
    },
    {
      title: '学校', dataIndex: 'school', key: 'school', width: 150,
      render: (text, record) => {
        const isEditing = editingCell?.appId === record.id && editingCell?.field === 'school';
        return isEditing ? (
          <Input autoFocus size="small" defaultValue={text}
            onChange={(e) => setCellValue(e.target.value)}
            onPressEnter={(e) => saveCellEdit(e.target.value)}
            onBlur={(e) => saveCellEdit(e.target.value)}
            style={{ width: 130 }}
          />
        ) : (
          <span onClick={() => startCellEdit(record.id, 'school', text)}
            style={{ cursor: 'pointer', display: 'inline-block', padding: '2px 6px', borderRadius: 4, minWidth: 60, fontSize: 13 }}
            title="点击修改"
          >
            {text || <span style={{ color: '#bbb' }}>—</span>}
          </span>
        );
      }
    },
    {
      title: '申请专业', dataIndex: 'program', key: 'program', width: 300,
      render: (text, record) => {
        const isEditing = editingCell?.appId === record.id && editingCell?.field === 'program';
        return isEditing ? (
          <Input autoFocus size="small" defaultValue={text}
            onChange={(e) => setCellValue(e.target.value)}
            onPressEnter={(e) => saveCellEdit(e.target.value)}
            onBlur={(e) => saveCellEdit(e.target.value)}
            style={{ width: 260 }}
          />
        ) : (
          <span onClick={() => startCellEdit(record.id, 'program', text)}
            style={{ cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}
            title="点击修改"
          >
            {text || <span style={{ color: '#bbb' }}>—</span>}
          </span>
        );
      }
    },
    {
      title: '链接', dataIndex: 'link', key: 'link', width: 56,
      render: (text) => text
        ? <a href={text} target="_blank" rel="noopener noreferrer" title={text}>🔗</a>
        : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: '截止日期', dataIndex: 'deadline', key: 'deadline', width: 100,
      render: (text, record) => {
        const isEditing = editingCell?.appId === record.id && editingCell?.field === 'deadline';
        return isEditing ? (
          <Input autoFocus type="date" size="small" defaultValue={text}
            onChange={(e) => setCellValue(e.target.value)}
            onBlur={(e) => saveCellEdit(e.target.value)}
            style={{ width: 90 }}
          />
        ) : (
          <span onClick={() => startCellEdit(record.id, 'deadline', text)}
            style={{ cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}
            title="点击修改"
          >
            {text || <span style={{ color: '#bbb' }}>—</span>}
          </span>
        );
      }
    },
    {
      title: '类型', dataIndex: 'rank', key: 'rank', width: 70,
      render: (text, record) => {
        const isEditing = editingCell?.appId === record.id && editingCell?.field === 'rank';
        const rankOptions = ['冲刺', '主申', '保底'];
        return isEditing ? (
          <Select autoFocus size="small" defaultValue={text || '主申'}
            onChange={(v) => saveCellEdit(v)}
            onBlur={() => cancelCellEdit()}
            style={{ width: 65 }}
          >
            {rankOptions.map(o => <Option key={o} value={o}>{o}</Option>)}
          </Select>
        ) : (
          <Tag onClick={() => startCellEdit(record.id, 'rank', text || '主申')}
            style={{ cursor: 'pointer', fontSize: 11, margin: 0 }}
            title="点击修改"
          >
            {text || '主申'}
          </Tag>
        );
      }
    },
    {
      title: '申请状态', dataIndex: 'status', key: 'status', width: 100,
      render: (text, record) => {
        const isEditing = editingCell?.appId === record.id && editingCell?.field === 'status';
        return isEditing ? (
          <Select autoFocus size="small" defaultValue={text}
            onChange={(v) => saveCellEdit(v)}
            style={{ width: 90 }}
          >
            {STATUS_OPTIONS.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
          </Select>
        ) : (
          <span onClick={() => startCellEdit(record.id, 'status', text)} style={{ cursor: 'pointer' }} title="点击修改">
            {getStatusTag(text)}
          </span>
        );
      }
    },
    {
      title: '备注', dataIndex: 'notes', key: 'notes', width: 120,
      render: (text, record) => {
        const isEditing = editingCell?.appId === record.id && editingCell?.field === 'notes';
        return isEditing ? (
          <Input autoFocus size="small" defaultValue={text || ''}
            onChange={(e) => setCellValue(e.target.value)}
            onPressEnter={(e) => saveCellEdit(e.target.value)}
            onBlur={(e) => saveCellEdit(e.target.value)}
            style={{ width: 110 }}
          />
        ) : (
          text ? (
            <Tooltip title={text} placement="topLeft">
              <span onClick={() => startCellEdit(record.id, 'notes', text)}
                style={{ cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4, maxHeight: '2.8em', fontSize: 12 }}
                title="点击修改"
              >
                {text}
              </span>
            </Tooltip>
          ) : (
            <span onClick={() => startCellEdit(record.id, 'notes', text)}
              style={{ cursor: 'pointer', color: '#bbb', fontSize: 12 }}
              title="点击添加备注"
            >
              —
            </span>
          )
        );
      }
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<ArrowUpOutlined />}
            onClick={() => moveAppItem(record.id, -1)}
            disabled={student.applications?.findIndex(a => a.id === record.id) === 0}
            style={{ color: '#999', padding: '0 4px' }}
            title="上移" />
          <Button type="text" size="small" icon={<ArrowDownOutlined />}
            onClick={() => moveAppItem(record.id, 1)}
            disabled={student.applications?.findIndex(a => a.id === record.id) === (student.applications?.length || 1) - 1}
            style={{ color: '#999', padding: '0 4px' }}
            title="下移" />
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openAppModal(record)}
            style={{ padding: '0 6px' }}>编辑</Button>
          <Button type="link" danger size="small" onClick={() => handleDeleteApp(record.id)}
            style={{ padding: '0 6px' }}>删除</Button>
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
              <Descriptions.Item label="文案老师">
                {student.copywriter ? (
                  <Tag color="purple">{student.copywriter}</Tag>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="目标专业">{student.targetMajor || '-'}</Descriptions.Item>
              <Descriptions.Item label="目标地区">{student.targetCountries?.map(c => <Tag key={c}>{c}</Tag>)}</Descriptions.Item>
              <Descriptions.Item label="申请类别">{student.applicationCategory ? <Tag color="blue">{student.applicationCategory}</Tag> : '-'}</Descriptions.Item>
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
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              items={[
                {
                  key: 'applications',
                  label: '🎓 申请目标',
                  children: (
                    <div>
                      <Space style={{ marginBottom: 16 }}>
                        <Button type="primary" icon={<PlusOutlined />} style={{ backgroundColor: COLORS.primary }} onClick={() => openAppModal()}>添加申请目标</Button>
                        <Upload beforeUpload={handleExcelFile} accept=".xlsx,.xls,.csv" showUploadList={false}>
                          <Button icon={<UploadOutlined />}>从Excel导入</Button>
                        </Upload>
                      </Space>
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
                            render: (status, record) => {
                              const isEditing = editingDocCell?.docType === record.key && editingDocCell?.field === 'status';
                              return isEditing ? (
                                <Select
                                  autoFocus size="small" defaultValue={status}
                                  onChange={(v) => saveDocCellEdit(v)}
                                  style={{ width: 120 }}
                                >
                                  {DOC_STATUS_OPTIONS.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
                                </Select>
                              ) : (
                                <span onClick={() => startDocCellEdit(record.key, 'status', status)} style={{ cursor: 'pointer' }} title="点击修改">
                                  {getDocStatusTag(status)}
                                </span>
                              );
                            },
                          },
                          {
                            title: '版本',
                            dataIndex: 'version',
                            key: 'version',
                            render: (version, record) => {
                              const isEditing = editingDocCell?.docType === record.key && editingDocCell?.field === 'version';
                              return isEditing ? (
                                <Input
                                  autoFocus size="small" defaultValue={version || ''}
                                  onChange={(e) => {}}
                                  onPressEnter={(e) => saveDocCellEdit(e.target.value)}
                                  onBlur={(e) => saveDocCellEdit(e.target.value)}
                                  style={{ width: 80 }}
                                />
                              ) : (
                                <span onClick={() => startDocCellEdit(record.key, 'version', version)} style={{ cursor: 'pointer' }} title="点击修改">
                                  {version || '-'}
                                </span>
                              );
                            },
                          },
                          {
                            title: '最后更新',
                            dataIndex: 'updatedAt',
                            key: 'updatedAt',
                            render: (date, record) => {
                              const isEditing = editingDocCell?.docType === record.key && editingDocCell?.field === 'updatedAt';
                              return isEditing ? (
                                <Input
                                  autoFocus size="small" type="date" defaultValue={date || ''}
                                  onChange={(e) => {}}
                                  onBlur={(e) => saveDocCellEdit(e.target.value)}
                                  style={{ width: 110 }}
                                />
                              ) : (
                                <span onClick={() => startDocCellEdit(record.key, 'updatedAt', date)} style={{ cursor: 'pointer' }} title="点击修改">
                                  {date || <span style={{ color: '#bbb' }}>—</span>}
                                </span>
                              );
                            },
                          },
                          {
                            title: '备注',
                            dataIndex: 'notes',
                            key: 'notes',
                            ellipsis: true,
                            render: (notes, record) => {
                              const isEditing = editingDocCell?.docType === record.key && editingDocCell?.field === 'notes';
                              return isEditing ? (
                                <Input
                                  autoFocus size="small" defaultValue={notes || ''}
                                  onChange={(e) => {}}
                                  onPressEnter={(e) => saveDocCellEdit(e.target.value)}
                                  onBlur={(e) => saveDocCellEdit(e.target.value)}
                                  style={{ width: 150 }}
                                />
                              ) : (
                                <span onClick={() => startDocCellEdit(record.key, 'notes', notes)} style={{ cursor: 'pointer' }} title="点击修改">
                                  {notes || <span style={{ color: '#bbb' }}>—</span>}
                                </span>
                              );
                            },
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
                          { key: 'transcript', name: DOC_NAME_MAP.transcript, ...student.documents?.transcript },
                          { key: 'cv', name: DOC_NAME_MAP.cv, ...student.documents?.cv },
                          { key: 'ps', name: DOC_NAME_MAP.ps, ...student.documents?.ps },
                          { key: 'rl1', name: DOC_NAME_MAP.rl1, ...student.documents?.rl1 },
                          { key: 'rl2', name: DOC_NAME_MAP.rl2, ...student.documents?.rl2 },
                          { key: 'sop', name: DOC_NAME_MAP.sop, ...student.documents?.sop },
                          { key: 'rl3', name: DOC_NAME_MAP.rl3, ...student.documents?.rl3 },
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
                          {
                            title: '日期', dataIndex: 'date', key: 'date', width: 120,
                            render: (date, record) => {
                              const isEditing = editingCommCell?.commId === record.id && editingCommCell?.field === 'date';
                              return isEditing ? (
                                <Input
                                  autoFocus size="small" type="date" defaultValue={date || ''}
                                  onChange={(e) => {}}
                                  onBlur={(e) => saveCommCellEdit(e.target.value)}
                                  style={{ width: 110 }}
                                />
                              ) : (
                                <span onClick={() => startCommCellEdit(record.id, 'date', date)} style={{ cursor: 'pointer' }} title="点击修改">
                                  {date || <span style={{ color: '#bbb' }}>—</span>}
                                </span>
                              );
                            },
                          },
                          {
                            title: '方式', dataIndex: 'type', key: 'type', width: 100,
                            render: (type, record) => {
                              const isEditing = editingCommCell?.commId === record.id && editingCommCell?.field === 'type';
                              return isEditing ? (
                                <Select
                                  autoFocus size="small" defaultValue={type || ''}
                                  onChange={(v) => saveCommCellEdit(v)}
                                  style={{ width: 80 }}
                                >
                                  <Option value="电话">电话</Option>
                                  <Option value="微信">微信</Option>
                                  <Option value="视频">视频</Option>
                                  <Option value="邮件">邮件</Option>
                                  <Option value="面谈">面谈</Option>
                                </Select>
                              ) : (
                                <span onClick={() => startCommCellEdit(record.id, 'type', type)} style={{ cursor: 'pointer' }} title="点击修改">
                                  {type || <span style={{ color: '#bbb' }}>—</span>}
                                </span>
                              );
                            },
                          },
                          {
                            title: '摘要', dataIndex: 'summary', key: 'summary',
                            render: (text, record) => {
                              const isEditing = editingCommCell?.commId === record.id && editingCommCell?.field === 'summary';
                              return isEditing ? (
                                <Input
                                  autoFocus size="small" defaultValue={text || ''}
                                  onChange={(e) => {}}
                                  onPressEnter={(e) => saveCommCellEdit(e.target.value)}
                                  onBlur={(e) => saveCommCellEdit(e.target.value)}
                                  style={{ width: 200 }}
                                />
                              ) : (
                                <Tooltip title={text || '无内容'} placement="topLeft">
                                  <span
                                    onClick={() => startCommCellEdit(record.id, 'summary', text)}
                                    style={{ cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6, maxHeight: '3.2em' }}
                                    title="点击修改"
                                  >
                                    {text || <span style={{ color: '#bbb' }}>—</span>}
                                  </span>
                                </Tooltip>
                              );
                            },
                          },
                          {
                            title: '下一步', dataIndex: 'nextAction', key: 'nextAction',
                            render: (text, record) => {
                              const isEditing = editingCommCell?.commId === record.id && editingCommCell?.field === 'nextAction';
                              return isEditing ? (
                                <Input
                                  autoFocus size="small" defaultValue={text || ''}
                                  onChange={(e) => {}}
                                  onPressEnter={(e) => saveCommCellEdit(e.target.value)}
                                  onBlur={(e) => saveCommCellEdit(e.target.value)}
                                  style={{ width: 200 }}
                                />
                              ) : (
                                <Tooltip title={text || '无内容'} placement="topLeft">
                                  <span
                                    onClick={() => startCommCellEdit(record.id, 'nextAction', text)}
                                    style={{ cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6, maxHeight: '3.2em' }}
                                    title="点击修改"
                                  >
                                    {text || <span style={{ color: '#bbb' }}>—</span>}
                                  </span>
                                </Tooltip>
                              );
                            },
                          },
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
              <Form.Item label="申请专业" name="program">
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="链接" name="link">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="截止日期" name="deadline">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="申请状态" name="status">
                <Select>
                  {STATUS_OPTIONS.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="备注" name="notes">
                <Input.TextArea rows={2} placeholder="备注信息..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Excel导入预览弹窗 */}
      <Modal
        title="📋 Excel导入预览"
        open={excelPreviewVisible}
        onCancel={() => { setExcelPreviewVisible(false); setExcelPreviewData({ rows: [], matchedCols: [], totalRows: 0 }); }}
        onOk={confirmExcelImport}
        okText={`确认导入 ${excelPreviewData.totalRows} 条`}
        cancelText="取消"
        width={700}
      >
        {excelPreviewData.matchedCols.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>匹配到的列：</span>
            <Space wrap style={{ marginLeft: 8 }}>
              {excelPreviewData.matchedCols.map((m, i) => (
                <Tag key={i} color="blue">{m.excelHeader} → {m.field}</Tag>
              ))}
            </Space>
          </div>
        )}
        <div style={{ marginBottom: 8, color: '#888', fontSize: 12 }}>
          共解析 <strong>{excelPreviewData.totalRows}</strong> 条数据。导入后将<strong style={{ color: COLORS.danger }}>覆盖</strong>现有全部申请目标。
        </div>
        <Table
          dataSource={excelPreviewData.rows.slice(0, 10)}
          columns={[
            { title: '#', key: 'index', width: 40, render: (_, __, idx) => idx + 1 },
            { title: '学校', dataIndex: 'school', width: 120, ellipsis: true },
            { title: '申请专业', dataIndex: 'program', width: 100, ellipsis: true },
            { title: '链接', dataIndex: 'link', width: 80, ellipsis: true },
            { title: 'DDL', dataIndex: 'deadline', width: 100 },
            { title: '类型', dataIndex: 'rank', width: 60 },
            { title: '申请状态', dataIndex: 'status', width: 80, ellipsis: true },
            { title: '备注', dataIndex: 'notes', width: 100, ellipsis: true },
          ]}
          rowKey={(_, idx) => idx}
          pagination={false}
          size="small"
        />
        {excelPreviewData.totalRows > 10 && (
          <div style={{ marginTop: 8, textAlign: 'center', color: '#888', fontSize: 12 }}>
            ... 仅显示前10条，共 {excelPreviewData.totalRows} 条
          </div>
        )}
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

          {/* ----- 下一步计划（可折叠式扩展） ----- */}
          <div style={{ borderTop: '1px dashed #d9d9d9', paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E3A5F', marginBottom: 8 }}>
              📋 下一步计划
            </div>
            <Form.Item name="nextAction" style={{ marginBottom: 8 }}>
              <Input placeholder="计划标题（简要描述）" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="planTaskType" label="任务类型" style={{ marginBottom: 8 }}>
                  <Select placeholder="选择类型" allowClear>
                    {PLAN_TASK_TYPE_OPTIONS.map(opt => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="planPriority" label="优先级" style={{ marginBottom: 8 }}>
                  <Select placeholder="选择优先级" allowClear>
                    {PLAN_PRIORITY_OPTIONS.map(opt => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="planDueDate" label="截止日期" style={{ marginBottom: 8 }}>
              <Input type="date" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="planDescription" label="详细描述" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={2} placeholder="补充说明..." />
            </Form.Item>
          </div>
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
