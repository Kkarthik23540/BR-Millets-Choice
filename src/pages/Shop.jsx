import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { api, money } from '../services/api';
import { useCart } from '../context/CartContext';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState({});
  const [categoryFilter, setCategoryFilter] = useState('All');
  const { addToCart } = useCart();

  useEffect(() => {
    api('/api/products')
      .then((data) => {
        const prods = data.products || [];
        setProducts(prods);
        const defaultPacks = {};
        prods.forEach((p) => {
          if (p.variants?.length) defaultPacks[p.id] = p.variants[0].id;
        });
        setSelectedPack(defaultPacks);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];
  const filteredProducts = categoryFilter === 'All'
    ? products
    : products.filter((p) => p.category === categoryFilter);

  return (
    <>
      <PageHeader
        eyebrow="Stone-ground catalogue"
        title="Millet products &amp; available packs"
        description="Select a pack size and submit an order request. Availability and dispatch are confirmed directly with you."
      />

      <section className="container section-space py-4">
        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div className="d-flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm rounded-pill px-3 ${categoryFilter === cat ? 'btn-brand' : 'btn-outline-brand'}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-forest" role="status" />
            <p className="mt-2 text-secondary">Loading millet packs…</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const activeVariantId = selectedPack[product.id] || product.variants?.[0]?.id;
              const activeVariant = product.variants?.find((v) => v.id === activeVariantId) || product.variants?.[0];
              const isOutOfStock = !activeVariant || Number(activeVariant.stockQuantity) <= 0;

              return (
                <article className="product-card" key={product.id}>
                  <div className="product-card-visual">
                    <Link to={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="product-card-img" />
                      ) : (
                        <div className="product-placeholder-icon">🌾</div>
                      )}
                    </Link>
                    <span className="status-pill status-in_stock">100% Cash on Delivery</span>
                  </div>
                  <div className="product-card-body">
                    <p className="product-category mb-1">{product.category || 'Millet Blend'}</p>
                    <h2 className="product-title h5 mb-2">
                      <Link to={`/product/${product.slug}`}>{product.name}</Link>
                    </h2>
                    <p className="product-description small mb-3">{product.description}</p>

                    {product.variants?.length > 1 && (
                      <div className="d-flex gap-2 mb-3">
                        {product.variants.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            className={`btn btn-sm ${v.id === activeVariantId ? 'btn-brand' : 'btn-outline-brand'}`}
                            onClick={() => setSelectedPack({ ...selectedPack, [product.id]: v.id })}
                          >
                            {v.packSize}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                      <div>
                        <span className="price-label small text-secondary d-block">Price</span>
                        <strong className="product-price text-forest fs-5">
                          {activeVariant ? money(activeVariant.pricePaise) : '—'}
                        </strong>
                      </div>
                      <button
                        type="button"
                        className="btn btn-brand btn-sm"
                        disabled={isOutOfStock}
                        onClick={() => activeVariant && addToCart(activeVariant.id)}
                      >
                        {isOutOfStock ? 'Out of Stock' : '+ Add to Cart'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-secondary">No products available in this category.</p>
          </div>
        )}
      </section>
    </>
  );
}
