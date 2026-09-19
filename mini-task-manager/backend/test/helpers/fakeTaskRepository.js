let nextId = 1;

class FakeTaskRepository {
  constructor(data = []) {
    this.tasks = data.map((t) => ({ id: nextId++, ...t }));
    this.date = new Date();
  }

  findAll() {
    return [...this.tasks].sort((a, b) => b.created_at - a.created_at);
  }

  findById(id) {
    const found = this.tasks.find((t) => t.id === Number(id));
    return found ? { ...found } : null;
  }

  create({ title, status }) {
    const task = {
      id: nextId++,
      title,
      status,
      created_at: this.date,
      updated_at: this.date
    };
    this.tasks.push(task);
    return { ...task };
  }

  updateStatus(id, status) {
    const task = this.tasks.find((t) => t.id === Number(id));
    if (!task) return null;
    task.status = status;
    task.updated_at = new Date();
    return { ...task };
  }

  delete(id) {
    const idx = this.tasks.findIndex((t) => t.id === Number(id));
    if (idx === -1) return false;
    this.tasks.splice(idx, 1);
    return true;
  }

  getSummary() {
    return {
      total: this.tasks.length,
      pending: this.tasks.filter((t) => t.status === 'pending').length,
      done: this.tasks.filter((t) => t.status === 'done').length,
      este_mes: this.tasks.length
    };
  }

  countByStatus() {
    const counts = {};
    this.tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, total]) => ({ status, total }));
  }

  countByMonth() {
    const counts = {};
    this.tasks.forEach((t) => {
      const mes = t.created_at.toISOString().slice(0, 7);
      counts[mes] = (counts[mes] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([mes, total]) => ({ mes, total }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }

  findRecent(limit = 5) {
    return [...this.tasks]
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, limit)
      .map(({ id, title, status, created_at }) => ({ id, title, status, created_at }));
  }
}

module.exports = { FakeTaskRepository };