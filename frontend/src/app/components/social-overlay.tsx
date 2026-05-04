import { useState } from 'react';
import { Video, MessageCircle, Users, Send, Phone, X, Mic, MicOff, VideoOff } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { motion, AnimatePresence } from 'motion/react';

interface WatchParty {
  id: string;
  host: string;
  title: string;
  participants: number;
  movie: string;
  status: 'live' | 'scheduled';
}

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  message: string;
  timestamp: string;
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isHost?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

const watchParties: WatchParty[] = [
  {
    id: '1',
    host: 'Sarah Chen',
    title: 'Movie Night 🎬',
    participants: 8,
    movie: 'Dune: Part Three',
    status: 'live',
  },
  {
    id: '2',
    host: 'Mike Johnson',
    title: 'Friday Sci-Fi Marathon',
    participants: 12,
    movie: 'Interstellar',
    status: 'live',
  },
  {
    id: '3',
    host: 'Emma Wilson',
    title: 'Classics Club',
    participants: 5,
    movie: 'The Godfather',
    status: 'scheduled',
  },
];

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    user: 'Sarah',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    message: 'This scene is incredible! 🤩',
    timestamp: '2:34 PM',
  },
  {
    id: '2',
    user: 'Mike',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    message: 'The cinematography is stunning',
    timestamp: '2:35 PM',
  },
  {
    id: '3',
    user: 'Emma',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    message: 'Anyone else crying? 😭',
    timestamp: '2:36 PM',
  },
];

const mockParticipants: Participant[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    isHost: true,
  },
  {
    id: '2',
    name: 'Mike Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
  },
  {
    id: '3',
    name: 'Emma Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    isMuted: true,
  },
  {
    id: '4',
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    isVideoOff: true,
  },
];

export function SocialOverlay() {
  const [isPartyOpen, setIsPartyOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          user: 'You',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
          message: newMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setNewMessage('');
    }
  };

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
            <Video className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl mb-4 text-white">Watch Parties</h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Join friends for synchronized movie watching with live video chat and real-time reactions
        </p>
      </motion.div>

      {/* Watch Parties List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-white">Active Parties</h2>
          <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
            <Video className="w-4 h-4 mr-2" />
            Create Party
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchParties.map((party, index) => (
            <motion.div
              key={party.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-[#141920] border-[#8B5CF6]/20 hover:border-[#8B5CF6] transition-all duration-300 overflow-hidden group cursor-pointer">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-white mb-1">{party.title}</h3>
                      <p className="text-sm text-gray-400">Hosted by {party.host}</p>
                    </div>
                    <Badge
                      className={
                        party.status === 'live'
                          ? 'bg-red-500 text-white border-none'
                          : 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]'
                      }
                    >
                      {party.status === 'live' ? '• LIVE' : 'Scheduled'}
                    </Badge>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-1">Now Watching</p>
                    <p className="text-white">{party.movie}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{party.participants} watching</span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                      onClick={() => setIsPartyOpen(true)}
                    >
                      Join
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active Party Overlay */}
      <AnimatePresence>
        {isPartyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsPartyOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-6xl h-[90vh] flex flex-col md:flex-row gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Main Video Area */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Movie Player */}
                <Card className="flex-1 bg-black border-[#8B5CF6]/20 relative overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=1200"
                    alt="Movie"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-[#8B5CF6]/20 backdrop-blur-sm hover:bg-[#8B5CF6] text-white"
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-[#8B5CF6]/20 backdrop-blur-sm hover:bg-[#8B5CF6] text-white"
                        onClick={() => setIsVideoOff(!isVideoOff)}
                      >
                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-red-500/20 backdrop-blur-sm hover:bg-red-500 text-white ml-auto"
                        onClick={() => setIsPartyOpen(false)}
                      >
                        <Phone className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Video Bubbles */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {mockParticipants.map((participant) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative flex-shrink-0"
                    >
                      <Card className="w-32 h-24 bg-[#141920] border-[#8B5CF6]/20 overflow-hidden relative group">
                        {participant.isVideoOff ? (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#8B5CF6]/20 to-[#EC4899]/20">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback>{participant.name[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                        ) : (
                          <img
                            src={participant.avatar}
                            alt={participant.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs text-white truncate">{participant.name}</p>
                        </div>
                        {participant.isHost && (
                          <Badge className="absolute top-1 right-1 bg-[#8B5CF6] text-white border-none text-xs px-1 py-0">
                            Host
                          </Badge>
                        )}
                        {participant.isMuted && (
                          <div className="absolute top-1 left-1 bg-red-500 rounded-full p-1">
                            <MicOff className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Glassmorphism Sidebar */}
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-full md:w-96 flex flex-col"
                style={{
                  background: 'rgba(20, 25, 32, 0.7)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '1rem',
                }}
              >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-[#8B5CF6]/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-[#8B5CF6]" />
                    <h3 className="text-white">Party Chat</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setIsChatOpen(!isChatOpen)}
                  >
                    {isChatOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                  </Button>
                </div>

                {/* Chat Messages */}
                {isChatOpen && (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3"
                        >
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={msg.avatar} />
                            <AvatarFallback>{msg.user[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-white">{msg.user}</span>
                              <span className="text-xs text-gray-400">{msg.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-300 break-words">{msg.message}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-[#8B5CF6]/20">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 bg-[#0B0E14]/50 border border-[#8B5CF6]/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] text-sm"
                        />
                        <Button
                          size="icon"
                          className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex-shrink-0"
                          onClick={handleSendMessage}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
