import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DeleteGearModalProps {
  gearId: string;
  gearName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteGearModal({ gearId, gearName, onClose, onSuccess }: DeleteGearModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setLoading(true);

    try {
      await supabase.from('gear').delete().eq('id', gearId);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full shadow-lg">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 line-clamp-1">Delete Equipment</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex gap-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900 mb-2">
                This action cannot be undone.
              </p>
              <p className="text-sm text-red-700">
                You are about to permanently delete <strong>{gearName}</strong> from your equipment list.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Equipment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
