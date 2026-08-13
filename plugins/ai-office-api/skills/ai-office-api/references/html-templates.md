# HTML 报告模板规范

Agent 生成业务数据 HTML 报告时的模板参考。所有模板为**单文件**（CSS/JS 内联），**暗色主题**，**响应式**，使用 **UTF-8 中文**。

---

## 1. 通用骨架（所有报告的基础）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>报告标题</title>
<style>
  :root {
    --bg: #0f172a;          /* 背景 */
    --card: #1e293b;        /* 卡片背景 */
    --border: #334155;      /* 边框 */
    --text: #e2e8f0;        /* 主文字 */
    --muted: #94a3b8;       /* 次要文字 */
    --accent: #38bdf8;      /* 强调色 */
    --green: #22c55e;       /* 正常 */
    --yellow: #eab308;      /* 警告 */
    --red: #ef4444;         /* 危险 */
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    padding: 24px;
    line-height: 1.6;
  }
  .container { max-width: 1200px; margin: 0 auto; }
  .header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 24px; padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .header h1 { font-size: 24px; font-weight: 600; }
  .header .meta { color: var(--muted); font-size: 13px; text-align: right; }
  .card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px; margin-bottom: 20px;
  }
  .card h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--accent); }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border); }
  th { color: var(--muted); font-weight: 500; white-space: nowrap; }
  tr:hover { background: rgba(56, 189, 248, 0.06); }
  .badge {
    display: inline-block; padding: 2px 10px; border-radius: 9999px;
    font-size: 12px; font-weight: 500;
  }
  .badge-green { background: rgba(34,197,94,0.15); color: var(--green); }
  .badge-yellow { background: rgba(234,179,8,0.15); color: var(--yellow); }
  .badge-red { background: rgba(239,68,68,0.15); color: var(--red); }
  .badge-blue { background: rgba(56,189,248,0.15); color: var(--accent); }
  .empty {
    text-align: center; color: var(--muted); padding: 40px 0; font-size: 14px;
  }
  .footer { text-align: center; color: var(--muted); font-size: 12px; margin-top: 32px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>{{报告标题}}</h1>
    <div class="meta">
      生成时间：{{YYYY-MM-DD HH:mm:ss}}<br>
      数据来源：AI-Automated-office API
    </div>
  </div>

  <!-- 内容区域 -->

  <div class="footer">AI-Automated-office · Agent 生成报告</div>
</div>
</body>
</html>
```

---

## 2. KPI 指标卡（用于仪表盘/驾驶舱）

```html
<div class="kpi-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px;">
  <div class="card" style="margin-bottom:0;">
    <div style="font-size:13px;color:var(--muted);">总营收</div>
    <div style="font-size:28px;font-weight:700;margin-top:8px;">¥{{total_revenue}}</div>
    <div class="badge badge-green">+{{revenue_growth}}%</div>
  </div>
  <div class="card" style="margin-bottom:0;">
    <div style="font-size:13px;color:var(--muted);">回款率</div>
    <div style="font-size:28px;font-weight:700;margin-top:8px;">{{collection_rate}}%</div>
  </div>
  <div class="card" style="margin-bottom:0;">
    <div style="font-size:13px;color:var(--muted);">在职员工</div>
    <div style="font-size:28px;font-weight:700;margin-top:8px;">{{active_employees}}</div>
  </div>
  <div class="card" style="margin-bottom:0;">
    <div style="font-size:13px;color:var(--muted);">新增客户</div>
    <div style="font-size:28px;font-weight:700;margin-top:8px;">{{new_customers}}</div>
  </div>
</div>
```

---

## 3. 状态信号面板（红/黄/绿）

```html
<div class="card">
  <h2>经营健康度</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">
    <div style="padding:16px;border-radius:10px;border:1px solid var(--border);background:rgba(239,68,68,0.08);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span>销售健康度</span>
        <span class="badge badge-red">低</span>
      </div>
      <div style="color:var(--muted);font-size:13px;margin-top:8px;">总营收较低</div>
    </div>
    <!-- 重复此结构 -->
  </div>
</div>
```

状态颜色映射：`red` → badge-red，`yellow`/`warning` → badge-yellow，`green` → badge-green。

---

## 4. 数据表格（列表类报告）

```html
<div class="card">
  <h2>{{列表标题}}（共 {{total}} 条）</h2>
  <div style="overflow-x:auto;">
  <table>
    <thead>
      <tr>
        <th>列1</th><th>列2</th><th>列3</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{value}}</td><td>{{value}}</td><td>{{value}}</td>
      </tr>
    </tbody>
  </table>
  </div>
