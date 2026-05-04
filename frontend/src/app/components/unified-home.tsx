import { useState } from 'react';
import { Play, Star, Clock, MapPin, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import { motion } from 'motion/react';

interface StreamingContent {
  id: string;
  title: string;
  platform: string;
  genre: string;
  rating: number;
  duration: string;
  image: string;
  trending?: boolean;
}

interface CinemaShowtime {
  id: string;
  title: string;
  theater: string;
  times: string[];
  distance: string;
  image: string;
}

const streamingData: StreamingContent[] = [
  {
    id: '1',
    title: 'Cosmic Odyssey',
    platform: 'Netflix',
    genre: 'Sci-Fi',
    rating: 4.8,
    duration: '2h 15m',
    image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400',
    trending: true,
  },
  {
    id: '2',
    title: 'The Last Kingdom',
    platform: 'Prime Video',
    genre: 'Drama',
    rating: 4.6,
    duration: '1h 45m',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
  },
  {
    id: '3',
    title: 'Midnight Tales',
    platform: 'Disney+',
    genre: 'Horror',
    rating: 4.3,
    duration: '1h 58m',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
  },
  {
    id: '4',
    title: 'Summer Dreams',
    platform: 'Hulu',
    genre: 'Romance',
    rating: 4.5,
    duration: '2h 5m',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
    trending: true,
  },
];

const cinemaData: CinemaShowtime[] = [
  {
    id: '1',
    title: 'Dune: Part Three',
    theater: 'AMC Empire 25',
    times: ['2:30 PM', '5:45 PM', '9:00 PM'],
    distance: '0.8 mi',
    image: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400',
  },
  {
    id: '2',
    title: 'The Matrix Resurrections',
    theater: 'Regal Union Square',
    times: ['3:15 PM', '6:30 PM', '9:45 PM'],
    distance: '1.2 mi',
    image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400',
  },
];

export function UnifiedHome() {
  const [hoveredStream, setHoveredStream] = useState<string | null>(null);
  const [hoveredCinema, setHoveredCinema] = useState<string | null>(null);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden"
      >
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200"
          alt="Featured"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <Badge className="mb-4 bg-[#8B5CF6] text-white border-none">
            <Sparkles className="w-3 h-3 mr-1" />
            Trending Now
          </Badge>
          <h1 className="text-3xl md:text-5xl mb-4 text-white">
            Welcome Back to ShowMatchGoOn
          </h1>
          <p className="text-lg text-gray-300 mb-6 max-w-2xl">
            Your personalized entertainment hub. Discover what to watch tonight across all your streaming services and local theaters.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
              <Play className="w-4 h-4 mr-2" />
              Explore Now
            </Button>
            <Button variant="outline" className="border-[#8B5CF6] text-white hover:bg-[#8B5CF6]/10">
              My Watchlist
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Streaming Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-1 text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#8B5CF6]" />
              Streaming Libraries
            </h2>
            <p className="text-gray-400">Across Netflix, Prime, Disney+ & more</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {streamingData.map((content, index) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onHoverStart={() => setHoveredStream(content.id)}
              onHoverEnd={() => setHoveredStream(null)}
            >
              <Card className="relative overflow-hidden bg-[#141920] border-[#8B5CF6]/20 hover:border-[#8B5CF6] transition-all duration-300 group cursor-pointer">
                <div className="relative h-[320px] overflow-hidden">
                  <img
                    src={content.image}
                    alt={content.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {content.trending && (
                    <Badge className="absolute top-3 right-3 bg-[#8B5CF6] text-white border-none">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent transition-opacity duration-300 ${hoveredStream === content.id ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <Button className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
                        <Play className="w-4 h-4 mr-2" />
                        Play Now
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white mb-2 truncate">{content.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span className="text-[#8B5CF6]">{content.platform}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {content.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {content.duration}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="mt-2 border-[#8B5CF6]/30 text-gray-400">
                    {content.genre}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cinema Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-1 text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-[#8B5CF6]" />
              Now in Theaters
            </h2>
            <p className="text-gray-400">Book tickets for nearby showtimes</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cinemaData.map((showtime, index) => (
            <motion.div
              key={showtime.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onHoverStart={() => setHoveredCinema(showtime.id)}
              onHoverEnd={() => setHoveredCinema(null)}
            >
              <Card className="bg-[#141920] border-[#8B5CF6]/20 hover:border-[#8B5CF6] transition-all duration-300 overflow-hidden group cursor-pointer">
                <div className="flex flex-col md:flex-row">
                  <div className="relative w-full md:w-48 h-64 md:h-auto overflow-hidden">
                    <img
                      src={showtime.image}
                      alt={showtime.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex-1">
                    <h3 className="text-xl text-white mb-2">{showtime.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                      <MapPin className="w-4 h-4 text-[#8B5CF6]" />
                      <span>{showtime.theater}</span>
                      <span className="text-[#8B5CF6]">• {showtime.distance}</span>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">Showtimes Today</p>
                      <div className="flex flex-wrap gap-2">
                        {showtime.times.map((time) => (
                          <Button
                            key={time}
                            variant="outline"
                            size="sm"
                            className="border-[#8B5CF6]/30 text-white hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6]"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full md:w-auto bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
                      Book Tickets
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
