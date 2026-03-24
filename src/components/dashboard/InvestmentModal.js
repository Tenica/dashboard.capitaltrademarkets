import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, TrendingUp, CheckCircle, Copy, AlertCircle, Loader2, ArrowRight, ChevronDown, Info, Send } from 'lucide-react';
import { planAPI, invoiceAPI, systemWalletAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboard.css';

const InvestmentModal = ({ onClose, onSuccess, preselectedPlanName, preselectedAmount }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  const [allWallets, setAllWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [systemAddress, setSystemAddress] = useState('');
  const [cryptoError, setCryptoError] = useState('');
  const [txError, setTxError] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [plansRes, walletRes] = await Promise.all([
          planAPI.viewAllPlans(),
          systemWalletAPI.getSystemWallet().catch(() => null),
        ]);
        const fetchedPlans = plansRes.data?.message || [];
        setPlans(fetchedPlans);
        if (fetchedPlans.length > 0) {
          let defPlan = fetchedPlans[0];
          if (preselectedPlanName) {
            const found = fetchedPlans.find(p => p.name === preselectedPlanName);
            if (found) defPlan = found;
          }
          setSelectedPlan(defPlan);
          
          if (preselectedAmount) {
            setAmount(preselectedAmount);
            const num = parseFloat(preselectedAmount);
            const min = parseFloat(defPlan.minimum);
            const max = parseFloat(defPlan.maximum);
            if (num < min) setAmountError(`Minimum for "${defPlan.name}" is $${min.toLocaleString()}.`);
            else if (num > max) setAmountError(`Maximum for "${defPlan.name}" is $${max.toLocaleString()}.`);
            else setAmountError('');
          }
        }

        // Extract active system wallets
        const wallets = walletRes?.data?.message || [];
        setAllWallets(wallets);
        if (wallets.length > 0) {
          const firstWallet = wallets[0];
          setSelectedWallet(firstWallet);
          setSystemAddress(firstWallet.address);
        }
      } catch {
        setSubmitError('Failed to load plans or wallet info.');
      } finally {
        setLoadingPlans(false);
      }
    };
    init();
  }, []);

  const handlePlanChange = (e) => {
    const plan = plans.find(p => p._id === e.target.value);
    setSelectedPlan(plan);
    setAmount('');
    setAmountError('');
  };

  const validateAmount = (val) => {
    if (!val || parseFloat(val) <= 0) {
      setAmountError('Please enter a valid investment amount.');
      return false;
    }
    if (!selectedPlan) return false;
    const num = parseFloat(val);
    const min = parseFloat(selectedPlan.minimum);
    const max = parseFloat(selectedPlan.maximum);
    if (num < min) {
      setAmountError(`Minimum for "${selectedPlan.name}" is $${min.toLocaleString()}.`);
      return false;
    }
    if (num > max) {
      setAmountError(`Maximum for "${selectedPlan.name}" is $${max.toLocaleString()}.`);
      return false;
    }
    setAmountError('');
    return true;
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    if (val) validateAmount(val);
    else setAmountError('');
  };

  const handleContinue = () => {
    if (validateAmount(amount)) setStep(2);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const validateStep2 = () => {
    let valid = true;
    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) {
      setCryptoError('Enter the crypto amount you sent (e.g. 82.50).');
      valid = false;
    } else setCryptoError('');
    if (!transactionId.trim()) {
      setTxError('Paste your blockchain transaction hash / ID.');
      valid = false;
    } else setTxError('');
    return valid;
  };

  const handleConfirm = async () => {
    if (!validateStep2()) return;
    setIsProcessing(true);
    setSubmitError('');
    try {
      const res = await invoiceAPI.createInvoice({
        amount: String(parseFloat(amount)),          // must be string numeric per model
        cryptoAmount: String(parseFloat(cryptoAmount)),
        systemAddress: systemAddress,
        transactionId: transactionId.trim(),
      });
      setSubmitSuccess(res.data?.message || 'Investment submitted for confirmation!');
      setTimeout(() => onClose(), 2800);
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.';
      setSubmitError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);
  const fmtFull = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? '$0.00' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  };

  const isAmountValid = amount && !amountError && parseFloat(amount) > 0;
  const displayAddr = systemAddress
    ? `${systemAddress.slice(0, 8)}...${systemAddress.slice(-8)}`
    : 'Not configured';

  const amountProgress = selectedPlan && amount
    ? Math.min(100, Math.max(0, ((parseFloat(amount) - parseFloat(selectedPlan.minimum)) / (parseFloat(selectedPlan.maximum) - parseFloat(selectedPlan.minimum))) * 100))
    : 0;

  const inputBase = (error) => ({
    width: '100%', padding: '0.875rem 1rem',
    background: 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
    color: '#f8fafc', borderRadius: '10px', fontSize: '0.95rem',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  });

  const labels = { fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.45rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' };
  const errTip = (msg) => msg && (
    <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: '#fca5a5', fontSize: '0.8rem' }}>
      <AlertCircle size={13} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
      {msg}
    </div>
  );

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, backdropFilter: 'blur(8px)', background: 'rgba(10,16,30,0.85)',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%', maxWidth: '480px', padding: '0', overflow: 'hidden',
        maxHeight: '94vh', display: 'flex', flexDirection: 'column',
        borderRadius: '20px', boxShadow: '0 32px 80px -12px rgba(0,0,0,0.9)',
        animation: 'fadeInScale 0.3s cubic-bezier(0.16,1,0.3,1)',
        background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(99,102,241,0.12)', padding: '0.5rem', borderRadius: '10px', color: '#6366f1', display: 'flex' }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc' }}>
                {step === 1 ? 'New Investment' : 'Payment Proof'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Step bar */}
        <div style={{ display: 'flex', padding: '0 1.5rem', paddingTop: '1.1rem', gap: '0.5rem', flexShrink: 0 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '4px', background: step >= s ? '#6366f1' : 'rgba(255,255,255,0.07)', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem 1.5rem', overflowY: 'auto', flex: 1 }}>

          {submitSuccess ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <CheckCircle size={52} style={{ color: '#10b981', marginBottom: '1rem' }} />
              <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem' }}>Submitted!</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>{submitSuccess}</p>
              <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: '0.4rem' }}>Closing automatically...</p>
            </div>
          ) : (
            <>
              {submitError && (
                <div style={{ display: 'flex', gap: '0.6rem', padding: '0.85rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.83rem' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, color: '#ef4444', marginTop: '2px' }} />
                  {submitError}
                </div>
              )}

              {/* ========= STEP 1 ========= */}
              {step === 1 && (
                <div style={{ animation: 'fadeIn 0.25s ease' }}>
                  {loadingPlans ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                      <p style={{ color: '#64748b', marginTop: '0.75rem', fontSize: '0.88rem' }}>Loading plans...</p>
                    </div>
                  ) : plans.length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>No investment plans available.</p>
                  ) : (
                    <>
                      {/* Plan selector */}
                      <div style={{ marginBottom: '1.1rem' }}>
                        <label style={labels}>Select Plan</label>
                        <div style={{ position: 'relative' }}>
                          <select
                            value={selectedPlan?._id || ''}
                            onChange={handlePlanChange}
                            style={{ ...inputBase(false), paddingRight: '2.5rem', cursor: 'pointer', appearance: 'none' }}
                          >
                            {plans.map(p => (
                              <option key={p._id} value={p._id} style={{ background: '#1e293b' }}>
                                {p.name} — {p.dailyProfitMin}%–{p.dailyProfitMax}% daily | ${parseFloat(p.minimum).toLocaleString()} – ${parseFloat(p.maximum).toLocaleString()}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={15} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                        </div>
                      </div>

                      {/* Plan info card */}
                      {selectedPlan && (
                        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '12px', padding: '0.9rem 1rem', marginBottom: '1.1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                            <span style={{ fontWeight: '700', color: '#f8fafc' }}>{selectedPlan.name}</span>
                            <span style={{ fontSize: '0.73rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '0.2rem 0.55rem', borderRadius: '5px', fontWeight: '700' }}>
                              {selectedPlan.dailyProfitMin}%–{selectedPlan.dailyProfitMax}%/day
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                            {[
                              { l: 'Min', v: fmt(selectedPlan.minimum), c: '#10b981' },
                              { l: 'Max', v: fmt(selectedPlan.maximum), c: '#f59e0b' },
                              { l: 'Duration', v: `${selectedPlan.endDate}d`, c: '#6366f1' },
                            ].map((item, i) => (
                              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '7px', padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase' }}>{item.l}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: item.c }}>{item.v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amount input */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                          <label style={{ ...labels, marginBottom: 0 }}>Amount (USD)</label>
                          {selectedPlan && (
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {fmt(selectedPlan.minimum)} – {fmt(selectedPlan.maximum)}
                            </span>
                          )}
                        </div>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1rem', fontWeight: '700' }}>$</span>
                          <input
                            type="number"
                            value={amount}
                            onChange={handleAmountChange}
                            onBlur={() => amount && validateAmount(amount)}
                            placeholder={selectedPlan ? `${selectedPlan.minimum} – ${selectedPlan.maximum}` : '0.00'}
                            style={{
                              ...inputBase(amountError),
                              paddingLeft: '2.2rem', fontSize: '1.15rem', fontWeight: '700',
                              borderColor: amountError ? '#ef4444' : isAmountValid ? '#10b981' : 'rgba(255,255,255,0.1)',
                            }}
                          />
                        </div>
                        {/* Progress bar */}
                        {selectedPlan && amount && !amountError && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <div style={{ height: '3px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${amountProgress}%`, background: 'linear-gradient(90deg, #10b981, #6366f1)', transition: 'width 0.3s' }} />
                            </div>
                          </div>
                        )}
                        {errTip(amountError)}
                        {isAmountValid && (
                          <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6ee7b7', fontSize: '0.8rem' }}>
                            <CheckCircle size={13} style={{ color: '#10b981' }} /> Within plan range ✓
                          </div>
                        )}
                      </div>

                      {/* Quick fill */}
                      {selectedPlan && (
                        <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.5rem' }}>
                          {[selectedPlan.minimum, Math.round((parseFloat(selectedPlan.minimum) + parseFloat(selectedPlan.maximum)) / 2), selectedPlan.maximum].map((val, i) => (
                            <button key={i} onClick={() => { setAmount(String(val)); validateAmount(String(val)); }}
                              style={{ flex: 1, padding: '0.4rem 0.3rem', borderRadius: '7px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                                background: parseFloat(amount) === val ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${parseFloat(amount) === val ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                                color: parseFloat(amount) === val ? '#818cf8' : '#94a3b8',
                              }}>
                              {['Min', 'Mid', 'Max'][i]}: {fmt(val)}
                            </button>
                          ))}
                        </div>
                      )}

                      <button onClick={handleContinue} disabled={!isAmountValid}
                        style={{
                          width: '100%', padding: '1rem', borderRadius: '12px',
                          background: isAmountValid ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.05)',
                          color: isAmountValid ? 'white' : '#475569',
                          border: 'none', fontSize: '1rem', fontWeight: '700',
                          cursor: isAmountValid ? 'pointer' : 'not-allowed',
                          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                          boxShadow: isAmountValid ? '0 8px 24px rgba(99,102,241,0.3)' : 'none', transition: 'all 0.2s'
                        }}>
                        Next: Funding Details <ArrowRight size={17} />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ========= STEP 2 ========= */}
              {step === 2 && (
                <div style={{ animation: 'fadeIn 0.25s ease' }}>
                  {/* Amount summary */}
                  <div style={{ textAlign: 'center', padding: '0.85rem', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Investment Amount</div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-1px' }}>{fmtFull(amount)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '600' }}>via {selectedPlan?.name}</div>
                  </div>

                  {/* Instruction */}
                  <div style={{ display: 'flex', gap: '0.7rem', padding: '0.9rem', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', marginBottom: '1.25rem' }}>
                    <Info size={16} style={{ flexShrink: 0, color: '#10b981', marginTop: '1px' }} />
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#d1fae5', lineHeight: 1.55 }}>
                      Deposit <strong>{fmtFull(amount)} USDT (TRC20)</strong> to the address below, then fill in your crypto amount sent and paste your transaction ID/hash as proof.
                    </p>
                  </div>

                  {/* System wallet selector/display */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <label style={labels}>Select Funding Method</label>
                    {allWallets.length === 0 ? (
                      <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.05)', border: '1.5px dashed rgba(239,68,68,0.2)', borderRadius: '12px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5' }}>
                          No active payment methods found. 
                          <br />Please contact support or try again later.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {allWallets.length > 1 && (
                          <div style={{ position: 'relative' }}>
                            <select
                              value={selectedWallet?._id || ''}
                              onChange={(e) => {
                                const w = allWallets.find(x => x._id === e.target.value);
                                setSelectedWallet(w);
                                setSystemAddress(w.address);
                              }}
                              style={{ ...inputBase(false), paddingRight: '2.5rem', cursor: 'pointer', appearance: 'none' }}
                            >
                              {allWallets.map(w => (
                                <option key={w._id} value={w._id} style={{ background: '#1e293b' }}>
                                  {w.currency} ({w.network || 'Main Net'}) — {w.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={15} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                          <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.82rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                            {systemAddress || 'Not configured'}
                          </span>
                          {systemAddress && (
                            <button onClick={() => handleCopy(systemAddress)}
                              style={{ background: isCopied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isCopied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, color: isCopied ? '#10b981' : '#94a3b8', cursor: 'pointer', padding: '0.4rem 0.7rem', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: '600', flexShrink: 0 }}>
                              {isCopied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                            </button>
                          )}
                        </div>
                        {selectedWallet?.network && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Info size={12} style={{ color: '#6366f1' }} />
                            Network: <strong style={{ color: '#818cf8' }}>{selectedWallet.network}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Crypto amount sent */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labels}>Amount Deposited ({selectedWallet?.currency || 'USDT'})</label>
                    <input
                      type="number"
                      value={cryptoAmount}
                      onChange={e => { setCryptoAmount(e.target.value); if (e.target.value) setCryptoError(''); }}
                      placeholder={`e.g. ${amount}`}
                      style={inputBase(cryptoError)}
                    />
                    {errTip(cryptoError)}
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: '#475569' }}>
                      Enter the exact amount of {selectedWallet?.currency || 'USDT'} you transferred.
                    </p>
                  </div>

                  {/* Transaction ID */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labels}>Transaction Hash / ID</label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={e => { setTransactionId(e.target.value); if (e.target.value.trim()) setTxError(''); }}
                      placeholder="e.g. 3a1b2c4d5e6f…"
                      style={{ ...inputBase(txError), fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                    {errTip(txError)}
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: '#475569' }}>Find this in your wallet or exchange after depositing.</p>
                  </div>

                  {/* Warning */}
                  <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem', background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <AlertCircle size={18} color="#eab308" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                      <strong style={{ color: '#eab308' }}>Important:</strong> Submit only after completing the deposit. Submission of false or misleading information may result in account restriction or suspension in line with our policies.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setStep(1)} disabled={isProcessing}
                      style={{ flex: 1, padding: '0.9rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.07)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                      ← Back
                    </button>
                    <button onClick={handleConfirm} disabled={isProcessing}
                      style={{
                        flex: 2, padding: '0.9rem', borderRadius: '12px',
                        background: '#10b981', color: 'white',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem',
                        border: 'none', fontSize: '1rem', fontWeight: '700',
                        cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1,
                        boxShadow: '0 8px 20px rgba(16,185,129,0.25)'
                      }}>
                      {isProcessing
                        ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                        : <><Send size={18} /> Submit for Approval</>}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
};

export default InvestmentModal;
