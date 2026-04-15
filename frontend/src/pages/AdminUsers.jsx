import { useState, useEffect } from 'react';
import { getUsers, deleteUser, updateUser } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineTrash, HiOutlinePencil, HiOutlineX, HiOutlineCheck, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineUserGroup } from 'react-icons/hi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ page, limit: 10, search });
      setUsers(res.data.users);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handleEdit = (u) => { setEditingUser(u._id); setEditForm({ name: u.name, email: u.email, role: u.role }); };
  const handleSaveEdit = async () => {
    try { await updateUser(editingUser, editForm); toast.success('User updated'); setEditingUser(null); fetchUsers(); }
    catch (e) { toast.error(e.response?.data?.message || 'Update failed'); }
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try { await deleteUser(id); toast.success('User deleted'); fetchUsers(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><HiOutlineUserGroup className="w-8 h-8 text-purple-400" />User Management</h1>
          <p className="text-gray-400 mt-1">{total} user{total !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input id="search-users" type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" placeholder="Search users..." />
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Joined</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr></thead>
              <tbody>{users.map((u) => (
                <tr key={u._id} className="border-b border-white/5 hover:bg-white/5">
                  {editingUser === u._id ? (<>
                    <td className="px-6 py-3"><input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="input-field py-1.5 text-sm" /></td>
                    <td className="px-6 py-3"><input value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="input-field py-1.5 text-sm" /></td>
                    <td className="px-6 py-3"><select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="select-field py-1.5 text-sm"><option value="user">User</option><option value="admin">Admin</option></select></td>
                    <td></td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={handleSaveEdit} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 mr-1"><HiOutlineCheck className="w-5 h-5" /></button>
                      <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10"><HiOutlineX className="w-5 h-5" /></button>
                    </td>
                  </>) : (<>
                    <td className="px-6 py-4 text-sm font-medium text-white">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{u.email}</td>
                    <td className="px-6 py-4"><span className={`badge ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>{u.role}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(u)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 mr-1"><HiOutlinePencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(u._id, u.name)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><HiOutlineTrash className="w-4 h-4" /></button>
                    </td>
                  </>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-3 py-4 border-t border-white/10">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary py-2 px-3 disabled:opacity-30"><HiOutlineChevronLeft className="w-5 h-5" /></button>
            <span className="text-gray-300 text-sm">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary py-2 px-3 disabled:opacity-30"><HiOutlineChevronRight className="w-5 h-5" /></button>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminUsers;
