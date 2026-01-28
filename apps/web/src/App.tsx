import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '@/providers/app-provider';
import { ProtectedRoute } from '@/modules/auth/components/protected-route';
import { LandingPage } from '@/modules/landing/pages/landing-page';

const Dashboard = () => <h1>Dashboard</h1>;
const ListDetail = () => <h1>List Detail</h1>;

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Private Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lists/:listId" element={<ListDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
