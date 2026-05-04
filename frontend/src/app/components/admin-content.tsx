import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Star, Eye, Filter, Download } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

interface Content {
  id: string;
  title: string;
  platform: string;
  genre: string;
  rating: number;
  views: number;
  status: 'active' | 'hidden' | 'scheduled';
  hiddenGem: boolean;
  releaseDate: string;
}

const mockContent: Content[] = [
  {
    id: '1',
    title: 'Cosmic Odyssey',
    platform: 'Netflix',
    genre: 'Sci-Fi',
    rating: 4.8,
    views: 245000,
    status: 'active',
    hiddenGem: true,
    releaseDate: '2026-01-15',
  },
  {
    id: '2',
    title: 'The Last Kingdom',
    platform: 'Prime Video',
    genre: 'Drama',
    rating: 4.6,
    views: 189000,
    status: 'active',
    hiddenGem: false,
    releaseDate: '2026-01-20',
  },
  {
    id: '3',
    title: 'Midnight Tales',
    platform: 'Disney+',
    genre: 'Horror',
    rating: 4.3,
    views: 156000,
    status: 'hidden',
    hiddenGem: true,
    releaseDate: '2026-01-10',
  },
  {
    id: '4',
    title: 'Summer Dreams',
    platform: 'Hulu',
    genre: 'Romance',
    rating: 4.5,
    views: 201000,
    status: 'active',
    hiddenGem: false,
    releaseDate: '2026-02-01',
  },
  {
    id: '5',
    title: 'Dark Waters',
    platform: 'HBO Max',
    genre: 'Thriller',
    rating: 4.7,
    views: 178000,
    status: 'scheduled',
    hiddenGem: true,
    releaseDate: '2026-02-15',
  },
];

export function AdminContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [content] = useState<Content[]>(mockContent);

  const filteredContent = content.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || item.platform === filterPlatform;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-500 border-green-500';
      case 'hidden':
        return 'bg-gray-500/20 text-gray-400 border-gray-400';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-500 border-blue-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-400';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl text-white mb-2">Content Management</h1>
          <p className="text-gray-400">Manage streaming titles, metadata, and featured content</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Total Content</p>
            <div className="p-2 bg-[#8B5CF6]/20 rounded-lg">
              <Eye className="w-4 h-4 text-[#8B5CF6]" />
            </div>
          </div>
          <p className="text-3xl text-white">{content.length}</p>
          <p className="text-sm text-green-500 mt-1">+12% this month</p>
        </Card>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Active</p>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Star className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <p className="text-3xl text-white">{content.filter((c) => c.status === 'active').length}</p>
          <p className="text-sm text-gray-400 mt-1">Currently streaming</p>
        </Card>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Hidden Gems</p>
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
          </div>
          <p className="text-3xl text-white">{content.filter((c) => c.hiddenGem).length}</p>
          <p className="text-sm text-gray-400 mt-1">Featured selections</p>
        </Card>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Total Views</p>
            <div className="p-2 bg-[#EC4899]/20 rounded-lg">
              <Eye className="w-4 h-4 text-[#EC4899]" />
            </div>
          </div>
          <p className="text-3xl text-white">
            {(content.reduce((sum, c) => sum + c.views, 0) / 1000).toFixed(0)}K
          </p>
          <p className="text-sm text-green-500 mt-1">+8% this week</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0B0E14] border-[#8B5CF6]/20 text-white"
              />
            </div>
          </div>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-full md:w-48 bg-[#0B0E14] border-[#8B5CF6]/20 text-white">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="Netflix">Netflix</SelectItem>
              <SelectItem value="Prime Video">Prime Video</SelectItem>
              <SelectItem value="Disney+">Disney+</SelectItem>
              <SelectItem value="Hulu">Hulu</SelectItem>
              <SelectItem value="HBO Max">HBO Max</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48 bg-[#0B0E14] border-[#8B5CF6]/20 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Content Table */}
      <Card className="bg-[#141920] border-[#8B5CF6]/20 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#8B5CF6]/20 hover:bg-transparent">
                <TableHead className="text-gray-400">Title</TableHead>
                <TableHead className="text-gray-400">Platform</TableHead>
                <TableHead className="text-gray-400">Genre</TableHead>
                <TableHead className="text-gray-400">Rating</TableHead>
                <TableHead className="text-gray-400">Views</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Release Date</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.map((item) => (
                <TableRow key={item.id} className="border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="text-white">{item.title}</div>
                      {item.hiddenGem && (
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                          <Star className="w-3 h-3 mr-1" />
                          Hidden Gem
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{item.platform}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-[#8B5CF6]/30 text-gray-400">
                      {item.genre}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-white">{item.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {(item.views / 1000).toFixed(0)}K
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{item.releaseDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
