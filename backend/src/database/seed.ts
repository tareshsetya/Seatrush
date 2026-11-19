import { db } from './in-memory-db.js';
import { Event, Seat, SeatTier } from '../types/index.js';

export function seedDatabase(): void {
  const events: Event[] = [
    // --- CONCERTS ---
    {
      id: 'event-coldplay-2026',
      title: 'Coldplay: Music of the Spheres',
      subtitle: 'World Tour - Live at Wembley Stadium',
      artist: 'Coldplay',
      category: 'Concert',
      venue: 'Wembley Stadium',
      location: 'London, UK',
      date: '2027-08-22',
      time: '19:30',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      description: 'Experience Coldplay live on their groundbreaking eco-friendly world tour featuring immersive LED wristbands, laser shows, and chart-topping classics.',
      totalSeats: 0,
      availableSeats: 0,
      heldSeats: 0,
      bookedSeats: 0,
      pricing: { VIP: 350, PREMIUM: 180, STANDARD: 85 },
    },
    {
      id: 'event-taylor-swift',
      title: 'Taylor Swift: The Eras Tour',
      subtitle: 'All Era Showcase Spectacular',
      artist: 'Taylor Swift',
      category: 'Concert',
      venue: 'SoFi Stadium',
      location: 'Inglewood, CA, USA',
      date: '2027-09-15',
      time: '19:00',
      bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      description: 'The monumental world tour journeying through all musical eras of Taylor Swift’s iconic career with a 3-hour stadium spectacle.',
      totalSeats: 0,
      availableSeats: 0,
      heldSeats: 0,
      bookedSeats: 0,
      pricing: { VIP: 450, PREMIUM: 220, STANDARD: 110 },
    },
    {
      id: 'event-dua-lipa',
      title: 'Dua Lipa: Radical Optimism Tour',
      subtitle: 'Electrifying Pop Extravaganza',
      artist: 'Dua Lipa',
      category: 'Concert',
      venue: 'The O2 Arena',
      location: 'London, UK',
      date: '2027-10-04',
      time: '20:00',
      bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
      description: 'Chart-topping dance pop anthems, dazzling choreography, and world-class stage production from the global pop phenomenon.',
      totalSeats: 0,
      availableSeats: 0,
      heldSeats: 0,
      bookedSeats: 0,
      pricing: { VIP: 280, PREMIUM: 160, STANDARD: 75 },
    },

    // --- MOVIES ---
    {
      id: 'event-dune-2',
      title: 'Dune: Part Two (IMAX 70mm)',
      subtitle: 'Exclusive 70mm Film Print Presentation',
      artist: 'Directed by Denis Villeneuve',
      category: 'Movies',
      venue: 'BFI IMAX, Waterloo',
      location: 'London, UK',
      date: '2027-07-18',
      time: '18:15',
      bannerUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
      description: 'Witness Paul Atreides unite with Chani and the Fremen on the gigantic BFI IMAX screen in glorious 70mm analog film with 12-channel sound.',
      totalSeats: 0,
      availableSeats: 0,
      heldSeats: 0,
      bookedSeats: 0,
      pricing: { VIP: 38, PREMIUM: 26, STANDARD: 18 },
    },
    {
      id: 'event-interstellar',
      title: 'Interstellar: 10th Anniversary IMAX',
      subtitle: 'Christopher Nolan Masterpiece in Full 1.43:1 Aspect',
      artist: 'Score by Hans Zimmer',
      category: 'Movies',
      venue: 'TCL Chinese Theatre',
      location: 'Hollywood, CA, USA',
      date: '2027-07-25',
      time: '20:45',
      bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      description: 'Mankind was born on Earth. It was never meant to die here. Return to Gargantua and Miller’s planet with earth-shattering surround sound.',
      totalSeats: 0,
      availableSeats: 0,
      heldSeats: 0,
      bookedSeats: 0,
      pricing: { VIP: 35, PREMIUM: 24, STANDARD: 16 },
    },
    {
      id: 'event-gladiator-2',
      title: 'Gladiator II: Premiere Screening',
      subtitle: 'Dolby Atmos & Laser Projection',
      artist: 'Directed by Ridley Scott',
      category: 'Movies',
      venue: 'Odeon Luxe Leicester Square',
      location: 'London, UK',
      date: '2027-08-01',
      time: '19:45',
      bannerUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
      description: 'The Colosseum roars once more in this epic historic action sequel screened in ultra-plush reclining leather seats with Dolby Vision.',
      totalSeats: 0,
      availableSeats: 0,
      heldSeats: 0,
      bookedSeats: 0,
      pricing: { VIP: 42, PREMIUM: 28, STANDARD: 20 },
    },

    // --- SPORTS ---
    {
      id: 'event-f1-gp-2026',
      title: 'Formula 1 British Grand Prix',
      subtitle: 'Race Day - International Pits Straight',
      artist: 'FIA Formula One World Championship',
      category: 'Sports',
      venue: 'Silverstone Circuit',
      location: 'Towcester, UK',
      date: '2027-07-05',
      time: '14:00',
      bannerUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
      description: 'Witness the pinnacle of motorsport live with uncompromised views of the start/finish grid, team garages, and high-speed Abbey corner.',
      totalSeats: 0,
      availableSeats: 0,
      heldSeats: 0,
      bookedSeats: 0,
      pricing: { VIP: 550, PREMIUM: 320, STANDARD: 150 },
    },
    {
      id: 'event-ucl-final',
      title: 'UEFA Champions League Final',
      subtitle: 'European Football Championship Match',
      artist: 'UEFA Club Competitions',
      category: 'Sports',
      venue: 'Wembley Stadium',
      location: 'London, UK',
      date: '2027-05-30',
      time: '20:00',
      bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      description: 'The two best football clubs in Europe battle for immortality under the iconic Wembley arch in the biggest club match of the year.',
      totalSeats: 0,
      availableSeats: 0,
      heldSeats: 0,
      bookedSeats: 0,
      pricing: { VIP: 600, PREMIUM: 350, STANDARD: 120 },
    },
    {
      id: 'event-nba-finals',
      title: 'NBA Finals 2026 - Game 7',
      subtitle: 'Championship Decider at Courtside',
      artist: 'National Basketball Association',
      category: 'Sports',
      venue: 'Crypto.com Arena',
      location: 'Los Angeles, CA, USA',
      date: '2027-06-20',
      time: '18:30',
      bannerUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
      description: 'Winner take all. The ultimate basketball championship decider live in downtown Los Angeles with star-studded courtside seats.',
      totalSeats: 0,
      availableSeats: 0,
      heldSeats: 0,
      bookedSeats: 0,
      pricing: { VIP: 750, PREMIUM: 420, STANDARD: 180 },
    },
  ];

  for (const event of events) {
    db.setEvent(event);

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const cols = 12;

    rows.forEach((rowLetter, rowIndex) => {
      let tier: SeatTier = 'STANDARD';
      let price = event.pricing.STANDARD;

      if (rowIndex < 2) {
        tier = 'VIP';
        price = event.pricing.VIP;
      } else if (rowIndex < 5) {
        tier = 'PREMIUM';
        price = event.pricing.PREMIUM;
      }

      for (let col = 1; col <= cols; col++) {
        const seatId = `${event.id}-${rowLetter}${col}`;
        const label = `${rowLetter}${col}`;

        const isPreBooked =
          (rowIndex === 0 && (col === 5 || col === 6)) ||
          (rowIndex === 2 && (col === 3 || col === 4 || col === 9));

        const seat: Seat = {
          id: seatId,
          eventId: event.id,
          row: rowLetter,
          col,
          label,
          tier,
          price,
          status: isPreBooked ? 'BOOKED' : 'AVAILABLE',
          bookedBy: isPreBooked ? 'user_presale_99' : undefined,
          bookedAt: isPreBooked ? new Date(Date.now() - 3600000).toISOString() : undefined,
          version: 1,
        };

        db.setSeat(seat);
      }
    });

    const updated = db.getEvent(event.id);
    if (updated) db.setEvent(updated);
  }
}
