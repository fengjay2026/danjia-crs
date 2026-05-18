// 学生数据存储 - 使用 localStorage（按用户隔离）
import { getCurrentUser } from './userStore';

const STORAGE_KEY_PREFIX = 'danjia_crs_students_';
const OLD_STORAGE_KEY = 'danjia_crs_students'; // 旧版数据 key，兼容迁移

function getStorageKey() {
  const user = getCurrentUser();
  return STORAGE_KEY_PREFIX + (user?.username || 'guest');
}

// 获取学生数据（优先新key，回退旧key）
function getStudentsData() {
  const newKey = getStorageKey();
  const newData = localStorage.getItem(newKey);
  if (newData) {
    try { return JSON.parse(newData); } catch { return null; }
  }
  // 兼容旧数据：从旧 key 迁移
  const oldData = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldData) {
    try {
      const parsed = JSON.parse(oldData);
      // 迁移到新 key
      localStorage.setItem(newKey, oldData);
      // 保留旧 key 一份（不删除，避免多端冲突）
      return parsed;
    } catch { return null; }
  }
  return null;
}

const defaultStudents = [
  {
    id: 1,
    name: '张小明',
    chineseName: '张小明',
    school: '上海交通大学',
    major: '计算机科学',
    gpa: '3.7',
    targetMajor: 'CS',
    targetCountries: ['香港', '新加坡'],
    season: '26Fall',
    status: 'active',
    contact: {
      phone: '13800138001',
      email: 'zhangxm@sjtu.edu.cn',
      wechat: 'zhangxm123'
    },
    ielts: {
      status: 'scored',
      overall: 7.0,
      listening: 7.5,
      reading: 7.5,
      writing: 6.5,
      speaking: 6.0,
      examDate: '2026-03-15',
      examCenter: '北京'
    },
    documents: {
      ps: { status: 'final', version: 'v3.0', updatedAt: '2026-04-15' },
      cv: { status: 'final', version: 'v2.1', updatedAt: '2026-04-10' },
      rl1: { status: 'signed', professor: '李教授', updatedAt: '2026-04-12' },
      rl2: { status: 'pending', professor: '王教授', updatedAt: '2026-04-10' }
    },
    applications: [
      { id: 1, school: '香港大学', program: 'CS', rank: '冲刺', status: 'submitted', submittedDate: '2026-01-15' },
      { id: 2, school: '香港中文大学', program: 'CS', rank: '主申', status: 'interview', submittedDate: '2026-01-20' },
      { id: 3, school: '香港科技大学', program: 'IT', rank: '主申', status: 'submitted', submittedDate: '2026-02-01' }
    ],
    communications: [
      { id: 1, date: '2026-04-18', type: '电话', summary: '讨论港中文面试准备情况', nextAction: '跟进面试准备' },
      { id: 2, date: '2026-04-10', type: '微信', summary: 'PS第三稿反馈', nextAction: '确认修改' }
    ],
    internships: [
      { id: 1, company: '腾讯', position: '后端开发', startDate: '2025-06', endDate: '2025-09' }
    ],
    research: [
      { id: 1, title: '机器学习算法研究', professor: '李教授', institution: '上交', startDate: '2024-09', output: '论文参与' }
    ],
    createdAt: '2026-01-01'
  },
  {
    id: 2,
    name: '李思琪',
    chineseName: '李思琪',
    school: '复旦大学',
    major: '金融学',
    gpa: '3.5',
    targetMajor: 'Finance',
    targetCountries: ['新加坡', '香港'],
    season: '26Fall',
    status: 'active',
    contact: {
      phone: '13800138002',
      email: 'lisiq@fudan.edu.cn',
      wechat: 'lisiq456'
    },
    ielts: {
      status: 'pending',
      expectedDate: '2026-05-10',
      target: 7.0,
      examCenter: '广州'
    },
    documents: {
      ps: { status: 'review', version: 'v3.0', updatedAt: '2026-04-18' },
      cv: { status: 'final', version: 'v1.5', updatedAt: '2026-04-08' },
      rl1: { status: 'signed', professor: '张教授', updatedAt: '2026-04-05' },
      rl2: { status: 'pending', professor: '陈教授', updatedAt: '2026-04-01' }
    },
    applications: [
      { id: 1, school: 'NUS', program: 'Finance', rank: '冲刺', status: 'pending' },
      { id: 2, school: 'CityU', program: 'Finance', rank: '主申', status: 'draft' }
    ],
    communications: [
      { id: 1, date: '2026-04-12', type: '视频', summary: 'PS第三稿反馈已完成', nextAction: '确认最终版' }
    ],
    internships: [
      { id: 1, company: '中金公司', position: '投行部', startDate: '2025-07', endDate: '2025-09' }
    ],
    research: [],
    createdAt: '2026-01-15'
  },
  {
    id: 3,
    name: '王浩然',
    chineseName: '王浩然',
    school: '浙江大学',
    major: '数据科学',
    gpa: '3.8',
    targetMajor: 'Data Science',
    targetCountries: ['新加坡'],
    season: '26Fall',
    status: 'active',
    contact: {
      phone: '13800138003',
      email: 'wanghr@zju.edu.cn',
      wechat: 'wanghr789'
    },
    ielts: {
      status: 'preparing',
      expectedDate: '2026-05-24',
      target: 7.0
    },
    documents: {
      ps: { status: 'draft', version: 'v1.0', updatedAt: '2026-04-15' },
      cv: { status: 'draft', version: 'v1.0', updatedAt: '2026-04-10' },
      rl1: { status: 'pending', professor: '待定', updatedAt: '' },
      rl2: { status: 'pending', professor: '待定', updatedAt: '' }
    },
    applications: [
      { id: 1, school: 'NUS', program: 'Data Science', rank: '冲刺', status: 'pending' },
      { id: 2, school: 'NTU', program: 'Data Science', rank: '主申', status: 'pending' }
    ],
    communications: [
      { id: 1, date: '2026-04-19', type: '微信', summary: '催促推荐信签字', nextAction: '等待导师回复' }
    ],
    internships: [
      { id: 1, company: '阿里巴巴', position: '数据分析', startDate: '2025-01', endDate: '2025-03' }
    ],
    research: [
      { id: 1, title: '大数据分析项目', professor: '刘教授', institution: '浙大', startDate: '2025-03', output: '' }
    ],
    createdAt: '2026-02-01'
  },
  {
    id: 4,
    name: '赵雨晴',
    chineseName: '赵雨晴',
    school: '北京大学',
    major: '商业分析',
    gpa: '3.9',
    targetMajor: 'Business Analytics',
    targetCountries: ['香港'],
    season: '26Fall',
    status: 'offer',
    contact: {
      phone: '13800138004',
      email: 'zhaoyq@pku.edu.cn',
      wechat: 'zhaoyq168'
    },
    ielts: {
      status: 'scored',
      overall: 7.5,
      listening: 8.0,
      reading: 7.5,
      writing: 7.0,
      speaking: 7.5,
      examDate: '2026-02-20',
      examCenter: '北京'
    },
    documents: {
      ps: { status: 'submitted', version: 'v2.0', updatedAt: '2026-01-10' },
      cv: { status: 'submitted', version: 'v1.0', updatedAt: '2026-01-05' },
      rl1: { status: 'submitted', professor: '周教授', updatedAt: '2026-01-08' },
      rl2: { status: 'submitted', professor: '吴教授', updatedAt: '2026-01-09' }
    },
    applications: [
      { id: 1, school: '香港大学', program: 'BA', rank: '冲刺', status: 'offer', resultDate: '2026-04-18' },
      { id: 2, school: '香港中文大学', program: 'BA', rank: '主申', status: 'pending' }
    ],
    communications: [
      { id: 1, date: '2026-04-18', type: '电话', summary: '收到港大Offer', nextAction: '考虑offer' }
    ],
    internships: [
      { id: 1, company: '字节跳动', position: '产品经理', startDate: '2025-06', endDate: '2025-08' }
    ],
    research: [
      { id: 1, title: '消费者行为分析', professor: '陈教授', institution: '北大', startDate: '2024-09', output: '论文发表' }
    ],
    createdAt: '2025-11-01'
  }
];

