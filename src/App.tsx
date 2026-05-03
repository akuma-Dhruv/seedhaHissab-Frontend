import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import NotFound from '@/pages/not-found';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import ProjectsPage from '@/pages/projects';
import ProjectDashboardPage from '@/pages/project-dashboard';
import TransactionFormPage from '@/pages/transaction-form';
import PersonalDashboardPage from '@/pages/personal-dashboard';
import PersonalTransactionFormPage from '@/pages/personal-transaction-form';
import PersonalCounterpartiesPage from '@/pages/personal-counterparties';
import PersonalCounterpartyLedgerPage from '@/pages/personal-counterparty-ledger';
import RemindersPage from '@/pages/reminders';
import ProjectInstallmentsPage from '@/pages/project-installments';
import InstallmentDetailPage from '@/pages/installment-detail';
import { isAuthenticated } from '@/lib/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="seedhahisaab-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter
          basename={import.meta.env.BASE_URL.replace(/\/$/, '')}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId/transactions/:txId/edit" element={<TransactionFormPage />} />
            <Route path="/projects/:projectId/transactions/new" element={<TransactionFormPage />} />
            <Route path="/projects/:projectId/installments" element={<ProjectInstallmentsPage />} />
            <Route path="/installments/:id" element={<InstallmentDetailPage />} />
            <Route path="/projects/:projectId" element={<ProjectDashboardPage />} />
            <Route path="/personal" element={<PersonalDashboardPage />} />
            <Route path="/personal/transactions/new" element={<PersonalTransactionFormPage />} />
            <Route path="/personal/transactions/:id/edit" element={<PersonalTransactionFormPage />} />
            <Route path="/personal/counterparties" element={<PersonalCounterpartiesPage />} />
            <Route path="/personal/counterparties/:name" element={<PersonalCounterpartyLedgerPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/" element={<Navigate to={isAuthenticated() ? '/projects' : '/login'} replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
