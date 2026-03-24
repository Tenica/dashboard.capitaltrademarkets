import React, { useState, useEffect, useRef } from 'react';
import { invoiceAPI, planAPI, systemWalletAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/App.css';

function CreateInvestment() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [matchingPlans, setMatchingPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [systemWallets, setSystemWallets] = useState({ BTC: '', ETH: '', USDT: '' });
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [checkingPlans, setCheckingPlans] = useState(false);
  const debounceRef = useRef(null);

  const cryptoOptions = [
    { value: 'BTC', label: 'Bitcoin (BTC)', icon: '₿' },
    { value: 'ETH', label: 'Ethereum (ETH)', icon: 'Ξ' },
    { value: 'USDT', label: 'Tether (USDT)', icon: '₮' }
  ];

  useEffect(() => {
    fetchSystemWallets();
  }, []);

  const fetchSystemWallets = async () => {
    try {
      const response = await systemWalletAPI.getSystemWallet();
      const walletData = response.data?.message?.[0];
      if (walletData) {
        setSystemWallets({
          BTC: walletData.BTC?.[0]?.address || '',
          ETH: walletData.ETH?.[0]?.address || '',
          USDT: walletData.USDT?.[0]?.address || '',
        });
      }
    } catch (error) {
      console.error('Error fetching system wallets:', error);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    if (value.split('.').length > 2) return;
    setAmount(value);
    setMatchingPlans([]);
    setSelectedPlan(null);
    setMessage({ type: '', text: '' });

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value && parseFloat(value) > 0) {
      setCheckingPlans(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await planAPI.getMatchingPlans(value);
          const plans = response.data?.message || [];

          if (plans.length === 0) {
            setMessage({
              type: 'error',
              text: `No investment plans available for $${parseFloat(value).toLocaleString()}. Please choose a different amount.`
            });
          } else {
            setMatchingPlans(plans);
            if (plans.length === 1) {
              setSelectedPlan(plans[0]);
            }
          }
        } catch (error) {
          setMessage({ type: 'error', text: 'Error checking investment plans' });
        } finally {
          setCheckingPlans(false);
        }
      }, 500);
    } else {
      setCheckingPlans(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handleCryptoSelect = (crypto) => {
    setSelectedCrypto(crypto);
  };

  const handleNextStep = () => {
    if (step === 1 && !amount) {
      setMessage({ type: 'error', text: 'Please enter an investment amount' });
      return;
    }
    if (step === 1 && matchingPlans.length === 0) {
      setMessage({ type: 'error', text: 'No plans available for this amount' });
      return;
    }
    if (step === 1 && !selectedPlan) {
      setMessage({ type: 'error', text: 'Please select an investment plan' });
      return;
    }
    if (step === 2 && !selectedCrypto) {
      setMessage({ type: 'error', text: 'Please select a payment method' });
      return;
    }
    if (step === 3 && !transactionId.trim()) {
      setMessage({ type: 'error', text: 'Please enter transaction ID' });
      return;
    }

    setMessage({ type: '', text: '' });
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setMessage({ type: '', text: '' });
    setStep(step - 1);
  };

  const calculateCryptoAmount = () => {
    // Simplified conversion rates (in production, fetch real-time rates)
    const rates = {
      BTC: 50000, // $50,000 per BTC
      ETH: 3000,  // $3,000 per ETH
      USDT: 1     // $1 per USDT
    };

    if (!selectedCrypto || !amount) return '0';

    const cryptoAmount = parseFloat(amount) / rates[selectedCrypto];
    return cryptoAmount.toFixed(8);
  };

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
      setMessage({ type: 'error', text: 'Please enter transaction ID' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const invoiceData = {
        amount: amount,
        cryptoAmount: calculateCryptoAmount(),
        systemAddress: systemWallets[selectedCrypto],
        transactionId: transactionId.trim()
      };

      await invoiceAPI.createInvoice(invoiceData);

      setMessage({
        type: 'success',
        text: `Investment of $${parseFloat(amount).toLocaleString()} submitted successfully! Your payment is pending confirmation.`
      });

      // Reset form after success
      setTimeout(() => {
        setStep(1);
        setAmount('');
        setMatchingPlans([]);
        setSelectedPlan(null);
        setSelectedCrypto('');
        setTransactionId('');
        setMessage({ type: '', text: '' });
      }, 3000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error creating investment. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Wallet address copied to clipboard!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  return (
    <div className="container">
      <h1>Create New Investment</h1>

      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}

      <div className="card">
        {/* Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '0.5rem',
                borderBottom: `3px solid ${step >= num ? '#4e73df' : '#e3e6f0'}`,
                color: step >= num ? '#4e73df' : '#858796',
                fontWeight: step === num ? '700' : '400'
              }}
            >
              Step {num}
            </div>
          ))}
        </div>

        {/* Step 1: Enter Amount and Select Plan */}
        {step === 1 && (
          <div>
            <h2>Step 1: Enter Investment Amount</h2>

            <div className="form-group">
              <label htmlFor="amount">Investment Amount ($)</label>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount in USD"
                inputMode="decimal"
              />
            </div>

            {checkingPlans && (
              <p style={{ color: '#858796', marginTop: '1rem' }}>
                Checking available plans...
              </p>
            )}

            {matchingPlans.length > 0 && !checkingPlans && (
              <div style={{ marginTop: '2rem' }}>
                <h3>Available Investment Plans ({matchingPlans.length})</h3>
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  {matchingPlans.map((plan) => (
                    <div
                      key={plan._id}
                      onClick={() => handlePlanSelect(plan)}
                      style={{
                        border: `2px solid ${selectedPlan?._id === plan._id ? '#4e73df' : '#e3e6f0'}`,
                        borderRadius: '0.35rem',
                        padding: '1.5rem',
                        cursor: 'pointer',
                        backgroundColor: selectedPlan?._id === plan._id ? '#f8f9fc' : 'white',
                        transition: 'all 0.3s'
                      }}
                    >
                      <h4 style={{ color: '#4e73df', marginBottom: '1rem' }}>{plan.name}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div>
                          <span style={{ color: '#858796' }}>Range: </span>
                          <span style={{ fontWeight: '600' }}>
                            ${parseFloat(plan.minimum).toLocaleString()} - ${parseFloat(plan.maximum).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#858796' }}>Daily Return: </span>
                          <span style={{ fontWeight: '600', color: '#1cc88a' }}>
                            {plan.dailyProfitMin}% - {plan.dailyProfitMax}%
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#858796' }}>Duration: </span>
                          <span style={{ fontWeight: '600' }}>{plan.endDate} days</span>
                        </div>
                        <div>
                          <span style={{ color: '#858796' }}>Referral Bonus: </span>
                          <span style={{ fontWeight: '600', color: '#f6c23e' }}>{plan.referralBonus}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={handleNextStep}
                disabled={!selectedPlan || checkingPlans}
              >
                Next: Select Funding Method
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Cryptocurrency */}
        {step === 2 && (
          <div>
            <h2>Step 2: Select Funding Method</h2>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fc', borderRadius: '0.35rem' }}>
              <p style={{ margin: 0, color: '#5a5c69' }}>
                <strong>Investment Amount:</strong> ${parseFloat(amount).toLocaleString()}
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#5a5c69' }}>
                <strong>Selected Plan:</strong> {selectedPlan?.name}
              </p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {cryptoOptions.map((crypto) => (
                <div
                  key={crypto.value}
                  onClick={() => handleCryptoSelect(crypto.value)}
                  style={{
                    border: `2px solid ${selectedCrypto === crypto.value ? '#4e73df' : '#e3e6f0'}`,
                    borderRadius: '0.35rem',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    backgroundColor: selectedCrypto === crypto.value ? '#f8f9fc' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.3s'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{crypto.icon}</span>
                  <div>
                    <h4 style={{ margin: 0, color: '#5a5c69' }}>{crypto.label}</h4>
                    {selectedCrypto === crypto.value && (
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#858796' }}>
                        Amount: {calculateCryptoAmount()} {crypto.value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn" onClick={handlePrevStep}>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNextStep}
                disabled={!selectedCrypto}
              >
                Next: Funding Details
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Funding Details */}
        {step === 3 && (
          <div>
            <h2>Step 3: Make Payment</h2>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fc', borderRadius: '0.35rem' }}>
              <p style={{ margin: 0, color: '#5a5c69' }}>
                <strong>Amount to Pay:</strong> {calculateCryptoAmount()} {selectedCrypto} (${parseFloat(amount).toLocaleString()})
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '0.35rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#856404' }}>
                <strong>Please send your payment to the following address:</strong>
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f8f9fc',
              borderRadius: '0.35rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#858796', marginBottom: '0.5rem' }}>
                {selectedCrypto} Wallet Address:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <code style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  border: '1px solid #e3e6f0',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  wordBreak: 'break-all'
                }}>
                  {systemWallets[selectedCrypto] || 'No wallet address available'}
                </code>
                <button
                  className="btn btn-sm"
                  onClick={() => copyToClipboard(systemWallets[selectedCrypto])}
                  disabled={!systemWallets[selectedCrypto]}
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="transactionId">
                Transaction ID <span style={{ color: '#e74a3b' }}>*</span>
              </label>
              <input
                type="text"
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter your transaction ID after making payment"
              />
              <small style={{ color: '#858796', fontSize: '0.75rem' }}>
                After sending the payment, paste your transaction ID/hash here
              </small>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn" onClick={handlePrevStep}>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNextStep}
                disabled={!transactionId.trim()}
              >
                Next: Confirm
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div>
            <h2>Step 4: Confirm Investment</h2>

            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f8f9fc',
              borderRadius: '0.35rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ marginTop: 0, color: '#4e73df' }}>Investment Summary</h3>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#858796' }}>Investment Amount:</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', fontSize: '1.25rem', color: '#5a5c69' }}>
                    ${parseFloat(amount).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#858796' }}>Selected Plan:</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#5a5c69' }}>
                    {selectedPlan?.name}
                  </p>
                </div>

                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#858796' }}>Daily Return:</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#1cc88a' }}>
                    {selectedPlan?.dailyProfitMin}% - {selectedPlan?.dailyProfitMax}%
                  </p>
                </div>

                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#858796' }}>Duration:</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#5a5c69' }}>
                    {selectedPlan?.endDate} days
                  </p>
                </div>

                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#858796' }}>Payment Method:</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#5a5c69' }}>
                    {selectedCrypto} ({calculateCryptoAmount()} {selectedCrypto})
                  </p>
                </div>

                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#858796' }}>Transaction ID:</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#5a5c69', wordBreak: 'break-all' }}>
                    {transactionId}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: '0.35rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#0c5460' }}>
                By confirming, you acknowledge that you have sent the payment and provided the correct transaction ID.
                Your investment will be activated once the admin confirms your payment.
              </p>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn" onClick={handlePrevStep} disabled={loading}>
                Back
              </button>
              <button
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'I Have Made Payment - Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateInvestment;
