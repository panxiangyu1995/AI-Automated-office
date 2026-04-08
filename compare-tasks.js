const fs = require('fs');

const original = JSON.parse(fs.readFileSync('.\\task.json', 'utf8'));
const newPlan = JSON.parse(fs.readFileSync('.plan\\2026-04-08\\task.json', 'utf8'));

// 提取原始task.json的所有任务标题
const originalTitles = original.tasks.map(t => t.title);
console.log('原始 task.json 任务数:', original.tasks.length);
console.log('新 plan task.json 任务数:', newPlan.tasks.length);

// 提取新plan中与原始重复的任务
const duplicates = [];
const keepTasks = [];

newPlan.tasks.forEach(newTask => {
  // 精确匹配标题
  const exactMatch = original.tasks.find(t => t.title === newTask.title);
  if (exactMatch) {
    duplicates.push({
      newTask: newTask,
      match: exactMatch,
      reason: 'exact_title'
    });
  } else {
    keepTasks.push(newTask);
  }
});

console.log('\n重复任务数:', duplicates.length);
console.log('\n重复任务详情:');
duplicates.forEach(d => {
  console.log(`- New Task #${d.newTask.id}: "${d.newTask.title}" 匹配 Original Task #${d.match.id}`);
});

console.log('\n需要保留的新任务数:', keepTasks.length);

// 更新新plan的tasks
newPlan.tasks = keepTasks;
newPlan.total_tasks = keepTasks.length;

fs.writeFileSync('.plan\\2026-04-08\\task.json', JSON.stringify(newPlan, null, 2), 'utf8');
console.log('\n已更新 task.json，移除重复任务');
