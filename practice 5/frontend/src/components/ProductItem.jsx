import React from "react";

export default function ProductItem({ product, onEdit, onDelete }) {
  return (
    <div className="productRow">
      <div className="productMain">
        <div className="productTitle">{product.title}</div>
        <div className="productMeta">
          <span className="badge">{product.category}</span>
          <span>Цена: {product.price} ₽</span>
          <span>Остаток: {product.stock}</span>
        </div>
        <div className="productDesc">{product.description}</div>
      </div>

      <div className="productActions">
        <button className="btn" onClick={() => onEdit(product)}>
          Редактировать
        </button>
        <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}