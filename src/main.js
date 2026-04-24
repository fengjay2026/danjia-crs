const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('./data/database');

// 材料文件存储根目录
const FILE_ROOT = 'D:/e/CRM文件';

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.ico'),
    show: false
  });

  // 开发模式加载Vite开发服务器
  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 初始化数据库
function initDatabase() {
  try {
    Database.initialize();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    Database.close();
    app.quit();
  }
});

// IPC处理器 - 学生管理
ipcMain.handle('get-students', async () => {
  return Database.getAllStudents();
});

ipcMain.handle('get-student', async (event, id) => {
  return Database.getStudent(id);
});

ipcMain.handle('add-student', async (event, student) => {
  return Database.addStudent(student);
});

ipcMain.handle('update-student', async (event, id, student) => {
  return Database.updateStudent(id, student);
});

ipcMain.handle('get-students-by-season', async (event, seasonId) => {
  return Database.getStudentsBySeason(seasonId);
});

// IPC处理器 - 申请
ipcMain.handle('get-applications', async (event, studentId) => {
  return Database.getApplicationsByStudent(studentId);
});

ipcMain.handle('add-application', async (event, application) => {
  return Database.addApplication(application);
});

// IPC处理器 - 沟通记录
ipcMain.handle('get-communications', async (event, studentId) => {
  return Database.getCommunicationsByStudent(studentId);
});

ipcMain.handle('add-communication', async (event, communication) => {
  return Database.addCommunication(communication);
});

// IPC处理器 - 文书
ipcMain.handle('get-documents', async (event, studentId) => {
  return Database.getDocumentsByStudent(studentId);
});

ipcMain.handle('add-document', async (event, doc) => {
  return Database.addDocument(doc);
});

// IPC处理器 - 雅思
ipcMain.handle('get-ielts', async (event, studentId) => {
  return Database.getIeltsScore(studentId);
});

ipcMain.handle('add-ielts', async (event, score) => {
  return Database.addIeltsScore(score);
});

// IPC处理器 - 实习
ipcMain.handle('get-internships', async (event, studentId) => {
  return Database.getInternships(studentId);
});

ipcMain.handle('add-internship', async (event, internship) => {
  return Database.addInternship(internship);
});

// IPC处理器 - 科研
ipcMain.handle('get-research', async (event, studentId) => {
  return Database.getResearch(studentId);
});

ipcMain.handle('add-research', async (event, research) => {
  return Database.addResearch(research);
});

// IPC处理器 - 任务
ipcMain.handle('get-tasks', async (event, studentId) => {
  return Database.getTasks(studentId);
});

ipcMain.handle('add-task', async (event, task) => {
  return Database.addTask(task);
});

ipcMain.handle('toggle-task', async (event, taskId) => {
  return Database.toggleTaskComplete(taskId);
});

// IPC处理器 - 申请季
ipcMain.handle('get-seasons', async () => {
  return Database.getSeasons();
});

// IPC处理器 - 仪表盘统计
ipcMain.handle('get-dashboard-stats', async () => {
  return Database.getDashboardStats();
});

// IPC处理器 - 文件存储（按用户名隔离）
ipcMain.handle('save-file', async (event, username, filename, arrayBuffer) => {
  try {
    const userDir = path.join(FILE_ROOT, username);
    ensureDir(userDir);
    const filePath = path.join(userDir, filename);
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('delete-file', async (event, username, filename) => {
  try {
    const filePath = path.join(FILE_ROOT, username, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-file-list', async (event, username) => {
  try {
    const userDir = path.join(FILE_ROOT, username);
    ensureDir(userDir);
    const files = fs.readdirSync(userDir);
    const fileInfos = files.map(name => {
      const filePath = path.join(userDir, name);
      const stat = fs.statSync(filePath);
      return {
        name,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString().split('T')[0],
      };
    });
    return { success: true, files: fileInfos };
  } catch (err) {
    return { success: false, error: err.message, files: [] };
  }
});

ipcMain.handle('read-file', async (event, username, filename) => {
  try {
    const filePath = path.join(FILE_ROOT, username, filename);
    const buffer = fs.readFileSync(filePath);
    return { success: true, data: buffer };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 获取文件 Base64（用于预览）
ipcMain.handle('get-file-base64', async (event, username, filename) => {
  try {
    const filePath = path.join(FILE_ROOT, username, filename);
    const buffer = fs.readFileSync(filePath);
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };
    const mime = mimeTypes[ext] || 'application/octet-stream';
    const base64 = buffer.toString('base64');
    return { success: true, base64, mime, ext };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 导出数据 - 弹出保存对话框选择位置
ipcMain.handle('save-dialog', async (event, defaultName, content) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '导出数据备份',
      defaultPath: defaultName,
      filters: [
        { name: 'JSON 文件', extensions: ['json'] }
      ]
    });
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { success: true, path: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