// 获取所有学生
export function getStudents() {
  const data = getStudentsData();
  if (data && data.length > 0) {
    return data;
  }
  // 首次使用，初始化默认数据
  localStorage.setItem(getStorageKey(), JSON.stringify(defaultStudents));
  return defaultStudents;
}

// 根据ID获取学生
export function getStudentById(id) {
  const students = getStudents();
  return students.find(s => s.id === id);
}

// 添加学生
export function addStudent(student) {
  const students = getStudents();
  const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
  const newStudent = {
    ...student,
    id: newId,
    createdAt: new Date().toISOString().split('T')[0],
    applications: [],
    communications: [],
    internships: [],
    research: [],
    documents: {
      ps: { status: 'pending', version: '', updatedAt: '' },
      cv: { status: 'pending', version: '', updatedAt: '' },
      rl1: { status: 'pending', professor: '', updatedAt: '' },
      rl2: { status: 'pending', professor: '', updatedAt: '' }
    }
  };
  students.push(newStudent);
  localStorage.setItem(getStorageKey(), JSON.stringify(students));
  return newStudent;
}

// 更新学生
export function updateStudent(id, updates) {
  const students = getStudents();
  const index = students.findIndex(s => s.id === id);
  if (index !== -1) {
    students[index] = { ...students[index], ...updates };
    localStorage.setItem(getStorageKey(), JSON.stringify(students));
    return students[index];
  }
  return null;
}

