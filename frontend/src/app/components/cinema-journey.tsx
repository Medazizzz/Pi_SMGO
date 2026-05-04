import { useState } from 'react';
import { MapPin, Clock, Calendar, Users, CreditCard, Check, ArrowLeft, Armchair } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';

interface Seat {
  id: string;
  row: string;
  number: number;
  type: 'regular' | 'premium' | 'occupied';
  price?: number;
}

const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  rows.forEach((row, rowIndex) => {
    for (let i = 1; i <= 12; i++) {
      const isOccupied = Math.random() > 0.7;
      const isPremium = rowIndex >= 3 && rowIndex <= 5 && i >= 4 && i <= 9;
      
      seats.push({
        id: `${row}${i}`,
        row,
        number: i,
        type: isOccupied ? 'occupied' : isPremium ? 'premium' : 'regular',
        price: isPremium ? 18 : 12,
      });
    }
  });
  
  return seats;
};

export function CinemaJourney() {
  const [step, setStep] = useState<'selection' | 'booking' | 'ticket'>('selection');
  const [seats] = useState<Seat[]>(generateSeats());
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const handleSeatClick = (seatId: string, type: string) => {
    if (type === 'occupied') return;
    
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seatId) => {
      const seat = seats.find((s) => s.id === seatId);
      return total + (seat?.price || 0);
    }, 0);
  };

  const handleBooking = () => {
    if (selectedSeats.length > 0) {
      setStep('booking');
    }
  };

  const handlePayment = () => {
    setStep('ticket');
  };

  const getSeatInfo = (seatId: string) => {
    const seat = seats.find((s) => s.id === seatId);
    return seat;
  };

  if (step === 'ticket') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto p-6"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl text-white mb-2">Booking Confirmed!</h1>
          <p className="text-gray-400">Your tickets are ready</p>
        </div>

        <Card className="bg-[#141920] border-[#8B5CF6]/20 overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] p-6 text-white">
            <h2 className="text-2xl mb-2">Dune: Part Three</h2>
            <p className="text-sm opacity-90">AMC Empire 25</p>
          </div>

          {/* Ticket Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-gray-300">
              <Calendar className="w-5 h-5 text-[#8B5CF6]" />
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p>Monday, Feb 2, 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Clock className="w-5 h-5 text-[#8B5CF6]" />
              <div>
                <p className="text-xs text-gray-400">Showtime</p>
                <p>7:30 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Armchair className="w-5 h-5 text-[#8B5CF6]" />
              <div>
                <p className="text-xs text-gray-400">Seats</p>
                <p>{selectedSeats.join(', ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Users className="w-5 h-5 text-[#8B5CF6]" />
              <div>
                <p className="text-xs text-gray-400">Tickets</p>
                <p>{selectedSeats.length} {selectedSeats.length === 1 ? 'Ticket' : 'Tickets'}</p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="border-t border-dashed border-[#8B5CF6]/20 p-6">
            <div className="bg-white p-4 rounded-xl inline-block">
              <QRCodeSVG
                value={`SHOWMATCH-${Date.now()}-${selectedSeats.join('-')}`}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Show this QR code at the theater entrance
            </p>
          </div>

          {/* Booking ID */}
          <div className="bg-[#0B0E14] p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Booking ID</p>
            <p className="text-[#8B5CF6] font-mono">SMG-{Date.now().toString().slice(-8)}</p>
          </div>
        </Card>

        <div className="mt-6 space-y-3">
          <Button
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
            onClick={() => {
              setStep('selection');
              setSelectedSeats([]);
            }}
          >
            Book Another Show
          </Button>
          <Button variant="outline" className="w-full border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10">
            Add to Wallet
          </Button>
        </div>
      </motion.div>
    );
  }

  if (step === 'booking') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-4xl mx-auto p-6"
      >
        <Button
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
          onClick={() => setStep('selection')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Seats
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Summary */}
          <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6 h-fit">
            <h2 className="text-xl text-white mb-6">Booking Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Movie</p>
                <p className="text-white">Dune: Part Three</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Theater</p>
                <p className="text-white">AMC Empire 25</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Date</p>
                  <p className="text-white">Feb 2, 2026</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Time</p>
                  <p className="text-white">7:30 PM</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Selected Seats</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seatId) => {
                    const seat = getSeatInfo(seatId);
                    return (
                      <Badge key={seatId} className="bg-[#8B5CF6] text-white border-none">
                        {seatId} - ${seat?.price}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-[#8B5CF6]/20 pt-4 space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>${calculateTotal()}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Booking Fee</span>
                <span>$2.50</span>
              </div>
              <div className="flex justify-between text-white text-lg pt-2 border-t border-[#8B5CF6]/20">
                <span>Total</span>
                <span>${(calculateTotal() + 2.5).toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Payment Form */}
          <Card className="bg-[#141920] border-[#8B5CF6]/20 p-6">
            <h2 className="text-xl text-white mb-6">Payment Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full bg-[#0B0E14] border border-[#8B5CF6]/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full bg-[#0B0E14] border border-[#8B5CF6]/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full bg-[#0B0E14] border border-[#8B5CF6]/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-[#0B0E14] border border-[#8B5CF6]/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full bg-[#0B0E14] border border-[#8B5CF6]/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <Button
                className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white mt-6"
                onClick={handlePayment}
              >
                Confirm Payment - ${(calculateTotal() + 2.5).toFixed(2)}
              </Button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Your payment information is secure and encrypted
              </p>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Movie Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-[#141920] border-[#8B5CF6]/20 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <img
              src="https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400"
              alt="Movie Poster"
              className="w-full md:w-64 h-64 md:h-auto object-cover"
            />
            <div className="p-6 flex-1">
              <h1 className="text-3xl text-white mb-2">Dune: Part Three</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#8B5CF6]" />
                  <span>AMC Empire 25</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Monday, Feb 2, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8B5CF6]" />
                  <span>7:30 PM</span>
                </div>
              </div>
              <p className="text-gray-300">
                Select your preferred seats from the interactive seating chart below. Premium seats offer enhanced comfort and viewing angles.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Seating Chart */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl text-white mb-4">Select Your Seats</h2>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#8B5CF6] rounded-lg" />
              <span className="text-gray-400">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1E2530] rounded-lg border border-[#8B5CF6]/20" />
              <span className="text-gray-400">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F59E0B]/20 rounded-lg border border-[#F59E0B]" />
              <span className="text-gray-400">Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#374151] rounded-lg" />
              <span className="text-gray-400">Occupied</span>
            </div>
          </div>
        </div>

        <Card className="bg-[#141920] border-[#8B5CF6]/20 p-8 overflow-x-auto">
          {/* Screen */}
          <div className="mb-12">
            <div className="h-2 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent rounded-full mb-2" />
            <p className="text-center text-sm text-gray-400">SCREEN</p>
          </div>

          {/* Seats */}
          <div className="space-y-3 min-w-max">
            {Array.from(new Set(seats.map((s) => s.row))).map((row) => (
              <div key={row} className="flex items-center gap-2">
                <span className="w-8 text-center text-gray-400 text-sm">{row}</span>
                <div className="flex gap-2">
                  {seats
                    .filter((s) => s.row === row)
                    .map((seat) => (
                      <motion.button
                        key={seat.id}
                        whileHover={{ scale: seat.type !== 'occupied' ? 1.1 : 1 }}
                        whileTap={{ scale: seat.type !== 'occupied' ? 0.95 : 1 }}
                        className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                          selectedSeats.includes(seat.id)
                            ? 'bg-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/50'
                            : seat.type === 'occupied'
                            ? 'bg-[#374151] cursor-not-allowed'
                            : seat.type === 'premium'
                            ? 'bg-[#F59E0B]/20 border border-[#F59E0B] hover:bg-[#F59E0B]/30'
                            : 'bg-[#1E2530] border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20'
                        }`}
                        onClick={() => handleSeatClick(seat.id, seat.type)}
                        disabled={seat.type === 'occupied'}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Booking Bar */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-[#141920] border-t border-[#8B5CF6]/20 p-4 md:p-6 z-50"
          >
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-400">Selected Seats</p>
                  <p className="text-white">{selectedSeats.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Amount</p>
                  <p className="text-2xl text-[#8B5CF6]">${calculateTotal()}</p>
                </div>
              </div>
              <Button
                className="w-full md:w-auto bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-8"
                onClick={handleBooking}
              >
                Continue to Payment
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
