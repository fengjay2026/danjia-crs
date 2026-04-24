-- 丹加留学顾问CRS数据库表结构

-- 申请季
CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  year INTEGER,
  status TEXT DEFAULT 'active'
);

-- 学生主档案
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  chinese_name TEXT,
  school TEXT,
  major TEXT,
  gpa TEXT,
  target_major TEXT,
  target_countries TEXT,
  season_id INTEGER,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id)
);

-- 申请目标
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  school TEXT NOT NULL,
  program TEXT,
  rank TEXT,
  status TEXT DEFAULT 'pending',
  submitted_date DATE,
  result_date DATE,
  notes TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 文书进度
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  doc_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  current_version TEXT,
  deadline DATE,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 沟通记录
CREATE TABLE IF NOT EXISTS communications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  date DATETIME NOT NULL,
  type TEXT,
  summary TEXT,
  next_action TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 雅思成绩
CREATE TABLE IF NOT EXISTS ielts_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  exam_date DATE,
  expected_exam_date DATE,
  overall_score REAL,
  listening REAL,
  reading REAL,
  writing REAL,
  speaking REAL,
  status TEXT DEFAULT 'pending',
  target_score REAL,
  exam_center TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 实习经历
CREATE TABLE IF NOT EXISTS internships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  company TEXT,
  position TEXT,
  start_date DATE,
  end_date DATE,
  description TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 科研经历
CREATE TABLE IF NOT EXISTS research (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  title TEXT,
  professor TEXT,
  institution TEXT,
  start_date DATE,
  end_date DATE,
  description TEXT,
  output TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 计划任务/提醒
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  task_type TEXT,
  title TEXT NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  completed BOOLEAN DEFAULT 0,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 插入默认申请季
INSERT INTO seasons (name, year, status) VALUES ('26Fall', 2026, 'active');
INSERT INTO seasons (name, year, status) VALUES ('27Fall', 2027, 'active');
INSERT INTO seasons (name, year, status) VALUES ('28Fall', 2028, 'active');
