import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { AddGearModal } from './AddGearModal';
import { EditGearModal } from './EditGearModal';
import { DeleteGearModal } from './DeleteGearModal';

interface Gear {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  available: boolean;
  gear_pricing: { hourly_rate: number; daily_rate: number } | null;
  gear_images: { image_url: string }[];
}

export function GearManagement() {
  const { user } = useAuth();
  const [gear, setGear] = useState<Gear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGear, setEditingGear] = useState<Gear | null>(null);
  const [deletingGear, setDeletingGear] = useState<Gear | null>(null);

  useEffect(() => {
    if (user) {
      loadGear();
    }
  }, [user]);

  const loadGear = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gear')
        .select(
          `
          *,
          gear_pricing(*),
          gear_images(*)
        `
        )
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGear(data || []);
    } catch (error) {
      console.error('Error loading gear:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (gear: Gear) => {
    setDeletingGear(gear);
  };

  const handleDeleteSuccess = () => {
    if (deletingGear) {
      setGear((prev) => prev.filter((g) => g.id !== deletingGear.id));
    }
  };

  const handleToggleAvailability = async (gearId: string, currentAvailable: boolean) => {
    try {
      await supabase
        .from('gear')
        .update({ available: !currentAvailable })
        .eq('id', gearId);

      setGear((prev) =>
        prev.map((g) =>
          g.id === gearId ? { ...g, available: !currentAvailable } : g
        )
      );
    } catch (error) {
      console.error('Error updating gear:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading your equipment...</div>;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Equipment</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Equipment
        </button>
      </div>

      {gear.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't added any equipment yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Your First Equipment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {gear.map((g) => {
            const primaryImage = g.gear_images?.[0]?.image_url;
            const pricing = g.gear_pricing;

            return (
              <div
                key={g.id}
                className="backdrop-blur-md bg-glass border border-white border-opacity-20 rounded-xl p-4 shadow-glass"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {primaryImage && (
                    <div className="sm:hidden w-full h-48 rounded-lg overflow-hidden">
                      <img
                        src={primaryImage}
                        alt={g.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {primaryImage && (
                    <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={primaryImage}
                        alt={g.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{g.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{g.description}</p>

                      {pricing && (
                        <p className="text-sm text-gray-600 mb-3">
                          ${pricing.hourly_rate}/hr • ${pricing.daily_rate}/day
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto pt-3 sm:pt-4">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {g.category}
                      </span>
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {g.condition}
                      </span>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          g.available
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {g.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto sm:justify-end">
                    <button
                      onClick={() => handleToggleAvailability(g.id, g.available)}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition w-full sm:w-auto ${
                        g.available
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                          : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                      }`}
                      title={g.available ? 'Mark unavailable' : 'Mark available'}
                    >
                      <span className="text-sm">{g.available ? '✓ Available' : '✗ Unavailable'}</span>
                    </button>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setEditingGear(g)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition flex items-center justify-center gap-2"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-sm">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(g)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition flex items-center justify-center gap-2"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && <AddGearModal onClose={() => setShowAddModal(false)} onSuccess={loadGear} />}
      {editingGear && (
        <EditGearModal
          gear={editingGear}
          onClose={() => setEditingGear(null)}
          onSuccess={loadGear}
        />
      )}
      {deletingGear && (
        <DeleteGearModal
          gearId={deletingGear.id}
          gearName={deletingGear.name}
          onClose={() => setDeletingGear(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  );
}