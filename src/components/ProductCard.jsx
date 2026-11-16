import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { money } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const variants = product.variants || [];
  const firstAvailable = variants.find((v) => v.stockQuantity > 0) || variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(firstAvailable?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || firstAvailable;
  const isOutOfStock = !selectedVariant || selectedVariant.stockQuantity < 1;
  const isLowStock = selectedVariant && selectedVariant.stockQuantity > 0 && selectedVariant.stockQuantity <= (selectedVariant.lowStockThreshold || 5);

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock || isAdding) return;
    setIsAdding(true);
    await addToCart(selectedVariant.id, quantity);
    setIsAdding(false);
  };

  return (
    <article className="product-card h-100 d-flex flex-column bg-white rounded-4 border overflow-hidden shadow-xs hover-shadow transition">
      <div className="product-media position-relative bg-light text-center p-3">
        {isOutOfStock ? (
          <span className="badge bg-danger position-absolute top-2 start-2 rounded-pill px-2 py-1 small">
            Out of stock
          </span>
        ) : isLowStock ? (
          <span className="badge bg-warning text-dark position-absolute top-2 start-2 rounded-pill px-2 py-1 small">
            Low stock ({selectedVariant.stockQuantity} left)
          </span>
        ) : (
          <span className="badge bg-success position-absolute top-2 start-2 rounded-pill px-2 py-1 small">
            ✓ In stock
          </span>
        )}

        <Link to={`/product/${product.slug}`} className="d-block text-decoration-none">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="img-fluid rounded-3 object-fit-cover"
              style={{ maxHeight: '180px', width: '100%' }}
              loading="lazy"
            />
          ) : (
            <div
              className="d-flex align-items-center justify-content-center text-forest fs-1 rounded-3 bg-white border"
              style={{ height: '180px', width: '100%' }}
            >
              🌾
            </div>
          )}
        </Link>
      </div>

      <div className="product-body p-3 d-flex flex-column flex-grow-1">
        <h3 className="h6 fw-bold mb-1">
          <Link to={`/product/${product.slug}`} className="text-forest text-decoration-none hover-underline">
            {product.name}
          </Link>
        </h3>

        {product.description && (
          <p className="small text-secondary mb-2 line-clamp-2" style={{ minHeight: '2.4em' }}>
            {product.description}
          </p>
        )}

        {/* Variant selector */}
        {variants.length > 1 ? (
          <div className="mb-2">
            <select
              className="form-select form-select-sm"
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              aria-label="Select pack size"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.packSize} — {money(v.pricePaise)} {v.stockQuantity < 1 ? '(Out of stock)' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : selectedVariant ? (
          <div className="mb-2 small text-secondary">
            Pack size: <strong className="text-dark">{selectedVariant.packSize}</strong>
          </div>
        ) : null}

        <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top">
          <div className="price-tag">
            <strong className="fs-5 text-forest">
              {selectedVariant ? money(selectedVariant.pricePaise) : '—'}
            </strong>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-brand rounded-pill px-3 py-1.5 fw-semibold"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
          >
            {isAdding ? 'Adding…' : isOutOfStock ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
