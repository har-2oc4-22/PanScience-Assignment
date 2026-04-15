import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTask, updateTask, getTask, getUsers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineDocumentAdd, HiOutlineX } from 'react-icons/hi';

const TaskForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
  });
  const [files, setFiles] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchTask();
    }
    fetchUsers();
  }, [id]);

  const fetchTask = async () => {
    try {
      const res = await getTask(id);
      const task = res.data;
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assignedTo: task.assignedTo?._id || '',
      });
      setExistingDocs(task.documents || []);
    } catch (err) {
      toast.error('Failed to load task');
      navigate('/dashboard');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getUsers({ limit: 100 });
      setUsers(res.data.users || []);
    } catch {
      // Non-admin users won't have access; that's fine
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (formData.title.length > 100) errs.title = 'Title cannot exceed 100 characters';
    if (files.length + existingDocs.length > 3) errs.files = 'Maximum 3 documents allowed';
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        errs.files = 'Only PDF files are allowed';
        break;
      }
      if (file.size > 5 * 1024 * 1024) {
        errs.files = 'File size must not exceed 5MB';
        break;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('status', formData.status);
      data.append('priority', formData.priority);
      if (formData.dueDate) data.append('dueDate', formData.dueDate);
      data.append('assignedTo', formData.assignedTo);
      files.forEach((file) => data.append('documents', file));

      if (isEdit) {
        await updateTask(id, data);
        toast.success('Task updated!');
      } else {
        await createTask(data);
        toast.success('Task created!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const totalCount = files.length + existingDocs.length + selected.length;
    if (totalCount > 3) {
      toast.error('Maximum 3 documents allowed');
      return;
    }
    setFiles([...files, ...selected]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" />

      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold text-white mb-6">
          {isEdit ? 'Edit Task' : 'Create New Task'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input
              id="task-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Enter task title"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              id="task-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[120px] resize-y"
              placeholder="Describe the task..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                id="task-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="select-field"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="select-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
              <input
                id="task-due-date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Assign To</label>
              <select
                id="task-assigned-to"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="select-field"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Documents (PDF, max 3, max 5MB each)
            </label>

            {/* Existing documents */}
            {existingDocs.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs text-gray-500">Existing documents:</p>
                {existingDocs.map((doc) => (
                  <div key={doc._id} className="flex items-center space-x-2 text-sm text-gray-300 bg-white/5 rounded-lg px-3 py-2">
                    <HiOutlineDocumentAdd className="w-4 h-4 text-blue-400" />
                    <span className="flex-1 truncate">{doc.originalName}</span>
                  </div>
                ))}
              </div>
            )}

            {/* New files */}
            {files.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs text-gray-500">New files to upload:</p>
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-sm text-gray-300 bg-white/5 rounded-lg px-3 py-2">
                    <HiOutlineDocumentAdd className="w-4 h-4 text-green-400" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-gray-500 text-xs">{(file.size / 1024).toFixed(0)}KB</span>
                    <button type="button" onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-300">
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length + existingDocs.length < 3 && (
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300">
                <div className="flex flex-col items-center space-y-1">
                  <HiOutlineDocumentAdd className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-400">Click to upload PDF</span>
                </div>
                <input
                  id="task-documents"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
            {errors.files && <p className="text-red-400 text-xs mt-1">{errors.files}</p>}
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              id="task-submit"
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
              ) : isEdit ? (
                'Update Task'
              ) : (
                'Create Task'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
