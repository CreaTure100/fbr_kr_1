import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'user'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await register(form);
      setSuccess('Регистрация успешна! Теперь войдите.');
      setTimeout(() => navigate('/login'), 700);
    } catch (err) {
      setError(err?.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="card">
      <h2>Регистрация</h2>
      <form onSubmit={onSubmit} className="form-grid">
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input name="first_name" type="text" placeholder="Имя" value={form.first_name} onChange={onChange} required />
        <input name="last_name" type="text" placeholder="Фамилия" value={form.last_name} onChange={onChange} required />
        <input name="password" type="password" placeholder="Пароль" value={form.password} onChange={onChange} required />

        <select name="role" value={form.role} onChange={onChange}>
          <option value="user">Пользователь</option>
          <option value="seller">Продавец</option>
          <option value="admin">Администратор</option>
        </select>

        <button type="submit">Зарегистрироваться</button>
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
    </div>
  );
}