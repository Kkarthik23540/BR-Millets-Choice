import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'featured';

  useEffect(() => {
    api('/api/products')
      .then((data) => setProducts(data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    const next = new URLSearchParams(searchParams);
    if (val) next.set('q', val);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const handleCategoryChange = (cat) => {
    const next = new URLSearchParams(searchParams);
    if (cat && cat !== 'all') next.set('category', cat);
    else next.delete('category');
    setSearchParams(next);
  };

  const handleSortChange = (e) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', e.target.value);
    setSearchParams(next);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search text
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (category !== 'all') {
      result = result.filter(
        (p) => (p.category || '').toLowerCase() === category.toLowerCase()
      );
    }

    // Sort
    result.sort((a, b) => {
      const getMinPrice = (p) => {
        const prices = (p.variants || []).map((v) => Number(v.pricePaise) || 0);
        return prices.length ? Math.min(...prices) : 0;
      };
      if (sort === 'price-asc') return getMinPrice(a) - getMinPrice(b);
      if (sort === 'price-desc') return getMinPrice(b) - getMinPrice(a);
      if (sort === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [products, query, category, sort]);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  return (
    <>
      <PageHeader
        eyebrow="The Shop"
        title="Millet Powder Products"
        description="Choose a product to see its pack options, stone-ground details, and current stock availability."
      />

      <section className="container section-space">
        <div className="shop-filter-bar mb-4 p-3 bg-white border rounded-4 shadow-sm">
          <div className="row g-3 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-6 col-lg-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">🔍</span>
                <input
                  type="search"
                  className="form-control border-start-0"
                  placeholder="Search millets, blends, powders…"
                  value={query}
                  onChange={handleSearchChange}
                  aria-label="Search products"
                />
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="col-6 col-md-3 col-lg-4 ms-auto">
              <select
                className="form-select form-select-sm"
                value={sort}
                onChange={handleSortChange}
                aria-label="Sort products"
              >
                <option value="featured">Featured packs</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="shop-category-pills mt-3 pt-2 border-top d-flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm rounded-pill text-capitalize ${
                    category === cat ? 'btn-brand' : 'btn-outline-secondary'
                  }`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat === 'all' ? 'All Products' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-forest" role="status" />
            <p className="mt-2 text-secondary">Loading fresh millets…</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-3">
            {filteredProducts.map((p) => (
              <div className="col" key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-white rounded-4 border p-4">
            <span className="fs-1 d-block mb-2">🌾</span>
            <h3 className="h5 fw-bold text-dark">No products found</h3>
            <p className="small text-secondary mb-3">Try adjusting your search terms or filters.</p>
            <button
              type="button"
              className="btn btn-sm btn-outline-brand rounded-pill px-3"
              onClick={() => setSearchParams({})}
            >
              Reset all filters
            </button>
          </div>
        )}
      </section>
    </>
  );
}
