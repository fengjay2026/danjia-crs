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
  const [selectedSeasons, setSelectedSeasons] = useState(['26Fall']);

  useEffect(() => {
    loadData();
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

  const loadData = () => {
    const statsData = getStats();
    setStats(statsData);
    const tasksData = getTasks();
    setTasks(tasksData);
    const studentsData = getStudents();
    setStudents(studentsData);
  };

  // 根据申请季筛选学生
  const filteredStudents = students
    .filter(s => {
      const matchesSeason = selectedSeasons.includes(s.season);
      const matchesSearch = searchText === '' ||
        s.name.includes(searchText) ||
        (s.school && s.school.includes(searchText)) ||
        (s.major && s.major.includes(searchText));
      return matchesSeason && matchesSearch;
    })
    .slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return COLORS.danger;
      case 'today': return COLORS.accent;
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
      render: (_, record) => (
        <Space>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: COLORS.primary, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 12
          }}>
            {record.name[0]}
          </div>
          <span style={{ fontWeight: 500 }}>{record.name}</span>
        </Space>
      ),
    },
    {
      title: '学校 / 专业',
      key: 'school',
      render: (_, record) => (
        <div>
          <div>{record.school}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{record.major} · GPA {record.gpa}</div>
        </div>
      ),
    },
    {
      title: '申请季',
      dataIndex: 'season',
      key: 'season',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '文书状态',
      key: 'docStatus',
      render: (_, record) => {
        const status = getDocStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '最新动态',
      key: 'status',
      render: (_, record) => {
        const offers = record.applications?.filter(a => a.status === 'offer').length || 0;
        if (offers > 0) return <Tag color="success">🎉 {offers}个Offer</Tag>;
        const submitted = record.applications?.filter(a => a.status === 'submitted').length || 0;
        if (submitted > 0) return <Tag color="processing">已提交{submitted}所</Tag>;
        return <Tag>准备中</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24, color: COLORS.primary }}>📊 26Fall 申请季总览</h2>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card style={{ borderLeft: `4px solid ${COLORS.primary}` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.primary }}>{stats.total}</div>
              <div style={{ fontSize: 14, color: COLORS.textSecondary }}>在途学生</div>
              <div style={{ fontSize: 12, color: COLORS.success, marginTop: 4 }}>↑ {stats.newThisMonth} 本月新增</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card style={{ borderLeft: `4px solid ${COLORS.accent}` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.accent }}>{stats.docPending}</div>
              <div style={{ fontSize: 14, color: COLORS.textSecondary }}>文书待完成</div>
              <div style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>⚠️ 需跟进</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card style={{ borderLeft: `4px solid ${COLORS.warning}` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.warning }}>{stats.offers}</div>
              <div style={{ fontSize: 14, color: COLORS.textSecondary }}>Offer接收</div>
              <div style={{ fontSize: 12, color: COLORS.success, marginTop: 4 }}>🎉 恭喜!</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card style={{ borderLeft: `4px solid ${COLORS.success}` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.success }}>{stats.offers}</div>
              <div style={{ fontSize: 14, color: COLORS.textSecondary }}>Offer接收</div>
              <div style={{ fontSize: 12, color: COLORS.success, marginTop: 4 }}>🎉 恭喜!</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card style={{ borderLeft: `4px solid #4A7C9B` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#4A7C9B' }}>{stats.pendingComm}</div>
              <div style={{ fontSize: 14, color: COLORS.textSecondary }}>待跟进沟通</div>
              <div style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>📞 超7天未联系</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 重要提醒 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <span style={{ fontSize: 16, fontWeight: 600 }}>🔔 重要提醒</span>
            <Badge count={tasks.length} style={{ backgroundColor: COLORS.danger }} />
          </Space>
          <a onClick={() => navigate('/students')} style={{ color: COLORS.textSecondary }}>查看全部 ›</a>
        </div>
        <Row gutter={[16, 16]}>
          {tasks.slice(0, 6).map(task => (
            <Col xs={24} sm={12} lg={8} xl={4} key={task.id}>
              <Card
                size="small"
                style={{
                  borderLeft: `4px solid ${getStatusColor(task.status)}`,
                  background: task.status === 'today' ? '#FFF7ED' : 'white',
                }}
              >
                <Space style={{ marginBottom: 8 }}>
                  <Tag>{getTypeIcon(task.type)} {task.type}</Tag>
                  <span style={{ fontSize: 11, color: getStatusColor(task.status), fontWeight: 600 }}>
                    {task.status === 'overdue' ? '已逾期' : task.status === 'today' ? '今天' : `${task.days}天后`}
                  </span>
                </Space>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{task.student}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>{task.desc}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>📅 {task.date}</div>
              </Card>
            </Col>
          ))}
          {tasks.length === 0 && (
            <Col span={24}>
              <div style={{ textAlign: 'center', color: COLORS.textSecondary, padding: 24 }}>
                🎉 暂无重要提醒
              </div>
            </Col>
          )}
        </Row>
      </Card>

      {/* 学生列表 */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <span style={{ fontSize: 16, fontWeight: 600 }}>👥 学生列表</span>
            <Badge count={students.length} style={{ backgroundColor: COLORS.primary }} />
          </Space>
          <Space>
            <Button 
              type="primary" 
              size="small"
              onClick={() => navigate('/students/new')}
              style={{ backgroundColor: COLORS.accent }}
            >
              ➕ 新增学生
            </Button>
          </Space>
        </div>

        <Input
          placeholder="搜索学生姓名、学校，专业..."
          prefix={<SearchOutlined />}
          style={{ width: 300, marginBottom: 16 }}
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

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button onClick={() => navigate('/students')}>查看全部学生 ›</Button>
        </div>
      </Card>

      {/* 申请进度总览 */}
      <Card style={{ marginTop: 24 }}>
        <h4 style={{ marginBottom: 16 }}>📈 申请季进度总览</h4>
        <Row gutter={[32, 16]}>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>26Fall 申请进度</span>
              <span style={{ color: COLORS.accent, fontWeight: 600 }}>68%</span>
            </div>
            <Progress percent={68} strokeColor={COLORS.accent} />
          </Col>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>27Fall 准备进度</span>
              <span style={{ color: COLORS.primary, fontWeight: 600 }}>35%</span>
            </div>
            <Progress percent={35} strokeColor={COLORS.primary} />
          </Col>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>文书完成率</span>
              <span style={{ color: COLORS.success, fontWeight: 600 }}>82%</span>
            </div>
            <Progress percent={82} strokeColor={COLORS.success} />
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default Dashboard;
