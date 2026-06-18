import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PageSizeProvider } from './context/PageSizeContext';
import { ToastProvider } from './context/ToastContext';
import { AppRouter } from './router';
import './index.css';

// Always use light Ventorio theme
document.documentElement.classList.remove('dark');
localStorage.setItem('theme', 'light');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PageSizeProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </PageSizeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
