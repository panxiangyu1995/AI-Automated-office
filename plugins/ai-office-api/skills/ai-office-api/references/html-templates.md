# HTML 报告模板规范

Agent 生成业务数据 HTML 报告时的模板参考。所有模板为**单文件**（CSS/JS 内联），**暗色主题**，**响应式**，使用 **UTF-8 中文**。

---

## 0. 字段展示本地化（先读！）

**原则：展示给业务人员看，枚举值必须转中文。** 生成报告时，API 返回的每个字段值按下表处理：

| 字段类别 | 处理方式 | 示例 |
|---------|---------|------|
| 业务枚举 | **必须中文映射**（见下表） | `active` → 在职 |
| 业务编码（SKU/工号/单号） | 保留原样 | `SKU-PC-LAPTOP` |
| 联系数据（邮箱/电话/地址） | 保留原样 | `zhangsan@test.com` |
| 日期时间 | `YYYY-MM-DD HH:mm:ss` | `2026-08-13 15:10:00` |
| 金额 | `¥` + 千分位 | `¥5,999.00` |
| 布尔值 | 是 / 否 | `true` → 是 |
| 通用缩写（VIP/SKU/KPI/SLA） | 保留 | `VIP` |
| 未收录枚举 | 保留原值（兜底） | `archived` |

### 枚举值中文映射表（生成时必须转换）

| 枚举字段 | 英文值 | 中文显示 |
|---------|--------|---------|
| 角色 `role` | owner | 老板 |
| | admin | 管理员 |
| | manager | 经理 |
| | employee | 员工 |
| 通用状态 `status` | active | 生效中（员工→在职/物料→在用/合同→履约中） |
| | inactive | 停用 |
| | pending | 待处理 |
| | pending_approval | 待审批 |
| | draft | 草稿 |
| | confirmed | 已确认 |
| | shipped | 已发货 |
| | fulfilled | 已完结 |
| | completed | 已完成 |
| | approved | 已批准 |
| | rejected | 已拒绝 |
| | cancelled | 已取消 |
| | expired | 已过期 |
| | issued | 已开票 |
| | received | 已收货 |
| | refunded | 已退款 |
| | returned | 已退货 |
| | paid | 已付款 |
| | overdue / past_due | 已逾期 |
| | open | 待处理 |
| | running | 进行中 |
| | frozen | 已冻结 |
| | resigned | 已离职 |
| | cleared | 已结清 |
| | success | 成功 |
| | error / failed | 失败 |
| | enabled | 已启用 |
| | disabled | 已禁用 |
| 优先级 `priority` | normal | 普通 |
| | low | 低 |
| | high | 高 |
| | urgent / critical | 紧急 |
| 信号状态 `signal.status` | red | 差（badge-red） |
| | yellow | 警告（badge-yellow） |
| | green | 健康（badge-green） |

**注意**：badge 颜色按原始枚举映射（`red`→红色背景），**文字内容用中文**。筛选按钮从**中文值**自动生成。

---

## 0.1 报告文件命名（复用/清理基础）

```
{报告类型}_{维度标识}_{YYYYMMDD}.html
```

- **报告类型**：employee-list / customer-list / material-list / dashboard / audit-log / work-report / owner-kpi ...
- **维度标识**：查询条件的稳定摘要（all / active / dept-{name} / level-{name} / month-{YYYYMM}），无查询条件用 all
- **日期**：当日有效

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
    flex-wrap: wrap; gap: 8px;
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

## 2. 交互组件库（列表类报告必须包含）

以下 JS 工具代码为列表类报告的**标准交互组件**。生成带表格的 HTML 时，必须集成此组件库（可整体复制，替换 `{{数据行}}`）。

### 2.1 工具栏 HTML（搜索框 + 筛选 + 导出）

```html
<div class="toolbar">
  <input type="text" id="searchInput" class="search-input" placeholder="搜索..." data-table="dataTable">
  <div class="filter-group" data-table="dataTable"></div>
  <div class="toolbar-right">
    <span class="count-info" data-count="dataTable">共 0 条</span>
    <button class="btn" onclick="exportCSV('dataTable')">导出 CSV</button>
    <button class="btn" onclick="window.print()">打印</button>
  </div>
</div>
<div style="overflow-x:auto;">
  <table id="dataTable">
    <thead>
      <tr>
        <th data-sort="0" class="sortable">列1 <span class="sort-icon"></span></th>
        <th data-sort="1" class="sortable">列2 <span class="sort-icon"></span></th>
      </tr>
    </thead>
    <tbody>
      {{数据行}}
    </tbody>
  </table>
</div>
```

