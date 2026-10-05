import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StatusStepper from './StatusStepper';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

describe('StatusStepper', () => {
  it('offers all stages to a manager and marks an unsaved direct jump', () => {
    const markup = renderToStaticMarkup(
      <StatusStepper currentStatus={1} selectedStatus={3} onSelectStatus={() => {}} />,
    );

    expect(markup.match(/<button/g)).toHaveLength(4);
    expect(markup).toContain('zzv-case-timeline__step--draft');
    expect(markup).toContain('aria-label="case.chooseNextStage: status.pending" aria-pressed="true"');
    expect(markup).toContain('case.unsavedStage');
  });

  it('does not offer current or previous stages to a technician', () => {
    const markup = renderToStaticMarkup(
      <StatusStepper currentStatus={2} onSelectStatus={() => {}} canSelectStatus={(status) => status > 2} />,
    );

    expect(markup.match(/<button/g)).toHaveLength(2);
    expect(markup).toContain('aria-label="case.chooseNextStage: status.pending"');
    expect(markup).not.toContain('aria-label="case.chooseNextStage: status.opened"');
  });
});
