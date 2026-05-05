import React, { useState, useEffect, useMemo } from 'react';
import { hospitalsAPI } from '../services/api';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search,   setSearch]     = useState('');
  const [city,     setCity]       = useState('All Cities');
  const [category, setCategory]   = useState('All Categories');
  const [cashless, setCashless]   = useState(false);

  useEffect(() => {
    hospitalsAPI.getAll().then(({ data }) => {
      setHospitals(data.hospitals || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const cities     = useMemo(() => ['All Cities',     ...new Set(hospitals.map(h => h.city))],     [hospitals]);
  const categories = useMemo(() => ['All Categories', ...new Set(hospitals.map(h => h.category))], [hospitals]);

  const filtered = useMemo(() => hospitals.filter((h) => {
    const q = search.toLowerCase();
    return (!q || h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q))
      && (city     === 'All Cities'      || h.city     === city)
      && (category === 'All Categories'  || h.category === category)
      && (!cashless || h.cashless);
  }), [hospitals, search, city, category, cashless]);

  const clearFilters = () => { setSearch(''); setCity('All Cities'); setCategory('All Categories'); setCashless(false); };

  const totalCashless = hospitals.filter(h => h.cashless).length;
  const uniqueCities  = new Set(hospitals.map(h => h.city)).size;
  const avgRating     = hospitals.length ? (hospitals.reduce((a, h) => a + h.rating, 0) / hospitals.length).toFixed(1) : '—';

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink3)', fontSize: 15 }}>Loading hospitals…</div>;

  return (
    <>
      {/* Search & filter bar */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 20px', marginBottom: 20, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 12, alignItems: 'center' }}>
          <input className="form-input" placeholder="🔍  Search hospital name or city…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ margin: 0 }} />
          <select className="form-select" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: 160 }}>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 180 }}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <input type="checkbox" checked={cashless} onChange={(e) => setCashless(e.target.checked)} />
            Cashless only
          </label>
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink3)' }}>
          Showing <strong>{filtered.length}</strong> of {hospitals.length} hospitals in the network
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Hospitals',  value: hospitals.length,  icon: '🏥', color: 'var(--accent)'  },
          { label: 'Cashless Enabled', value: totalCashless,     icon: '💳', color: 'var(--green)'   },
          { label: 'Cities Covered',   value: uniqueCities,      icon: '📍', color: 'var(--purple)'  },
          { label: 'Avg. Rating',      value: `${avgRating} ★`,  icon: '⭐', color: 'var(--amber)'   },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="es-icon">🔍</div>
          <div className="es-title">No hospitals found</div>
          <div className="es-desc">Try adjusting your search filters</div>
          <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ marginTop: 12 }}>Clear Filters</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Hospital Name</th><th>City</th><th>Specialty</th><th>Beds</th>
              <th>Cashless</th><th>Rating</th><th>Action</th>
            </tr></thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h._id || h.id}>
                  <td><div style={{ fontWeight: 500 }}>{h.name}</div></td>
                  <td style={{ fontSize: 13 }}>{h.city}</td>
                  <td>
                    <span style={{ fontSize: 11.5, background: 'var(--accent-lt)', color: 'var(--accent-dk)', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                      {h.category}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'DM Mono,monospace', fontSize: 13 }}>{h.beds.toLocaleString()}</td>
                  <td>
                    {h.cashless
                      ? <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>✓ Yes</span>
                      : <span style={{ color: 'var(--red)', fontSize: 13 }}>✕ No</span>}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--amber)', fontSize: 14 }}>{'★'.repeat(Math.round(h.rating))}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink3)', marginLeft: 4 }}>{h.rating}</span>
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm"
                      onClick={() => alert(`Contact ${h.name}\nToll-free: 1800-XXX-XXXX\nInsurance Desk: Available 24/7`)}>
                      Contact
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
