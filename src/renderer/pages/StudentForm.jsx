import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Row, Col, Button, message, Tabs, InputNumber, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { addStudent, updateStudent, getStudentById } from '../data/store';

const COLORS = {
  primary: '#1E3A5F',
  accent: '#FF6B35',
};

const { Option } = Select;

function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id && id !== 'new';

  useEffect(() => {
    if (isEdit) {
      const student = getStudentById(parseInt(id));
      if (student) {
        form.setFieldsValue({
          name: student.name,
          major: student.major,
          gpa: student.gpa,
          season: student.season,
          targetCountries: student.targetCountries || [],
          phone: student.contact?.phone || '',
          email: student.contact?.email || '',
          wechat: student.contact?.wechat || '',
          ieltsStatus: student.ielts?.status || 'preparing',
          ieltsTarget: student.ielts?.target || 7.0,
          expectedDate: student.ielts?.expectedDate || '',
          examCenter: student.ielts?.examCenter || '',
          schoolInput: student.school || '',
          targetMajorInput: student.targetMajor || '',
        });
      }
    }
  }, [id, isEdit, form]);

  const majorOptions = [
    { label: '💻 计算机/CS', value: 'CS' },
    { label: '📊 会计 Accounting', value: '会计' },
    { label: '📊 金融 Finance', value: '金融' },
    { label: '📊 商业分析 BA', value: '商业分析' },
    { label: '📊 经济学 Economics', value: '经济学' },
    { label: '⚖️ 法律 LLM', value: '法律' },
    { label: '📊 管理学 Management', value: '管理学' },
    { label: '📊 市场营销 Marketing', value: '市场营销' },
    { label: '🎭 供应链 SCM', value: '供应链' },
    { label: '🎭 MBA', value: 'MBA' },
    { label: '📺 传媒 Communication', value: '传媒' },
    { label: '📺 心理学 Psychology', value: '心理学' },
    { label: '📺 教育学 Education', value: '教育学' },
    { label: '📺 社会学 Sociology', value: '社会学' },
    { label: '🎨 艺术设计 Art&Design', value: '艺术设计' },
    { label: '🏛️ 建筑 Architecture', value: '建筑' },
    { label: '🔬 数据科学 DS', value: '数据科学' },
    { label: '🔬 统计学 Statistics', value: '统计学' },
    { label: '💊 公共卫生 Public Health', value: '公共卫生' },
    { label: '📋 其他专业', value: '其他' },
  ];

  const onFinish = (values) => {
    setLoading(true);
    
    const school = values.schoolInput || values.school;
    const targetMajor = values.targetMajorInput || values.targetMajor;
    
    if (!values.name) {
      message.error('请填写姓名');
      setLoading(false);
      return;
    }

    const baseData = {
      name: values.name,
      chineseName: values.name,
      major: values.major || '',
      gpa: values.gpa || '',
      school: school || '',
      targetMajor: targetMajor || values.targetMajor || '',
      targetCountries: values.targetCountries || [],
      season: values.season || '26Fall',
      status: 'active',
      contact: {
        phone: values.phone || '',
        email: values.email || '',
        wechat: values.wechat || ''
      },
      ielts: {
        status: values.ieltsStatus || 'preparing',
        target: values.ieltsTarget ? parseFloat(values.ieltsTarget) : 7.0,
        expectedDate: values.expectedDate || '',
        examCenter: values.examCenter || '',
        overall: values.overall ? parseFloat(values.overall) : null,
        listening: values.listening ? parseFloat(values.listening) : null,
        reading: values.reading ? parseFloat(values.reading) : null,
        writing: values.writing ? parseFloat(values.writing) : null,
        speaking: values.speaking ? parseFloat(values.speaking) : null,
        examDate: values.examDate || ''
      }
    };

    if (isEdit) {
      // 编辑模式：更新现有学生
      const existingStudent = getStudentById(parseInt(id));
      const updatedData = {
        ...existingStudent,
        ...baseData
      };
      updateStudent(parseInt(id), updatedData);
      message.success('学生信息已更新！');
    } else {
      // 新增模式
      const newStudent = {
        ...baseData,
        documents: {
          ps: { status: 'pending', version: '', updatedAt: '' },
          cv: { status: 'pending', version: '', updatedAt: '' },
          rl1: { status: 'pending', professor: '', updatedAt: '' },
          rl2: { status: 'pending', professor: '', updatedAt: '' }
        },
        applications: [],
        communications: [],
        internships: [],
        research: []
      };
      addStudent(newStudent);
      // 通知侧边栏更新申请季列表
      window.dispatchEvent(new CustomEvent('studentsUpdated'));
      message.success('学生添加成功！');
    }
    
    setLoading(false);
    navigate('/students');
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/students')}>
          返回列表
        </Button>
      </div>

      <Card title={<span style={{ fontSize: 20, fontWeight: 600 }}>
        {isEdit ? '✏️ 编辑学生' : '➕ 新增学生'}
      </span>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            season: '26Fall',
            ieltsStatus: 'preparing',
            ieltsTarget: 7.0,
            targetCountries: ['香港', '新加坡']
          }}
        >
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: '📝 基本信息',
                children: (
                  <>
                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item label="姓名（必填）" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                          <Input placeholder="请输入学生姓名" size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="学校（必填）" name="schoolInput">
                          <Input placeholder="直接输入学校名称" size="large" />
                        </Form.Item>
                      </Col>
                    </Row>                    
                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item label="当前专业" name="major">
                          <Input placeholder="请输入当前在读专业" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="GPA" name="gpa">
                          <Input placeholder="如：3.5 / 4.0" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item label="申请目标专业（必填）" name="targetMajorInput">
                          <Input placeholder="直接输入目标专业" size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="或选择预设专业" name="targetMajor">
                          <Select placeholder="选择专业" allowClear>
                            {majorOptions.map(opt => (
                              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item label="申请季" name="season" rules={[{ required: true }]}>
                          <Select 
                            size="large"
                            placeholder="选择或输入申请季"
                            showSearch
                            allowClear
                            mode={undefined}
                            popupRender={(menu) => (
                              <>
                                {menu}
                                <Divider style={{ margin: '8px 0' }} />
                                <div style={{ padding: '4px 8px' }}>
                                  <Input
                                    placeholder="输入自定义申请季 (如: 25Spring)"
                                    id="customSeasonInput"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const input = document.getElementById('customSeasonInput');
                                        const value = input.value.trim();
                                        if (value) {
                                          const select = e.target.closest('.ant-select').querySelector('.ant-select-selector');
                                          // 通过form设置自定义值
                                          const form = window.__studentForm;
                                          if (form) {
                                            form.setFieldsValue({ season: value });
                                          }
                                          input.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <div style={{ fontSize: 12, color: '#8C8C8C', marginTop: 4 }}>
                                    按 Enter 确认自定义申请季
                                  </div>
                                </div>
                              </>
                            )}
                          >
                            <Option value="26Fall">26Fall (2026年入学)</Option>
                            <Option value="27Fall">27Fall (2027年入学)</Option>
                            <Option value="28Fall">28Fall (2028年入学)</Option>
                            <Option value="25Fall">25Fall (2025年入学)</Option>
                            <Option value="25Spring">25Spring (2025年春季)</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="目标国家/地区" name="targetCountries">
                          <Select mode="multiple" placeholder="选择目标申请地区" style={{ width: '100%' }}>
                            <Option value="香港">🇭🇰 香港</Option>
                            <Option value="新加坡">🇸🇬 新加坡</Option>
                            <Option value="英国">🇬🇧 英国</Option>
                            <Option value="美国">🇺🇸 美国</Option>
                            <Option value="澳大利亚">🇦🇺 澳大利亚</Option>
                            <Option value="加拿大">🇨🇦 加拿大</Option>
                            <Option value="欧洲">🇪🇺 欧洲</Option>
                            <Option value="日本">🇯🇵 日本</Option>
                            <Option value="韩国">🇰🇷 韩国</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
              {
                key: 'contact',
                label: '📞 联系方式',
                children: (
                  <Row gutter={24}>
                    <Col span={8}>
                      <Form.Item label="手机号" name="phone">
                        <Input placeholder="请输入手机号" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="邮箱" name="email">
                        <Input placeholder="请输入邮箱" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="微信" name="wechat">
                        <Input placeholder="请输入微信号" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'ielts',
                label: '📊 雅思信息',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item label="雅思状态" name="ieltsStatus">
                          <Select size="large">
                            <Option value="preparing">🗓️ 备考中</Option>
                            <Option value="pending">⏳ 待出分</Option>
                            <Option value="scored">✅ 已出分</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="目标分数" name="ieltsTarget">
                          <Select size="large">
                            <Option value={6.0}>6.0</Option>
                            <Option value={6.5}>6.5</Option>
                            <Option value={7.0}>7.0</Option>
                            <Option value={7.5}>7.5</Option>
                            <Option value={8.0}>8.0</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="预计考试日期" name="expectedDate">
                          <Input type="date" size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="考试城市" name="examCenter">
                          <Input placeholder="如：北京、上海、广州" size="large" />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <div style={{ marginTop: 16, padding: '16px', background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
                      <div style={{ fontWeight: 600, marginBottom: 12 }}>📝 已出分成绩（如有）</div>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item label="总分" name="overall">
                            <InputNumber min={0} max={9} step={0.5} placeholder="7.0" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label="听力 L" name="listening">
                            <InputNumber min={0} max={9} step={0.5} placeholder="7.5" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label="阅读 R" name="reading">
                            <InputNumber min={0} max={9} step={0.5} placeholder="7.5" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label="写作 W" name="writing">
                            <InputNumber min={0} max={9} step={0.5} placeholder="6.5" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item label="口语 S" name="speaking">
                            <InputNumber min={0} max={9} step={0.5} placeholder="6.0" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="考试日期" name="examDate">
                            <Input type="date" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </>
                ),
              },
            ]}
          />

          <div style={{ marginTop: 24, textAlign: 'center', paddingTop: 24, borderTop: '1px solid #e8e8e8' }}>
            <Button onClick={() => navigate('/students')} size="large" style={{ marginRight: 16 }}>
              取消
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              size="large"
              style={{ backgroundColor: COLORS.accent, minWidth: 150 }}
            >
              {isEdit ? '保存修改' : '添加学生'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default StudentForm;
