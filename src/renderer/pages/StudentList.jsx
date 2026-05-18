import React, { useState, useEffect } from 'react';
import { Card, Table, Progress, Tag, Row, Col, Button, Space, Input, Select, Modal, message, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStudents, deleteStudent, updateStudent } from '../data/store';

const COLORS = {
  primary: '#1E3A5F',
  accent: '#FF6B35',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  textSecondary: '#6B7280',
};

function StudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [selectedSeasons, setSelectedSeasons] = useState(['26Fall', '27Fall']);
  const [loading, setLoading] = useState(true);
  const [editingCopywriter, setEditingCopywriter] = useState(null); // student id being edited
  const [editingCategory, setEditingCategory] = useState(null); // student id being edited
  const [editingSeason, setEditingSeason] = useState(null); // student id being edited

  const COPYWRITER_OPTIONS = ['檬檬', '鑫欣', '然然', '欢欢', '外围', '其他'];
  const CATEGORY_OPTIONS = ['中学', '本科', '硕士', '博士', '本科预科', '硕士预科'];

  useEffect(() => {
    loadStudents();
  }, []);

  // 监听申请季筛选变化
  useEffect(() => {
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
    setLoading(true);
    const data = getStudents();
    setStudents(data);
    setFilteredStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    let filtered = students;
    
    if (searchText) {
      filtered = filtered.filter(s => 
        s.name.includes(searchText) ||
        s.school.includes(searchText) ||
        s.major.includes(searchText)
      );
    }
    
    // 根据侧边栏选中的申请季过滤（自定义申请季始终显示）
    if (selectedSeasons.length > 0 && !selectedSeasons.includes('all')) {
      filtered = filtered.filter(s =>
        selectedSeasons.includes(s.season) || !['26Fall', '27Fall', '28Fall', '25Fall', '25Spring', '26Spring', '27Spring', '28Spring'].includes(s.season)
      );
    }
    
    if (seasonFilter !== 'all') {
      filtered = filtered.filter(s => s.season === seasonFilter);
    }
    
    setFilteredStudents(filtered);
  }, [searchText, seasonFilter, students, selectedSeasons]);

  const handleDelete = (id, name) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除学生 "${name}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteStudent(id);
        message.success('删除成功');
        loadStudents();
      }
    });
  };

  const getLastCommDays = (student) => {
    if (!student.communications || student.communications.length === 0) {
      return { days: '无记录', color: COLORS.danger };
    }
    // 按日期降序排序，取最新一条沟通记录
    const sorted = [...student.communications].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastComm = sorted[0];
    const days = Math.floor((new Date() - new Date(lastComm.date)) / (1000 * 60 * 60 * 24));
    if (days >= 14) return { days: `${days}天`, color: COLORS.danger };
    if (days >= 7) return { days: `${days}天`, color: COLORS.warning };
    return { days: `${days}天`, color: COLORS.success };
  };

  const getDocStatus = (student) => {
    const docs = student.documents || {};
    const statuses = [docs.ps?.status, docs.cv?.status].filter(Boolean);
    if (statuses.includes('submitted')) return { text: '已提交', color: 'purple' };
    if (statuses.includes('final')) return { text: '定稿', color: 'success' };
    if (statuses.includes('review')) return { text: '修改中', color: 'processing' };
    if (statuses.includes('draft')) return { text: '初稿', color: 'warning' };
    return { text: '待开始', color: 'default' };
  };

  const getProgress = (student) => {
    const docs = student.documents || {};
    let progress = 0;
    if (docs.ps?.status === 'submitted') progress += 20;
    else if (docs.ps?.status === 'final') progress += 15;
    else if (docs.ps?.status) progress += 10;
    
    if (docs.cv?.status === 'submitted') progress += 15;
    else if (docs.cv?.status === 'final') progress += 12;
    else if (docs.cv?.status) progress += 8;
    
    if (docs.rl1?.status === 'submitted' || docs.rl1?.status === 'signed') progress += 15;
    else if (docs.rl1?.status) progress += 10;
    
    const apps = student.applications || [];
    const submitted = apps.filter(a => a.status === 'submitted' || a.status === 'offer').length;
    progress += Math.min(submitted * 15, 30);
    
    const offers = apps.filter(a => a.status === 'offer').length;
    if (offers > 0) progress = 100;
    
    return progress;
  };

  const saveCopywriter = (studentId, value) => {
    if (!value) {
      setEditingCopywriter(null);
      return;
    }
    const student = students.find(s => s.id === studentId);
    if (student) {
      updateStudent(studentId, { ...student, copywriter: value });
      loadStudents(); // 刷新列表
    }
    setEditingCopywriter(null);
  };

  const saveCategory = (studentId, value) => {
    if (!value) {
      setEditingCategory(null);
      return;
    }
    const student = students.find(s => s.id === studentId);
    if (student) {
      updateStudent(studentId, { ...student, applicationCategory: value });
      loadStudents();
    }
    setEditingCategory(null);
  };

  const saveSeason = (studentId, value) => {
    if (!value) {
      setEditingSeason(null);
      return;
    }
    const student = students.find(s => s.id === studentId);
    if (student) {
      updateStudent(studentId, { ...student, season: value });
      loadStudents();
    }
    setEditingSeason(null);
  };

  const columns = [
    {
      title: '学生',
      key: 'name',
      render: (_, record) => (
        <Space>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: COLORS.primary, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 16,
            cursor: 'pointer'
          }}
          onClick={() => navigate(`/students/${record.id}`)}
          >
            {record.name[0]}
          </div>
          <div>
            <div
              style={{ fontWeight: 600, color: COLORS.primary, cursor: 'pointer' }}
              onClick={() => navigate(`/students/${record.id}`)}
            >
              {record.name}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
              ID: STU{record.id.toString().padStart(3, '0')}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '学校 / 专业',
      key: 'school',
      render: (_, record) => (
        <div>
          <div>{record.school}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
            {record.major} · GPA {record.gpa}
          </div>
        </div>
      ),
    },
    {
      title: '申请季',
      key: 'season',
      render: (_, record) => {
        const text = record.season;
        if (editingSeason === record.id) {
          return (
            <Input
              autoFocus
              size="small"
              defaultValue={text || ''}
              style={{ width: 90 }}
              onPressEnter={(e) => saveSeason(record.id, e.target.value)}
              onBlur={(e) => saveSeason(record.id, e.target.value)}
            />
          );
        }
        return text
          ? <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => setEditingSeason(record.id)}>{text}</Tag>
          : <span onClick={() => setEditingSeason(record.id)} style={{ color: '#bbb', cursor: 'pointer' }} title="点击设置申请季">—</span>;
      },
    },
    {
      title: '申请类别',
      key: 'applicationCategory',
      width: 110,
      render: (_, record) => {
        const cat = record.applicationCategory;
        const emojiMap = { '中学': '🎒', '本科': '🎓', '硕士': '📜', '博士': '🔬', '本科预科': '📚', '硕士预科': '📖' };

        if (editingCategory === record.id) {
          return (
            <Select
              autoFocus
              size="small"
              defaultValue={cat || undefined}
              style={{ width: 105 }}
              onChange={(v) => saveCategory(record.id, v)}
              onBlur={() => setEditingCategory(null)}
              open
            >
              {CATEGORY_OPTIONS.map(opt => (
                <Select.Option key={opt} value={opt}>{emojiMap[opt] || ''} {opt}</Select.Option>
              ))}
            </Select>
          );
        }

        return cat
          ? <Tag color="geekblue" style={{ cursor: 'pointer' }} onClick={() => setEditingCategory(record.id)}>{emojiMap[cat] || ''} {cat}</Tag>
          : <span onClick={() => setEditingCategory(record.id)} style={{ color: '#bbb', cursor: 'pointer' }} title="点击设置申请类别">—</span>;
      },
    },
    {
      title: '文案老师',
      key: 'copywriter',
      width: 120,
      render: (_, record) => {
        if (editingCopywriter === record.id) {
          return (
            <Select
              autoFocus
              size="small"
              defaultValue={record.copywriter || undefined}
              style={{ width: 100 }}
              onChange={(v) => saveCopywriter(record.id, v)}
              onBlur={() => setEditingCopywriter(null)}
              open
            >
              {COPYWRITER_OPTIONS.map(opt => (
                <Select.Option key={opt} value={opt}>{opt}</Select.Option>
              ))}
            </Select>
          );
        }
        return record.copywriter
          ? <Tag color="purple" style={{ cursor: 'pointer' }} onClick={() => setEditingCopywriter(record.id)}>{record.copywriter}</Tag>
          : <span onClick={() => setEditingCopywriter(record.id)} style={{ color: '#bbb', cursor: 'pointer' }} title="点击设置文案老师">—</span>;
      },
    },
    {
      title: '目标院校',
      key: 'targets',
      render: (_, record) => {
        const all = record.applications || [];
        const visible = all.slice(0, 2);
        const extra = all.length - 2;
        const tooltipContent = all.map((a, i) => (
          <div key={i}>
            • {a.school}
            {a.program ? ' · ' + a.program : ''}
            {a.rank ? ' [' + a.rank + ']' : ''}
          </div>
        ));
        return (
          <Tooltip
            title={<div>{tooltipContent}</div>}
            overlayStyle={{ maxWidth: 400 }}
          >
            <div>
              {visible.map((a, i) => (
                <Tag key={i} style={{ marginBottom: 2 }}>{a.school}</Tag>
              ))}
              {extra > 0 && <Tag>+{extra} 所</Tag>}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: '申请进度',
      key: 'progress',
      render: (_, record) => {
        const progress = getProgress(record);
        return (
          <div style={{ minWidth: 120 }}>
            <Progress 
              percent={progress} 
              size="small" 
              strokeColor={progress === 100 ? COLORS.success : COLORS.primary} 
            />
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{progress}%</div>
          </div>
        );
      },
    },
    {
      title: '文书状态',
      key: 'docStatus',
      render: (_, record) => {
        const status = getDocStatus(record);
        return (
          <Tag
            color={status.color}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/students/${record.id}?tab=documents`)}
            title="点击查看文书详情"
          >
            {status.text}
          </Tag>
        );
      },
    },
    {
      title: '最后沟通',
      key: 'lastComm',
      render: (_, record) => {
        const { days, color } = getLastCommDays(record);
        // 按日期降序找最新沟通记录
        const sorted = record.communications ? [...record.communications].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
        const lastComm = sorted[0];
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/students/${record.id}?tab=communications`)}
            title="点击查看沟通记录"
          >
            <span style={{ color, fontWeight: 600 }}>{days}</span>
            {lastComm && (
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
                {lastComm.date}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '最新动态',
      key: 'status',
      render: (_, record) => {
        const offers = record.applications?.filter(a => a.status === 'offer').length || 0;
        if (offers > 0) {
          return <Tag color="success">🎉 {offers}个Offer</Tag>;
        }
        const submitted = record.applications?.filter(a => a.status === 'submitted').length || 0;
        if (submitted > 0) {
          return <Tag color="processing">已提交{submitted}所</Tag>;
        }
        return <Tag>准备中</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/students/${record.id}`)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/students/${record.id}/edit`)}
            style={{ color: COLORS.primary }}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, record.name)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: COLORS.primary }}>👥 学生管理</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/students/new')}
          style={{ backgroundColor: COLORS.accent }}
        >
          新增学生
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="搜索学生姓名、学校、专业..."
            prefix={<SearchOutlined style={{ color: COLORS.textSecondary }} />}
            style={{ width: 280 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Select
            value={seasonFilter}
            onChange={setSeasonFilter}
            style={{ width: 140 }}
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={(() => {
              // 从实际数据中收集所有申请季（去重）
              const allSeasons = [...new Set(students.map(s => s.season).filter(Boolean))];
              const predefined = ['26Fall', '27Fall', '28Fall'];
              const sorted = [...new Set([...predefined, ...allSeasons])];
              return [
                { value: 'all', label: '全部申请季' },
                ...sorted.map(s => ({ value: s, label: s })),
              ];
            })()}
          />
          <Button icon={<ReloadOutlined />} onClick={loadStudents}>
            刷新
          </Button>
        </Space>
      </Card>

      <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100'],
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>
    </div>
  );
}

export default StudentList;
