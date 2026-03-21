import React, { useState, useEffect, useContext } from 'react';
import { planAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AdminContext } from '../components/layout/Layout';
import { Rocket, ShieldCheck, Zap, Diamond, CheckCircle, Clock, ArrowRight, Plus, Pencil, Trash2 } from 'lucide-react';
import InvestmentModal from '../components/dashboard/InvestmentModal';

const ICONS = [Rocket, ShieldCheck, Zap, Diamond];
const ICON_COLORS = ['icon-purple', 'icon-blue', 'icon-green', 'icon-orange'];

function Plans() {
  const { user } = useAuth();
  const { isAdmin } = useContext(AdminContext);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editPlanId, setEditPlanId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', minimum: '', maximum: '', dailyProfitMin: '', dailyProfitMax: '', referralBonus: '', endDate: '', description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPlans();
  }, [isAdmin]);

  const fetchPlans = async () => {
    try {
      const response = await planAPI.viewAllPlans();
      const fetchedPlans = response.data?.message || [];
      const sortedPlans = [...fetchedPlans].sort((a, b) => {
        const cleanNumber = (str) => parseFloat(String(str).replace(/[^0-9.-]/g, '')) || 0;
        const minA = cleanNumber(a.minimum);
        const minB = cleanNumber(b.minimum);
        if (minA === minB) return (parseInt(a.endDate) || 0) - (parseInt(b.endDate) || 0);
        return minA - minB;
      });
      setPlans(sortedPlans);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching plans' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      if (editPlanId) {
        await planAPI.editPlan(editPlanId, formData);
        setMessage({ type: 'success', text: 'Investment plan updated successfully!' });
      } else {
        await planAPI.createPlan(formData);
        setMessage({ type: 'success', text: 'Investment plan created successfully!' });
      }
      setFormData({ name: '', minimum: '', maximum: '', dailyProfitMin: '', dailyProfitMax: '', referralBonus: '', endDate: '', description: '' });
      setEditPlanId(null);
      setShowForm(false);
      fetchPlans();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error saving plan' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (plan) => {
    setFormData({
      name: plan.name || '',
      minimum: plan.minimum || '',
      maximum: plan.maximum || '',
      dailyProfitMin: plan.dailyProfitMin || '',
      dailyProfitMax: plan.dailyProfitMax || '',
      referralBonus: plan.referralBonus || '',
      endDate: plan.endDate || '',
      description: plan.description || ''
    });
    setEditPlanId(plan._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await planAPI.deletePlan(id);
      fetchPlans();
    } catch (error) {
       console.error(error);
       alert("Error deleting plan");
    }
  };

  const handleInvestClick = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="dashboard-page" style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'50vh'}}>
        <div className="spinner" style={{borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)'}}></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page overflow-hidden">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Investment Plans</h1>
          <p>Choose the perfect tier to grow your portfolio</p>
        </div>
        {isAdmin && (
          <button 
            className="btn btn-primary glass" 
            style={{ marginTop: '-0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditPlanId(null);
                setFormData({ name: '', minimum: '', maximum: '', dailyProfitMin: '', dailyProfitMax: '', referralBonus: '', endDate: '', description: '' });
              } else {
                setShowForm(true);
              }
            }}
          >
            <Plus size={20} /> {showForm ? 'Cancel' : 'New Plan'}
          </button>
        )}
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'} style={{marginBottom: '2rem', borderRadius: '12px'}}>
          {message.text}
        </div>
      )}

      {isAdmin && showForm && (
        <div className="dashboard-panel glass" style={{ marginBottom: '2.5rem', border: '1px solid var(--accent-primary)', padding: '2rem' }}>
          <div className="panel-header" style={{ marginBottom: '1.5rem', border: 'none' }}>
            <h2 className="panel-title" style={{ fontSize: '1.4rem' }}>{editPlanId ? 'Edit Investment Plan' : 'Create New Investment Plan'}</h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Plan Name</label>
                <input type="text" name="name" className="glass" placeholder="e.g. Diamond Plan" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '0.85rem' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Duration (Days)</label>
                <input type="number" name="endDate" className="glass" placeholder="e.g. 30" value={formData.endDate} onChange={handleChange} required style={{ width: '100%', padding: '0.85rem' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Min Amount ($)</label>
                <input type="number" name="minimum" className="glass" placeholder="100" value={formData.minimum} onChange={handleChange} required style={{ width: '100%', padding: '0.85rem' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Max Amount ($)</label>
                <input type="number" name="maximum" className="glass" placeholder="5000" value={formData.maximum} onChange={handleChange} required style={{ width: '100%', padding: '0.85rem' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Daily Profit Min (%)</label>
                <input type="text" name="dailyProfitMin" className="glass" placeholder="1.5" value={formData.dailyProfitMin} onChange={handleChange} required style={{ width: '100%', padding: '0.85rem' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Daily Profit Max (%)</label>
                <input type="text" name="dailyProfitMax" className="glass" placeholder="3.0" value={formData.dailyProfitMax} onChange={handleChange} required style={{ width: '100%', padding: '0.85rem' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Referral Bonus (%)</label>
                <input type="number" name="referralBonus" className="glass" placeholder="10" value={formData.referralBonus} onChange={handleChange} required style={{ width: '100%', padding: '0.85rem' }} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Description (Optional)</label>
                <textarea name="description" className="glass" placeholder="Plan details..." value={formData.description} onChange={handleChange} style={{ width: '100%', padding: '0.85rem', minHeight: '80px', resize: 'vertical' }} />
              </div>
            </div>

            {/* Live Preview Bar */}
            {(formData.name || formData.minimum) && (
              <div className="glass" style={{
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)',
                borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '2rem',
                display: 'flex', flexWrap: 'wrap', gap: '1rem 2rem', alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Preview</span>
                {formData.name && <span style={{ fontWeight: '600' }}>{formData.name}</span>}
                {formData.minimum && <span className="text-success">${Number(formData.minimum).toLocaleString()} Min</span>}
                {formData.dailyProfitMin && <span className="text-warning">{formData.dailyProfitMin}% Return</span>}
                {formData.endDate && <span className="text-accent">{formData.endDate} Days</span>}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="submit" 
                disabled={submitting} 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '1rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: '12px', fontWeight: '700' }}
              >
                {submitting ? 'Saving...' : editPlanId ? 'Update Plan' : 'Create Plan'}
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditPlanId(null); setFormData({ name: '', minimum: '', maximum: '', dailyProfitMin: '', dailyProfitMax: '', referralBonus: '', endDate: '', description: '' }); }} 
                className="btn glass" 
                style={{ padding: '1rem 2rem', borderRadius: '12px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="dashboard-panel glass text-center" style={{ padding: '4rem 2rem' }}>
           <div className="stat-icon-wrapper icon-purple" style={{ margin: '0 auto 1.5rem' }}>
              <Rocket size={32} />
           </div>
           <h2 className="panel-title">No Plans Available</h2>
           <p className="text-secondary">Platform investment plans will appear here once configured.</p>
        </div>
      ) : (
        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {plans.map((plan, index) => {
            const IconComp = ICONS[index % ICONS.length];
            const iconCol = ICON_COLORS[index % ICON_COLORS.length];
            
            return (
              <div className="stat-card-new glass" key={plan._id || index} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {isAdmin && (
                  <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.6rem' }}>
                    <button 
                      onClick={() => handleEditClick(plan)}
                      title="Edit Plan"
                      style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'var(--text-secondary)', 
                        padding: '0.5rem', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        display: 'flex',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(plan._id)}
                      title="Delete Plan"
                      style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'var(--text-secondary)', 
                        padding: '0.5rem', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        display: 'flex',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
                
                <div className="plan-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div className={`stat-icon-wrapper ${iconCol}`}>
                      <IconComp size={24} />
                   </div>
                   <h3 className="plan-title" style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: 'white' }}>{plan.name}</h3>
                </div>
                
                <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Minimum Invest</div>
                   <div style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--accent-primary)', display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.2rem', marginTop: '0.5rem', marginRight: '2px' }}>$</span>
                      {(parseFloat(plan.minimum) || 0).toLocaleString()}
                   </div>
                </div>
                
                <ul className="plan-features" style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.92rem' }}><CheckCircle className="text-success" size={18} /> <span>Maximum: <strong>${(parseFloat(plan.maximum) || 0).toLocaleString()}</strong></span></li>
                   <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.92rem' }}><CheckCircle className="text-success" size={18} /> <span>Return: <strong>{plan.dailyProfitMin}%-{plan.dailyProfitMax}% Daily</strong></span></li>
                   <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.92rem' }}><CheckCircle className="text-success" size={18} /> <span>Bonus: <strong>{plan.referralBonus}% Referral</strong></span></li>
                   <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.92rem' }}><Clock className="text-warning" size={18} /> <span>Duration: <strong>{plan.endDate} Days</strong></span></li>
                </ul>
                
                {plan.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '2rem', flex: 1 }}>
                    {plan.description}
                  </p>
                )}
                
                <div style={{ marginTop: 'auto' }}>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: '700', background: 'var(--accent-gradient)', border: 'none' }} onClick={() => handleInvestClick(plan)}>
                    Invest Now <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {isModalOpen && <InvestmentModal selectedPlan={selectedPlan} onClose={() => setIsModalOpen(false)} onSuccess={fetchPlans} />}
    </div>
  );
}

export default Plans;
