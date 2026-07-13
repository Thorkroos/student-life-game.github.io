export function getAdminTaskProgress(state, data) {
  const flags = new Set(state.flags || []);
  const tasks = (data.adminTasks || []).map(task => ({
    ...task,
    completed: flags.has(task.flag)
  }));
  const completedCount = tasks.filter(task => task.completed).length;
  return {
    tasks,
    completedCount,
    totalCount: tasks.length
  };
}
