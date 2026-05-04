import { useState } from 'react';
import { MapPin, Plus, Edit2, Clock, Calendar, Users } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';

interface Theater {
  id: string;
  name: string;
  location: string;
  screens: number;
  totalSeats: number;
}

interface Showtime {
  id: string;
  movie: string;
  theater: string;
  date: string;
  time: string;
  screen: number;
  seatsAvailable: number;
  totalSeats: number;
}

const mockTheaters: Theater[] = [
  { id: '1', name: 'AMC Empire 25', location: 'New York, NY', screens: 25, totalSeats: 5000 },
  { id: '2', name: 'Regal Union Square', location: 'New York, NY', screens: 14, totalSeats: 2800 },
  { id: '3', name: 'Alamo Drafthouse', location: 'Brooklyn, NY', screens: 8, totalSeats: 1600 },
];

const mockShowtimes: Showtime[] = [
  {
    id: '1',
    movie: 'Dune: Part Three',
    theater: 'AMC Empire 25',
    date: '2026-02-02',
    time: '7:30 PM',
    screen: 1,
    seatsAvailable: 156,
    totalSeats: 300,
  },
  {
    id: '2',
    movie: 'The Matrix Resurrections',
    theater: 'Regal Union Square',
    date: '2026-02-02',
    time: '6:30 PM',
    screen: 3,
    seatsAvailable: 89,
    totalSeats: 200,
  },
  {
    id: '3',
    movie: 'Interstellar (Re-release)',
    theater: 'Alamo Drafthouse',
    date: '2026-02-02',
    time: '8:00 PM',
    screen: 2,
    seatsAvailable: 45,
    totalSeats: 150,
  },
];

export function AdminCinema() {
  const [theaters] = useState<Theater[]>(mockTheaters);
  const [showtimes] = useState<Showtime[]>(mockShowtimes);
  const [selectedTheater, setSelectedTheater] = useState<string | null>(null);

  const getOccupancyPercentage = (available: number, total: number) => {
    return ((total - available) / total) * 100;
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl text-white mb-2">Cinema Partner Portal</h1>
          <p className="text-gray-400">Manage theater partnerships and showtimes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10">
            <MapPin className="w-4 h-4 mr-2" />
            Add Theater
          </Button>
          <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Showtime
          </Button>
        </div>
      </div>

      {/* Theater Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Total Theaters</p>
            <div className="p-2 bg-[#8B5CF6]/20 rounded-lg">
              <MapPin className="w-4 h-4 text-[#8B5CF6]" />
            </div>
          </div>
          <p className="text-3xl text-white">{theaters.length}</p>
          <p className="text-sm text-gray-400 mt-1">Active partnerships</p>
        </Card>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Total Screens</p>
            <div className="p-2 bg-[#EC4899]/20 rounded-lg">
              <Users className="w-4 h-4 text-[#EC4899]" />
            </div>
          </div>
          <p className="text-3xl text-white">{theaters.reduce((sum, t) => sum + t.screens, 0)}</p>
          <p className="text-sm text-gray-400 mt-1">Across all theaters</p>
        </Card>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Today's Shows</p>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Clock className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <p className="text-3xl text-white">{showtimes.length}</p>
          <p className="text-sm text-green-500 mt-1">Currently scheduled</p>
        </Card>
      </div>

      {/* Theaters List */}
      <div>
        <h2 className="text-2xl text-white mb-4">Theater Partners</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {theaters.map((theater) => (
            <Card
              key={theater.id}
              className={`bg-[#141920] border-[#8B5CF6]/20 hover:border-[#8B5CF6] transition-all duration-300 cursor-pointer ${
                selectedTheater === theater.id ? 'border-[#8B5CF6] bg-[#8B5CF6]/5' : ''
              }`}
              onClick={() => setSelectedTheater(theater.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white mb-1">{theater.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {theater.location}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-[#8B5CF6]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Screens</p>
                    <p className="text-lg text-white">{theater.screens}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Seats</p>
                    <p className="text-lg text-white">{theater.totalSeats.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Showtimes Schedule */}
      <div>
        <h2 className="text-2xl text-white mb-4">Today's Schedule</h2>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#8B5CF6]/20">
                  <th className="text-left p-4 text-gray-400">Movie</th>
                  <th className="text-left p-4 text-gray-400">Theater</th>
                  <th className="text-left p-4 text-gray-400">Time</th>
                  <th className="text-left p-4 text-gray-400">Screen</th>
                  <th className="text-left p-4 text-gray-400">Occupancy</th>
                  <th className="text-right p-4 text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {showtimes.map((showtime) => {
                  const occupancyPercent = getOccupancyPercentage(
                    showtime.seatsAvailable,
                    showtime.totalSeats
                  );
                  return (
                    <tr key={showtime.id} className="border-b border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/5">
                      <td className="p-4">
                        <div className="text-white">{showtime.movie}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="w-4 h-4 text-[#8B5CF6]" />
                          {showtime.theater}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4 text-[#8B5CF6]" />
                          {showtime.time}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="border-[#8B5CF6]/30 text-gray-400">
                          Screen {showtime.screen}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`${getOccupancyColor(occupancyPercent)}`}>
                              {occupancyPercent.toFixed(0)}%
                            </span>
                            <span className="text-gray-400 text-sm">
                              ({showtime.totalSeats - showtime.seatsAvailable}/{showtime.totalSeats})
                            </span>
                          </div>
                          <div className="w-full bg-[#0B0E14] rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                occupancyPercent >= 80
                                  ? 'bg-red-500'
                                  : occupancyPercent >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${occupancyPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Seating Layout Manager */}
      <div>
        <h2 className="text-2xl text-white mb-4">Seating Layout Manager</h2>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <p className="text-gray-400 mb-4">
            Configure seating layouts for each screen. Click on a theater to manage its seating arrangements.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Theater</label>
              <select className="w-full bg-[#0B0E14] border border-[#8B5CF6]/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6]">
                <option>Select theater...</option>
                {theaters.map((theater) => (
                  <option key={theater.id} value={theater.id}>
                    {theater.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Screen Number</label>
              <Input
                type="number"
                placeholder="Enter screen number"
                className="bg-[#0B0E14] border-[#8B5CF6]/20 text-white"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
              Configure Layout
            </Button>
            <Button variant="outline" className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10">
              Preview
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
