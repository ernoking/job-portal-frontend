import './AnalysisProgress.css';

export default function AnalysisProgress({ uploaded }) {
  return (
    <section className="analysis-progress" role="status" aria-live="polite" data-testid="analysis-progress">
      <div className="analysis-progress-eyebrow">AI ANALYSIS</div>
      <h2>{uploaded ? 'AI resume analysis in progress…' : 'Uploading your resume…'}</h2>
      <div className="analysis-progress-step">
        <span className="analysis-progress-icon" aria-hidden="true">{uploaded ? '✓' : '↑'}</span>
        <span>{uploaded ? 'Document uploaded successfully' : 'Uploading your document securely…'}</span>
      </div>
      <p>{uploaded ? 'Analysing your skills and experience…' : 'Preparing your resume for analysis…'}</p>
      <div className="analysis-progress-track" role="progressbar" aria-label="Resume analysis in progress">
        <div className="analysis-progress-fill" />
      </div>
      <p className="analysis-progress-caption">Processing your CV…</p>
    </section>
  );
}
