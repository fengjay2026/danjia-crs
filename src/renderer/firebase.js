import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, get, remove, onValue, push, update, query, orderByChild, equalTo } from 'firebase/database';
import { getStudents as getLocalStudents, getStudentById as getLocalStudentById, addStudent as addLocalStudent, updateStudent as updateLocalStudent, deleteStudent as deleteLocalStudent } from './data/store';

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyDFTRECOheHiwuh68MNfodwi6J3el984kw",
  authDomain: "zdstudio-5b6af.firebaseapp.com",
  databaseURL: "https://zdstudio-5b6af-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zdstudio-5b6af",
  storageBucket: "zdstudio-5b6af.firebasestorage.app",
  messagingSenderId: "737277655166",
  appId: "1:737277655166:web:ec1db057352496e96f802f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// ========== 数据库引用路径 ==========
const DB_PATHS = {
  students: 'students',
  scheduleItems: 'scheduleItems',
};

// ========== 学生 CRUD ==========

// 获取所有学生（监听实时变化）
export function subscribeStudents(callback) {
  const studentsRef = ref(database, DB_PATHS.students);
  const unsubscribe = onValue(studentsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Firebase 存储的是对象 { id1: {...}, id2: {...} }，转成数组
      const students = Object.entries(data).map(([key, value]) => ({
        ...value,
        _firebaseKey: key, // 保留 Firebase key 用于后续更新
        id: value.id || parseInt(key) // 兼容已有 id
      }));
      callback(students);
    } else {
      callback([]);
    }
  });
  return unsubscribe;
}

// 获取所有学生（一次性读取）
export async function fetchStudents() {
  const studentsRef = ref(database, DB_PATHS.students);
  const snapshot = await get(studentsRef);
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([key, value]) => ({
    ...value,
    _firebaseKey: key,
    id: value.id || parseInt(key)
  }));
}

// 新增学生
export async function cloudAddStudent(student) {
  const studentsRef = ref(database, DB_PATHS.students);
  const newRef = push(studentsRef);
  const id = student.id || Date.now();
  const data = { ...student, id };
  await set(newRef, data);
  return data;
}

// 更新学生
export async function cloudUpdateStudent(id, updates) {
  // 先找到对应的 Firebase key
  const students = await fetchStudents();
  const target = students.find(s => s.id === id);
  if (!target || !target._firebaseKey) return null;

  const studentRef = ref(database, `${DB_PATHS.students}/${target._firebaseKey}`);
  await update(studentRef, updates);
  return { ...target, ...updates };
}

// 删除学生
export async function cloudDeleteStudent(id) {
  const students = await fetchStudents();
  const target = students.find(s => s.id === id);
  if (!target || !target._firebaseKey) return;

  const studentRef = ref(database, `${DB_PATHS.students}/${target._firebaseKey}`);
  await remove(studentRef);
}

// ========== 日程管理 CRUD ==========

// 获取所有日程（监听实时变化）
export function subscribeScheduleItems(callback) {
  const itemsRef = ref(database, DB_PATHS.scheduleItems);
  const unsubscribe = onValue(itemsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const items = Object.entries(data).map(([key, value]) => ({
        ...value,
        _firebaseKey: key,
        id: value.id || parseInt(key)
      }));
      callback(items);
    } else {
      callback([]);
    }
  });
  return unsubscribe;
}

// 新增日程
export async function cloudAddScheduleItem(item) {
  const itemsRef = ref(database, DB_PATHS.scheduleItems);
  const newRef = push(itemsRef);
  const data = { ...item, id: item.id || Date.now() };
  await set(newRef, data);
  return data;
}

// 更新日程
export async function cloudUpdateScheduleItem(id, updates) {
  const itemsRef = ref(database, DB_PATHS.scheduleItems);
  const snapshot = await get(itemsRef);
  const data = snapshot.val();
  if (!data) return null;
  const entry = Object.entries(data).find(([, v]) => v.id === id);
  if (!entry) return null;
  const [key] = entry;
  const itemRef = ref(database, `${DB_PATHS.scheduleItems}/${key}`);
  await update(itemRef, updates);
}

// 删除日程
export async function cloudDeleteScheduleItem(id) {
  const itemsRef = ref(database, DB_PATHS.scheduleItems);
  const snapshot = await get(itemsRef);
  const data = snapshot.val();
  if (!data) return;
  const entry = Object.entries(data).find(([, v]) => v.id === id);
  if (!entry) return;
  const [key] = entry;
  const itemRef = ref(database, `${DB_PATHS.scheduleItems}/${key}`);
  await remove(itemRef);
}

// ========== 数据迁移（localStorage → Firebase）==========

export async function migrateLocalData() {
  try {
    // 迁移学生数据
    const localStudents = getLocalStudents();
    if (localStudents && localStudents.length > 0) {
      for (const student of localStudents) {
        // 去掉 _firebaseKey（如果有）
        const { _firebaseKey, ...cleanStudent } = student;
        await cloudAddStudent(cleanStudent);
      }
    }

    // 迁移日程数据
    try {
      const saved = localStorage.getItem('danjia_schedule_items');
      if (saved) {
        const items = JSON.parse(saved);
        for (const item of items) {
          const { _firebaseKey, ...cleanItem } = item;
          await cloudAddScheduleItem(cleanItem);
        }
      }
    } catch (e) {
      console.error('迁移日程数据失败:', e);
    }

    return { success: true };
  } catch (error) {
    console.error('数据迁移失败:', error);
    return { success: false, error };
  }
}

export { auth, database };