### 2.2 工具栏 CSS

```css
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
.search-input {
  flex: 1; min-width: 200px; max-width: 320px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
  color: var(--text); padding: 8px 12px; font-size: 13px; outline: none;
}
.search-input:focus { border-color: var(--accent); }
.filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-btn {
  background: var(--card); border: 1px solid var(--border); color: var(--muted);
  border-radius: 9999px; padding: 4px 12px; font-size: 12px; cursor: pointer;
}
.filter-btn.active { border-color: var(--accent); color: var(--accent); }
.toolbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
.count-info { color: var(--muted); font-size: 13px; }
.btn {
  background: var(--card); border: 1px solid var(--border); color: var(--text);
  border-radius: 8px; padding: 6px 14px; font-size: 13px; cursor: pointer;
}
.btn:hover { border-color: var(--accent); color: var(--accent); }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--text); }
.sort-icon { display: inline-block; width: 0; height: 0; margin-left: 4px; }
.sort-asc .sort-icon { border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 5px solid var(--accent); }
.sort-desc .sort-icon { border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid var(--accent); }
#backToTop {
  position: fixed; right: 24px; bottom: 24px; width: 40px; height: 40px;
  border-radius: 50%; background: var(--accent); color: #0f172a;
  border: none; font-size: 18px; cursor: pointer; display: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
```

### 2.3 交互 JS（搜索 / 排序 / 筛选 / 统计 / CSV 导出 / 回顶）

```html
<script>
/* ===== 标准交互组件（列表报告必含） ===== */
(function() {
  // --- 通用：按 data-table 关联 ---
  function getRows(tableId) {
    const t = document.getElementById(tableId);
    return t ? Array.from(t.querySelectorAll('tbody tr')) : [];
  }
  function updateCount(tableId) {
    const rows = getRows(tableId).filter(r => r.style.display !== 'none');
    const total = getRows(tableId).length;
    const el = document.querySelector(`[data-count="${tableId}"]`);
    if (el) el.textContent = `显示 ${rows.length} / 共 ${total} 条`;
  }

  // --- 搜索过滤 ---
  document.querySelectorAll('.search-input').forEach(input => {
    input.addEventListener('input', () => {
      const tableId = input.getAttribute('data-table');
      const q = input.value.trim().toLowerCase();
      getRows(tableId).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
      updateCount(tableId);
    });
  });

  // --- 表头排序 ---
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const tableId = th.closest('table').id;
      const idx = parseInt(th.getAttribute('data-sort'), 10);
      const tbody = th.closest('table').querySelector('tbody');
      const rows = getRows(tableId).filter(r => r.style.display !== 'none');
      const asc = !th.classList.contains('sort-asc');
      th.closest('thead').querySelectorAll('th.sortable').forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
      });
      th.classList.add(asc ? 'sort-asc' : 'sort-desc');
      rows.sort((a, b) => {
        const av = a.cells[idx] ? a.cells[idx].textContent.trim() : '';
        const bv = b.cells[idx] ? b.cells[idx].textContent.trim() : '';
        const an = parseFloat(av.replace(/[¥,]/g, ''));
        const bn = parseFloat(bv.replace(/[¥,]/g, ''));
        const cmp = (!isNaN(an) && !isNaN(bn)) ? an - bn : av.localeCompare(bv, 'zh-CN');
        return asc ? cmp : -cmp;
      });
      rows.forEach(r => tbody.appendChild(r));
    });
  });

  // --- 状态筛选（生成时从数据提取唯一状态值生成按钮） ---
  document.querySelectorAll('.filter-group').forEach(group => {
    const tableId = group.getAttribute('data-table');
    const colIdx = parseInt(group.getAttribute('data-col') || '0', 10);
    const values = new Set();
    getRows(tableId).forEach(r => {
      const v = (r.cells[colIdx] ? r.cells[colIdx].textContent.trim() : '');
      if (v) values.add(v);
    });
    const all = document.createElement('button');
    all.className = 'filter-btn active'; all.textContent = '全部';
    all.addEventListener('click', () => {
      group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      all.classList.add('active');
      getRows(tableId).forEach(r => r.style.display = '');
      updateCount(tableId);
    });
    group.appendChild(all);
    values.forEach(v => {
      const b = document.createElement('button');
      b.className = 'filter-btn'; b.textContent = v;
      b.addEventListener('click', () => {
        group.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        getRows(tableId).forEach(r => {
          const cell = r.cells[colIdx] ? r.cells[colIdx].textContent.trim() : '';
          r.style.display = cell === v ? '' : 'none';
        });
        updateCount(tableId);
      });
      group.appendChild(b);
    });
  });

  // --- CSV 导出 ---
  window.exportCSV = function(tableId) {
    const t = document.getElementById(tableId);
    if (!t) return;
    const headers = Array.from(t.querySelectorAll('thead th')).map(h => h.textContent.replace(/[▲▼]/g, '').trim());
    const rows = getRows(tableId).filter(r => r.style.display !== 'none')
      .map(r => Array.from(r.cells).map(c => c.textContent.trim()));
    const csv = [headers, ...rows].map(row =>
      row.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')
    ).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tableId + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // --- 回到顶部 ---
  const backToTop = document.createElement('button');
  backToTop.id = 'backToTop'; backToTop.textContent = '↑';
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(backToTop);
  window.addEventListener('scroll', () => {
    backToTop.style.display = window.scrollY > 300 ? 'block' : 'none';
  });

  // --- 初始化统计 ---
  updateCount('dataTable');
})();
</script>
```

