const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  saveFile: (username, filename, arrayBuffer) => {
    return ipcRenderer.invoke('save-file', username, filename, arrayBuffer);
  },
  deleteFile: (username, filename) => {
    return ipcRenderer.invoke('delete-file', username, filename);
  },
  getFileList: (username) => {
    return ipcRenderer.invoke('get-file-list', username);
  },
  readFile: (username, filename) => {
    return ipcRenderer.invoke('read-file', username, filename);
  },
  // 导出数据（弹出保存对话框）
  saveDialog: (defaultName, content) => {
    return ipcRenderer.invoke('save-dialog', defaultName, content);
  },
  // 获取文件 Base64（用于预览）
  getFileBase64: (username, filename) => {
    return ipcRenderer.invoke('get-file-base64', username, filename);
  },
});

