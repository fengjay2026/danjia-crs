const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  initialize() {
    const userDataPath = process.env.APPDATA || process.env.HOME;
    const dbDir = path.join(userDataPath, 'DanjiaCRS');
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'danjia-crs.db');
    this.db = new Database(dbPath);
    
    // 启用外键
    this.db.pragma('foreign_keys = ON');
    
    // 初始化表结构
    this.initializeSchema();
    
    console.log('Database initialized at:', dbPath);
    return this;
  }

  initializeSchema() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // 分割并执行每个语句
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      try {
        this.db.exec(statement);
      } catch (err) {
        // 忽略已存在的表错误
        if (!err.message.includes('already exists')) {
          console.error('Schema error:', err.message);
        }
      }
    }
  }

  // 学生操作
  getAllStudents() {
    return this.db.prepare(`
      SELECT s.*, ss.name as season_name 
      FROM students s 
      LEFT JOIN seasons ss ON s.season_id = ss.id 
      ORDER BY s.created_at DESC
    `).all();
  }

  getStudentsBySeason(seasonId) {
    return this.db.prepare(`
      SELECT * FROM students WHERE season_id = ? ORDER BY name
    `).all(seasonId);
  }

  getStudent(id) {
    return this.db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  }

  addStudent(student) {
    const stmt = this.db.prepare(`
      INSERT INTO students (name, chinese_name, school, major, gpa, target_major, target_countries, season_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      student.name,
      student.chinese_name || null,
      student.school || null,
      student.major || null,
      student.gpa || null,
      student.target_major || null,
      student.target_countries ? JSON.stringify(student.target_countries) : null,
      student.season_id || null
    );
    return result.lastInsertRowid;
  }

  updateStudent(id, student) {
    const stmt = this.db.prepare(`
      UPDATE students SET 
        name = ?, chinese_name = ?, school = ?, major = ?, gpa = ?,
        target_major = ?, target_countries = ?, season_id = ?, status = ?
      WHERE id = ?
    `);
    return stmt.run(
      student.name,
      student.chinese_name || null,
      student.school || null,
      student.major || null,
      student.gpa || null,
      student.target_major || null,
      student.target_countries ? JSON.stringify(student.target_countries) : null,
      student.season_id || null,
      student.status || 'active',
      id
    );
  }

  // 申请操作
  getApplicationsByStudent(studentId) {
    return this.db.prepare('SELECT a.*, s.name as student_name FROM applications a LEFT JOIN students s ON a.student_id = s.id WHERE a.student_id = ?').all(studentId);
  }

  getAllApplications() {
    return this.db.prepare(`
      SELECT a.*, s.name as student_name, s.target_major, ss.name as season_name
      FROM applications a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN seasons ss ON s.season_id = ss.id
      ORDER BY s.name, a.school
    `).all();
  }

  getApplication(id) {
    return this.db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  }

  addApplication(application) {
    const stmt = this.db.prepare(`
      INSERT INTO applications (student_id, school, program, rank, status, submitted_date, result_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      application.student_id,
      application.school,
      application.program || null,
      application.rank || null,
      application.status || 'pending',
      application.submitted_date || null,
      application.result_date || null,
      application.notes || null
    );
    return result.lastInsertRowid;
  }

  updateApplication(id, application) {
    const stmt = this.db.prepare(`
      UPDATE applications SET school = ?, program = ?, rank = ?, status = ?,
        submitted_date = ?, result_date = ?, notes = ?
      WHERE id = ?
    `);
    return stmt.run(
      application.school,
      application.program || null,
      application.rank || null,
      application.status || 'pending',
      application.submitted_date || null,
      application.result_date || null,
      application.notes || null,
      id
    );
  }

  deleteApplication(id) {
    return this.db.prepare('DELETE FROM applications WHERE id = ?').run(id);
  }

  // 沟通记录
  getCommunicationsByStudent(studentId) {
    return this.db.prepare('SELECT * FROM communications WHERE student_id = ? ORDER BY date DESC').all(studentId);
  }

  addCommunication(communication) {
    const stmt = this.db.prepare(`
      INSERT INTO communications (student_id, date, type, summary, next_action)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      communication.student_id,
      communication.date,
      communication.type || null,
      communication.summary || null,
      communication.next_action || null
    );
  }

  // 文书进度
  getDocumentsByStudent(studentId) {
    return this.db.prepare(`
      SELECT d.*, s.name as student_name
      FROM documents d
      LEFT JOIN students s ON d.student_id = s.id
      WHERE d.student_id = ?
    `).all(studentId);
  }

  getAllDocuments() {
    return this.db.prepare(`
      SELECT d.*, s.name as student_name, s.target_major
      FROM documents d
      LEFT JOIN students s ON d.student_id = s.id
      ORDER BY s.name, d.doc_type
    `).all();
  }

  getDocument(id) {
    return this.db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  }

  addDocument(doc) {
    const stmt = this.db.prepare(`
      INSERT INTO documents (student_id, doc_type, status, current_version, deadline)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(doc.student_id, doc.doc_type, doc.status || 'pending', doc.current_version || null, doc.deadline || null);
  }

  updateDocument(id, doc) {
    const stmt = this.db.prepare(`
      UPDATE documents SET doc_type = ?, status = ?, current_version = ?, deadline = ?
      WHERE id = ?
    `);
    return stmt.run(
      doc.doc_type,
      doc.status || 'pending',
      doc.current_version || null,
      doc.deadline || null,
      id
    );
  }

  deleteDocument(id) {
    return this.db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  }

  // 雅思成绩
  getIeltsScore(studentId) {
    return this.db.prepare('SELECT * FROM ielts_scores WHERE student_id = ? ORDER BY exam_date DESC LIMIT 1').get(studentId);
  }

  addIeltsScore(score) {
    const stmt = this.db.prepare(`
      INSERT INTO ielts_scores (student_id, exam_date, expected_exam_date, overall_score, listening, reading, writing, speaking, status, target_score, exam_center)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      score.student_id,
      score.exam_date || null,
      score.expected_exam_date || null,
      score.overall_score || null,
      score.listening || null,
      score.reading || null,
      score.writing || null,
      score.speaking || null,
      score.status || 'pending',
      score.target_score || null,
      score.exam_center || null
    );
  }

  // 实习经历
  getInternships(studentId) {
    return this.db.prepare('SELECT * FROM internships WHERE student_id = ? ORDER BY start_date DESC').all(studentId);
  }

  addInternship(internship) {
    const stmt = this.db.prepare(`
      INSERT INTO internships (student_id, company, position, start_date, end_date, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      internship.student_id,
      internship.company || null,
      internship.position || null,
      internship.start_date || null,
      internship.end_date || null,
      internship.description || null
    );
  }

  // 科研经历
  getResearch(studentId) {
    return this.db.prepare('SELECT * FROM research WHERE student_id = ? ORDER BY start_date DESC').all(studentId);
  }

  addResearch(research) {
    const stmt = this.db.prepare(`
      INSERT INTO research (student_id, title, professor, institution, start_date, end_date, description, output)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      research.student_id,
      research.title || null,
      research.professor || null,
      research.institution || null,
      research.start_date || null,
      research.end_date || null,
      research.description || null,
      research.output || null
    );
  }

  // 任务
  getTasks(studentId = null) {
    if (studentId) {
      return this.db.prepare('SELECT * FROM tasks WHERE student_id = ? ORDER BY due_date').all(studentId);
    }
    return this.db.prepare('SELECT t.*, s.name as student_name FROM tasks t LEFT JOIN students s ON t.student_id = s.id ORDER BY t.due_date').all();
  }

  addTask(task) {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (student_id, task_type, title, due_date, status, completed)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      task.student_id || null,
      task.task_type || null,
      task.title,
      task.due_date || null,
      task.status || 'pending',
      task.completed ? 1 : 0
    );
  }

  toggleTaskComplete(taskId) {
    return this.db.prepare('UPDATE tasks SET completed = NOT completed WHERE id = ?').run(taskId);
  }

  // 申请季
  getSeasons() {
    return this.db.prepare('SELECT * FROM seasons ORDER BY year DESC').all();
  }

  // 统计数据
  getDashboardStats() {
    const totalStudents = this.db.prepare('SELECT COUNT(*) as count FROM students WHERE status = ?').get('active').count;
    const pendingApplications = this.db.prepare('SELECT COUNT(*) as count FROM applications WHERE status = ?').get('pending').count;
    const upcomingTasks = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 0 AND due_date <= date("now", "+7 days")').get().count;
    
    return { totalStudents, pendingApplications, upcomingTasks };
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new DatabaseManager();
