import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTasks, deleteTask } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
  HiOutlineSearch, HiOutlinePlus, HiOutlineFilter, HiOutlineTrash, HiOutlinePencil,
  HiOutlineEye, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineDocumentText
} from 'react-icons/hi';

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'in-progress': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};

const priorityColors = {
  low: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  medium: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  high: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ status: '', priority: '', sort: '-createdAt', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const { isAdmin } = useAuth();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.sort) params.sort = filters.sort;
      if (filters.search) params.search = filters.search;

      const res = await getTasks(params);
      setTasks(res.data.tasks);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date() && dateStr;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Tasks</h1>
          <p className="text-gray-400 mt-1">{total} task{total !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/tasks/new" className="btn-primary flex items-center space-x-2">
          <HiOutlinePlus className="w-5 h-5" />
          <span>New Task</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="search-tasks"
              type="text"
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              className="input-field pl-10"
              placeholder="Search tasks..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center space-x-2 ${showFilters ? 'bg-white/20' : ''}`}
          >
            <HiOutlineFilter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
              <select
                id="filter-status"
                value={filters.status}
                onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
                className="select-field"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Priority</label>
              <select
                id="filter-priority"
                value={filters.priority}
                onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}
                className="select-field"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Sort By</label>
              <select
                id="filter-sort"
                value={filters.sort}
                onChange={(e) => { setFilters({ ...filters, sort: e.target.value }); setPage(1); }}
                className="select-field"
              >
                <option value="-createdAt">Newest First</option>
                <option value="createdAt">Oldest First</option>
                <option value="dueDate">Due Date (Asc)</option>
                <option value="-dueDate">Due Date (Desc)</option>
                <option value="priority">Priority (Low → High)</option>
                <option value="-priority">Priority (High → Low)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Task Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <HiOutlineDocumentText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300">No tasks found</h3>
          <p className="text-gray-500 mt-2">Create your first task to get started</p>
          <Link to="/tasks/new" className="btn-primary inline-flex items-center space-x-2 mt-6">
            <HiOutlinePlus className="w-5 h-5" />
            <span>Create Task</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div key={task._id} className="glass-card p-5 hover:bg-white/10 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1 flex-1 mr-2">
                    {task.title}
                  </h3>
                  {task.documents?.length > 0 && (
                    <span className="text-xs text-gray-400 flex items-center space-x-1 shrink-0">
                      <HiOutlineDocumentText className="w-4 h-4" />
                      <span>{task.documents.length}</span>
                    </span>
                  )}
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{task.description || 'No description'}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`badge ${statusColors[task.status]}`}>{task.status}</span>
                  <span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className={`text-gray-400 ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-400' : ''}`}>
                      Due: {formatDate(task.dueDate)}
                    </span>
                  </div>
                  {task.assignedTo && (
                    <span className="text-gray-500 text-xs">→ {task.assignedTo.name}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
                  <Link to={`/tasks/${task._id}`} className="flex-1 btn-secondary text-center text-sm py-2 flex items-center justify-center space-x-1">
                    <HiOutlineEye className="w-4 h-4" />
                    <span>View</span>
                  </Link>
                  <Link to={`/tasks/${task._id}/edit`} className="flex-1 btn-secondary text-center text-sm py-2 flex items-center justify-center space-x-1">
                    <HiOutlinePencil className="w-4 h-4" />
                    <span>Edit</span>
                  </Link>
                  <button onClick={() => handleDelete(task._id)} className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-3 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary py-2 px-3 disabled:opacity-30"
              >
                <HiOutlineChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-300 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-secondary py-2 px-3 disabled:opacity-30"
              >
                <HiOutlineChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
