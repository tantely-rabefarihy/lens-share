import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, LogOut, Menu, X, Camera } from 'lucide-react';
import { GearBrowser } from '../components/GearBrowser';
import { GearManagement } from '../components/GearManagement';
import { LocationPermissionModal } from '../components/LocationPermissionModal';

type Tab = 'browse' | 'manage';

export function DashboardPage() {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(data);

    if (data && !data.latitude && !data.longitude) {
      setShowLocationModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-glass border-b border-white border-opacity-20 shadow-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span className="hidden sm:inline text-xl font-bold text-gray-900">LensShare</span>
            </div>

            <div className="hidden md:flex gap-1 bg-white bg-opacity-30 rounded-full p-1">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-6 py-2 rounded-full transition ${
                  activeTab === 'browse'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-6 py-2 rounded-full transition ${
                  activeTab === 'manage'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Manage
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm text-gray-700">{profile?.display_name || user?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="p-2 hover:bg-white hover:bg-opacity-30 rounded-full transition"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('browse');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-white hover:bg-opacity-30 rounded-lg"
              >
                Browse
              </button>
              <button
                onClick={() => {
                  setActiveTab('manage');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-white hover:bg-opacity-30 rounded-lg"
              >
                Manage
              </button>
              <button
                onClick={() => signOut()}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'browse' && <GearBrowser />}
        {activeTab === 'manage' && <GearManagement />}
      </main>

      {showLocationModal && (
        <LocationPermissionModal onClose={() => setShowLocationModal(false)} />
      )}
    </div>
  );
}