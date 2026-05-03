import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { KidsContent, KidsCategory, AgeGroup, KidsContentType } from '../models/kids.model';
import { HttpClient } from '@angular/common/http';

/**
 * Kids Service
 * WHY: Manages all kid-friendly content and categories
 * Provides data for the kids section of the application
 */
@Injectable({
  providedIn: 'root'
})
export class KidsService {
  private apiUrl = '/api/kids';

  // Mock data for kids content - replace with API calls
  private kidsContent: KidsContent[] = [
    {
      id: '1',
      title: 'Adventure Island',
      description: 'Join our heroes on an exciting journey through magical lands!',
      ageGroup: '6-9',
      contentType: 'ANIMATION',
      rating: 4.9,
      duration: '22 min',
      image: 'https://images.unsplash.com/photo-1587614382346-4ec2e0311ff0?w=500',
      genre: 'Adventure',
      characters: ['Max', 'Luna', 'Buddy'],
      isEducational: true,
      releasedYear: 2024,
      featured: true,
    },
    {
      id: '2',
      title: 'Learning ABC',
      description: 'Fun way to learn letters and numbers!',
      ageGroup: '2-5',
      contentType: 'EDUCATIONAL',
      rating: 4.8,
      duration: '15 min',
      image: 'https://images.unsplash.com/photo-1574263867373-30651cc06da5?w=500',
      genre: 'Educational',
      characters: ['Teacher Bear', 'Happy Numbers'],
      isEducational: true,
      releasedYear: 2023,
      featured: true,
    },
    {
      id: '3',
      title: 'Space Rangers',
      description: 'Explore the universe with our brave space explorers!',
      ageGroup: '10-13',
      contentType: 'SERIES',
      rating: 4.7,
      duration: '42 min/ep',
      image: 'https://images.unsplash.com/photo-1536440407147-f9c07d019dde?w=500',
      genre: 'Sci-Fi',
      characters: ['Captain Star', 'Robot X', 'Princess Galaxy'],
      isEducational: true,
      releasedYear: 2024,
    },
    {
      id: '4',
      title: 'Magic Academy',
      description: 'Discover the secrets of a magical school!',
      ageGroup: '6-9',
      contentType: 'SERIES',
      rating: 4.6,
      duration: '30 min/ep',
      image: 'https://images.unsplash.com/photo-1506232408501-d90b3f8f6b4f?w=500',
      genre: 'Fantasy',
      characters: ['Willow', 'Spark', 'Zephyr'],
      isEducational: false,
      releasedYear: 2024,
    },
    {
      id: '5',
      title: 'Jungle Friends',
      description: 'Follow adorable animal friends in their jungle adventures!',
      ageGroup: '2-5',
      contentType: 'ANIMATION',
      rating: 4.9,
      duration: '12 min',
      image: 'https://images.unsplash.com/photo-1523388645328-f2e9e4b79af1?w=500',
      genre: 'Adventure',
      characters: ['Leo the Lion', 'Ella the Elephant', 'Tina the Tiger'],
      isEducational: true,
      releasedYear: 2023,
      featured: true,
    },
    {
      id: '6',
      title: 'Detective Squad',
      description: 'Solve mysteries with a team of clever kids!',
      ageGroup: '10-13',
      contentType: 'MOVIE',
      rating: 4.8,
      duration: '85 min',
      image: 'https://images.unsplash.com/photo-1578713183184-71dae1a5c5c3?w=500',
      genre: 'Mystery',
      characters: ['Sam', 'Alex', 'Jordan'],
      isEducational: false,
      releasedYear: 2024,
    },
  ];

  private categories: KidsCategory[] = [
    {
      id: 'age-2-5',
      name: 'Toddlers (2-5)',
      emoji: '👶',
      icon: 'baby',
      color: '#FF6B9D',
    },
    {
      id: 'age-6-9',
      name: 'Kids (6-9)',
      emoji: '👧',
      icon: 'child',
      color: '#FFD93D',
    },
    {
      id: 'age-10-13',
      name: 'Tweens (10-13)',
      emoji: '👦',
      icon: 'teenager',
      color: '#6BCB77',
    },
    {
      id: 'family',
      name: 'Family',
      emoji: '👨‍👩‍👧‍👦',
      icon: 'family',
      color: '#4D96FF',
    },
    {
      id: 'educational',
      name: 'Learning',
      emoji: '📚',
      icon: 'book',
      color: '#FF6348',
    },
    {
      id: 'animated',
      name: 'Animated',
      emoji: '🎬',
      icon: 'film',
      color: '#9B59B6',
    },
  ];

  constructor(private http: HttpClient) {}

  /**
   * Get all kids content
   */
  getAllContent(): Observable<KidsContent[]> {
    // Replace with actual API call once backend is ready
    // return this.http.get<KidsContent[]>(`${this.apiUrl}/content`);
    return of(this.kidsContent);
  }

  /**
   * Get featured kids content
   */
  getFeaturedContent(): Observable<KidsContent[]> {
    return of(this.kidsContent.filter(content => content.featured === true));
  }

  /**
   * Get content by age group
   */
  getContentByAgeGroup(ageGroup: AgeGroup): Observable<KidsContent[]> {
    return of(this.kidsContent.filter(content => content.ageGroup === ageGroup));
  }

  /**
   * Get content by type
   */
  getContentByType(type: KidsContentType): Observable<KidsContent[]> {
    return of(this.kidsContent.filter(content => content.contentType === type));
  }

  /**
   * Get educational content
   */
  getEducationalContent(): Observable<KidsContent[]> {
    return of(this.kidsContent.filter(content => content.isEducational === true));
  }

  /**
   * Search kids content
   */
  searchContent(query: string): Observable<KidsContent[]> {
    const lowerQuery = query.toLowerCase();
    return of(
      this.kidsContent.filter(
        content =>
          content.title.toLowerCase().includes(lowerQuery) ||
          content.description.toLowerCase().includes(lowerQuery) ||
          content.genre.toLowerCase().includes(lowerQuery)
      )
    );
  }

  /**
   * Get all categories
   */
  getCategories(): Observable<KidsCategory[]> {
    return of(this.categories);
  }

  /**
   * Get single content by ID
   */
  getContentById(id: string): Observable<KidsContent | undefined> {
    return of(this.kidsContent.find(content => content.id === id));
  }
}