// 删除学生
export function deleteStudent(id) {
  const students = getStudents();
  const filtered = students.filter(s => s.id !== id);
  localStorage.setItem(getStorageKey(), JSON.stringify(filtered));
  return filtered;
}

// 获取统计数据
export function getStats() {
  const students = getStudents();
  const inProgress = students.filter(s => s.status === 'active').length;
  const newThisMonth = students.filter(s => {
    const created = new Date(s.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  
  const docPending = students.filter(s => {
    const docs = s.documents || {};
    return docs.ps?.status === 'draft' || docs.ps?.status === 'review' || docs.cv?.status === 'draft';
  }).length;
  
  const offers = students.filter(s => 
    s.applications?.some(a => a.status === 'offer')
  ).length;
  
  const pendingComm = students.filter(s => {
    if (!s.communications || s.communications.length === 0) return true;
    const sorted = [...s.communications].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastComm = sorted[0];
    const daysSince = Math.floor((new Date() - new Date(lastComm.date)) / (1000 * 60 * 60 * 24));
    return daysSince >= 7;
  }).length;
  
  return {
    inProgress,
    newThisMonth,
    docPending,
    offers,
    pendingComm,
    total: students.length
  };
}

// 获取待办任务
export function getTasks() {
  const students = getStudents();
  const tasks = [];
  
  students.forEach(student => {
    // IELTS 考试提醒
    if (student.ielts?.status === 'preparing' || student.ielts?.status === 'pending') {
      const examDate = student.ielts.expectedDate;
      if (examDate) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const target = new Date(examDate); target.setHours(0, 0, 0, 0);
        const daysUntil = Math.floor((target - today) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 7 && daysUntil >= -7) {
          tasks.push({
            id: `ielts-${student.id}`,
            studentId: student.id,
            student: student.name,
            type: '雅思',
            desc: `雅思考试 · 目标${student.ielts.target || '7.0'}`,
            date: examDate,
            days: daysUntil,
            status: daysUntil < 0 ? 'overdue' : daysUntil === 0 ? 'today' : 'soon'
          });
        }
      }
    }
    
    // 申请提交日期提醒
    if (student.applications) {
      student.applications.forEach(app => {
        if (app.submittedDate) {
          // 检查是否已提交
          return;
        }
        // 未提交，检查截止日期
        const deadline = app.submittedDate || app.deadline;
        if (deadline) {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const target = new Date(deadline); target.setHours(0, 0, 0, 0);
          const daysUntil = Math.floor((target - today) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 7 && daysUntil >= 0) {
            tasks.push({
              id: `app-${student.id}-${app.id}`,
              studentId: student.id,
              student: student.name,
              type: '提交',
              desc: `${app.school} · ${app.program || '申请'}`,
              date: deadline,
              days: daysUntil,
              status: daysUntil === 0 ? 'today' : 'soon'
            });
          }
        }
      });
    }
    
    // 沟通提醒 - 超过7天未联系
    if (student.communications && student.communications.length > 0) {
      // 按日期降序排序，取最新沟通记录
      const sorted = [...student.communications].sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastComm = sorted[0];
      const daysSince = Math.floor((new Date() - new Date(lastComm.date)) / (1000 * 60 * 60 * 24));
      if (daysSince >= 7 && daysSince <= 30) {
        tasks.push({
          id: `comm-${student.id}`,
          studentId: student.id,
          student: student.name,
          type: '沟通',
          desc: `已${daysSince}天未联系 · ${lastComm.nextAction || '需跟进'}`,
          date: lastComm.date,
          days: daysSince,
          status: daysSince >= 14 ? 'overdue' : 'soon'
        });
      }
    } else if (!student.communications || student.communications.length === 0) {
      // 从未沟通过的新学生
      tasks.push({
        id: `comm-new-${student.id}`,
        studentId: student.id,
        student: student.name,
        type: '沟通',
        desc: '新学生 · 尚未建立联系',
        date: student.createdAt || new Date().toISOString().split('T')[0],
        days: 0,
        status: 'soon'
      });
    }
    
    // 文书进度提醒 - 搜集材料状态超过14天
    if (student.documents) {
      Object.entries(student.documents).forEach(([docType, doc]) => {
        if (doc.status === 'collecting' && doc.updatedAt) {
          const daysSince = Math.floor((new Date() - new Date(doc.updatedAt)) / (1000 * 60 * 60 * 24));
          if (daysSince >= 14) {
            const docName = {
              ps: 'PS',
              cv: 'CV',
              sop: 'SOP',
              rl1: '推荐信1',
              rl2: '推荐信2',
              rl3: '推荐信3',
              transcript: '成绩单',
              enrollment: '在读证明',
              passport: '护照',
              idcard: '身份证',
              hkmPass: '港澳通行证',
              portfolio: '作品集',
            }[docType] || docType;
            
            tasks.push({
              id: `doc-${student.id}-${docType}`,
              studentId: student.id,
              student: student.name,
              type: '文书',
              desc: `${docName} · 搜集材料中`,
              date: doc.updatedAt,
              days: daysSince,
              status: daysSince >= 21 ? 'overdue' : 'soon'
            });
          }
        }
      });
    }
  });

  // ★ 从日程管理加载待办事项（未完成的日程任务自动加入提醒）
  try {
    const scheduleData = localStorage.getItem('danjia_schedule_items');
    if (scheduleData) {
      const scheduleItems = JSON.parse(scheduleData);
      if (Array.isArray(scheduleItems)) {
        const typeMap = {
          followup: '跟进', ielts: '雅思', document: '文书',
          application: '提交', meeting: '会议', other: '其他',
        };
        const priorityMap = { high: '紧急', medium: '重要', low: '一般' };

        scheduleItems.forEach(item => {
          if (item.status === 'completed') return; // 已完成不提醒
          if (!item.dueDate) return; // 无截止日期不提醒

          const today = new Date(); today.setHours(0, 0, 0, 0);
          const target = new Date(item.dueDate); target.setHours(0, 0, 0, 0);
          const daysUntil = Math.floor((target - today) / (1000 * 60 * 60 * 24));

          // 仅显示7天内或已逾期的日程
          if (daysUntil > 7 && daysUntil >= 0) return;

          tasks.push({
            id: `schedule-${item.id}`,
            studentId: item.studentId || null,
            student: item.studentName || '',
            type: typeMap[item.type] || '其他',
            desc: `${priorityMap[item.priority] || ''} ${item.title}`.trim(),
            date: item.dueDate,
            days: daysUntil,
            status: daysUntil < 0 ? 'overdue' : daysUntil === 0 ? 'today' : 'soon',
            // 附加原数据，用于Dashboard卡片显示详情
            schedulePriority: item.priority,
            scheduleDesc: item.description,
          });
        });
      }
    }
  } catch (e) { /* 忽略日程数据异常 */ }

  // 按紧急程度排序：已逾期 > 今天 > 7天内 > 其他
  return tasks.sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (b.status === 'overdue' && a.status !== 'overdue') return 1;
    if (a.status === 'today' && b.status !== 'today') return -1;
    if (b.status === 'today' && a.status !== 'today') return 1;
    return a.days - b.days;
  });
}
