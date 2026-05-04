import { useState } from 'react';
import { Sparkles, Users, Coffee, Heart, Zap, Moon, Sun, Smile } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { motion } from 'motion/react';

interface MoodOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  genre: string;
  rating: number;
  image: string;
  match: number;
}

const moods: MoodOption[] = [
  {
    id: 'kids',
    label: 'Watching with kids',
    icon: Users,
    description: 'Family-friendly entertainment',
    color: '#10B981',
  },
  {
    id: 'relaxing',
    label: 'After a long day',
    icon: Coffee,
    description: 'Light, feel-good content',
    color: '#8B5CF6',
  },
  {
    id: 'romantic',
    label: 'Date night',
    icon: Heart,
    description: 'Romantic and engaging',
    color: '#EC4899',
  },
  {
    id: 'thrilling',
    label: 'Need excitement',
    icon: Zap,
    description: 'Action-packed adventures',
    color: '#F59E0B',
  },
  {
    id: 'late',
    label: 'Late night vibes',
    icon: Moon,
    description: 'Mysterious and captivating',
    color: '#6366F1',
  },
  {
    id: 'morning',
    label: 'Fresh start',
    icon: Sun,
    description: 'Uplifting and inspiring',
    color: '#F59E0B',
  },
  {
    id: 'comedy',
    label: 'Need a laugh',
    icon: Smile,
    description: 'Comedy and humor',
    color: '#06B6D4',
  },
];

const recommendationsByMood: Record<string, Recommendation[]> = {
  kids: [
    {
      id: '1',
      title: 'Wonder Park',
      reason: 'Perfect for ages 6-12, teaches creativity and friendship',
      genre: 'Animation',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
      match: 98,
    },
    {
      id: '2',
      title: 'Ocean Quest',
      reason: 'Educational and entertaining underwater adventure',
      genre: 'Family',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
      match: 95,
    },
    {
      id: '3',
      title: 'Space Explorers',
      reason: 'Inspires curiosity about science and space',
      genre: 'Sci-Fi',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400',
      match: 92,
    },
  ],
  relaxing: [
    {
      id: '1',
      title: 'Coastal Escape',
      reason: 'Slow-paced drama with beautiful scenery',
      genre: 'Drama',
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400',
      match: 96,
    },
    {
      id: '2',
      title: 'The Chef\'s Table',
      reason: 'Comforting culinary journey',
      genre: 'Documentary',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
      match: 94,
    },
    {
      id: '3',
      title: 'Garden Stories',
      reason: 'Peaceful and meditative viewing',
      genre: 'Nature',
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      match: 90,
    },
  ],
  romantic: [
    {
      id: '1',
      title: 'Parisian Nights',
      reason: 'Classic romance in the city of love',
      genre: 'Romance',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
      match: 97,
    },
    {
      id: '2',
      title: 'Love in Bloom',
      reason: 'Heartwarming modern love story',
      genre: 'Romance',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400',
      match: 93,
    },
  ],
  thrilling: [
    {
      id: '1',
      title: 'Velocity',
      reason: 'Non-stop action from start to finish',
      genre: 'Action',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=400',
      match: 99,
    },
    {
      id: '2',
      title: 'Edge of Tomorrow',
      reason: 'Mind-bending sci-fi thriller',
      genre: 'Thriller',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1574267432644-f610a2f9db04?w=400',
      match: 96,
    },
  ],
};

export function AIDiscovery() {
  const [selectedMood, setSelectedMood] = useState<string>('kids');
  const recommendations = recommendationsByMood[selectedMood] || recommendationsByMood.kids;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-2xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl mb-4 text-white">AI-Powered Discovery</h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Tell us your mood, and we'll find the perfect match. Our AI understands context, not just preferences.
        </p>
      </motion.div>

      {/* Mood Selection */}
      <div>
        <h2 className="text-xl mb-6 text-white">What's your vibe right now?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {moods.map((mood, index) => {
            const Icon = mood.icon;
            return (
              <motion.div
                key={mood.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-6 cursor-pointer transition-all duration-300 border-2 ${
                    selectedMood === mood.id
                      ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/20'
                      : 'bg-[#141920] border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50'
                  }`}
                  onClick={() => setSelectedMood(mood.id)}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        backgroundColor: selectedMood === mood.id ? mood.color : `${mood.color}20`,
                      }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: mood.color }}
                      />
                    </div>
                    <div>
                      <p className="text-white mb-1">{mood.label}</p>
                      <p className="text-xs text-gray-400">{mood.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl text-white mb-1">Perfect Matches for You</h2>
            <p className="text-gray-400">Based on your current mood and viewing history</p>
          </div>
          <Button variant="outline" className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10">
            <Sparkles className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-[#141920] border-[#8B5CF6]/20 hover:border-[#8B5CF6] transition-all duration-300 overflow-hidden group">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={rec.image}
                    alt={rec.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[#8B5CF6] text-white border-none">
                      {rec.match}% Match
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent opacity-60" />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white mb-1">{rec.title}</h3>
                      <Badge variant="outline" className="border-[#8B5CF6]/30 text-gray-400 text-xs">
                        {rec.genre}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <span className="text-sm">★</span>
                        <span className="text-sm">{rec.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#8B5CF6] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-400 leading-relaxed">{rec.reason}</p>
                    </div>
                  </div>
                  <Button className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
                    Watch Now
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#EC4899]/10 border-[#8B5CF6]/30 p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#8B5CF6] rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl text-white mb-2">AI Insight</h3>
              <p className="text-gray-300 mb-4">
                Based on your current selection and viewing patterns, you tend to enjoy {moods.find(m => m.id === selectedMood)?.description.toLowerCase()} on Monday evenings. We've tailored these recommendations to match your preferences.
              </p>
              <Button variant="outline" className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10">
                Learn More About AI Matching
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