### 2.4 交互组件使用约定

| 组件 | 触发方式 | 必须项 |
|------|---------|--------|
| 搜索 | `input.search-input` + `data-table="{tableId}"` | 表格 tbody 有数据行 |
| 排序 | `th.sortable` + `data-sort="{列索引}"` | 每列 `th` 加 `class="sortable"` |
| 筛选 | `.filter-group` + `data-col="{状态列索引}"` | 表格 `id` 唯一 |
| 统计 | `[data-count="{tableId}"]` | 自动 |
| 导出 | `onclick="exportCSV('{tableId}')"` | 自动 |
| 回顶 | 自动注入 | 页面可滚动 |

**最小集成要求**：表格 `<table id="dataTable">`、搜索框、导出按钮 + 上述 `<script>`。三个缺一不可。

---

## 3. KPI 指标卡（用于仪表盘/驾驶舱）

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

## 4. 状态信号面板（红/黄/绿，可交互筛选）

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

## 5. 数据表格（列表类报告标准结构，含交互）

```html
<div class="card">
  <h2>{{列表标题}}（共 {{total}} 条）</h2>
  <div class="toolbar">
    <input type="text" id="searchInput" class="search-input" placeholder="搜索..." data-table="{{tableId}}">
    <div class="filter-group" data-table="{{tableId}}" data-col="{{状态列索引}}"></div>
    <div class="toolbar-right">
      <span class="count-info" data-count="{{tableId}}">共 0 条</span>
      <button class="btn" onclick="exportCSV('{{tableId}}')">导出 CSV</button>
      <button class="btn" onclick="window.print()">打印</button>
    </div>
  </div>
  <div style="overflow-x:auto;">
  <table id="{{tableId}}">
    <thead>
      <tr>
        <th class="sortable" data-sort="0">列1 <span class="sort-icon"></span></th>
        <th class="sortable" data-sort="1">列2 <span class="sort-icon"></span></th>
        <th class="sortable" data-sort="2">列3 <span class="sort-icon"></span></th>
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

<script>
/* ===== 标准交互组件（复制自 §2.3） ===== */
(function() {
  function getRows(tableId) { ... }
  function updateCount(tableId) { ... }
  /* ...完整代码见 §2.3... */
})();
</script>
```

---

## 6. 柱状图（Canvas 原生绘制，带 hover tooltip）

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

  // 柱形 + hover 提示
  const bars = [];
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
    bars.push({ x, y, w: barW, h, label: labels[i], value: v });
  });

  // tooltip
  const tip = document.createElement('div');
  tip.style.cssText = 'position:fixed;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px;pointer-events:none;display:none;z-index:99;';
  document.body.appendChild(tip);
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / W;
    const mx = (e.clientX - rect.left) / scale;
    const my = (e.clientY - rect.top) / scale;
    const hit = bars.find(b => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h);
    if (hit) {
      tip.textContent = `${hit.label}: ${hit.value}`;
      tip.style.display = 'block';
      tip.style.left = (e.clientX + 12) + 'px';
      tip.style.top = (e.clientY + 12) + 'px';
    } else {
      tip.style.display = 'none';
    }
  });
  canvas.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
})();
</script>
```

---

## 7. 时间线（审计日志等）

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

## 8. 空数据状态

当 API 返回空列表时，必须显示空状态而非空白页：

```html
<div class="card">
  <h2>{{标题}}</h2>
  <div class="empty">暂无数据</div>
