import React, { useState } from 'react';
import { planAPI } from '../services/api';
import '../styles/App.css';

function CreatePlan() {
  const [formData, setFormData] = useState({
    name: '',
    minAmount: '',
    maxAmount: '',
    percentage: '',
    referralBonus: '',
    duration: '',
    description: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await planAPI.createPlan(formData);
      setMessage({ type: 'success', text: 'Investment plan created successfully!' });
      setFormData({
        name: '',
        minAmount: '',
        maxAmount: '',
        percentage: '',
        referralBonus: '',
        duration: '',
        description: ''
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error creating plan'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Create Investment Plan</h1>

      <div className="card">
        <h2>New Plan Details</h2>

        {message.text && (
          <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Plan Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Starter Plan, Premium Plan"
            />
          </div>

          <div className="form-group">
            <label htmlFor="minAmount">Minimum Amount ($)</label>
            <input
              type="number"
              id="minAmount"
              name="minAmount"
              value={formData.minAmount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="Enter minimum investment amount"
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxAmount">Maximum Amount ($)</label>
            <input
              type="number"
              id="maxAmount"
              name="maxAmount"
              value={formData.maxAmount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="Enter maximum investment amount"
            />
          </div>

          <div className="form-group">
            <label htmlFor="percentage">Return Percentage (%)</label>
            <input
              type="number"
              id="percentage"
              name="percentage"
              value={formData.percentage}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="Enter return percentage"
            />
          </div>

          <div className="form-group">
            <label htmlFor="referralBonus">Referral Bonus (%)</label>
            <input
              type="number"
              id="referralBonus"
              name="referralBonus"
              value={formData.referralBonus}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="Enter referral bonus percentage"
            />
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (days)</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              min="1"
              placeholder="Enter duration in days"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Enter plan description"
            ></textarea>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating Plan...' : 'Create Plan'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatePlan;
