import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api/products';
import { useAuth } from '../context/AuthContext';

export default function ProductsPage() {
  const { hasRole } = useAuth();
  const canCreateOrEdit = hasRole(['seller', 'admin']);
  const canDelete = hasRole(['admin']);

  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [createForm, setCreateForm] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    image: ''
  });

  const normalizeImage = (img) => {
    if (!img) return '/images/placeholder.webp';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    if (img.startsWith('/')) return `http://localhost:5173${img}`;
    return `http://localhost:5173/${img}`;
  };

  const loadProducts = async () => {
    try {
      const res = await productsApi.getAll();
      setProducts(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Не удалось загрузить товары');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onCreateChange = (e) => setCreateForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await productsApi.create({ ...createForm, price: Number(createForm.price) });
      setMessage('Товар создан');
      setCreateForm({ title: '', category: '', description: '', price: '', image: '' });
      loadProducts();
    } catch (err) {
      setError(err?.response?.data?.error || 'Ошибка создания');
    }
  };

  const onDelete = async (id) => {
    try {
      await productsApi.deleteById(id);
      setMessage('Товар удален');
      loadProducts();
    } catch (err) {
      setError(err?.response?.data?.error || 'Ошибка удаления');
    }
  };

  return (
    <div className="grid-2">
      {canCreateOrEdit && (
        <section className="card">
          <h2>Создать товар</h2>
          <form onSubmit={onCreate} className="form-grid">
            <input name="title" placeholder="Название" value={createForm.title} onChange={onCreateChange} required />
            <input name="category" placeholder="Категория" value={createForm.category} onChange={onCreateChange} required />
            <textarea name="description" placeholder="Описание" value={createForm.description} onChange={onCreateChange} required />
            <input name="price" type="number" step="0.01" min="0" placeholder="Цена" value={createForm.price} onChange={onCreateChange} required />
            <input name="image" type="text" placeholder="URL или /images/..." value={createForm.image} onChange={onCreateChange} />
            <button type="submit">Создать</button>
          </form>
        </section>
      )}

      <section className="card">
        <h2>Список товаров</h2>
        <button onClick={loadProducts} className="secondary-btn">Обновить</button>

        <ul className="product-list">
          {products.map((p) => (
            <li key={p.id} className="product-item">
              <div className="product-main">
                <img
                  src={normalizeImage(p.image)}
                  alt={p.title}
                  className="product-thumb"
                  onError={(e) => { e.currentTarget.src = '/images/placeholder.webp'; }}
                />
                <div>
                  <strong>{p.title}</strong>
                  <p>{p.category}</p>
                  <p>{p.price} ₽</p>
                </div>
              </div>

              <div className="item-actions">
                <Link to={`/products/${p.id}`}>Открыть</Link>
                {canDelete && (
                  <button className="danger-btn" onClick={() => onDelete(p.id)}>Удалить</button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
      </section>
    </div>
  );
}