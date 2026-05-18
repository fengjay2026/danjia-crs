import React, { useState, useEffect } from 'react';
import { Card, Table, Progress, Badge, Tag, Row, Col, Input, Select, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, UserOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStudents, getStats, getTasks } from '../data/store';

const COLORS = {
  primary: '#1E3A5F',
  accent: '#FF6B35',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  textSecondary: '#6B7280',
};

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    inProgress: 0,
    newThisMonth: 0,
    docPending: 0,
    offers: 0,
    pendingComm: 0,
    total: 0
  });
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedSeasons, setSelectedSeasons] = useState(['26Fall', '27Fall']);

  useEffect(() => {
    loadData();
    const handleSeasonChange = (e) => {
      setSelectedSeasons(e.detail);
    };
    window.addEventListener('seasonFilterChange', handleSeasonChange);
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

  const loadData = () => {
    const statsData = getStats();
    setStats(statsData);
    const tasksData = getTasks();
    setTasks(tasksData);
    const studentsData = getStudents();
    setStudents(studentsData);
  };

  const filteredStudents = students
    .filter(s => {
      const matchesSeason = selectedSeasons.includes(s.season);
      const matchesSearch = searchText === '' ||
        s.name.includes(searchText) ||
        (s.school && s.school.includes(searchText)) ||
        (s.major && s.major.includes(searchText));
      return matchesSeason && matchesSearch;
    })
    .slice(0, 8);

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return COLORS.danger;
      case 'today': return '#D4380D';
      default: return COLORS.warning;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case '沟通': return '📞';
      case '文书': return '📄';
      case '面试': return '🎤';
      case '雅思': return '📝';
      case '提交': return '📤';
      case '考试': return '📚';
      default: return '📌';
    }
  };

  const getDocStatus = (student) => {
    const docs = student.documents || {};
    if (docs.ps?.status === 'completed') return { text: '已完成', color: 'success' };
    if (docs.ps?.status === 'in_progress') return { text: '制作中', color: 'processing' };
    if (docs.ps?.status === 'student_feedback') return { text: '学生反馈中', color: 'warning' };
    if (docs.ps?.status === 'collecting') return { text: '搜集材料', color: 'default' };
    return { text: '待开始', color: 'default' };
  };

  const columns = [
    {
      title: '学生',
      key: 'name',
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: COLORS.primary, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 11
          }}>
            {record.name[0]}
          </div>
          <span style={{ fontWeight: 500, fontSize: 13 }}>{record.name}</span>
        </Space>
      ),
    },
    {
      title: '学校 / 专业',
      key: 'school',
      width: 200,
      render: (_, record) => (
        <div style={{ lineHeight: 1.4 }}>
          <div style={{ fontSize: 13 }}>{record.school}</div>
          <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{record.major} · GPA {record.gpa}</div>
        </div>
      ),
    },
    {
      title: '申请季',
      dataIndex: 'season',
      key: 'season',
      width: 80,
      render: (text) => <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>{text}</Tag>,
    },
    {
      title: '文书',
      key: 'docStatus',
      width: 80,
      render: (_, record) => {
        const status = getDocStatus(record);
        return <Tag color={status.color} style={{ fontSize: 11, margin: 0 }}>{status.text}</Tag>;
      },
    },
    {
      title: '动态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const offers = record.applications?.filter(a => a.status === 'offer').length || 0;
        if (offers > 0) return <Tag color="success" style={{ fontSize: 11, margin: 0 }}>🎉 {offers}个Offer</Tag>;
        const submitted = record.applications?.filter(a => a.status === 'submitted').length || 0;
        if (submitted > 0) return <Tag color="processing" style={{ fontSize: 11, margin: 0 }}>已提交{submitted}所</Tag>;
        return <Tag style={{ fontSize: 11, margin: 0 }}>准备中</Tag>;
      },
    },
    {
      title: '文案老师',
      key: 'copywriter',
      width: 70,
      render: (_, record) => record.copywriter
        ? <Tag color="purple" style={{ fontSize: 11, margin: 0 }}>{record.copywriter}</Tag>
        : null,
    },
  ];

  const statCards = [
    { label: '在途学生', value: stats.total, sub: `↑ ${stats.newThisMonth} 本月新增`, subColor: COLORS.success, borderColor: COLORS.primary, valueColor: COLORS.primary },
    { label: '进行中申请', value: stats.inProgress, sub: '📋 处理中', subColor: COLORS.warning, borderColor: COLORS.accent, valueColor: COLORS.accent },
    { label: '文书待完成', value: stats.docPending, sub: '⚠️ 需跟进', subColor: COLORS.danger, borderColor: COLORS.danger, valueColor: COLORS.danger },
    { label: 'Offer数', value: stats.offers, sub: '🎉 恭喜!', subColor: COLORS.success, borderColor: COLORS.success, valueColor: COLORS.success },
    { label: '待跟进沟通', value: stats.pendingComm, sub: '📞 超7天未联系', subColor: COLORS.danger, borderColor: '#4A7C9B', valueColor: '#4A7C9B' },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* 标题 + 刷新 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: COLORS.primary }}>📊 申请季总览</h3>
        <Button size="small" icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
      </div>

      {/* 统计卡片 - 紧凑横排 */}
      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
        {statCards.map((card, i) => (
          <Col xs={12} sm={8} md={4} key={i}>
            <Card size="small" bodyStyle={{ padding: '10px 8px' }} style={{ borderLeft: `3px solid ${card.borderColor}`, borderRadius: 6 }}>
              <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: card.valueColor }}>{card.value}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{card.label}</div>
                <div style={{ fontSize: 10, color: card.subColor, marginTop: 2 }}>{card.sub}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 重要提醒 - 方块形式（7天内） */}
      <Card size="small" bodyStyle={{ padding: '8px 12px' }} style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Space size={4}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>🔔 重要提醒</span>
            <Badge count={tasks.length} style={{ backgroundColor: COLORS.danger, fontSize: 10 }} />
            <span style={{ fontSize: 11, color: COLORS.textSecondary }}>· 7天内</span>
          </Space>
          <Space size={8}>
            <a onClick={() => navigate('/students')} style={{ fontSize: 12, color: COLORS.textSecondary }}>学生列表 ›</a>
            <a onClick={() => navigate('/schedule')} style={{ fontSize: 12, color: COLORS.textSecondary }}>日程管理 ›</a>
          </Space>
        </div>
        <Row gutter={[6, 6]}>
          {tasks.map(task => (
            <Col xs={24} sm={12} md={8} lg={6} key={task.id}>
              <Card
                size="small"
                bodyStyle={{ padding: '8px 10px' }}
                style={{
                  borderLeft: `3px solid ${getStatusColor(task.status)}`,
                  background: task.status === 'today' ? '#FFF7ED' : 'white',
                  cursor: 'pointer', borderRadius: 4,
                  transition: 'all 0.15s'
                }}
                hoverable
                onClick={() => {
                  if (task.id?.startsWith('schedule-')) navigate('/schedule');
                  else if (task.type === '沟通' && task.studentId) navigate(`/students/${task.studentId}?tab=communications`);
                  else if (task.studentId) navigate(`/students/${task.studentId}`);
                }}
              >
                <Space size={4} style={{ marginBottom: 4 }}>
                  <Tag style={{ fontSize: 10, lineHeight: '16px', height: 18, margin: 0 }}>{getTypeIcon(task.type)} {task.type}</Tag>
                  <span style={{ fontSize: 10, color: getStatusColor(task.status), fontWeight: 600 }}>
                    {task.status === 'overdue' ? `逾期${Math.abs(task.days)}天` : task.status === 'today' ? '今日逾期' : `${task.days}天后`}
                  </span>
                </Space>
                <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, marginBottom: 2 }}>{task.student}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.3, marginBottom: 2 }}>{task.desc}</div>
                <div style={{ fontSize: 10, color: COLORS.textSecondary }}>📅 {task.date}</div>
              </Card>
            </Col>
          ))}
          {tasks.length === 0 && (
            <Col span={24}>
              <div style={{ textAlign: 'center', color: COLORS.textSecondary, padding: 16, fontSize: 13 }}>
                🎉 暂无重要提醒
              </div>
            </Col>
          )}
        </Row>
      </Card>

      {/* 学生列表 - 纵向 */}
      <Card size="small" bodyStyle={{ padding: '8px 12px' }} style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Space size={4}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>👥 学生列表</span>
            <Badge count={students.length} style={{ backgroundColor: COLORS.primary, fontSize: 10 }} />
          </Space>
          <Button type="primary" size="small" onClick={() => navigate('/students/new')}
            style={{ backgroundColor: COLORS.accent, fontSize: 12, height: 24 }}>
            ➕ 新增
          </Button>
        </div>
        <Input
          placeholder="搜索姓名/学校/专业..."
          prefix={<SearchOutlined style={{ fontSize: 12 }} />}
          size="small"
          style={{ marginBottom: 8 }}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="id"
          pagination={false}
          size="small"
        />
        <div style={{ marginTop: 6, textAlign: 'center' }}>
          <Button size="small" onClick={() => navigate('/students')} style={{ fontSize: 12 }}>
            查看全部学生 ›
          </Button>
        </div>
      </Card>

      {/* 申请进度总览 */}
      <Card size="small" bodyStyle={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, marginRight: 16 }}>📈 申请季进度总览</span>
        </div>
        <Row gutter={[24, 8]}>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>26Fall 申请进度</span>
              <span style={{ color: COLORS.accent, fontWeight: 600 }}>68%</span>
            </div>
            <Progress percent={68} strokeColor={COLORS.accent} size="small" />
          </Col>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>27Fall 准备进度</span>
              <span style={{ color: COLORS.primary, fontWeight: 600 }}>35%</span>
            </div>
            <Progress percent={35} strokeColor={COLORS.primary} size="small" />
          </Col>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>文书完成率</span>
              <span style={{ color: COLORS.success, fontWeight: 600 }}>82%</span>
            </div>
            <Progress percent={82} strokeColor={COLORS.success} size="small" />
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default Dashboard;
