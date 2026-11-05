import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
