import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFound = () => (
  <div className="grid min-h-[70vh] place-items-center text-center">
    <div>
      <p className="font-display text-7xl font-extrabold text-blue">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-secondary">This route is outside the Expence Tracker workspace.</p>
      <Link to="/dashboard"><Button className="mt-6">Back to Dashboard</Button></Link>
    </div>
  </div>
);
