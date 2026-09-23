import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import '../../../styles/static-pages-figma.css';

const StaticPageFrame = ({ title, narrow = false, children }) => {
  const navigate = useNavigate();
  return <main className={`zzv-static-page${narrow ? ' zzv-static-page--narrow' : ''}`}>
    <div className="zzv-static-mobile-bar">
      <button type="button" aria-label="Back" onClick={() => navigate(-1)}><ArrowBack aria-hidden="true" /></button>
      <span>{title}</span>
    </div>
    <div className="zzv-static-content">
      <h1>{title}</h1>
      {children}
    </div>
  </main>;
};

export default StaticPageFrame;
