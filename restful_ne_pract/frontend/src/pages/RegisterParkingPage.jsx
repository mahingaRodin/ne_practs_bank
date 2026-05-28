import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Alert from '../components/Alert';

export default function RegisterParkingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ code: '', name: '', totalSpaces: '', location: '', feePerHour: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/api/parkings', {
        ...form,
        totalSpaces: parseInt(form.totalSpaces, 10),
        feePerHour: parseFloat(form.feePerHour),
      });
      setSuccess('Parking registered successfully!');
      setForm({ code: '', name: '', totalSpaces: '', location: '', feePerHour: '' });
      setTimeout(() => navigate('/parkings'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-1">Register Parking</h1>
      <p className="text-muted text-sm mb-6">Add a new parking location to the system</p>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} />

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label-field">Parking Code</label>
          <input name="code" className="input-field" placeholder="e.g. KGL-03" value={form.code} onChange={handleChange} required />
        </div>
        <div>
          <label className="label-field">Parking Name</label>
          <input name="name" className="input-field" placeholder="Parking name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label className="label-field">Number of Spaces</label>
          <input name="totalSpaces" type="number" min="1" className="input-field" placeholder="Total capacity" value={form.totalSpaces} onChange={handleChange} required />
        </div>
        <div>
          <label className="label-field">Location</label>
          <input name="location" className="input-field" placeholder="Physical address" value={form.location} onChange={handleChange} required />
        </div>
        <div>
          <label className="label-field">Charging Fee per Hour (RWF)</label>
          <input name="feePerHour" type="number" min="0" step="0.01" className="input-field" placeholder="500" value={form.feePerHour} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn-primary !w-auto px-8" disabled={loading}>
          {loading ? 'Registering...' : 'Register Parking'}
        </button>
      </form>
    </div>
  );
}
