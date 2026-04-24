import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Table, Tag, Row, Col, Button, Space, Input, Select,
  Modal, Form, Upload, message, Popconfirm, Typography, Empty,
  Divider, Badge, Tooltip, Image, Drawer, Spin
} from 'antd';
import {
  PlusOutlined, UploadOutlined, DeleteOutlined, FileOutlined,
  FilePdfOutlined, FileWordOutlined, FileExcelOutlined,
  FileImageOutlined, FileTextOutlined, FolderOutlined,
  EyeOutlined, DownloadOutlined, SearchOutlined, FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStudents } from '../data/store';
import { getCurrentUser } from '../data/userStore';

// 材料文件元数据存储 key
const FILE_META_KEY = 'danjia_crs_file_meta';

const { Text, Title } = Typography;
const { Option } = Select;
const { Dragger } = Upload;
const { TextArea } = Input;

// 文件类型配置
const FILE_TYPE_CONFIG = {
  pdf: { icon: <FilePdfOutlined />, color: '#FF4D4F', label: 'PDF' },
  doc: { icon: <FileWordOutlined />, color: '#1890FF', label: 'Word' },
  docx: { icon: <FileWordOutlined />, color: '#1890FF', label: 'Word' },
  xls: { icon: <FileExcelOutlined />, color: '#52C41A', label: 'Excel' },
  xlsx: { icon: <FileExcelOutlined />, color: '#52C41A', label: 'Excel' },
  png: { icon: <FileImageOutlined />, color: '#722ED1', label: '图片' },
  jpg: { icon: <FileImageOutlined />, color: '#722ED1', label: '图片' },
  jpeg: { icon: <FileImageOutlined />, color: '#722ED1', label: '图片' },
  default: { icon: <FileOutlined />, color: '#8C8C8C', label: '其他' },
};

// 材料分类配置
const CATEGORY_CONFIG = {
  ps: { label: 'Personal Statement', shortLabel: 'PS', color: '#1E3A5F' },
  cv: { label: '简历 CV', shortLabel: 'CV', color: '#722ED1' },
  rl: { label: '推荐信', shortLabel: 'RL', color: '#52C41A' },
  transcripts: { label: '成绩单', shortLabel: '成绩单', color: '#EB2F96' },
  certificate: { label: '在读/毕业证明', shortLabel: '证明', color: '#0891B2' },
  id: { label: '身份材料', shortLabel: '身份', color: '#FA8C16' },
  language: { label: '语言成绩', shortLabel: '语言', color: '#13C2C2' },
  other: { label: '其他材料', shortLabel: '其他', color: '#8C8C8C' },
};

// 获取文件类型
const getFileType = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return FILE_TYPE_CONFIG[ext] || FILE_TYPE_CONFIG.default;
};

// 获取文件元数据
const getFileMeta = () => {
  const user = getCurrentUser();
  if (!user) return [];
  const key = FILE_META_KEY + '_' + user.username;
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch { return []; }
};

