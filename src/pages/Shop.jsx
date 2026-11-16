import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ProductCard from '../components/ProductCard';
import { api } from '../services/api';

export default function Shop() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('category') || 'all');
  const [activeSort, setActiveSort] = useState(searchParams.get('sort') || 'featured');

  useEffect(() => {
    api('/api/products')
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getMinPrice = (p) => {
    const prices = (p.variants || []).map((v) => Number(v.pricePaise)).filter((n) => !isNaN(n) && n > 0);
    return prices.length ? Math.min(...prices) : 0;
  };

  const getMaxPrice = (p) => {
    const prices = (p.variants || []).map((v) => Number(v.pricePaise)).filter((n) => !isNaN(n) && n > 0);
    return prices.length ? Math.max(...prices) : 0;
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const ing = (p.ingredients || '').toLowerCase();
        const packSizes = (p.variants || []).map((v) => (v.packSize || '').toLowerCase()).join(' ');
        return name.includes(q) || desc.includes(q) || cat.includes(q) || ing.includes(q) || packSizes.includes(q);
      });
    }

    if (activeFilter !== 'all') {
      const q = activeFilter.toLowerCase();
      result = result.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const ing = (p.ingredients || '').toLowerCase();
        const packSizes = (p.variants || []).map((v) => (v.packSize || '').toLowerCase()).join(' ');
        return name.includes(q) || desc.includes(q) || cat.includes(q) || ing.includes(q) || packSizes.includes(q);
      });
    }

    if (activeSort === 'price-asc') {
      result.sort((a, b) => getMinPrice(a) - getMinPrice(b));
    } else if (activeSort === 'price-desc') {
      result.sort((a, b) => getMaxPrice(b) - getMaxPrice(a));
    } else if (activeSort === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
    } else if (activeSort === 'name-desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' }));
    } else if (activeSort === 'in-stock') {
      const stockScore = (p) => ((p.variants || []).some((v) => v.stockQuantity > 0) ? 1 : 0);
      result.sort((a, b) => stockScore(b) - stockScore(a));
    } else if (activeSort === 'featured') {
      result.sort((a, b) => {
        const isAFlagship = (a.name || '').toLowerCase().includes('choice') || (a.category || '').toLowerCase().includes('blend');
        const isBFlagship = (b.name || '').toLowerCase().includes('choice') || (b.category || '').toLowerCase().includes('blend');
        if (isAFlagship && !isBFlagship) return -1;
        if (!isAFlagship && isBFlagship) return 1;
        return 0;
      });
    }

    return result;
  }, [products, search, activeFilter, activeSort]);

  return (
    <>
      <PageHeader
        eyebrow="The Shop"
        title="Millet Powder Products"
        description="Choose a product to see its pack options, stone-ground details and current stock availability."
      />

      <section className="container section-space">
        <div className="shop-filter-bar mb-3 p-2 p-md-3 bg-white border rounded-4 shadow-sm">
          <form className="d-flex gap-2 mb-3" onSubmit={(e) => e.preventDefault()}>
            <input
              className="form-control form-control-sm"
              name="q"
              placeholder="Search millets, nuts, seeds, 500g, 1kg..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-sm btn-brand text-nowrap" type="submit">
              Search
            </button>
            {search && (
              <button
                className="btn btn-sm btn-outline-secondary text-nowrap"
                type="button"
                onClick={() => setSearch('')}
              >
                Clear
              </button>
            )}
          </form>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="shop-category-pills">
              <button
                type="button"
                className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All Items
              </button>
              <button
                type="button"
                className={`filter-pill ${activeFilter === 'blend' ? 'active' : ''}`}
                onClick={() => setActiveFilter('blend')}
              >
                Special Blend
              </button>
              <button
                type="button"
                className={`filter-pill ${activeFilter === '500' ? 'active' : ''}`}
                onClick={() => setActiveFilter('500')}
              >
                500 g Pack
              </button>
              <button
                type="button"
                className={`filter-pill ${activeFilter === '1 kg' ? 'active' : ''}`}
                onClick={() => setActiveFilter('1 kg')}
              >
                1 kg Pack
              </button>
              <button
                type="button"
                className={`filter-pill ${activeFilter === 'millet' ? 'active' : ''}`}
                onClick={() => setActiveFilter('millet')}
              >
                Millets
              </button>
              <button
                type="button"
                className={`filter-pill ${activeFilter === 'nuts' ? 'active' : ''}`}
                onClick={() => setActiveFilter('nuts')}
              >
                Nuts &amp; Seeds
              </button>
            </div>

            <div className="shop-sort-compact d-flex align-items-center gap-1 ms-auto">
              <label className="small text-secondary text-nowrap fw-semibold" htmlFor="shop-sort">
                Sort:
              </label>
              <select
                className="form-select form-select-sm fw-semibold"
                id="shop-sort"
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value)}
                style={{ width: 'auto', cursor: 'pointer' }}
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="in-stock">In Stock First</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-forest" role="status" />
            <p className="mt-2 text-secondary">Loading products…</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="row g-2 g-md-3">
            {filteredProducts.map((product) => (
              <div key={product.id} className="col-12 col-sm-6 col-lg-4">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-products-slider my-4">
            <div className="sliding-empty-card">
              <div className="sliding-empty-icon">🌾</div>
              <div className="sliding-empty-content">
                <h3 className="h5 mb-1 text-forest fw-bold">Fresh Harvest Batches Arriving Soon!</h3>
                <p className="mb-2 text-secondary">
                  Our stone mills in Hyderabad are freshly preparing new unpolished millet powder batches. Check back soon or contact us directly.
                </p>
                <div className="d-flex gap-2 flex-wrap mt-3">
                  <Link to="/contact" className="btn btn-sm btn-brand">Ask about restock</Link>
                  <a href="https://whatsapp.com/channel/0029Vb909Ye7oQhkdutTQM24" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-brand">
                    Follow WhatsApp Updates
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
