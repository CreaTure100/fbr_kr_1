import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/products" className="brand">
          Products App
        </Link>
      </div>

      <nav className="navbar-right">
        {!isAuthenticated ? (
          <>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
          </>
        ) : (
          <>
            <span className="user-pill">
              {user ? `${user.first_name} ${user.last_name}` : 'Пользователь'}
            </span>
            <button className="danger-btn" onClick={onLogout}>
              Выйти
            </button>
          </>
        )}
      </nav>
    </header>
  );
}