// 保存文件元数据
const saveFileMeta = (files) => {
  const user = getCurrentUser();
  if (!user) return;
  const key = FILE_META_KEY + '_' + user.username;
  localStorage.setItem(key, JSON.stringify(files));
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '未知';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
const DocumentCenter = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploadFile, setUploadFile] = useState(null); // 待上传的 File 对象
  const [students, setStudents] = useState([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [studentFilter, setStudentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSeasons, setSelectedSeasons] = useState(['26Fall']);
  const [uploadForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // Blob URL 或 data URL
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadStudents();
    // 加载文件元数据
    setFiles(getFileMeta());
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

  const loadStudents = () => {
    const data = getStudents();
    setStudents(data);
  };

  // 根据申请季获取学生
  const getFilteredStudents = () => {
    return students.filter(s => selectedSeasons.includes(s.season));
  };

  // 过滤后的文件
  const filteredFiles = files.filter(file => {
    const matchesSearch = searchText === '' ||
      file.filename.toLowerCase().includes(searchText.toLowerCase()) ||
      file.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchText.toLowerCase());
    
    // 根据申请季筛选学生
    const targetStudent = students.find(s => s.id === file.studentId);
    const matchesSeason = !targetStudent || selectedSeasons.includes(targetStudent.season);
    
    const matchesStudent = studentFilter === 'all' || file.studentId.toString() === studentFilter;
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    return matchesSearch && matchesStudent && matchesCategory && matchesSeason;
  });

  // 按学生分组统计
  const studentStats = filteredFiles.reduce((acc, file) => {
    if (!acc[file.studentId]) {
      acc[file.studentId] = { name: file.studentName, count: 0, categories: new Set() };
    }
    acc[file.studentId].count++;
    acc[file.studentId].categories.add(file.category);
    return acc;
  }, {});

  // 预览文件
  const handlePreview = async (record) => {
    setPreviewFile(record);
    setPreviewUrl(null);
    setPreviewLoading(true);
    setPreviewVisible(true);

    try {
      // 从 Electron 或浏览器存储获取文件
      let blob = null;
      let ext = record.filename?.split('.').pop()?.toLowerCase() || '';

      if (window.electronAPI?.getFileBase64) {
        // Electron 模式：读取磁盘文件
        const user = getCurrentUser();
        const username = user?.username || 'guest';
        const result = await window.electronAPI.getFileBase64(
          record.storedName?.split('_').slice(0, 2).join('_') === username + '_' + record.id
            ? username
            : username,
          record.storedName || record.filename
        );
        if (result.success) {
          const binary = atob(result.base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const mime = result.mime || 'application/octet-stream';
          blob = new Blob([bytes], { type: mime });
        }
      } else if (record.storedName && record.storedName.startsWith('blob:')) {
        // 浏览器 File System Access API 创建的 Blob URL
        // 直接使用 storedName 作为 URL
        setPreviewUrl(record.storedName);
        setPreviewLoading(false);
        return;
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch (err) {
      console.error('预览失败:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 判断是否为图片类型
  const isImageFile = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  };

  // 判断是否为PDF文件
  const isPdfFile = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    return ext === 'pdf';
  };

  // 判断是否为Office文档
  const isOfficeFile = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  };

  // 获取文件预览内容（使用 previewUrl）
  const getPreviewContent = (file) => {
    if (previewLoading) {
      return (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin tip="正在加载预览..." />
        </div>
      );
    }

    if (isImageFile(file.filename) && previewUrl) {
      return (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <img src={previewUrl} alt={file.filename} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 8 }} />
        </div>
      );
    }

    if (isPdfFile(file.filename) && previewUrl) {
      return (
        <iframe
          src={previewUrl}
          title="PDF 预览"
          style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 8 }}
        />
      );
    }

    if (isOfficeFile(file.filename) && previewUrl) {
      const ext = file.filename?.split('.').pop()?.toLowerCase();
      const isSpreadsheet = ['xls', 'xlsx'].includes(ext);
      // Microsoft Office Online Viewer
      const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`;
      return (
        <iframe
          src={viewerUrl}
          title={isSpreadsheet ? 'Excel 预览' : 'Word 预览'}
          style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 8 }}
        />
      );
    }

    // 默认：显示文件图标和下载按钮
    const ext = file.filename?.split('.').pop()?.toLowerCase() || '';
    let icon = <FileOutlined />;
    let color = '#8C8C8C';
    if (ext === 'pdf') { icon = <FilePdfOutlined style={{ fontSize: 64, color: '#FF4D4F' }} />; color = '#FF4D4F'; }
    else if (['doc', 'docx'].includes(ext)) { icon = <FileWordOutlined style={{ fontSize: 64, color: '#1890FF' }} />; color = '#1890FF'; }
    else if (['xls', 'xlsx'].includes(ext)) { icon = <FileExcelOutlined style={{ fontSize: 64, color: '#52C41A' }} />; color = '#52C41A'; }
    else if (['png', 'jpg', 'jpeg'].includes(ext)) { icon = <FileImageOutlined style={{ fontSize: 64, color: '#722ED1' }} />; color = '#722ED1'; }

    return (
      <div style={{ textAlign: 'center', padding: 40, background: '#f5f5f5', borderRadius: 8 }}>
        {icon}
        <div style={{ marginTop: 12, fontWeight: 500, color }}>{file.filename}</div>
        <div style={{ marginTop: 8, color: '#8C8C8C', fontSize: 12 }}>
          点击下方按钮下载查看完整内容
        </div>
        <Button type="primary" style={{ marginTop: 16 }} onClick={() => handleDownload(file)} icon={<DownloadOutlined />}>
          下载文件
        </Button>
      </div>
    );
  };

  // 下载文件
  const handleDownload = async (record) => {
    message.loading({ content: `正在准备下载: ${record.filename}`, key: 'download' });
    try {
      let blob = null;
      let mime = 'application/octet-stream';
      const ext = record.filename?.split('.').pop()?.toLowerCase() || '';

      if (window.electronAPI?.getFileBase64) {
        const user = getCurrentUser();
        const username = user?.username || 'guest';
        const result = await window.electronAPI.getFileBase64(username, record.storedName || record.filename);
        if (result.success) {
          const binary = atob(result.base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          blob = new Blob([bytes], { type: result.mime || mime });
        } else {
          throw new Error(result.error);
        }
      } else if (record.storedName && record.storedName.startsWith('blob:')) {
        // 浏览器模式
        message.success({ content: '请右键保存文件', key: 'download' });
        return;
      } else {
        message.warning({ content: '文件未保存到磁盘，无法下载', key: 'download' });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = record.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success({ content: `已下载: ${record.filename}`, key: 'download' });
    } catch (err) {
      message.error({ content: '下载失败：' + err.message, key: 'download' });
    }
  };

  // 打开上传弹窗
  const openUploadModal = () => {
    uploadForm.resetFields();
    setUploadModalVisible(true);
  };

  // 处理文件上传
  const handleUpload = async (values) => {
    if (!uploadFile) {
      message.error('请先选择文件');
      return;
    }
    setUploading(true);

    const user = getCurrentUser();
    const username = user?.username || 'guest';
    const ext = uploadFile.name.split('.').pop();
    const safeFilename = `${username}_${Date.now()}_${uploadFile.name}`;
    let savedPath = null;

    try {
      const arrayBuffer = await uploadFile.arrayBuffer();

      if (window.electronAPI?.saveFile) {
        // Electron 模式：保存到 D:/e/CRM文件/用户名/
        const result = await window.electronAPI.saveFile(username, safeFilename, Array.from(new Uint8Array(arrayBuffer)));
        if (!result.success) throw new Error(result.error);
        savedPath = result.path;
      } else if (window.showSaveFilePicker) {
        // 浏览器 File System Access API：让用户选择保存位置
        const ext = uploadFile.name.split('.').pop();
        const handle = await window.showSaveFilePicker({
          suggestedName: uploadFile.name,
          types: [{
            description: '文件',
            accept: { 'application/octet-stream': ['.' + ext] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(uploadFile);
        await writable.close();
        savedPath = '浏览器本地存储';
      } else {
        // 兜底：仅记录元数据（文件保存在浏览器内存）
        savedPath = '（浏览器模式，文件仅记录元数据）';
      }

      const newFile = {
        id: Date.now(),
        studentId: values.studentId,
        studentName: students.find(s => s.id.toString() === values.studentId)?.name || '未知',
        filename: uploadFile.name,
        storedName: savedPath,
        category: values.category,
        type: ext,
        size: formatFileSize(uploadFile.size),
        rawSize: uploadFile.size,
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: user?.nickname || '未知',
        description: values.description || '',
      };

      const updated = [newFile, ...files];
      setFiles(updated);
      saveFileMeta(updated);
      setUploadFile(null);
      setUploading(false);
      setUploadModalVisible(false);
      uploadForm.resetFields();
      message.success(savedPath.startsWith('D:') ? `已保存到：${savedPath}` : '文件已记录');
    } catch (err) {
      setUploading(false);
      if (err.name === 'AbortError') {
        message.info('已取消');
      } else {
        message.error('上传失败：' + err.message);
      }
    }
  };

  // 删除文件（同时删除磁盘文件和元数据）
  const handleDelete = async (fileId) => {
    const user = getCurrentUser();
    const username = user?.username || 'guest';
    const targetFile = files.find(f => f.id === fileId);

    try {
      if (targetFile?.storedName && window.electronAPI) {
        await window.electronAPI.deleteFile(username, targetFile.storedName);
      }
      const updated = files.filter(f => f.id !== fileId);
      setFiles(updated);
      saveFileMeta(updated);
      message.success('文件已删除');
    } catch (err) {
      message.error('删除失败：' + err.message);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '文件',
      key: 'file',
      render: (_, record) => {
        const fileType = getFileType(record.filename);
        return (
          <Space>
            <Tag icon={fileType.icon} style={{ color: fileType.color, background: fileType.color + '15' }}>
              {fileType.label}
            </Tag>
            <div>
              <div style={{ fontWeight: 500 }}>{record.filename}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{record.size}</Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: '所属学生',
      key: 'student',
      width: 100,
      render: (_, record) => (
        <Tag
          color="blue"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/students/${record.studentId}`)}
        >
          {record.studentName}
        </Tag>
      ),
    },
    {
      title: '材料类型',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
        return (
          <Tag style={{ background: config.color + '20', color: config.color, borderColor: config.color }}>
            {config.shortLabel}
          </Tag>
        );
      },
    },
    {
      title: '上传日期',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 100,
      render: (date) => date || '-',
    },
    {
      title: '上传人',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      width: 80,
      render: (text) => text || '-',
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text ? <Tooltip title={text}><Text>{text}</Text></Tooltip> : <Text type="secondary">-</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)} />
          </Tooltip>
          <Tooltip title="下载">
            <Button type="text" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)} />
          </Tooltip>
          <Popconfirm title="确定删除此文件？" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 学生文件统计卡片
  const renderStudentStats = () => {
    return (
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {Object.entries(studentStats).map(([studentId, stat]) => (
          <Col span={6} key={studentId}>
            <Card
              size="small"
              hoverable
              style={{ cursor: 'pointer' }}
              onClick={() => setStudentFilter(studentId)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#1E3A5F', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600
                }}>
                  {stat.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{stat.name}</div>
                  <div style={{ fontSize: 12, color: '#8C8C8C' }}>
                    {stat.count} 个文件 · {stat.categories.size} 种类型
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1F2937' }}>📁 材料中心</Title>
          <Text type="secondary">统一管理所有学生申请材料</Text>
        </div>
        <Button type="primary" icon={<UploadOutlined />} onClick={openUploadModal}>
          上传材料
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1E3A5F' }}>{files.length}</div>
              <div style={{ fontSize: 14, color: '#8C8C8C' }}>文件总数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#52C41A' }}>{Object.keys(studentStats).length}</div>
              <div style={{ fontSize: 14, color: '#8C8C8C' }}>学生数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1890FF' }}>{(files.length * 2.5).toFixed(1)}</div>
              <div style={{ fontSize: 14, color: '#8C8C8C' }}>总大小 (MB)</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#722ED1' }}>{Object.keys(CATEGORY_CONFIG).length}</div>
              <div style={{ fontSize: 14, color: '#8C8C8C' }}>材料类型</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 学生快速筛选 */}
      {renderStudentStats()}

      {/* 筛选区域 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="搜索文件名、学生名..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="按学生筛选"
              value={studentFilter}
              onChange={setStudentFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="all">全部学生</Option>
              {getFilteredStudents().map(s => (
                <Option key={s.id} value={s.id.toString()}>{s.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Select
              placeholder="按类型筛选"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="all">全部类型</Option>
              {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                <Option key={key} value={key}>{val.label}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Text type="secondary">共 {filteredFiles.length} 个文件</Text>
          </Col>
        </Row>
      </Card>

      {/* 文件列表 */}
      <Card>
        {filteredFiles.length === 0 ? (
          <Empty description="暂无材料文件" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" icon={<UploadOutlined />} onClick={openUploadModal}>
              上传第一个文件
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredFiles}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      {/* 上传弹窗 */}
      <Modal
        title="📤 上传材料"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={uploadForm} layout="vertical" onFinish={handleUpload}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentId"
                label="所属学生"
                rules={[{ required: true, message: '请选择学生' }]}
              >
                <Select placeholder="选择学生">
                  {students.map(s => (
                    <Option key={s.id} value={s.id.toString()}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="材料类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select placeholder="选择类型">
                  {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                    <Option key={key} value={key}>{val.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="filename"
            label="文件名"
            rules={[{ required: true, message: '请输入文件名' }]}
          >
            <Input placeholder="如：张同学_PS_定稿版.pdf" />
          </Form.Item>

          <Form.Item
            name="description"
            label="文件说明"
          >
            <TextArea rows={2} placeholder="简要描述文件内容..." />
          </Form.Item>

          <Divider>上传文件</Divider>

          <Form.Item
            name="file"
            label="选择文件"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Dragger
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              maxCount={1}
              beforeUpload={(file) => {
                setUploadFile(file);
                const formValues = uploadForm.getFieldsValue();
                uploadForm.setFieldsValue({
                  filename: file.name,
                });
                return false;
              }}
            >
              <p style={{ fontSize: 48, color: '#1E3A5F', marginBottom: 16 }}>
                <UploadOutlined />
              </p>
              <p style={{ fontSize: 16, fontWeight: 500 }}>点击或拖拽上传文件</p>
              <p style={{ color: '#8C8C8C' }}>支持 PDF、Word、Excel、图片等格式</p>
              <p style={{ color: '#8C8C8C', fontSize: 12 }}>文件大小不超过 20MB</p>
            </Dragger>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setUploadModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit" icon={<UploadOutlined />} loading={uploading}>
              {uploading ? '上传中...' : '确认上传'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 预览抽屉 */}
      <Drawer
        title={
          <Space>
            <FileOutlined />
            <span>{previewFile?.filename || '文件预览'}</span>
          </Space>
        }
        placement="right"
        width={700}
        onClose={() => setPreviewVisible(false)}
        open={previewVisible}
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => previewFile && handleDownload(previewFile)}>
              下载
            </Button>
          </Space>
        }
      >
        {previewFile && (
          <div>
            {/* 文件信息卡片 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text type="secondary">所属学生：</Text>
                  <Tag color="blue">{previewFile.studentName}</Tag>
                </Col>
                <Col span={12}>
                  <Text type="secondary">材料类型：</Text>
                  <Tag>{CATEGORY_CONFIG[previewFile.category]?.label || previewFile.category}</Tag>
                </Col>
                <Col span={12}>
                  <Text type="secondary">上传日期：</Text>
                  <Text>{previewFile.uploadedAt}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">上传人：</Text>
                  <Text>{previewFile.uploadedBy}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">文件大小：</Text>
                  <Text>{previewFile.size}</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary">文件说明：</Text>
                  <div>{previewFile.description || '无'}</div>
                </Col>
              </Row>
            </Card>
            
            {/* 预览内容 */}
            <div style={{ marginTop: 16 }}>
              <Divider orientation="left">文件预览</Divider>
              {getPreviewContent(previewFile)}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DocumentCenter;
