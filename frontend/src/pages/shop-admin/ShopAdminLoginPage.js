import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const ShopAdminLoginPage = () => {
  const { t, i18n } = useTranslation();
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.user?.role !== 'admin') {
        logout();
        setError(t('shopAdminLogin.adminOnly'));
        setLoading(false);
        return;
      }
      navigate('/shop/admin/products');
    } catch (err) {
      setError(t('login.invalidCredentials'));
      setLoading(false);
    }
  };

  return (
    <main className="zzv-staff-login zzv-shop-admin-login">
      <section className="zzv-staff-login-card" aria-labelledby="zzv-shop-admin-login-title">
        <header className="zzv-staff-login-header">
          <img src="/figma-home/trade-nav-logo.svg" width="147" height="24" alt="ZEZVA" />
          <h1 id="zzv-shop-admin-login-title">{t('shopAdminLogin.subtitle')}</h1>
        </header>
        <form className="zzv-staff-login-form" onSubmit={handleSubmit}>
          <div className="zzv-staff-login-fields">
            <label className="zzv-staff-login-field" htmlFor="shop-admin-username">
              <span>{t('login.usernameShort')}</span>
              <span className={`zzv-staff-login-input${error ? ' is-error' : ''}`}>
                <img src="/figma-staff/login-user.svg" width="20" height="20" alt="" />
                <input
                  id="shop-admin-username"
                  type="text"
                  value={username}
                  onChange={(event) => { setUsername(event.target.value); setError(''); }}
                  autoComplete="username"
                  required
                  placeholder={t('login.usernamePlaceholder')}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'shop-admin-login-error' : undefined}
                />
              </span>
            </label>
            <label className="zzv-staff-login-field" htmlFor="shop-admin-password">
              <span>{t('login.password')}</span>
              <span className={`zzv-staff-login-input${error ? ' is-error' : ''}`}>
                <img src="/figma-staff/login-lock.svg" width="20" height="20" alt="" />
                <input
                  id="shop-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setError(''); }}
                  autoComplete="current-password"
                  required
                  placeholder={t('login.passwordPlaceholder')}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'shop-admin-login-error' : undefined}
                />
                <button
                  className="zzv-staff-login-eye"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  aria-pressed={showPassword}
                >
                  <img src="/figma-staff/login-eye.svg" width="20" height="20" alt="" />
                </button>
              </span>
            </label>
          </div>
          {error && (
            <div className="zzv-staff-login-error" id="shop-admin-login-error" role="alert">
              <img src="/figma-staff/login-alert.svg" width="16" height="16" alt="" />
              <span>{error}</span>
            </div>
          )}
          <button className="zzv-staff-login-submit" type="submit" disabled={loading}>
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
        <footer className="zzv-staff-login-footer">
          <span>{t('shopAdminLogin.employeesOnly')}</span>
          <div className="zzv-staff-login-languages" role="group" aria-label={t('login.language')}>
            {['ka', 'en'].map((language) => (
              <button
                key={language}
                className={i18n.resolvedLanguage === language ? 'is-active' : ''}
                type="button"
                onClick={() => i18n.changeLanguage(language)}
                aria-label={language === 'ka' ? 'ქართული' : 'English'}
                aria-pressed={i18n.resolvedLanguage === language}
              >
                <img src={`/figma-home/trade-nav-flag-${language === 'ka' ? 'ge' : 'uk'}.svg`} width="24" height="17" alt="" />
              </button>
            ))}
          </div>
        </footer>
      </section>
    </main>
  );
};

export default ShopAdminLoginPage;
