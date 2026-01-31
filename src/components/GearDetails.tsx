import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BookingModal } from './BookingModal';

interface Gear {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  owner_id: string;
  gear_pricing: { hourly_rate: number; daily_rate: number } | null;
  gear_images: { image_url: string }[];
  profiles: { display_name: string } | null;
}

interface GearDetailsProps {
  gear: Gear;
  onClose: () => void;
}

export function GearDetails({ gear, onClose }: GearDetailsProps) {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [rentalType, setRentalType] = useState<'hourly' | 'daily'>('daily');

  const primaryImage = gear.gear_images?.[0]?.image_url;
  const pricing = gear.gear_pricing;
  const isOwner = user?.id === gear.owner_id;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? gear.gear_images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === gear.gear_images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl sm:rounded-2xl">
          <div className="sticky top-0 flex justify-between items-center p-4 sm:p-6 border-b bg-white gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 line-clamp-2">{gear.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              {gear.gear_images.length > 0 && (
                <div className="relative bg-gray-200 rounded-lg overflow-hidden mb-4 h-48 sm:h-96">
                  <img
                    src={gear.gear_images[currentImageIndex].image_url}
                    alt={gear.name}
                    className="w-full h-full object-cover"
                  />
                  {gear.gear_images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition"
                      >
                        ←
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition"
                      >
                        →
                      </button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {gear.gear_images.length}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-gray-600 mb-4">{gear.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Category</p>
                  <p className="font-semibold text-sm sm:text-base text-gray-900">{gear.category}</p>
                </div>
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Condition</p>
                  <p className="font-semibold text-sm sm:text-base text-gray-900">{gear.condition}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-900 mb-4">Owner Information</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{gear.profiles?.display_name || 'Unknown User'}</p>
              </div>
            </div>

            {pricing && !isOwner && (
              <div className="border-t pt-4 sm:pt-6">
                <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">Rental Pricing</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
                    <Clock className="w-5 h-5 text-blue-600 mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600">Per Hour</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">${pricing.hourly_rate}</p>
                  </div>
                  <div className="p-3 sm:p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
                    <Calendar className="w-5 h-5 text-blue-600 mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600">Per Day</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">${pricing.daily_rate}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowBooking(true)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition"
                >
                  Book Now
                </button>
              </div>
            )}

            {isOwner && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900">This is your equipment. You cannot book it.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBooking && pricing && (
        <BookingModal
          gear={gear}
          pricing={pricing}
          onClose={() => setShowBooking(false)}
        />
      )}
    </>
  );
}