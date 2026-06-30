import { useCallback, useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { Select } from '../../components/ui/Field';
import TaskItem from '../../components/tasks/TaskItem';
import TaskModal from '../../components/tasks/TaskModal';
import api, { errMsg } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TASK_PRIORITIES } from '../../constants/statuses';

export default function Tasks() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [priorityF, setPriorityF] = useState('');
  const [agentF, setAgentF] = useState('');
  const [modal, setModal] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1 };
      if (search) params.search = search;
      if (statusF) params.status = statusF;
      if (priorityF) params.priority = priorityF;
      if (agentF) params.agent = agentF;
      const { data } = await api.get('/tasks', { params });
      setTasks(data.data.items);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load tasks'));
    } finally {
      setLoading(false);
    }
  }, [search, statusF, priorityF, agentF, toast]);

  useEffect(() => {
    const t = setTimeout(fetchTasks, 300);
    return () => clearTimeout(t);
  }, [fetchTasks]);

  useEffect(() => {
    if (isAdmin) api.get('/agents').then((r) => setAgents(r.data.data.items)).catch(() => {});
  }, [isAdmin]);

  async function toggle(task) {
    const completed = task.status !== 'Completed';
    setTasks((ts) => ts.map((t) => (t._id === task._id ? { ...t, status: completed ? 'Completed' : 'Pending' } : t)));
    try {
      await api.patch(`/tasks/${task._id}/complete`, { completed });
    } catch (err) {
      toast.error(errMsg(err, 'Could not update'));
      fetchTasks();
    }
  }

  return (
    <PageWrapper title="Tasks">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…" className="flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 ring-accent outline-none" />
        <Select value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          <option value="" className="bg-card">All statuses</option>
          <option value="Pending" className="bg-card">Pending</option>
          <option value="Completed" className="bg-card">Completed</option>
        </Select>
        <Select value={priorityF} onChange={(e) => setPriorityF(e.target.value)}>
          <option value="" className="bg-card">All priorities</option>
          {TASK_PRIORITIES.map((p) => <option key={p} value={p} className="bg-card">{p}</option>)}
        </Select>
        {isAdmin && (
          <Select value={agentF} onChange={(e) => setAgentF(e.target.value)}>
            <option value="" className="bg-card">All agents</option>
            {agents.map((a) => <option key={a.id} value={a.id} className="bg-card">{a.name}</option>)}
          </Select>
        )}
        <Button className="ml-auto" onClick={() => setModal({})}>+ Add Task</Button>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={1} />
      ) : tasks.length === 0 ? (
        <EmptyState icon="✓" title="No tasks found" subtext="Create a task to stay on top of follow-ups." action="+ Add Task" onAction={() => setModal({})} />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <TaskItem key={t._id} task={t} onToggle={toggle} onOpen={(task) => setModal({ taskId: task._id })} />
          ))}
        </div>
      )}

      {modal && <TaskModal taskId={modal.taskId} agents={agents} onClose={() => setModal(null)} onSaved={fetchTasks} />}
    </PageWrapper>
  );
}
