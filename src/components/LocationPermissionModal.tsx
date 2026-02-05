import React, { useState } from 'react';
import { MapPin, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LocationPermissionModalProps {
  onClose: () => void;
}

export function LocationPermissionModal({ onClose }: LocationPermissionModalProps) {
  const { updateUserLocation } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRequestLocation = async () => {
    setError('');
    setLoading(true);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await updateUserLocation(latitude, longitude);
          setSuccess(true);
          setTimeout(() => onClose(), 2000);
        },
        (err) => {
          if (err.code === 1) {
            setError('Location permission denied. You can enable it anytime in settings.');
          } else if (err.code === 2) {
            setError('Unable to retrieve your location. Please check your connection.');
          } else {
            setError('An error occurred while retrieving your location.');
          }
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-6 sm:p-8 text-center">
          <CheckCircle className="w-12 sm:w-16 h-12 sm:h-16 text-green-500 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Location Saved</h2>
          <p className="text-sm sm:text-base text-gray-600">Your location has been saved. You'll now see equipment within 10 km.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 line-clamp-1">Enable Location</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex gap-3">
            <MapPin className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-1" />
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">Find Gear Near You</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                We'll use your location to show you equipment available within 10 km. This helps connect photographers in your area.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-900">
              <strong>Privacy:</strong> Your location is only used to filter results and is never shared with other users. You can update or disable this anytime.
            </p>
          </div>

          {error && (
            <div className="flex gap-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
              <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleRequestLocation}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Requesting...' : 'Enable Location'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Skip for Now
            </button>
          </div>

          <p className="text-xs sm:text-xs text-gray-500 text-center">
            You can enable location anytime from your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
}