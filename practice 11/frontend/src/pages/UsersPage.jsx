import { useEffect, useState } from 'react';
import { usersApi } from '../api/users';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Ошибка загрузки пользователей');
    }
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (id, role) => {
    setError('');
    try {
      await usersApi.updateById(id, { role });
      setMsg('Роль обновлена');
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Ошибка обновления роли');
    }
  };

  const blockUser = async (id) => {
    setError('');
    try {
      await usersApi.blockById(id);
      setMsg('Пользователь заблокирован');
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Ошибка блокировки');
    }
  };

  return (
    <div className="card">
      <h2>Пользователи (Admin)</h2>
      {users.map((u) => (
        <div key={u.id} className="product-item">
          <div>
            <strong>{u.first_name} {u.last_name}</strong>
            <p>{u.email}</p>
            <p>role: {u.role}</p>
            <p>blocked: {String(u.isBlocked)}</p>
          </div>
          <div className="item-actions">
            <select defaultValue={u.role} onChange={(e) => updateRole(u.id, e.target.value)}>
              <option value="user">user</option>
              <option value="seller">seller</option>
              <option value="admin">admin</option>
            </select>
            <button className="danger-btn" onClick={() => blockUser(u.id)}>Блок</button>
          </div>
        </div>
      ))}
      {error && <p className="error">{error}</p>}
      {msg && <p className="success">{msg}</p>}
    </div>
  );
}