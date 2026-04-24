// 用户认证存储
const USER_LIST_KEY = 'danjia_crs_users';
const CURRENT_USER_KEY = 'danjia_crs_current_user';

// 默认用户
const defaultUsers = [
  {
    username: 'nehfgze911',
    password: btoa('zxcvzxcv'), // Base64 编码
    nickname: '冯老师',
    isAdmin: true,
    createdAt: '2026-01-01'
  }
];

// 基础编码/解码
const encode = (str) => btoa(encodeURIComponent(str));
const decode = (str) => {
  try { return decodeURIComponent(atob(str)); } catch { return str; }
};

// 获取用户列表
export function getUsers() {
  const data = localStorage.getItem(USER_LIST_KEY);
  if (data) {
    try { return JSON.parse(data); } catch { return []; }
  }
  // 首次使用，初始化默认用户
  localStorage.setItem(USER_LIST_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

// 根据用户名查找用户
export function findUserByUsername(username) {
  const users = getUsers();
  return users.find(u => u.username === username);
}

// 验证登录
export function validateLogin(username, password) {
  const user = findUserByUsername(username.trim());
  if (!user) return { success: false, error: '用户名不存在' };

  const decoded = decode(user.password);
  if (decoded !== password) return { success: false, error: '密码错误' };

  // 登录成功，保存当前用户
  const sessionUser = {
    username: user.username,
    nickname: user.nickname,
    isAdmin: user.isAdmin || false
  };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
  return { success: true, user: sessionUser };
}

// 获取当前登录用户（自动从用户列表同步最新权限）
export function getCurrentUser() {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) return null;
  try {
    const session = JSON.parse(data);
    // 从用户列表同步最新 isAdmin 状态，防止权限遗漏
    const user = findUserByUsername(session.username);
    if (user) {
      session.isAdmin = user.isAdmin || false;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
    }
    return session;
  } catch {
    return null;
  }
}

// 判断当前用户是否为管理员
export function isAdmin() {
  const user = getCurrentUser();
  return user?.isAdmin === true;
}

// 登出
export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// 添加用户
export function addUser(userData) {
  const users = getUsers();
  if (users.find(u => u.username === userData.username)) {
    return { success: false, error: '用户名已存在' };
  }
  const newUser = {
    username: userData.username,
    password: encode(userData.password),
    nickname: userData.nickname,
    isAdmin: false,
    createdAt: new Date().toISOString().split('T')[0]
  };
  users.push(newUser);
  localStorage.setItem(USER_LIST_KEY, JSON.stringify(users));
  return { success: true, user: newUser };
}

// 更新用户信息
export function updateUser(username, updates) {
  const users = getUsers();
  const index = users.findIndex(u => u.username === username);
  if (index === -1) return { success: false, error: '用户不存在' };

  if (updates.password) {
    users[index].password = encode(updates.password);
  }
  if (updates.nickname) {
    users[index].nickname = updates.nickname;
  }

  localStorage.setItem(USER_LIST_KEY, JSON.stringify(users));

  // 更新当前会话
  const current = getCurrentUser();
  if (current && current.username === username) {
    const updated = { ...current };
    if (updates.nickname) updated.nickname = updates.nickname;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
  }

  return { success: true };
}

// 切换到其他用户系统（仅管理员可用）
export function switchToUser(targetUsername) {
  const current = getCurrentUser();
  if (!current?.isAdmin) return { success: false, error: '无权限' };

  const targetUser = findUserByUsername(targetUsername);
  if (!targetUser) return { success: false, error: '用户不存在' };

  const sessionUser = {
    username: targetUser.username,
    nickname: targetUser.nickname,
    isAdmin: targetUser.isAdmin || false,
    isViewingAs: true
  };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
  return { success: true };
}

