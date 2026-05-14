import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Sidebar />
      <main className="desktop:ml-sidebar pt-header min-h-[calc(100vh-56px)]">
        <div className="max-w-content mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
