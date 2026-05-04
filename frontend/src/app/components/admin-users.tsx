import { useState } from 'react';
import { Users, Award, TrendingUp, Search, Filter, Crown, Star } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  tier: 'free' | 'individual' | 'multiple';
  points: number;
  joinDate: string;
  totalSpent: number;
  activeSubscription: boolean;
}

interface SubscriptionTier {
  id: string;
  name: string;
  type: 'free' | 'individual' | 'multiple';
  price: number;
  users: number;
  features: string[];
  color: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    tier: 'multiple',
    points: 2450,
    joinDate: '2025-06-15',
    totalSpent: 299.99,
    activeSubscription: true,
  },
  {
    id: '2',
    name: 'Mike Johnson',
    email: 'mike.j@email.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    tier: 'individual',
    points: 1230,
    joinDate: '2025-08-20',
    totalSpent: 149.99,
    activeSubscription: true,
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma.w@email.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    tier: 'individual',
    points: 890,
    joinDate: '2025-09-10',
    totalSpent: 89.99,
    activeSubscription: true,
  },
  {
    id: '4',
    name: 'John Doe',
    email: 'john.doe@email.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    tier: 'free',
    points: 150,
    joinDate: '2026-01-05',
    totalSpent: 0,
    activeSubscription: false,
  },
];

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: '1',
    name: 'Free',
    type: 'free',
    price: 0,
    users: 15420,
    features: ['Basic discovery', 'Limited recommendations', 'Community features'],
    color: 'gray',
  },
  {
    id: '2',
    name: 'Individual',
    type: 'individual',
    price: 9.99,
    users: 8965,
    features: [
      'Unlimited AI recommendations',
      'Priority cinema booking',
      'Watch party hosting',
      'Loyalty points',
    ],
    color: 'purple',
  },
  {
    id: '3',
    name: 'Multiple',
    type: 'multiple',
    price: 14.99,
    users: 3247,
    features: [
      'All Individual features',
      'Up to 5 profiles',
      'Family watch parties',
      'Double loyalty points',
      'Priority support',
    ],
    color: 'gold',
  },
];

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [users] = useState<User[]>(mockUsers);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' || user.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'border-gray-500 text-gray-400';
      case 'individual':
        return 'border-[#8B5CF6] text-[#8B5CF6]';
      case 'multiple':
        return 'border-yellow-500 text-yellow-500';
      default:
        return 'border-gray-500 text-gray-400';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'multiple':
        return <Crown className="w-3 h-3" />;
      case 'individual':
        return <Star className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl text-white mb-2">User & Loyalty Management</h1>
          <p className="text-gray-400">Manage subscribers and fidelity rewards</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Total Users</p>
            <div className="p-2 bg-[#8B5CF6]/20 rounded-lg">
              <Users className="w-4 h-4 text-[#8B5CF6]" />
            </div>
          </div>
          <p className="text-3xl text-white">
            {users.reduce((sum, u) => sum + (subscriptionTiers.find((t) => t.type === u.tier)?.users || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-green-500 mt-1">+23% this month</p>
        </Card>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Active Subscribers</p>
            <div className="p-2 bg-[#EC4899]/20 rounded-lg">
              <Crown className="w-4 h-4 text-[#EC4899]" />
            </div>
          </div>
          <p className="text-3xl text-white">
            {users.filter((u) => u.activeSubscription).length.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Paying members</p>
        </Card>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Loyalty Points</p>
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Award className="w-4 h-4 text-yellow-500" />
            </div>
          </div>
          <p className="text-3xl text-white">
            {users.reduce((sum, u) => sum + u.points, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Total distributed</p>
        </Card>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">MRR</p>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <p className="text-3xl text-white">$156K</p>
          <p className="text-sm text-green-500 mt-1">+18% growth</p>
        </Card>
      </div>

      {/* Subscription Tiers */}
      <div>
        <h2 className="text-2xl text-white mb-4">Subscription Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subscriptionTiers.map((tier) => (
            <Card
              key={tier.id}
              className={`bg-[#141920] border-2 ${
                tier.type === 'multiple'
                  ? 'border-yellow-500'
                  : tier.type === 'individual'
                  ? 'border-[#8B5CF6]'
                  : 'border-[#8B5CF6]/20'
              } p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl text-white mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl text-white">${tier.price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </div>
                {tier.type === 'multiple' && (
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Crown className="w-5 h-5 text-yellow-500" />
                  </div>
                )}
                {tier.type === 'individual' && (
                  <div className="p-2 bg-[#8B5CF6]/20 rounded-lg">
                    <Star className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                )}
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Active Users</p>
                <p className="text-2xl text-white">{tier.users.toLocaleString()}</p>
              </div>
              <div className="space-y-2 mb-4">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                    {feature}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
              >
                Edit Tier
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* User Search & Filters */}
      <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0B0E14] border-[#8B5CF6]/20 text-white"
              />
            </div>
          </div>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            title="Filter users by tier"
            className="w-full md:w-48 bg-[#0B0E14] border border-[#8B5CF6]/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="individual">Individual</option>
            <option value="multiple">Multiple</option>
          </select>
        </div>
      </Card>

      {/* Users List */}
      <div>
        <h2 className="text-2xl text-white mb-4">Users</h2>
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="bg-[#141920] border-[#8B5CF6]/20 p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white">{user.name}</h3>
                      <Badge variant="outline" className={getTierColor(user.tier)}>
                        {getTierIcon(user.tier)}
                        <span className="ml-1 capitalize">{user.tier}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Loyalty Points</p>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <p className="text-white">{user.points}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Spent</p>
                    <p className="text-white">${user.totalSpent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Member Since</p>
                    <p className="text-white">{new Date(user.joinDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <Badge
                      variant="outline"
                      className={
                        user.activeSubscription
                          ? 'border-green-500 text-green-500'
                          : 'border-gray-500 text-gray-400'
                      }
                    >
                      {user.activeSubscription ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Loyalty Program Settings */}
      <div>
        <h2 className="text-2xl text-white mb-4">Loyalty Program</h2>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Points per Dollar Spent
                </label>
                <Input
                  type="number"
                  defaultValue="10"
                  className="bg-[#0B0E14] border-[#8B5CF6]/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Points for Review
                </label>
                <Input
                  type="number"
                  defaultValue="50"
                  className="bg-[#0B0E14] border-[#8B5CF6]/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Points for Watch Party Host
                </label>
                <Input
                  type="number"
                  defaultValue="100"
                  className="bg-[#0B0E14] border-[#8B5CF6]/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Redemption Rate (Points per Dollar)
                </label>
                <Input
                  type="number"
                  defaultValue="100"
                  className="bg-[#0B0E14] border-[#8B5CF6]/20 text-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
                Save Changes
              </Button>
              <Button variant="outline" className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10">
                Reset to Defaults
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
