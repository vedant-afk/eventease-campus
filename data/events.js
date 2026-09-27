// Seed data for EventEase.
// The app keeps events in memory (a plain JavaScript array), so every
// restart of the server starts again from this list.

function createSeedEvents() {
  return [
    {
      id: 1,
      title: 'Tech Fest',
      category: 'Festival',
      date: '28 September 2026',
      venue: 'Main Auditorium',
      description: 'Coding contests, project expo and tech talks by alumni.',
      capacity: 100,
      participants: []
    },
    {
      id: 2,
      title: 'Photography Workshop',
      category: 'Workshop',
      date: '2 October 2026',
      venue: 'Media Lab',
      description: 'Hands-on session on composition, lighting and editing.',
      capacity: 30,
      participants: []
    },
    {
      id: 3,
      title: 'AI & Robotics Meetup',
      category: 'Meetup',
      date: '5 October 2026',
      venue: 'Innovation Lab',
      description: 'Live robot demos and a panel on careers in AI.',
      capacity: 50,
      participants: []
    }
  ];
}

module.exports = { createSeedEvents };
