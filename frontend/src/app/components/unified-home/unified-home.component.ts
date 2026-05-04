import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Play,
  Star,
  Clock,
  MapPin,
  Sparkles,
  TrendingUp,
} from 'lucide-angular';

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

@Component({
  selector: 'app-unified-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unified-home.component.html',
  styleUrls: ['./unified-home.component.css'],
})
export class UnifiedHomeComponent {
  readonly PlayIcon = Play;
  readonly StarIcon = Star;
  readonly ClockIcon = Clock;
  readonly MapPinIcon = MapPin;
  readonly SparklesIcon = Sparkles;
  readonly TrendingUpIcon = TrendingUp;

  hoveredStream = signal<string | null>(null);
  hoveredCinema = signal<string | null>(null);

  streamingData: StreamingContent[] = [
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

  cinemaData: CinemaShowtime[] = [
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

  setHoveredStream(id: string | null) {
    this.hoveredStream.set(id);
  }

  setHoveredCinema(id: string | null) {
    this.hoveredCinema.set(id);
  }
}


