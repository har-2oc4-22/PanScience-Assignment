import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineClipboardList, HiOutlineUsers, HiOutlineLogout, HiOutlinePlus } from 'react-icons/hi';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-card border-b border-white/10 rounded-none sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
              <HiOutlineClipboardList className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              TaskManager
            </span>
          </Link>

          <div className="flex items-center space-x-2">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                ${isActive('/dashboard')
                  ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            >
              <HiOutlineClipboardList className="w-4 h-4" />
              <span>Tasks</span>
            </Link>

            <Link
              to="/tasks/new"
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                ${isActive('/tasks/new')
                  ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            >
              <HiOutlinePlus className="w-4 h-4" />
              <span>New Task</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin/users"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                  ${isActive('/admin/users')
                    ? 'bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
              >
                <HiOutlineUsers className="w-4 h-4" />
                <span>Users</span>
              </Link>
            )}

            <div className="w-px h-8 bg-white/10 mx-2" />

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                title="Logout"
              >
                <HiOutlineLogout className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
