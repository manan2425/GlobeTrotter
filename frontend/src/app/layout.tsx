import './globals.css';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import MobileNav from '../components/MobileNav';

export const metadata = {
  title: 'GlobeTrotter — Personalized Intelligent Travel Planning Platform',
  description: 'Discover destinations, create multi-city trips, build day-wise itineraries, manage budgets, visualize on interactive maps and calendars, and collaborate.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 flex flex-col min-h-screen">
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }
            }}
          />
          <Navbar />
          <main className="flex-1 pb-20 md:pb-8">
            {children}
          </main>
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
