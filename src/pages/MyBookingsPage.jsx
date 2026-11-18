import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CarFront } from 'lucide-react';
import { getMyBookings } from '../services/api.js';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyBookings()
      .then(data => setBookings(data.items || []))
      .catch(requestError => setError(requestError.message || 'Could not load bookings.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="account-page">
      <div className="wrap account-wrap">
        <Link className="brand account-brand" to="/" aria-label="Machanix home">
          <span className="brand-mark"><CarFront size={27} strokeWidth={2.8} /><span className="mark-dot" /></span>
          <span className="brand-name"><b>Mach</b>anix<span className="brand-period">.</span></span>
        </Link>
        <div className="section-heading"><div><span className="eyebrow">MY ACCOUNT</span><h1>My bookings</h1><p>View the service requests associated with your account.</p></div><Link className="btn btn-red" to="/">Back to home</Link></div>
        {loading && <p className="account-message">Loading bookings…</p>}
        {error && <p className="auth-error">{error}</p>}
        {!loading && !error && !bookings.length && <p className="account-message">No bookings found.</p>}
        <div className="booking-list">
          {bookings.map(booking => (
            <article className="account-booking" key={booking.id}>
              <span className="account-booking-icon"><CalendarClock size={22} /></span>
              <div><b>{booking.serviceName}</b><p>{booking.car?.make} {booking.car?.model} · {booking.city}</p><small>{booking.bookingDate}</small></div>
              <span className={`status-badge status-${String(booking.status).toLowerCase()}`}>{booking.status}</span>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
