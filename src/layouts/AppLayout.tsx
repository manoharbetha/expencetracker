import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';

export const AppLayout = () => (
  <div className="min-h-screen bg-base">
    <Sidebar />
    <div className="lg:pl-60">
      <Navbar />
      <main className="px-4 pb-24 pt-6 lg:px-6 lg:pb-8">
        <Outlet />
      </main>
    </div>
  </div>
);
