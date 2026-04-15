import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTask, downloadDocument, deleteDocument, deleteTask } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  HiOutlinePencil, HiOutlineTrash, HiOutlineDownload, HiOutlineArrowLeft,
  HiOutlineDocumentText, HiOutlineCalendar, HiOutlineUser, HiOutlineFlag
} from 'react-icons/hi';

const statusConfig = {
  pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Pending' },
  'in-progress': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'In Progress' },
  completed: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Completed' },
};

const priorityConfig = {
  low: { color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', label: 'Low' },
  medium: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Medium' },
  high: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'High' },
};

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const res = await getTask(id);
      setTask(res.data);
    } catch (err) {
      toast.error('Task not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (docId, originalName) => {
    try {
      const res = await downloadDocument(id, docId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await deleteDocument(id, docId);
      toast.success('Document deleted');
      fetchTask();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      toast.success('Task deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!task) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" />

      <Link to="/dashboard" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <HiOutlineArrowLeft className="w-5 h-5" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="glass-card p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">{task.title}</h1>
            <div className="flex flex-wrap gap-2">
              <span className={`badge border ${statusConfig[task.status]?.color}`}>
                {statusConfig[task.status]?.label}
              </span>
              <span className={`badge border ${priorityConfig[task.priority]?.color}`}>
                <HiOutlineFlag className="w-3 h-3 mr-1" />
                {priorityConfig[task.priority]?.label}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link to={`/tasks/${id}/edit`} className="btn-secondary text-sm flex items-center space-x-1">
              <HiOutlinePencil className="w-4 h-4" />
              <span>Edit</span>
            </Link>
            <button onClick={handleDeleteTask} className="btn-danger text-sm flex items-center space-x-1">
              <HiOutlineTrash className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Description</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Meta Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-gray-400 mb-1">
              <HiOutlineCalendar className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Due Date</span>
            </div>
            <p className="text-white font-medium">{formatDate(task.dueDate)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-gray-400 mb-1">
              <HiOutlineUser className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Assigned To</span>
            </div>
            <p className="text-white font-medium">{task.assignedTo?.name || 'Unassigned'}</p>
            {task.assignedTo?.email && (
              <p className="text-gray-500 text-xs">{task.assignedTo.email}</p>
            )}
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-gray-400 mb-1">
              <HiOutlineUser className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Created By</span>
            </div>
            <p className="text-white font-medium">{task.createdBy?.name || 'Unknown'}</p>
            <p className="text-gray-500 text-xs">{formatDate(task.createdAt)}</p>
          </div>
        </div>

        {/* Documents */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Attached Documents ({task.documents?.length || 0}/3)
          </h2>
          {task.documents?.length > 0 ? (
            <div className="space-y-2">
              {task.documents.map((doc) => (
                <div
                  key={doc._id}
                  className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                      <HiOutlineDocumentText className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{doc.originalName}</p>
                      <p className="text-gray-500 text-xs">
                        {doc.size ? `${(doc.size / 1024).toFixed(0)} KB` : ''} · {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <button
                      onClick={() => handleDownload(doc._id, doc.originalName)}
                      className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all"
                      title="Download"
                    >
                      <HiOutlineDownload className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(doc._id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No documents attached</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
