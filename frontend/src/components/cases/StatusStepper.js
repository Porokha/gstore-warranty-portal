import React from 'react';
import { useTranslation } from 'react-i18next';

const formatTimestamp = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(/\//g, '.');
};

const StatusStepper = ({ currentStatus, selectedStatus = currentStatus, statusTimestamps = {}, onSelectStatus, canSelectStatus = () => true, children }) => {
  const { t } = useTranslation();
  const steps = [
    t('status.opened'),
    t('status.investigating'),
    t('status.pending'),
    t('status.completed'),
  ];

  return (
    <section className="zzv-case-timeline" aria-label={t('case.currentStage')}>
      <h2>{t('case.stage')}</h2>
      <ol>
        {steps.map((label, index) => {
          const number = index + 1;
          const state = number < currentStatus ? 'done' : number === currentStatus ? 'current' : 'future';
          const isDraft = selectedStatus !== currentStatus && number === selectedStatus;
          const selectable = Boolean(onSelectStatus) && canSelectStatus(number);
          return (
            <li key={number} aria-current={state === 'current' ? 'step' : undefined} className={`zzv-case-timeline__step zzv-case-timeline__step--${state}${isDraft ? ' zzv-case-timeline__step--draft' : ''}`}>
              <div className="zzv-case-timeline__rail">
                <span className="zzv-case-timeline__line" />
                {selectable ? (
                  <button
                    type="button"
                    className="zzv-case-timeline__circle"
                    aria-label={`${t('case.chooseNextStage')}: ${label}`}
                    aria-pressed={selectedStatus === number}
                    onClick={() => onSelectStatus(number)}
                  >{state === 'done' ? <img src="/figma-staff/detail-check.svg" alt="" /> : number}</button>
                ) : (
                  <span className="zzv-case-timeline__circle">{state === 'done' ? <img src="/figma-staff/detail-check.svg" alt="" /> : number}</span>
                )}
                <span className="zzv-case-timeline__line" />
              </div>
              <span className="zzv-case-timeline__label">{label}</span>
              {isDraft ? <small>{t('case.unsavedStage')}</small> : state === 'current' ? <small>{t('case.currentStage')}</small> : statusTimestamps[number] ? <small>{formatTimestamp(statusTimestamps[number])}</small> : null}
            </li>
          );
        })}
      </ol>
      {children}
    </section>
  );
};

export default StatusStepper;
