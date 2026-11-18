import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CarFront, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getAdminBookings, getAdminStats, updateAdminBookingStatus } from '../services/api.js';

const STATUSES = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function estimateLabel(booking) {
  if (!booking.estimate) return '—';
  const { min, max, currency = 'INR' } = booking.estimate;
  if (min == null || max == null) return '—';
  return `${currency} ${Number(min).toLocaleString('en-IN')}–${Number(max).toLocaleString('en-IN')}`;
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    getAdminStats()
      .then(data => { if (active) setStats(data); })
      .catch(requestError => { if (active) setError(requestError.message || 'Could not load dashboard stats.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getAdminBookings({ page, limit: 20, status, search })
      .then(data => {
        if (!active) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .catch(requestError => {
        if (active) setError(requestError.message || 'Could not load bookings.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, status, search]);

  const changeStatus = async (id, nextStatus) => {
    setUpdatingId(id);
    setError('');
    try {
      await updateAdminBookingStatus(id, nextStatus);
      setItems(current => current.map(item => item.id === id ? { ...item, status: nextStatus } : item));
      const refreshedStats = await getAdminStats();
      setStats(refreshedStats);
    } catch (requestError) {
      setError(requestError.message || 'Could not update booking status.');
    } finally {
      setUpdatingId('');
    }
  };

  const statCards = [
    ['Total', stats?.total ?? 0],
    ['Pending', stats?.pending ?? stats?.counts?.PENDING ?? 0],
    ['Accepted', stats?.accepted ?? stats?.counts?.ACCEPTED ?? 0],
    ['In progress', stats?.inProgress ?? stats?.counts?.IN_PROGRESS ?? 0],
    ['Completed', stats?.completed ?? stats?.counts?.COMPLETED ?? 0],
    ['Today', stats?.requestsToday ?? 0],
  ];

  return (
    <main className="admin-page">
      <div className="wrap admin-wrap">
        <Link className="brand account-brand" to="/" aria-label="Machanix home">
          <span className="brand-mark"><CarFront size={27} strokeWidth={2.8} /><span className="mark-dot" /></span>
          <span className="brand-name"><b>Mach</b>anix<span className="brand-period">.</span></span>
        </Link>
        <div className="admin-heading">
          <div><span className="eyebrow">ADMIN AREA</span><h1>Booking dashboard</h1></div>
          <Link className="btn btn-white-charcoal" to="/">Back to home</Link>
        </div>

        <div className="admin-stats">
          {statCards.map(([label, value]) => <article className="admin-stat" key={label}><span>{label}</span><b>{value}</b></article>)}
        </div>

        <section className="admin-bookings">
          <div className="admin-toolbar">
            <div className="admin-tabs" role="tablist" aria-label="Filter bookings by status">
              {[['', 'All'], ...STATUSES.map(statusName => [statusName, statusName.replace('_', ' ')] )].map(([value, label]) => (
                <button key={value || 'ALL'} type="button" className={status === value ? 'active' : ''} onClick={() => { setStatus(value); setPage(1); }}>{label}</button>
              ))}
            </div>
            <label className="admin-search"><Search size={16} /><input value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Search name, phone or ID" aria-label="Search bookings" /></label>
          </div>

          {error && <p className="admin-error">{error}</p>}
          {loading ? <div className="admin-state">Loading bookings…</div> : !items.length ? <div className="admin-state">No bookings found.</div> : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>ID</th><th>Customer</th><th>Phone</th><th>Car</th><th>Service</th><th>City</th><th>Preferred date</th><th>Estimate</th><th>Status</th><th>Created</th></tr></thead>
                  <tbody>{items.map(booking => (
                    <tr key={booking.id}>
                      <td data-label="ID">{booking.id}</td>
                      <td data-label="Customer">{booking.name || '—'}</td>
                      <td data-label="Phone">{booking.phone || '—'}</td>
                      <td data-label="Car">{booking.car ? `${booking.car.make} ${booking.car.model}` : '—'}{booking.car?.fuel && <small>{booking.car.fuel}</small>}</td>
                      <td data-label="Service">{booking.serviceName || '—'}</td>
                      <td data-label="City">{booking.city || '—'}</td>
                      <td data-label="Preferred date">{booking.bookingDate || '—'}</td>
                      <td data-label="Estimate">{estimateLabel(booking)}</td>
                      <td data-label="Status"><select className={`status-select status-${String(booking.status).toLowerCase()}`} value={booking.status} disabled={updatingId === booking.id} onChange={event => changeStatus(booking.id, event.target.value)}>{STATUSES.map(value => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></td>
                      <td data-label="Created">{formatDateTime(booking.createdAt)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="admin-cards">
                {items.map(booking => (
                  <article className="admin-booking-card" key={booking.id}>
                    <div className="admin-card-head"><b>{booking.id}</b><select className={`status-select status-${String(booking.status).toLowerCase()}`} value={booking.status} disabled={updatingId === booking.id} onChange={event => changeStatus(booking.id, event.target.value)}>{STATUSES.map(value => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></div>
                    <dl><div><dt>Customer</dt><dd>{booking.name || '—'} · {booking.phone || '—'}</dd></div><div><dt>Car</dt><dd>{booking.car ? `${booking.car.make} ${booking.car.model} · ${booking.car.fuel}` : '—'}</dd></div><div><dt>Service</dt><dd>{booking.serviceName || '—'}</dd></div><div><dt>City / date</dt><dd>{booking.city || '—'} · {booking.bookingDate || '—'}</dd></div><div><dt>Estimate</dt><dd>{estimateLabel(booking)}</dd></div><div><dt>Created</dt><dd>{formatDateTime(booking.createdAt)}</dd></div></dl>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="admin-pagination">
            <span>{total} total booking{total === 1 ? '' : 's'}</span>
            <div><button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}><ChevronLeft size={16} /> Prev</button><b>{page} / {pages}</b><button type="button" disabled={page >= pages} onClick={() => setPage(value => value + 1)}>Next <ChevronRight size={16} /></button></div>
          </div>
        </section>
      </div>
    </main>
  );
}
