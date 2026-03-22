import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronRight, Scale, BookOpen, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import '../styles/App.css';

function Terms() {
  const lastRevised = "16 January, 2021";

  const sections = [
    { id: "definitions", title: "I. Definitions", icon: <BookOpen size={20} /> },
    { id: "general", title: "II. General Provisions", icon: <Scale size={20} /> },
    { id: "services", title: "III. Services", icon: <Shield size={20} /> },
    { id: "liabilities", title: "IV. Liabilities", icon: <AlertCircle size={20} /> },
    { id: "miscellaneous", title: "XI. Miscellaneous", icon: <CheckCircle size={20} /> }
  ];

  return (
    <div className="terms-page" style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)', 
      color: 'var(--text-primary)',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Premium Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
        padding: '4rem 2rem',
        textAlign: 'center',
        borderBottom: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', zIndex: 0
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <Link to="/register" style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
            color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600',
            marginBottom: '1.5rem', fontSize: '0.9rem'
          }}>
            <ArrowLeft size={16} /> Back to Registration
          </Link>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Terms of <span style={{ color: 'var(--accent-primary)' }}>Service</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Last revised: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{lastRevised}</span>
          </p>
        </div>
      </div>

      <div className="terms-container" style={{ 
        maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem',
        display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '4rem'
      }}>
        {/* Sidebar Navigation */}
        <aside style={{ position: 'sticky', top: '2rem', alignSelf: 'start' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Navigation</h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  borderRadius: '12px', color: 'var(--text-secondary)', textDecoration: 'none',
                  fontSize: '0.95rem', fontWeight: '500', transition: 'all 0.2s'
                }} className="terms-nav-item">
                  {s.icon} {s.title.split('. ')[1]}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <article style={{ fontSize: '1.05rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.85)' }}>
          <div className="legal-intro" style={{ marginBottom: '4rem' }}>
            <p>These Capital Trade Markets Terms of Use is entered into between you (hereinafter referred to as “you” or “your”) and operators (as defined below). By accessing, using or clicking on “I agree” to accept any Capital Trades Markets Services (as defined below) provided by Capital Trade Markets (as defined below), you agree that you have read, understood and accepted all of the terms and conditions stipulated in these Terms of Use (hereinafter referred to as “these Terms”). In addition, when using some features of the Services, you may be subject to specific additional terms and conditions applicable to those features.</p>
            <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '1.5px dashed rgba(239, 68, 68, 0.3)', margin: '2rem 0' }}>
              <p style={{ margin: 0, color: '#ef4444', fontWeight: '700' }}>
                PLEASE READ THE TERMS CAREFULLY AS THEY GOVERN YOUR USE OF CAPITAL TRADE MARKETS SERVICES. THESE TERMS CONTAIN IMPORTANT PROVISIONS INCLUDING AN ARBITRATION PROVISION THAT REQUIRES ALL CLAIMS TO BE RESOLVED BY WAY OF LEGALLY BINDING ARBITRATION.
              </p>
            </div>
            <p style={{ fontWeight: '800', color: 'var(--text-primary)' }}>BY MAKING USE OF CAPITAL TRADE MARKETS SERVICES, YOU ACKNOWLEDGE AND AGREE THAT:</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <CheckCircle size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '5px' }} />
                <span>YOU ARE AT LEAST 18 OR ARE OF LEGAL AGE TO FORM A BINDING CONTRACT UNDER APPLICABLE LAWS.</span>
              </li>
              <li style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <CheckCircle size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '5px' }} />
                <span>WE ASSUME ALL THE TRADING RISKS RELATED TO THE USE OF CAPITAL TRADE MARKETS SERVICES AND TRANSACTIONS OF STOCKS, FOREIGN EXCHANGE, COMMODITIES, REAL ESTATE (IN DIGITAL CURRENCIES); DIGITAL CURRENCIES AND THEIR DERIVATIVES; AND WEALTH MANAGEMENT.</span>
              </li>
              <li style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <CheckCircle size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '5px' }} />
                <span>YOU SHALL NOT BE LIABLE FOR ANY SUCH RISKS.</span>
              </li>
            </ul>
          </div>

          <section id="definitions" style={{ marginBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--accent-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                 <BookOpen size={20} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>I. Definitions</h2>
            </div>
            
            <div className="legal-block">
              <p><strong>1. Capital Trade Markets</strong> refers to an ecosystem comprising Capital Trade Markets websites (whose domain names include but are not limited to capitaltrademarkets.net), clients, applets and other tools that are developed to offer Capital Trade Markets Services, and includes independently-operated platforms, websites and clients within the ecosystem.</p>
              <p><strong>2. Capital Trade Markets Operators</strong> refer to all parties that run Capital Trade Markets, including but not limited to legal persons, unincorporated organizations and teams that provide Capital Trade Markets Services and are responsible for such services.</p>
              <p><strong>3. Capital Trade Markets Services</strong> refer to various services provided to you by Capital Trade Markets that are based on Internet and/or blockchain technologies and offered via Capital Trade Markets websites, clients and other forms.</p>
              <p><strong>4. Digital Currencies</strong> refer to encrypted or digital tokens or cryptocurrencies with a certain value that are based on blockchain and cryptography technologies and are issued and managed in a decentralized form.</p>
              <p><strong>...and more.</strong> (Full definitions available below for Stocks, Commodities, Foreign Exchange, and Collateral Accounts)</p>
            </div>
          </section>

          <section id="general" style={{ marginBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--accent-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                 <Scale size={20} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>II. General Provisions</h2>
            </div>
            
            <div className="legal-block" style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>Account Registration Requirements</h4>
              <p>All Users must apply for a Capital Trade Markets Account before using Services. You agree to provide complete and accurate information when opening an account. Institutional Users can open subaccounts with consent. Capital Trade Markets reserves the right to deactivate, after 48hours, any trading account that was created but not funded.</p>
              <p><strong>Eligibility:</strong> By registering, you warrant that you are at least 18 years of age and haven't been previously suspended from our ecosystem.</p>
            </div>
          </section>

          <section id="services" style={{ marginBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--accent-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                 <Shield size={20} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>III. Services</h2>
            </div>
            
            <p>Upon completion of registration, you may access Crypto-to-crypto trading, Foreign Exchange, Stock trading, Commodities trading, ETFs trading and Fractionalized Real Estate. Capital Trade Markets maintains a highly experienced broker assignment system for market calls and placements.</p>
            
            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="stat-card-new glass" style={{ margin: 0 }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Wealth Management</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Interests up to 6% for idle Digital Assets through our portfolio management protocols.</p>
              </div>
              <div className="stat-card-new glass" style={{ margin: 0 }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Brokerage Fee</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tiered commission from 5% to 10% based on account category. No hidden deductions.</p>
              </div>
            </div>
          </section>

          <section id="liabilities" style={{ marginBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '40px', height: '40px', background: '#ef4444', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                 <AlertCircle size={20} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>IV. Liabilities</h2>
            </div>
            <p style={{ color: '#ef4444', fontWeight: '700' }}>DISCLAIMER OF WARRANTIES</p>
            <p>SERVICES ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS. WE EXPRESSLY DISCLAIM ALL WARRANTIES INCLUDING MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. CAPITAL TRADE MARKETS TAKES NO RESPONSIBILITY FOR DEPOSITS MADE TO ADDRESSES NOT LISTED ON THE OFFICIAL WEBSITE.</p>
          </section>

          <div style={{ 
            padding: '3rem', background: 'var(--bg-secondary)', 
            borderRadius: '32px', textAlign: 'center', marginTop: '6rem',
            border: '1px solid var(--border-color)'
          }}>
            <img src="/logo.png" alt="Logo" style={{ maxWidth: '180px', marginBottom: '1.5rem', opacity: 0.6 }} />
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              &copy; 2021 Capital Trade Markets Ecosystem. All rights reserved.<br />
              Continuous use of the platform constitutes agreement to the latest terms.
            </p>
          </div>
        </article>
      </div>

      <style>{`
        .legal-block p { margin-bottom: 1.5rem; }
        .legal-block strong { color: var(--text-primary); }
        .terms-nav-item:hover {
          background: rgba(99, 102, 241, 0.1);
          color: var(--accent-primary);
        }
        @media (max-width: 900px) {
          .terms-container { grid-template-columns: 1fr; }
          aside { display: none; }
        }
      `}</style>
    </div>
  );
}

export default Terms;