</div>
```

---

## 5. 柱状图（Canvas 原生绘制）

```html
<canvas id="barChart" width="800" height="300" style="width:100%;height:auto;"></canvas>
<script>
(function() {
  const data = [{{数值数组, 如 120, 85, 90, 45}}];
  const labels = [{{标签数组, 如 "1月","2月","3月","4月"}}];
  const canvas = document.getElementById('barChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const max = Math.max(...data) * 1.2;
  const barW = W / data.length * 0.6;
  ctx.clearRect(0, 0, W, H);

  // 网格线
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = 40 + (H - 80) - (H - 80) * i / 4;
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 20, y); ctx.stroke();
  }

  // 柱形
  data.forEach((v, i) => {
    const x = 40 + (W - 60) * i / data.length + (W - 60) / data.length * 0.2;
    const h = (H - 80) * v / max;
    const y = 40 + (H - 80) - h;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x, y, barW, h);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(v, x + barW / 2, y - 6);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(labels[i], x + barW / 2, H - 20);
  });
})();
</script>
```

---

## 6. 时间线（审计日志等）

```html
<div class="timeline" style="position:relative;padding-left:24px;">
  <div style="position:absolute;left:8px;top:0;bottom:0;width:2px;background:var(--border);"></div>
  <div style="position:relative;margin-bottom:16px;">
    <div style="position:absolute;left:-24px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--accent);"></div>
    <div style="font-size:13px;color:var(--muted);">{{时间}}</div>
    <div style="font-weight:600;margin-top:4px;">{{操作描述}}</div>
    <div style="font-size:13px;color:var(--muted);margin-top:2px;">{{详细信息}}</div>
  </div>
</div>
```

---

## 7. 空数据状态

当 API 返回空列表时，必须显示空状态而非空白页：

```html
<div class="card">
  <h2>{{标题}}</h2>
  <div class="empty">暂无数据</div>
</div>
```

---

## 8. 完整示例：经营驾驶舱

以下为 `finance_owner_signals` + `finance_owner_kpi` 数据的完整 HTML 报告模板：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>企业经营驾驶舱</title>
<style>
  :root {
    --bg: #0f172a; --card: #1e293b; --border: #334155;
    --text: #e2e8f0; --muted: #94a3b8; --accent: #38bdf8;
    --green: #22c55e; --yellow: #eab308; --red: #ef4444;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; padding: 24px; line-height: 1.6; }
  .container { max-width: 1200px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .header h1 { font-size: 24px; font-weight: 600; }
  .header .meta { color: var(--muted); font-size: 13px; text-align: right; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  .card h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--accent); }
  .kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
  .kpi .card { margin-bottom: 0; }
  .kpi-label { font-size: 13px; color: var(--muted); }
  .kpi-value { font-size: 28px; font-weight: 700; margin-top: 8px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
  .badge-green { background: rgba(34,197,94,0.15); color: var(--green); }
  .badge-yellow { background: rgba(234,179,8,0.15); color: var(--yellow); }
  .badge-red { background: rgba(239,68,68,0.15); color: var(--red); }
  .signal { padding: 16px; border-radius: 10px; border: 1px solid var(--border); margin-bottom: 12px; }
  .signal-header { display: flex; justify-content: space-between; align-items: center; }
  .signal-detail { color: var(--muted); font-size: 13px; margin-top: 8px; }
  .footer { text-align: center; color: var(--muted); font-size: 12px; margin-top: 32px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>企业经营驾驶舱</h1>
    <div class="meta">生成时间：{{YYYY-MM-DD HH:mm:ss}}<br>数据来源：AI-Automated-office API</div>
  </div>

  <div class="kpi">
    <div class="card">
      <div class="kpi-label">总营收</div>
      <div class="kpi-value">¥{{total_revenue}}</div>
      <div><span class="badge {{growth_badge_class}}">{{growth_badge_text}}</span></div>
    </div>
    <div class="card">
      <div class="kpi-label">回款率</div>
      <div class="kpi-value">{{collection_rate}}%</div>
    </div>
    <div class="card">
      <div class="kpi-label">在职员工</div>
      <div class="kpi-value">{{active_employees}}</div>
    </div>
    <div class="card">
      <div class="kpi-label">新增客户</div>
      <div class="kpi-value">{{new_customers}}</div>
    </div>
  </div>

  <div class="card">
    <h2>经营健康度信号</h2>
    <!-- 每个 signal 生成一个 .signal 块，status 映射 badge 颜色 -->
    <div class="signal">
      <div class="signal-header">
        <span style="font-weight:600;">{{signal.name}}</span>
        <span class="badge badge-{{signal_status_class}}">{{signal.value}}</span>
      </div>
      <div class="signal-detail">{{signal.detail}}</div>
    </div>
  </div>

  <div class="footer">AI-Automated-office · Agent 生成报告</div>
</div>
</body>
</html>
```

---

## 生成检查清单

生成 HTML 后，Agent 自检：

- [ ] `<meta charset="UTF-8">` 存在，中文正常显示
- [ ] 所有 CSS/JS 内联，无外部资源依赖
- [ ] 数据字段与 API 返回一致（无硬编码假数据）
- [ ] 空数据时显示"暂无数据"空状态
- [ ] 数字格式正确（金额、百分比、日期）
- [ ] 文件已保存到指定目录（默认 test-flie/）
- [ ] 已在回复中告知用户完整文件路径