</div>
```

---

## 9. 完整示例：经营驾驶舱

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

## 10. 完整示例：带交互的员工列表报告

此模板为列表类报告的**标准完整结构**（交互组件齐全），Agent 生成员工/客户/物料等列表报告时应以此为基础，替换表格列和数据行即可：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>员工花名册</title>
<style>
  :root {
    --bg: #0f172a; --card: #1e293b; --border: #334155;
    --text: #e2e8f0; --muted: #94a3b8; --accent: #38bdf8;
    --green: #22c55e; --yellow: #eab308; --red: #ef4444;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; padding: 24px; line-height: 1.6; }
  .container { max-width: 1200px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .header h1 { font-size: 24px; font-weight: 600; }
  .header .meta { color: var(--muted); font-size: 13px; text-align: right; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  .card h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--accent); }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border); }
  th { color: var(--muted); font-weight: 500; white-space: nowrap; }
  tr:hover { background: rgba(56, 189, 248, 0.06); }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
  .badge-green { background: rgba(34,197,94,0.15); color: var(--green); }
  .badge-blue { background: rgba(56,189,248,0.15); color: var(--accent); }
  .badge-yellow { background: rgba(234,179,8,0.15); color: var(--yellow); }
  .badge-red { background: rgba(239,68,68,0.15); color: var(--red); }
  .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
  .search-input { flex: 1; min-width: 200px; max-width: 320px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: 8px 12px; font-size: 13px; outline: none; }
  .search-input:focus { border-color: var(--accent); }
  .filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
  .filter-btn { background: var(--card); border: 1px solid var(--border); color: var(--muted); border-radius: 9999px; padding: 4px 12px; font-size: 12px; cursor: pointer; }
  .filter-btn.active { border-color: var(--accent); color: var(--accent); }
  .toolbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
  .count-info { color: var(--muted); font-size: 13px; }
  .btn { background: var(--card); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 6px 14px; font-size: 13px; cursor: pointer; }
  .btn:hover { border-color: var(--accent); color: var(--accent); }
  .sortable { cursor: pointer; user-select: none; }
  .sortable:hover { color: var(--text); }
  .sort-icon { display: inline-block; width: 0; height: 0; margin-left: 4px; }
  .sort-asc .sort-icon { border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 5px solid var(--accent); }
  .sort-desc .sort-icon { border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid var(--accent); }
  #backToTop { position: fixed; right: 24px; bottom: 24px; width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: #0f172a; border: none; font-size: 18px; cursor: pointer; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
  .footer { text-align: center; color: var(--muted); font-size: 12px; margin-top: 32px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>员工花名册</h1>
    <div class="meta">生成时间：{{YYYY-MM-DD HH:mm:ss}}<br>数据来源：AI-Automated-office API</div>
  </div>

  <div class="card">
    <h2>员工明细（共 {{total}} 人）</h2>
    <div class="toolbar">
      <input type="text" class="search-input" placeholder="搜索姓名/职位/邮箱..." data-table="empTable">
      <div class="filter-group" data-table="empTable" data-col="3"></div>
      <div class="toolbar-right">
        <span class="count-info" data-count="empTable">共 0 条</span>
        <button class="btn" onclick="exportCSV('empTable')">导出 CSV</button>
        <button class="btn" onclick="window.print()">打印</button>
      </div>
    </div>
    <div style="overflow-x:auto;">
    <table id="empTable">
      <thead>
        <tr>
          <th class="sortable" data-sort="0">工号 <span class="sort-icon"></span></th>
          <th class="sortable" data-sort="1">姓名 <span class="sort-icon"></span></th>
          <th class="sortable" data-sort="2">职位 <span class="sort-icon"></span></th>
          <th class="sortable" data-sort="3">角色 <span class="sort-icon"></span></th>
          <th class="sortable" data-sort="4">邮箱 <span class="sort-icon"></span></th>
          <th class="sortable" data-sort="5">入职日期 <span class="sort-icon"></span></th>
          <th class="sortable" data-sort="6">状态 <span class="sort-icon"></span></th>
        </tr>
      </thead>
      <tbody>
        <!-- 每行：数据行（枚举值必须用中文，badge 颜色按原始枚举映射） -->
        <tr>
          <td>EMP001</td><td>张三</td><td>技术总监</td>
          <td><span class="badge badge-blue">管理员</span></td>
          <td>zhangsan@test.com</td><td>2025-03-01</td>
          <td><span class="badge badge-green">在职</span></td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>

  <div class="footer">AI-Automated-office · Agent 生成报告</div>
</div>

<script>
/* ===== 标准交互组件（复制自 §2.3） ===== */
(function() {
  function getRows(tableId) {
    const t = document.getElementById(tableId);
    return t ? Array.from(t.querySelectorAll('tbody tr')) : [];
  }
  function updateCount(tableId) {
    const rows = getRows(tableId).filter(r => r.style.display !== 'none');
    const total = getRows(tableId).length;
    const el = document.querySelector(`[data-count="${tableId}"]`);
    if (el) el.textContent = `显示 ${rows.length} / 共 ${total} 条`;
  }
  document.querySelectorAll('.search-input').forEach(input => {
    input.addEventListener('input', () => {
      const tableId = input.getAttribute('data-table');
      const q = input.value.trim().toLowerCase();
      getRows(tableId).forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
      updateCount(tableId);
    });
  });
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const tableId = th.closest('table').id;
      const idx = parseInt(th.getAttribute('data-sort'), 10);
      const tbody = th.closest('table').querySelector('tbody');
      const rows = getRows(tableId).filter(r => r.style.display !== 'none');
      const asc = !th.classList.contains('sort-asc');
      th.closest('thead').querySelectorAll('th.sortable').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(asc ? 'sort-asc' : 'sort-desc');
      rows.sort((a, b) => {
        const av = a.cells[idx] ? a.cells[idx].textContent.trim() : '';
        const bv = b.cells[idx] ? b.cells[idx].textContent.trim() : '';
        const an = parseFloat(av.replace(/[¥,]/g, ''));
        const bn = parseFloat(bv.replace(/[¥,]/g, ''));
        const cmp = (!isNaN(an) && !isNaN(bn)) ? an - bn : av.localeCompare(bv, 'zh-CN');
        return asc ? cmp : -cmp;
      });
      rows.forEach(r => tbody.appendChild(r));
    });
  });
  document.querySelectorAll('.filter-group').forEach(group => {
    const tableId = group.getAttribute('data-table');
    const colIdx = parseInt(group.getAttribute('data-col') || '0', 10);
    const values = new Set();
    getRows(tableId).forEach(r => {
      const v = r.cells[colIdx] ? r.cells[colIdx].textContent.trim() : '';
      if (v) values.add(v);
    });
    const all = document.createElement('button');
    all.className = 'filter-btn active'; all.textContent = '全部';
    all.addEventListener('click', () => {
      group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      all.classList.add('active');
      getRows(tableId).forEach(r => r.style.display = '');
      updateCount(tableId);
    });
    group.appendChild(all);
    values.forEach(v => {
      const b = document.createElement('button');
      b.className = 'filter-btn'; b.textContent = v;
      b.addEventListener('click', () => {
        group.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        getRows(tableId).forEach(r => {
          const cell = r.cells[colIdx] ? r.cells[colIdx].textContent.trim() : '';
          r.style.display = cell === v ? '' : 'none';
        });
        updateCount(tableId);
      });
      group.appendChild(b);
    });
  });
  window.exportCSV = function(tableId) {
    const t = document.getElementById(tableId);
    if (!t) return;
    const headers = Array.from(t.querySelectorAll('thead th')).map(h => h.textContent.replace(/[▲▼]/g, '').trim());
    const rows = getRows(tableId).filter(r => r.style.display !== 'none')
      .map(r => Array.from(r.cells).map(c => c.textContent.trim()));
    const csv = [headers, ...rows].map(row =>
      row.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')
    ).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tableId + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const backToTop = document.createElement('button');
  backToTop.id = 'backToTop'; backToTop.textContent = '↑';
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(backToTop);
  window.addEventListener('scroll', () => {
    backToTop.style.display = window.scrollY > 300 ? 'block' : 'none';
  });
  updateCount('empTable');
})();
</script>
</body>
</html>
```

---

## 11. 生成检查清单

生成 HTML 后，Agent 自检：

- [ ] `<meta charset="UTF-8">` 存在，中文正常显示
- [ ] 所有 CSS/JS 内联，无外部资源依赖
- [ ] 数据字段与 API 返回一致（无硬编码假数据）
- [ ] 空数据时显示"暂无数据"空状态
- [ ] 数字格式正确（金额、百分比、日期）
- [ ] 文件名符合 `{报告类型}_{维度标识}_{YYYYMMDD}.html` 规范
- [ ] 生成前已执行复用检查（`ls test-flie/ | grep "{类型}_{维度}_{今天}"`）
- [ ] 生成后已执行清理（每类型保留最近 5 份）
- [ ] **交互组件已集成**：搜索框 + 表头排序 + 状态筛选 + 行数统计 + CSV 导出 + 回顶（列表类必含）
- [ ] **字段本地化**：所有枚举值已转中文（页面无 `admin`/`pending`/`active` 等英文残留）；badge 颜色仍按原始枚举映射
- [ ] 已在回复中告知用户完整文件路径
