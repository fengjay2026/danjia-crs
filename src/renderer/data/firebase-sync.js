import { auth, database } from '../firebase';
import { ref, set, get, remove } from 'firebase/database';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getCurrentUser } from './userStore';

// ========== Firebase 认证 ==========

const FIREBASE_EMAIL_KEY = 'danjia_firebase_email';

// 缓存 Firebase 邮箱
export function getStoredFirebaseEmail() {
  return localStorage.getItem(FIREBASE_EMAIL_KEY) || '';
}

// 登录 Firebase
export async function loginFirebase(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
  localStorage.setItem(FIREBASE_EMAIL_KEY, email);
}

// 退出 Firebase
export function logoutFirebase() {
  localStorage.removeItem(FIREBASE_EMAIL_KEY);
}

// 监听 Firebase 登录状态
export function onFirebaseAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(!!user);
  });
}

// ========== 数据读写 ==========

const DB_PATHS = {
  students: 'data/students',
  scheduleItems: 'data/scheduleItems',
};

// 刷新 localStorage 中的学生数据（从 Firebase 拉取）
export async function refreshStudentsFromFirebase() {
  const studentsRef = ref(database, DB_PATHS.students);
  const snapshot = await get(studentsRef);
  const data = snapshot.val();

  if (data) {
    const students = Object.values(data);
    // 同时写入老key（用户独立）和用户前缀key（兼容当前登录）
    localStorage.setItem('danjia_crs_students', JSON.stringify(students));
    const user = getCurrentUser();
    if (user) {
      localStorage.setItem(`danjia_crs_students_${user.username}`, JSON.stringify(students));
    }
    return students;
  }
  return null;
}

// 刷新 localStorage 中的日程数据（从 Firebase 拉取）
export async function refreshScheduleFromFirebase() {
  const itemsRef = ref(database, DB_PATHS.scheduleItems);
  const snapshot = await get(itemsRef);
  const data = snapshot.val();

  if (data) {
    const items = Object.values(data);
    localStorage.setItem('danjia_schedule_items', JSON.stringify(items));
    return items;
  }
  return null;
}

// 全量同步：将当前 localStorage 数据推送到 Firebase
export async function pushAllToFirebase() {
  // 读取当前用户隔离的 localStorage key，兼容旧 key 回退
  const user = getCurrentUser();
  const userStorageKey = user ? `danjia_crs_students_${user.username}` : null;
  const studentsRaw = userStorageKey
    ? (localStorage.getItem(userStorageKey) || localStorage.getItem('danjia_crs_students'))
    : localStorage.getItem('danjia_crs_students');
  if (studentsRaw) {
    const students = JSON.parse(studentsRaw);
    const studentsRef = ref(database, DB_PATHS.students);
    // 以 id 为 key 存储，避免重复
    const obj = {};
    students.forEach(s => { obj[s.id] = s; });
    await set(studentsRef, obj);
  }

  // 推送日程数据
  const scheduleRaw = localStorage.getItem('danjia_schedule_items');
  if (scheduleRaw) {
    const items = JSON.parse(scheduleRaw);
    const itemsRef = ref(database, DB_PATHS.scheduleItems);
    const obj = {};
    items.forEach(item => { obj[item.id] = item; });
    await set(itemsRef, obj);
  }
}

// ========== 增量同步 ==========

// 推送单条学生数据变更到 Firebase
export async function pushStudentToFirebase(student) {
  if (!auth.currentUser) return; // 未登录 Firebase 则跳过
  const studentRef = ref(database, `${DB_PATHS.students}/${student.id}`);
  await set(studentRef, student);
}

// 从 Firebase 删除单条学生数据
export async function removeStudentFromFirebase(studentId) {
  if (!auth.currentUser) return;
  const studentRef = ref(database, `${DB_PATHS.students}/${studentId}`);
  await remove(studentRef);
}

// 推送单条日程数据变更到 Firebase
export async function pushScheduleToFirebase(item) {
  if (!auth.currentUser) return;
  const itemRef = ref(database, `${DB_PATHS.scheduleItems}/${item.id}`);
  await set(itemRef, item);
}

// 从 Firebase 删除单条日程数据
export async function removeScheduleFromFirebase(itemId) {
  if (!auth.currentUser) return;
  const itemRef = ref(database, `${DB_PATHS.scheduleItems}/${itemId}`);
  await remove(itemRef);
}

// ========== 初始化（应用启动时调用）==========

let firebaseReady = false;
let skipAutoPull = false; // 防竞态：手动同步时跳过自动拉取

export function isFirebaseReady() {
  return firebaseReady;
}

// 在手动同步前调用，防止自动拉取覆盖本地数据
export function setSkipAutoPull() {
  skipAutoPull = true;
}

// 应用启动时调用：检查 Firebase 登录状态，如果可以就拉取云端数据
export function initFirebaseSync(onReady) {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (skipAutoPull) {
        // 手动同步中，跳过本次自动拉取
        skipAutoPull = false;
        firebaseReady = true;
        if (onReady) onReady(true);
        return;
      }
      // Firebase 已登录，尝试拉取云端数据到 localStorage
      try {
        const students = await refreshStudentsFromFirebase();
        if (students && students.length > 0) {
          console.log(`[FirebaseSync] 已从云端加载 ${students.length} 条学生数据`);
          localStorage.setItem('danjia_firebase_loaded', 'true');
        }
        const items = await refreshScheduleFromFirebase();
        if (items && items.length > 0) {
          console.log(`[FirebaseSync] 已从云端加载 ${items.length} 条日程数据`);
        }
        firebaseReady = true;
        // 通知各组件数据已更新
        window.dispatchEvent(new CustomEvent('studentsUpdated'));
      } catch (e) {
        console.error('[FirebaseSync] 加载云端数据失败:', e);
        firebaseReady = false;
      }
    } else {
      firebaseReady = false;
    }
    if (onReady) onReady(firebaseReady);
  });

  return unsubscribe; // 返回取消监听函数
}
