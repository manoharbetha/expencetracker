import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { Skeleton } from '../components/ui/Skeleton';

export const AppLayout = () => (
  <div className="min-h-screen bg-base">
    <Sidebar />
    <div className="lg:pl-60">
      <Navbar />
      <main className="px-4 pb-24 pt-6 lg:px-6 lg:pb-8">
        <Suspense fallback={
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-64 rounded-card" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-36 rounded-card" />
              <Skeleton className="h-36 rounded-card" />
            </div>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
    </div>
  </div>
);
