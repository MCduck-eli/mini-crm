import { Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { WorkerRoute } from './auth/WorkerRoute';
import { AppLayout } from './components/AppLayout';
import { BootScreen } from './components/BootScreen';
import { SetupNotice } from './components/SetupNotice';
import { isSupabaseConfigured } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import { ObjectsPage } from './pages/ObjectsPage';
import { ObjectPage } from './pages/ObjectPage';
import { TaskPage } from './pages/TaskPage';
import { MyTasksPage } from './pages/MyTasksPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  const { session, checking } = useAuth();

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (checking && !session) return <BootScreen />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<ObjectsPage />} />
        <Route path="/objects/:id" element={<ObjectPage />} />
        <Route path="/tasks/:id" element={<TaskPage />} />
        <Route
          path="/my-tasks"
          element={
            <WorkerRoute>
              <MyTasksPage />
            </WorkerRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
