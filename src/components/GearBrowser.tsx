import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Star, Calendar } from 'lucide-react';
import { GearDetails } from './GearDetails';

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

const CATEGORIES = [
  'All',
  'Camera Bodies',
  'Lenses',
  'Lighting',
  'Tripods',
  'Stabilizers',
  'Audio',
  'Filters',
];

export function GearBrowser() {
  const { user } = useAuth();
  const [gear, setGear] = useState<Gear[]>([]);
  const [filteredGear, setFilteredGear] = useState<Gear[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGear, setSelectedGear] = useState<Gear | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadGear();
  }, []);

  useEffect(() => {
    filterGear();
  }, [gear, selectedCategory, searchQuery]);

  const loadGear = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gear')
        .select(
          `
          *,
          gear_pricing(*),
          gear_images(*),
          profiles(display_name)
        `
        )
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGear(data || []);
    } catch (error) {
      console.error('Error loading gear:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterGear = () => {
    let filtered = gear;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((g) => g.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredGear(filtered);
  };

  const handleGearClick = (g: Gear) => {
    setSelectedGear(g);
    setShowDetails(true);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading gear...</div>;
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Available Equipment</h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-white bg-opacity-50 border border-white border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition font-medium ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-white bg-opacity-50 text-gray-700 hover:bg-opacity-70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredGear.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          No equipment found. Try adjusting your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGear.map((g) => {
            const primaryImage = g.gear_images?.[0]?.image_url;
            const pricing = g.gear_pricing;

            return (
              <div
                key={g.id}
                onClick={() => handleGearClick(g)}
                className="backdrop-blur-md bg-glass border border-white border-opacity-20 rounded-xl overflow-hidden shadow-glass hover:shadow-lg transition cursor-pointer group"
              >
                <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={g.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-400">No image</div>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <button className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition">
                      <Heart className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{g.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{g.description}</p>

                  <div className="flex gap-2 mb-3">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {g.category}
                    </span>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {g.condition}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">by {g.profiles?.display_name || 'Unknown'}</p>

                  {pricing && (
                    <div className="flex justify-between items-center mb-3 pt-3 border-t border-white border-opacity-20">
                      <div>
                        <p className="text-xs text-gray-600">Hourly</p>
                        <p className="font-bold text-gray-900">${pricing.hourly_rate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Daily</p>
                        <p className="font-bold text-gray-900">${pricing.daily_rate}</p>
                      </div>
                    </div>
                  )}

                  <button className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showDetails && selectedGear && (
        <GearDetails gear={selectedGear} onClose={() => setShowDetails(false)} />
      )}
    </>
  );
}