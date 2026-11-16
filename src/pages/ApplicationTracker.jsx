import AppNav from '../components/nav/AppNav';
import './ApplicationTracker.css';

export default function ApplicationTracker() {
  return (
    <div className="tracker-page">
      <AppNav activeTab="tracker" />
      <main className="tracker-main" data-testid="tracker-main" />
    </div>
  );
}
