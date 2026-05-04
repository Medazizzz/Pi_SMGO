import { useState } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Zap, Plus, Settings } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'websocket' | 'firebase' | 'email' | 'sms';
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  description: string;
  config: Record<string, any>;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'internal' | 'external';
  channels: string[];
  subject: string;
  message: string;
  trigger: string;
}

const mockChannels: NotificationChannel[] = [
  {
    id: '1',
    name: 'WebSocket',
    type: 'websocket',
    icon: Zap,
    enabled: true,
    description: 'Real-time in-app notifications',
    config: { endpoint: 'wss://api.showmatchgoon.com/ws' },
  },
  {
    id: '2',
    name: 'Firebase Cloud Messaging',
    type: 'firebase',
    icon: Bell,
    enabled: true,
    description: 'Push notifications for mobile apps',
    config: { projectId: 'showmatchgoon-prod' },
  },
  {
    id: '3',
    name: 'Email',
    type: 'email',
    icon: Mail,
    enabled: true,
    description: 'Email notifications via SendGrid',
    config: { provider: 'SendGrid', fromEmail: 'notify@showmatchgoon.com' },
  },
  {
    id: '4',
    name: 'SMS',
    type: 'sms',
    icon: MessageSquare,
    enabled: false,
    description: 'Text message notifications via Twilio',
    config: { provider: 'Twilio', fromNumber: '+1234567890' },
  },
];

const mockTemplates: NotificationTemplate[] = [
  {
    id: '1',
    name: 'Booking Confirmation',
    type: 'external',
    channels: ['email', 'sms'],
    subject: 'Your ShowMatch Booking Confirmed',
    message: 'Your tickets for {{movie}} at {{theater}} on {{date}} are confirmed!',
    trigger: 'booking.completed',
  },
  {
    id: '2',
    name: 'New Content Alert',
    type: 'internal',
    channels: ['websocket', 'firebase'],
    subject: 'New Content Added',
    message: '{{title}} is now available on {{platform}}',
    trigger: 'content.published',
  },
  {
    id: '3',
    name: 'Watch Party Invitation',
    type: 'internal',
    channels: ['websocket', 'firebase', 'email'],
    subject: 'You\'re invited to a Watch Party',
    message: '{{host}} invited you to watch {{movie}}',
    trigger: 'party.invited',
  },
];

export function AdminNotifications() {
  const [channels, setChannels] = useState<NotificationChannel[]>(mockChannels);
  const [templates] = useState<NotificationTemplate[]>(mockTemplates);

  const toggleChannel = (id: string) => {
    setChannels(
      channels.map((channel) =>
        channel.id === id ? { ...channel, enabled: !channel.enabled } : channel
      )
    );
  };

  const getChannelColor = (type: string) => {
    switch (type) {
      case 'websocket':
        return 'from-[#8B5CF6] to-[#EC4899]';
      case 'firebase':
        return 'from-[#F59E0B] to-[#EF4444]';
      case 'email':
        return 'from-[#06B6D4] to-[#3B82F6]';
      case 'sms':
        return 'from-[#10B981] to-[#059669]';
      default:
        return 'from-[#8B5CF6] to-[#EC4899]';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl text-white mb-2">Notification Hub</h1>
          <p className="text-gray-400">
            Configure notification channels and manage message templates
          </p>
        </div>
        <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Active Channels</p>
            <div className="p-2 bg-[#8B5CF6]/20 rounded-lg">
              <Bell className="w-4 h-4 text-[#8B5CF6]" />
            </div>
          </div>
          <p className="text-3xl text-white">{channels.filter((c) => c.enabled).length}</p>
          <p className="text-sm text-gray-400 mt-1">of {channels.length} total</p>
        </Card>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Templates</p>
            <div className="p-2 bg-[#EC4899]/20 rounded-lg">
              <MessageSquare className="w-4 h-4 text-[#EC4899]" />
            </div>
          </div>
          <p className="text-3xl text-white">{templates.length}</p>
          <p className="text-sm text-gray-400 mt-1">Configured</p>
        </Card>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Sent Today</p>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Smartphone className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <p className="text-3xl text-white">1,247</p>
          <p className="text-sm text-green-500 mt-1">+15% from yesterday</p>
        </Card>
        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Delivery Rate</p>
            <div className="p-2 bg-[#06B6D4]/20 rounded-lg">
              <Zap className="w-4 h-4 text-[#06B6D4]" />
            </div>
          </div>
          <p className="text-3xl text-white">98.5%</p>
          <p className="text-sm text-gray-400 mt-1">Last 30 days</p>
        </Card>
      </div>

      {/* Notification Channels */}
      <div>
        <h2 className="text-2xl text-white mb-4">Notification Channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <Card
                key={channel.id}
                className="bg-[#141920] border-[#8B5CF6]/20 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${getChannelColor(
                          channel.type
                        )}`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white">{channel.name}</h3>
                          <Badge
                            variant="outline"
                            className={
                              channel.enabled
                                ? 'border-green-500 text-green-500'
                                : 'border-gray-500 text-gray-500'
                            }
                          >
                            {channel.enabled ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">{channel.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                  </div>
                  <div className="bg-[#0B0E14] rounded-lg p-4 space-y-2">
                    {Object.entries(channel.config).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-400">{key}:</span>
                        <span className="text-gray-300">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Configure
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                    >
                      Test
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Message Templates */}
      <div>
        <h2 className="text-2xl text-white mb-4">Message Templates</h2>
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id} className="bg-[#141920] border-[#8B5CF6]/20 p-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white mb-1">{template.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            template.type === 'internal'
                              ? 'border-[#8B5CF6] text-[#8B5CF6]'
                              : 'border-[#EC4899] text-[#EC4899]'
                          }
                        >
                          {template.type}
                        </Badge>
                        <span className="text-sm text-gray-400">Trigger: {template.trigger}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Subject</p>
                    <p className="text-white">{template.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Message</p>
                    <p className="text-gray-300">{template.message}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Channels</p>
                    <div className="flex flex-wrap gap-2">
                      {template.channels.map((channelType) => {
                        const channel = channels.find((c) => c.type === channelType);
                        if (!channel) return null;
                        const Icon = channel.icon;
                        return (
                          <Badge
                            key={channelType}
                            className="bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]"
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {channel.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex lg:flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                  >
                    Test Send
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create New Template */}
      <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
        <h3 className="text-xl text-white mb-4">Create New Template</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Template Name</label>
              <Input
                placeholder="e.g., Welcome Email"
                className="bg-[#0B0E14] border-[#8B5CF6]/20 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Type</label>
              <select className="w-full bg-[#0B0E14] border border-[#8B5CF6]/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]">
                <option>Select type...</option>
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Subject</label>
            <Input
              placeholder="Email subject or notification title"
              className="bg-[#0B0E14] border-[#8B5CF6]/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Message</label>
            <Textarea
              placeholder="Use {{variable}} for dynamic content"
              rows={4}
              className="bg-[#0B0E14] border-[#8B5CF6]/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Trigger Event</label>
            <Input
              placeholder="e.g., user.signup"
              className="bg-[#0B0E14] border-[#8B5CF6]/20 text-white"
            />
          </div>
          <div className="flex gap-3">
            <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">Create Template</Button>
            <Button variant="outline" className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
