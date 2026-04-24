const fs = require('fs');
const c = fs.readFileSync('c:/Users/Administrator/WorkBuddy/20260421143/丹加留学顾问CRS/src/renderer/pages/StudentList.jsx', 'utf8');
const start = c.indexOf('目标院校');
const end = c.indexOf('申请进度');
const before = c.slice(0, start);
const after = c.slice(end);
const fixed = `    {
      title: '目标院校',
      key: 'targets',
      render: (_, record) => {
        const all = record.applications || [];
        const visible = all.slice(0, 2);
        const extra = all.length - 2;
        const tooltipItems = all.map((a, i) => i + ': ' + i + ': ' + i + ': ' + i
const tooltip = '<div>' + tooltipItems.join('') + '</div>';
        return (
          <Tooltip 
            title={<div>{all.map((a, i) => <div key={i}>• {a.school}{a.program ? ' · ' + a.program : ''}{a.rank ? ' [' + a.rank + ']' : ''}</div>)}
          >
            <div>{visible.map((a, i) => <Tag key={i} style={{ marginBottom: 2 }}>{a.school}</Tag>)}
              {extra > 0 && <Tag>+{extra}所</Tag>}
            </div>
          </Tooltip>
        );
      },` + after;
fs.writeFileSync('c:/Users/Administrator/WorkBuddy/20260421154313/丹加留学顾问CRS/src/renderer/pages/StudentList.jsx', before + fixed, 'utf8');
