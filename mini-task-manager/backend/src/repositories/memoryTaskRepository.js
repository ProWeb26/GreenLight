let nextId = 1;

const STATUS = ['pending', 'done'];

class InMemoryTaskRepository {
  constructor() {
    this.tasks = [];
  }

  _now() {
    return new Date();
  }

  findAll() {
    return [...this.tasks]
      .map((t) => ({ ...t }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
      created_at: this._now(),
      updated_at: this._now()
    };
    this.tasks.push(task);
    return { ...task };
  }

  updateStatus(id, status) {
    const task = this.tasks.find((t) => t.id === Number(id));
    if (!task) return null;
    task.status = status;
    task.updated_at = this._now();
    return { ...task };
  }

  delete(id) {
    const idx = this.tasks.findIndex((t) => t.id === Number(id));
    if (idx === -1) return false;
    this.tasks.splice(idx, 1);
    return true;
  }

  getSummary() {
    const month = new Date().toISOString().slice(0, 7);
    const inMonth = (t) => new Date(t.created_at).toISOString().slice(0, 7) === month;
    return {
      total: this.tasks.length,
      pending: this.tasks.filter((t) => t.status === 'pending').length,
      done: this.tasks.filter((t) => t.status === 'done').length,
      este_mes: this.tasks.filter(inMonth).length
    };
  }

  countByStatus() {
    const counts = {};
    this.tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, total]) => ({ status, total }));
  }

  countByMonth(limit = 6) {
    const counts = {};
    this.tasks.forEach((t) => {
      const mes = new Date(t.created_at).toISOString().slice(0, 7);
      counts[mes] = (counts[mes] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([mes, total]) => ({ mes, total }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-limit);
  }

  findRecent(limit = 5) {
    return this.findAll()
      .slice(0, limit)
      .map(({ id, title, status, created_at }) => ({ id, title, status, created_at }));
  }
}

module.exports = { InMemoryTaskRepository, STATUS };