/**
 * Comprehensive Database initialization script using Node.js MongoDB driver
 * Populates the database with test content including Films, Series, and Documentaries
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'content_management_db';

async function initDatabase() {
  let client;

  try {
    console.log('🚀 Connecting to MongoDB...');
    client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);

    // 1. Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await db.collection('categories').deleteMany({});
    await db.collection('contents').deleteMany({});
    await db.collection('notifications').deleteMany({});
    console.log('✅ Collections cleared');

    // 2. Create categories
    console.log('\n📂 Creating categories...');
    const categoryDocs = [
      { name: 'Action', description: 'High-octane films featuring explosions, stunts, and intense sequences', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Comedy', description: 'Humorous films designed to entertain and make audiences laugh', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Drama', description: 'Character-driven stories exploring human emotions and complex relationships', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Science Fiction', description: 'Imaginative stories set in futuristic worlds with advanced technology', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Documentary', description: 'Real-world stories and educational content about varied topics', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Horror', description: 'Suspenseful stories designed to frighten and thrill audiences', createdAt: new Date(), updatedAt: new Date() }
    ];

    const categoryResult = await db.collection('categories').insertMany(categoryDocs);
    console.log(`✅ Created ${categoryResult.insertedIds.length} categories`);

    // Get category IDs for reference
    const categories = await db.collection('categories').find().toArray();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
      console.log(`   - ${cat.name}`);
    });

    // Get admin user for addedBy reference
    const adminUser = await db.collection('users').findOne({ username: 'admin' });
    if (!adminUser) {
      throw new Error('❌ Admin user not found in database. Please run init-users.mongodb first.');
    }

    // 3. Create Films
    console.log('\n🎬 Creating films...');
    const filmDocs = [
      {
        title: 'The Matrix',
        description: 'A computer hacker learns about the true nature of his reality and his role in the war against its controllers.',
        releaseDate: new Date('1999-03-31'),
        category: { $ref: 'categories', $id: categoryMap['Action'] },
        addedBy: { $ref: 'users', $id: adminUser._id },
        durationInMinutes: 136,
        director: 'Lana Wachowski',
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _class: 'com.example.contentmanagement.entity.Film'
      },
      {
        title: 'Forrest Gump',
        description: 'The presidencies of Kennedy, Johnson, and Nixon unfold from the perspective of an Alabama man with an IQ of 75.',
        releaseDate: new Date('1994-07-06'),
        category: { $ref: 'categories', $id: categoryMap['Comedy'] },
        addedBy: { $ref: 'users', $id: adminUser._id },
        durationInMinutes: 142,
        director: 'Robert Zemeckis',
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _class: 'com.example.contentmanagement.entity.Film'
      },
      {
        title: 'Inception',
        description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.',
        releaseDate: new Date('2010-07-16'),
        category: { $ref: 'categories', $id: categoryMap['Science Fiction'] },
        addedBy: { $ref: 'users', $id: adminUser._id },
        durationInMinutes: 148,
        director: 'Christopher Nolan',
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _class: 'com.example.contentmanagement.entity.Film'
      },
      {
        title: 'The Shawshank Redemption',
        description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
        releaseDate: new Date('1994-10-14'),
        category: { $ref: 'categories', $id: categoryMap['Drama'] },
        addedBy: { $ref: 'users', $id: adminUser._id },
        durationInMinutes: 142,
        director: 'Frank Darabont',
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _class: 'com.example.contentmanagement.entity.Film'
      },
      {
        title: 'Parasite',
        description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
        releaseDate: new Date('2019-05-30'),
        category: { $ref: 'categories', $id: categoryMap['Drama'] },
        addedBy: { $ref: 'users', $id: adminUser._id },
        durationInMinutes: 132,
        director: 'Bong Joon-ho',
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _class: 'com.example.contentmanagement.entity.Film'
      }
    ];

    const filmResult = await db.collection('contents').insertMany(filmDocs);
    console.log(`✅ Created ${filmResult.insertedIds.length} films`);

    const films = await db.collection('contents').find({ _class: 'com.example.contentmanagement.entity.Film' }).toArray();
    films.forEach(film => {
      console.log(`   - ${film.title} (${film.director}) - ${film.durationInMinutes} min`);
    });

    // 4. Create Series
    console.log('\n📺 Creating series...');
    const seriesDocs = [
      {
        title: 'Breaking Bad',
        description: 'A high school chemistry teacher turned drug kingpin. Complex characters and plot twists throughout.',
        releaseDate: new Date('2008-01-20'),
        category: { $ref: 'categories', $id: categoryMap['Drama'] },
        addedBy: { $ref: 'users', $id: adminUser._id },
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        isCompleted: true,
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _class: 'com.example.contentmanagement.entity.Series'
      },
      {
        title: 'Stranger Things',
        description: 'A group of kids encounter mysterious supernatural forces and secret government experiments in their small town.',
        releaseDate: new Date('2016-07-15'),
        category: { $ref: 'categories', $id: categoryMap['Science Fiction'] },
        addedBy: { $ref: 'users', $id: adminUser._id },
        numberOfSeasons: 4,
        numberOfEpisodes: 42,
        isCompleted: false,
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _class: 'com.example.contentmanagement.entity.Series'
      },
      {
        title: 'The Office',
        description: 'A mockumentary about everyday life at a mid-sized paper company and its quirky employees.',
        releaseDate: new Date('2005-03-24'),
        category: { $ref: 'categories', $id: categoryMap['Comedy'] },
        addedBy: { $ref: 'users', $id: adminUser._id },
        numberOfSeasons: 9,
        numberOfEpisodes: 201,
        isCompleted: true,
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _class: 'com.example.contentmanagement.entity.Series'
      }
    ];

    const seriesResult = await db.collection('contents').insertMany(seriesDocs);
    console.log(`✅ Created ${seriesResult.insertedIds.length} series`);

    const series = await db.collection('contents').find({ _class: 'com.example.contentmanagement.entity.Series' }).toArray();
    series.forEach(s => {
      console.log(`   - ${s.title} (${s.numberOfSeasons} seasons, ${s.numberOfEpisodes} episodes) ${s.isCompleted ? '✅ Completed' : '🔄 Ongoing'}`);
    });

    // 5. Create Documentaries
    console.log('\n🎥 Creating documentaries...');
    const docDocs = [
      {
        title: 'Our Planet',
        description: 'A documentary series exploring the incredible diversity of wildlife and landscapes across our planet.',
        releaseDate: new Date('2019-04-05'),
        category: { $ref: 'categories', $id: categoryMap['Documentary'] },
        addedBy: { $ref: 'users', $id: adminUser._id },
        topic: 'Nature and Wildlife',
        narrator: 'David Attenborough',
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _class: 'com.example.contentmanagement.entity.Documentary'
      },
      {
        title: 'The Social Dilemma',
        description: 'An in-depth exploration of how social media companies engineer addiction and manipulate user behavior.',
        releaseDate: new Date('2020-09-09'),
        category: { $ref: 'categories', $id: categoryMap['Documentary'] },
        addedBy: { $ref: 'users', $id: adminUser._id },
        topic: 'Technology and Society',
        narrator: 'Various Experts',
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _class: 'com.example.contentmanagement.entity.Documentary'
      }
    ];

    const docResult = await db.collection('contents').insertMany(docDocs);
    console.log(`✅ Created ${docResult.insertedIds.length} documentaries`);

    const docs = await db.collection('contents').find({ _class: 'com.example.contentmanagement.entity.Documentary' }).toArray();
    docs.forEach(doc => {
      console.log(`   - ${doc.title} (Narrator: ${doc.narrator}) - Topic: ${doc.topic}`);
    });

    // 6. Create Notifications
    console.log('\n📢 Creating notifications...');
    const notificationDocs = [
      {
        message: 'New film added: Parasite has been added to the Drama collection',
        type: 'INFO',
        isRead: false,
        user: { $ref: 'users', $id: adminUser._id },
        createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
      },
      {
        message: 'New category created: Documentary is now available',
        type: 'INFO',
        isRead: false,
        user: { $ref: 'users', $id: adminUser._id },
        createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 mins ago
      },
      {
        message: 'System update completed successfully with new content types',
        type: 'SUCCESS',
        isRead: true,
        user: { $ref: 'users', $id: adminUser._id },
        createdAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      },
      {
        message: 'Database migration: 10 new items added (5 Films, 3 Series, 2 Documentaries)',
        type: 'SUCCESS',
        isRead: false,
        user: { $ref: 'users', $id: adminUser._id },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        message: 'Warning: Database size has increased. Consider archiving old content',
        type: 'WARNING',
        isRead: false,
        user: { $ref: 'users', $id: adminUser._id },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
      }
    ];

    const notificationResult = await db.collection('notifications').insertMany(notificationDocs);
    console.log(`✅ Created ${notificationResult.insertedIds.length} notifications`);

    const notifications = await db.collection('notifications').find({}).toArray();
    console.log('\n📬 Notifications created:');
    notifications.forEach(notif => {
      console.log(`   - [${notif.type}] ${notif.message.substring(0, 50)}... (read: ${notif.isRead})`);
    });

    // 7. Print comprehensive summary
    console.log('\n✨ Database population complete!\n');
    console.log('📊 Summary:');
    console.log(`   Categories: ${await db.collection('categories').countDocuments()}`);
    console.log(`   Films: ${(await db.collection('contents').find({ _class: 'com.example.contentmanagement.entity.Film' }).toArray()).length}`);
    console.log(`   Series: ${(await db.collection('contents').find({ _class: 'com.example.contentmanagement.entity.Series' }).toArray()).length}`);
    console.log(`   Documentaries: ${(await db.collection('contents').find({ _class: 'com.example.contentmanagement.entity.Documentary' }).toArray()).length}`);
    console.log(`   Notifications: ${await db.collection('notifications').countDocuments()}`);

    console.log('\n✅ Content Management System Ready');
    console.log('   ✓ Content Management: Films, Series, Documentaries');
    console.log('   ✓ Category Management: 6 categories with descriptions');
    console.log('   ✓ Notification Management: 5 notifications with types (INFO, SUCCESS, WARNING)');
    console.log('\n🎉 Application is ready to use!');
    console.log('📱 Frontend: http://localhost:4200');
    console.log('🔌 Backend: http://localhost:8090');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ MongoDB connection closed');
    }
  }
}

// Run initialization
initDatabase();
