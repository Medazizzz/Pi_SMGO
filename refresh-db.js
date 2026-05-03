const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'content_management_db';

const ADMIN_HASH = '$2a$10$DCUi01.wLdI9rtDa9KswNuA.0aS5Go3vatThBlXH2VUUv8qnilO2S';

function dbRef(collection, id) {
  return { $ref: collection, $id: id };
}

function makeComment(text, createdAt) {
  return {
    id: new ObjectId().toHexString(),
    text,
    createdAt
  };
}

async function ensureUsers(db) {
  const users = db.collection('users');

  const admin = await users.findOne({ username: 'admin' });
  if (!admin) {
    await users.insertOne({
      username: 'admin',
      password: ADMIN_HASH,
      email: 'admin@smgo.local',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      enabled: true,
      locked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const user = await users.findOne({ username: 'user' });
  if (!user) {
    await users.insertOne({
      username: 'user',
      password: ADMIN_HASH,
      email: 'user@smgo.local',
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
      status: 'ACTIVE',
      enabled: true,
      locked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return users.findOne({ username: 'admin' });
}

async function refreshDatabase() {
  const client = new MongoClient(MONGO_URL);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db(DB_NAME);

    const adminUser = await ensureUsers(db);
    if (!adminUser) {
      throw new Error('Admin user is required but was not created/found.');
    }

    console.log('Cleaning old data collections...');
    await Promise.all([
      db.collection('contents').deleteMany({}),
      db.collection('genres').deleteMany({}),
      db.collection('notifications').deleteMany({})
    ]);

    const now = new Date();
    const minus2h = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const minus1h = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const plus10m = new Date(now.getTime() + 10 * 60 * 1000);
    const plus2d = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const genreDocs = [
      { name: 'Thriller', description: 'Suspenseful and tense stories', color: '#DC2626' },
      { name: 'Drama', description: 'Character-driven stories', color: '#2563EB' },
      { name: 'SciFi', description: 'Futuristic themes and science concepts', color: '#7C3AED' },
      { name: 'Action', description: 'Fast paced and energetic', color: '#EA580C' },
      { name: 'Mystery', description: 'Investigative and puzzle plots', color: '#0F766E' },
      { name: 'Nature', description: 'Wildlife and natural world', color: '#16A34A' },
      { name: 'History', description: 'Historical topics and events', color: '#A16207' },
      { name: 'Technology', description: 'Innovation and digital society', color: '#0891B2' }
    ];

    const insertedGenres = await db.collection('genres').insertMany(genreDocs);
    const genreIds = Object.values(insertedGenres.insertedIds).map((id) => id.toHexString());
    const genreByName = {};
    Object.keys(insertedGenres.insertedIds).forEach((index) => {
      genreByName[genreDocs[Number(index)].name] = insertedGenres.insertedIds[index].toHexString();
    });

    const addedBy = dbRef('users', adminUser._id);

    const contents = [
      {
        title: 'Breaking Bad',
        description: 'A chemistry teacher enters the meth trade to secure his family future.',
        releaseDate: new Date('2008-01-20T00:00:00Z'),
        publishAt: minus2h,
        expireAt: plus2d,
        publishedAt: minus2h,
        category: 'SERIES',
        contentType: 'SERIES',
        status: 'PUBLISHED',
        visible: true,
        viewCount: 1480,
        genreIds: [genreByName.Thriller, genreByName.Drama],
        addedBy,
        comments: [
          makeComment('Legendary writing and acting.', minus2h),
          makeComment('The tension is unreal.', minus1h)
        ],
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        isCompleted: true,
        _class: 'com.example.contentmanagement.entity.Series'
      },
      {
        title: 'Edge of Tomorrow',
        description: 'A soldier relives the same day while fighting an alien invasion.',
        releaseDate: new Date('2014-06-06T00:00:00Z'),
        publishAt: minus2h,
        expireAt: plus2d,
        publishedAt: minus2h,
        category: 'MOVIE',
        contentType: 'FILM',
        status: 'PUBLISHED',
        visible: true,
        viewCount: 870,
        genreIds: [genreByName.Action, genreByName.SciFi],
        addedBy,
        comments: [makeComment('Amazing concept and pacing.', minus1h)],
        durationInMinutes: 113,
        director: 'Doug Liman',
        _class: 'com.example.contentmanagement.entity.Film'
      },
      {
        title: 'Dark Signals',
        description: 'Investigators decode encrypted broadcasts tied to unsolved disappearances.',
        releaseDate: new Date('2023-10-12T00:00:00Z'),
        publishAt: minus2h,
        expireAt: plus2d,
        publishedAt: minus2h,
        category: 'MOVIE',
        contentType: 'FILM',
        status: 'PUBLISHED',
        visible: true,
        viewCount: 620,
        genreIds: [genreByName.Mystery, genreByName.Thriller],
        addedBy,
        comments: [
          makeComment('Loved the soundtrack.', minus2h),
          makeComment('Great mystery atmosphere.', minus1h)
        ],
        durationInMinutes: 124,
        director: 'Nadia Elman',
        _class: 'com.example.contentmanagement.entity.Film'
      },
      {
        title: 'Future Launch',
        description: 'A near-future series about orbital colonies preparing first migration.',
        releaseDate: new Date('2026-04-01T00:00:00Z'),
        publishAt: plus10m,
        expireAt: plus2d,
        publishedAt: null,
        category: 'SERIES',
        contentType: 'SERIES',
        status: 'SCHEDULED',
        visible: false,
        viewCount: 0,
        genreIds: [genreByName.SciFi],
        addedBy,
        comments: [],
        numberOfSeasons: 1,
        numberOfEpisodes: 8,
        isCompleted: false,
        _class: 'com.example.contentmanagement.entity.Series'
      },
      {
        title: 'Past Release Trigger',
        description: 'This item is intentionally scheduled in the past for publish transition tests.',
        releaseDate: new Date('2025-01-01T00:00:00Z'),
        publishAt: minus2h,
        expireAt: plus2d,
        publishedAt: null,
        category: 'DOCUMENTARY',
        contentType: 'DOCUMENTARY',
        status: 'SCHEDULED',
        visible: false,
        viewCount: 10,
        genreIds: [genreByName.History],
        addedBy,
        comments: [],
        topic: 'Archaeology',
        narrator: 'Liam Carter',
        _class: 'com.example.contentmanagement.entity.Documentary'
      },
      {
        title: 'Expired Chronicle',
        description: 'This documentary is pre-expired to test archive transition.',
        releaseDate: new Date('2020-08-20T00:00:00Z'),
        publishAt: minus2h,
        expireAt: minus1h,
        publishedAt: minus2h,
        category: 'DOCUMENTARY',
        contentType: 'DOCUMENTARY',
        status: 'PUBLISHED',
        visible: true,
        viewCount: 445,
        genreIds: [genreByName.Nature, genreByName.History],
        addedBy,
        comments: [makeComment('Excellent visuals.', minus1h)],
        topic: 'Climate Patterns',
        narrator: 'Ava Monroe',
        _class: 'com.example.contentmanagement.entity.Documentary'
      },
      {
        title: 'Tech Ethics',
        description: 'How recommendation engines shape behavior in modern platforms.',
        releaseDate: new Date('2022-03-11T00:00:00Z'),
        publishAt: minus2h,
        expireAt: plus2d,
        publishedAt: minus2h,
        category: 'DOCUMENTARY',
        contentType: 'DOCUMENTARY',
        status: 'PUBLISHED',
        visible: true,
        viewCount: 990,
        genreIds: [genreByName.Technology],
        addedBy,
        comments: [
          makeComment('Very informative and balanced.', minus2h),
          makeComment('Great for class discussion.', minus1h)
        ],
        topic: 'AI and Society',
        narrator: 'Noah Reid',
        _class: 'com.example.contentmanagement.entity.Documentary'
      },
      {
        title: 'Draft Internal Review',
        description: 'Draft content for admin-only lifecycle checks.',
        releaseDate: new Date('2026-05-01T00:00:00Z'),
        publishAt: plus10m,
        expireAt: plus2d,
        publishedAt: null,
        category: 'MOVIE',
        contentType: 'FILM',
        status: 'DRAFT',
        visible: false,
        viewCount: 0,
        genreIds: [genreIds[0]],
        addedBy,
        comments: [],
        durationInMinutes: 98,
        director: 'Internal Team',
        _class: 'com.example.contentmanagement.entity.Film'
      }
    ];

    await db.collection('contents').insertMany(contents);

    await db.collection('notifications').insertMany([
      {
        message: 'Database refreshed with rich test content.',
        type: 'SUCCESS',
        isRead: false,
        user: dbRef('users', adminUser._id),
        createdAt: now
      },
      {
        message: 'Scheduler test records seeded: past scheduled and expired published.',
        type: 'INFO',
        isRead: false,
        user: dbRef('users', adminUser._id),
        createdAt: now
      }
    ]);

    const total = await db.collection('contents').countDocuments();
    const published = await db.collection('contents').countDocuments({ status: 'PUBLISHED' });
    const scheduled = await db.collection('contents').countDocuments({ status: 'SCHEDULED' });
    const archived = await db.collection('contents').countDocuments({ status: 'ARCHIVED' });
    const draft = await db.collection('contents').countDocuments({ status: 'DRAFT' });

    console.log('Refresh complete.');
    console.log(`Genres: ${await db.collection('genres').countDocuments()}`);
    console.log(`Contents total: ${total}`);
    console.log(`Status counts => PUBLISHED: ${published}, SCHEDULED: ${scheduled}, ARCHIVED: ${archived}, DRAFT: ${draft}`);
    console.log('Backend URL: http://localhost:8090');
    console.log('Frontend URL: http://localhost:4200');
  } catch (error) {
    console.error('Refresh failed:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

refreshDatabase();
