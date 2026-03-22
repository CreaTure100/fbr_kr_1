import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productsApi } from '../api/products';
import { useAuth } from '../context/AuthContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const canEdit = hasRole(['seller', 'admin']);

  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({ title: '', category: '', description: '', price: '', image: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const normalizeImage = (img) => {
    if (!img) return '/images/placeholder.webp';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    if (img.startsWith('/')) return `http://localhost:5173${img}`;
    return `http://localhost:5173/${img}`;
  };

  const loadProduct = async () => {
    try {
      const res = await productsApi.getById(id);
      setProduct(res.data);
      setForm({
        title: res.data.title,
        category: res.data.category,
        description: res.data.description,
        price: String(res.data.price),
        image: res.data.image || ''
      });
    } catch (err) {
      setError(err?.response?.data?.error || 'Не удалось загрузить товар');
    }
  };

  useEffect(() => { loadProduct(); }, [id]);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await productsApi.updateById(id, { ...form, price: Number(form.price) });
      setProduct(res.data);
      setMessage('Товар обновлён');
    } catch (err) {
      setError(err?.response?.data?.error || 'Ошибка обновления');
    }
  };

  if (!product && !error) return <p>Загрузка...</p>;

  return (
    <div className="card">
      <h2>Товар по ID</h2>
      <p><b>ID:</b> {id}</p>
      <p><Link to="/products">← Назад</Link></p>

      {product && (
        <>
          <img
            src={normalizeImage(form.image)}
            alt={form.title}
            className="product-cover"
            onError={(e) => { e.currentTarget.src = '/images/placeholder.webp'; }}
          />

          {canEdit ? (
            <form onSubmit={onUpdate} className="form-grid">
              <input name="title" value={form.title} onChange={onChange} required />
              <input name="category" value={form.category} onChange={onChange} required />
              <textarea name="description" value={form.description} onChange={onChange} required />
              <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={onChange} required />
              <input name="image" type="text" value={form.image} onChange={onChange} />
              <button type="submit">Сохранить изменения</button>
            </form>
          ) : (
            <div className="form-grid">
              <p><b>{product.title}</b></p>
              <p>{product.category}</p>
              <p>{product.description}</p>
              <p>{product.price} ₽</p>
            </div>
          )}
        </>
      )}

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
    </div>
  );
}