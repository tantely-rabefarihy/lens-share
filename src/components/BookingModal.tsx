import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Gear {
  id: string;
  name: string;
  owner_id: string;
  gear_pricing?: { hourly_rate: number; daily_rate: number } | null;
}

interface BookingModalProps {
  gear: Gear;
  pricing: { hourly_rate: number; daily_rate: number };
  onClose: () => void;
}

export function BookingModal({ gear, pricing, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const [rentalType, setRentalType] = useState<'hourly' | 'daily'>('daily');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rate = rentalType === 'hourly' ? pricing.hourly_rate : pricing.daily_rate;
  const totalPrice = rate * quantity;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setError('You must be logged in to book');
      setLoading(false);
      return;
    }

    if (!startDate) {
      setError('Please select a start date');
      setLoading(false);
      return;
    }

    try {
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(startDateTime);

      if (rentalType === 'hourly') {
        endDateTime.setHours(endDateTime.getHours() + quantity);
      } else {
        endDateTime.setDate(endDateTime.getDate() + quantity);
      }

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          gear_id: gear.id,
          renter_id: user.id,
          owner_id: gear.owner_id,
          start_date: startDateTime.toISOString(),
          end_date: endDateTime.toISOString(),
          rental_type: rentalType,
          total_price: totalPrice,
          payment_status: 'pending',
        })
        .select()
        .maybeSingle();

      if (bookingError) throw bookingError;

      // TODO: Integrate with Stripe
      // For now, we'll redirect to Stripe checkout
      if (booking) {
        const stripeCheckoutUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;

        try {
          const response = await fetch(stripeCheckoutUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              booking_id: booking.id,
              gear_name: gear.name,
              total_price: totalPrice,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create checkout session');
          }

          const { url } = await response.json();
          if (url) {
            window.location.href = url;
          }
        } catch (stripeError) {
          console.error('Stripe error:', stripeError);
          setError('Payment system unavailable. Booking created but payment failed.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Book {gear.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleBooking} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rental Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRentalType('hourly');
                  setQuantity(1);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  rentalType === 'hourly'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hourly (${pricing.hourly_rate}/hr)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRentalType('daily');
                  setQuantity(1);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  rentalType === 'daily'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Daily (${pricing.daily_rate}/day)
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              {rentalType === 'hourly' ? 'Hours' : 'Days'}
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              max="365"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-700">Rate:</span>
              <span className="font-semibold">${rate}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-gray-700">Quantity:</span>
              <span className="font-semibold">{quantity}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="font-bold text-2xl text-blue-600">${totalPrice}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}