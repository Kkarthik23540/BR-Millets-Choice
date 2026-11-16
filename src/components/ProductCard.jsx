import React from 'react';
import { Link } from 'react-router-dom';
import { money } from '../services/api';

export default function ProductCard({ product }) {
  const variants = product.variants ?? [];
  const firstVariant = variants[0];
  const image = product.images?.[0] || (product.imageUrl ? { url: product.imageUrl, altText: product.name } : null);
  const availability = firstVariant?.availability ?? (firstVariant?.stockQuantity > 0 ? 'in_stock' : 'out_of_stock');
  const label = availability === 'in_stock'
    ? 'In stock'
    : availability === 'low_stock'
    ? 'Low stock'
    : availability === 'out_of_stock'
    ? 'Out of stock'
    : 'Temporarily unavailable';
  const prices = variants.map((v) => Number(v.pricePaise));
  const price = prices.length
    ? prices.length === 1
      ? money(prices[0])
      : `${money(Math.min(...prices))} – ${money(Math.max(...prices))}`
    : 'Price to be announced';
  const packSizes = variants.map((v) => v.packSize).join(' / ') || 'Pack options to be announced';

  return (
    <article className="product-card">
      <Link className="text-decoration-none" to={`/product/${encodeURIComponent(product.slug)}`} aria-label={`View ${product.name}`}>
        <div className="product-image">
          {image ? (
            <img loading="lazy" src={image.url} alt={image.altText || product.name} />
          ) : (
            <span className="product-placeholder">Product details coming soon</span>
          )}
        </div>
      </Link>
      <div className="product-body">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <h3 className="mb-1">
            <Link className="text-decoration-none" to={`/product/${encodeURIComponent(product.slug)}`}>
              {product.name}
            </Link>
          </h3>
          {firstVariant && <span className={`availability ${availability}`}>{label}</span>}
        </div>
        <p className="product-meta mb-2">
          {product.category || 'Millet powder'} · {packSizes}
        </p>
        <div className="d-flex justify-content-between align-items-center">
          <strong>{price}</strong>
          <Link className="link-underline link-underline-opacity-0 fw-semibold" to={`/product/${encodeURIComponent(product.slug)}`}>
            View details <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
