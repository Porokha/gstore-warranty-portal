import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/staff/dashboard');
    } catch (err) {
      setError(err.response?.status === 401
        ? t('login.invalidCredentials')
        : err.response?.data?.message || t('login.invalidCredentials'));
      setLoading(false);
    }
  };

  return (
    <main className="zzv-staff-login">
      <div className="zzv-staff-login-stack">
        <section className="zzv-staff-login-card" aria-labelledby="zzv-staff-login-title">
          <header className="zzv-staff-login-header">
            <img src="/figma-home/trade-nav-logo.svg" width="147" height="24" alt="ZEZVA" />
            <h1 id="zzv-staff-login-title">{t('login.portalSubtitle')}</h1>
          </header>

          <form className="zzv-staff-login-form" onSubmit={handleSubmit}>
            <div className="zzv-staff-login-fields">
              <label className="zzv-staff-login-field" htmlFor="staff-username">
                <span>{t('login.usernameShort')}</span>
                <span className={`zzv-staff-login-input${error ? ' is-error' : ''}`}>
                  <img src="/figma-staff/login-user.svg" width="20" height="20" alt="" />
                  <input
                    id="staff-username"
                    type="text"
                    value={username}
                    onChange={(event) => { setUsername(event.target.value); setError(''); }}
                    autoComplete="username"
                    required
                    placeholder={t('login.usernamePlaceholder')}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'staff-login-error' : undefined}
                  />
                </span>
              </label>
              <label className="zzv-staff-login-field" htmlFor="staff-password">
                <span>{t('login.password')}</span>
                <span className={`zzv-staff-login-input${error ? ' is-error' : ''}`}>
                  <img src="/figma-staff/login-lock.svg" width="20" height="20" alt="" />
                  <input
                    id="staff-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setError(''); }}
                    autoComplete="current-password"
                    required
                    placeholder={t('login.passwordPlaceholder')}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'staff-login-error' : undefined}
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

            <label className="zzv-staff-login-remember">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>{t('login.rememberMe')}</span>
            </label>

            {error && (
              <div className="zzv-staff-login-error" id="staff-login-error" role="alert">
                <img src="/figma-staff/login-alert.svg" width="16" height="16" alt="" />
                <span>{error}</span>
              </div>
            )}

            <button className="zzv-staff-login-submit" type="submit" disabled={loading}>
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <footer className="zzv-staff-login-footer">
            <span>{t('login.staffPortalOnly')}</span>
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
        <p className="zzv-staff-login-copyright">{t('login.copyright')}</p>
      </div>
    </main>
  );
};

export default LoginPage;
