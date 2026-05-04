# 🗄️ MongoDB Setup Guide - User Profiles

## Overview

The User Profile System now uses **MongoDB** instead of SQL. This guide explains how to set up and use MongoDB with the application.

---

## ✅ What Changed

### Before (SQL/JPA)
```java
@Entity
@Table(name = "user_profiles")
public class UserProfile { }

extends JpaRepository<UserProfile, String>
```

### After (MongoDB)
```java
@Document(collection = "user_profiles")
public class UserProfile { }

extends MongoRepository<UserProfile, String>
```

---

## 🚀 Installation & Setup

### 1. Install MongoDB

#### Windows
```bash
# Download from https://www.mongodb.com/try/download/community
# Or use Chocolatey
choco install mongodb-community
```

#### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb-org
```

### 2. Start MongoDB Service

#### Windows
```bash
# MongoDB starts automatically as a service
# Or manually:
mongod --config "C:\Program Files\MongoDB\Server\6.0\etc\mongod.conf"
```

#### macOS/Linux
```bash
# Start MongoDB
brew services start mongodb-community

# Or manually
mongod
```

**Expected Output:**
```
[initandlisten] waiting for connections on port 27017
```

### 3. Verify MongoDB is Running

```bash
# Connect to MongoDB shell
mongosh

# Or legacy mongo shell
mongo
```

**Should show:**
```
test>
```

---

## 🔧 Configure Application

### Add MongoDB Dependency

Update `backend/pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
```

### Update application.properties

```properties
# MongoDB Configuration
spring.data.mongodb.uri=mongodb://localhost:27017/smgo_db
# OR individual properties:
spring.data.mongodb.host=localhost
spring.data.mongodb.port=27017
spring.data.mongodb.database=smgo_db
spring.data.mongodb.username=root
spring.data.mongodb.password=password
```

### Or application.yml

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/smgo_db
      # OR
      host: localhost
      port: 27017
      database: smgo_db
      username: root
      password: password
```

---

## 📊 MongoDB Collections

### user_profiles Collection

**Document Structure:**
```json
{
  "_id": "profile_1",
  "user_id": "user_123",
  "name": "mayssen",
  "type": "ADULT",
  "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=adult-avatar",
  "color": "#4D96FF",
  "is_default": true,
  "age_restriction": null,
  "created_at": ISODate("2026-05-02T10:30:00Z"),
  "updated_at": ISODate("2026-05-02T10:30:00Z")
}
```

**Sample Data:**
```javascript
db.user_profiles.insertMany([
  {
    "_id": "profile_1",
    "user_id": "user_123",
    "name": "mayssen",
    "type": "ADULT",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=adult-avatar",
    "color": "#4D96FF",
    "is_default": true,
    "age_restriction": null,
    "created_at": new Date(),
    "updated_at": new Date()
  },
  {
    "_id": "profile_2",
    "user_id": "user_123",
    "name": "Enfants",
    "type": "KIDS",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=kids-avatar",
    "color": "#FF6B9D",
    "is_default": false,
    "age_restriction": 13,
    "created_at": new Date(),
    "updated_at": new Date()
  }
])
```

---

## 📋 MongoDB Commands

### Connect to MongoDB

```bash
mongosh
# Or legacy:
mongo
```

### Select Database

```javascript
use smgo_db
```

### Create Collections

```javascript
db.createCollection("user_profiles")
db.createCollection("profile_favorites")
db.createCollection("profile_watch_history")
db.createCollection("profile_parental_controls")
```

### Create Indexes

```javascript
// Single field indexes
db.user_profiles.createIndex({ "user_id": 1 })
db.user_profiles.createIndex({ "type": 1 })

// Compound indexes
db.user_profiles.createIndex({ "user_id": 1, "is_default": 1 })
db.user_profiles.createIndex({ "user_id": 1, "type": 1 })

// View indexes
db.user_profiles.getIndexes()
```

### Insert Sample Data

```javascript
db.user_profiles.insertOne({
  "_id": "profile_1",
  "user_id": "user_123",
  "name": "mayssen",
  "type": "ADULT",
  "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=adult-avatar",
  "color": "#4D96FF",
  "is_default": true,
  "age_restriction": null,
  "created_at": new Date(),
  "updated_at": new Date()
})
```

### Query Data

```javascript
// Find all profiles for a user
db.user_profiles.find({ "user_id": "user_123" })

// Find default profile
db.user_profiles.findOne({ "user_id": "user_123", "is_default": true })

// Find by type
db.user_profiles.find({ "user_id": "user_123", "type": "KIDS" })
```

### Update Data

```javascript
// Update profile name
db.user_profiles.updateOne(
  { "_id": "profile_1" },
  { $set: { "name": "New Name", "updated_at": new Date() } }
)
```

### Delete Data

```javascript
// Delete single profile
db.user_profiles.deleteOne({ "_id": "profile_1" })

// Delete all profiles for user
db.user_profiles.deleteMany({ "user_id": "user_123" })
```

---

## 🔄 Entity Changes

### Old (SQL) vs New (MongoDB)

#### UserProfile.java

**OLD:**
```java
@Entity
@Table(name = "user_profiles")
public class UserProfile {
    @Id
    private String id;
    
    @Column(name = "user_id")
    private String userId;
    
    @PrePersist
    protected void onCreate() { ... }
}
```

**NEW:**
```java
@Document(collection = "user_profiles")
public class UserProfile {
    @Id
    private String id;
    
    @Field("user_id")
    private String userId;
    
    public void preSave() { ... }
}
```

---

## 🔌 Repository Changes

**OLD (JpaRepository):**
```java
extends JpaRepository<UserProfile, String>
```

**NEW (MongoRepository):**
```java
extends MongoRepository<UserProfile, String>
```

**Query Methods:** Same interface!
```java
List<UserProfile> findByUserId(String userId);
Optional<UserProfile> findByUserIdAndIsDefaultTrue(String userId);
```

---

## 🌐 API Endpoints

All endpoints work the same way:

```http
GET    /api/profiles/user/{userId}
GET    /api/profiles/{profileId}
POST   /api/profiles/user/{userId}
PUT    /api/profiles/{profileId}
DELETE /api/profiles/{profileId}
```

---

## 🧪 Testing MongoDB

### Test Connection

```bash
# In MongoDB shell
db.adminCommand('ping')
# Output: { ok: 1 }
```

### Test with Application

```bash
# Start backend
cd backend
mvn spring-boot:run
```

**Check logs for:**
```
[MongoDbConfig] Initializing MongoDB collections and indexes...
[MongoDbConfig] Created index on user_profiles: user_id
[MongoDbConfig] Inserting sample user profiles...
[MongoDbConfig] Sample profiles inserted successfully
```

### Test with API

```bash
# Get all profiles
curl http://localhost:8080/api/profiles/user/user_123

# Create profile
curl -X POST http://localhost:8080/api/profiles/user/user_123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Profile",
    "type": "KIDS",
    "color": "#FF6B9D"
  }'
```

---

## 📊 MongoDB Atlas (Cloud)

### Use MongoDB Cloud Instead of Local

1. **Create Account**: https://www.mongodb.com/cloud/atlas

2. **Create Cluster**: Free tier available

3. **Get Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/smgo_db?retryWrites=true&w=majority
   ```

4. **Update application.properties**:
   ```properties
   spring.data.mongodb.uri=mongodb+srv://username:password@cluster.mongodb.net/smgo_db?retryWrites=true&w=majority
   ```

---

## 🔐 Security

### Set MongoDB Password

```bash
# In MongoDB shell
use admin
db.createUser({
  user: "root",
  pwd: "password123",
  roles: [{ role: "root", db: "admin" }]
})
```

### Update Connection String

```properties
spring.data.mongodb.uri=mongodb://root:password123@localhost:27017/smgo_db?authSource=admin
```

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Refused
**Solution:** 
- Check MongoDB is running: `mongosh`
- Check port 27017 is open
- Verify connection string in `application.properties`

### Issue: Collection Not Found
**Solution:**
- MongoDbConfig should create it on startup
- Check logs for initialization messages
- Manually create: `db.createCollection("user_profiles")`

### Issue: Duplicate Key Error
**Solution:**
- Remove duplicate indexes: `db.user_profiles.dropIndex("user_id_1")`
- Or drop entire collection: `db.user_profiles.drop()`

### Issue: Authentication Failed
**Solution:**
- Verify username/password correct
- Add `?authSource=admin` to connection string
- Ensure user exists in correct database

---

## 📚 Useful MongoDB GUI Tools

- **MongoDB Compass** - Official GUI (https://www.mongodb.com/products/compass)
- **Studio 3T** - Professional IDE
- **Robo 3T** - Free MongoDB client
- **DataGrip** - JetBrains database IDE

---

## 📈 Performance Tips

### Create Indexes for Frequently Queried Fields
```javascript
db.user_profiles.createIndex({ "user_id": 1 })
db.user_profiles.createIndex({ "is_default": 1 })
```

### Use Projection to Limit Data
```javascript
db.user_profiles.find({ "user_id": "user_123" }, { "name": 1, "type": 1 })
```

### Use Compound Indexes for Multiple Fields
```javascript
db.user_profiles.createIndex({ "user_id": 1, "is_default": 1 })
```

---

## 🔄 Migration from SQL to MongoDB

### Automatic Initialization
- `MongoDbConfig.java` runs on startup
- Creates indexes automatically
- Inserts sample data if collection is empty

### Manual Migration
```bash
# Export from SQL (if needed)
mongoexport --db smgo_db --collection user_profiles --out profiles.json

# Import from JSON
mongoimport --db smgo_db --collection user_profiles --file profiles.json
```

---

## ✅ Checklist

- [ ] MongoDB installed and running
- [ ] `spring-boot-starter-data-mongodb` dependency added
- [ ] `application.properties` configured
- [ ] MongoDbConfig.java in classpath
- [ ] Sample data inserted
- [ ] Indexes created
- [ ] API endpoints tested
- [ ] Frontend connected to API

---

## 📞 Support

### Check Application Logs
```
[MongoDbConfig] Initializing MongoDB collections...
[MongoDbConfig] Created index on user_profiles: user_id
```

### Verify Data in MongoDB
```javascript
use smgo_db
db.user_profiles.find()
db.user_profiles.countDocuments()
```

### Test API
```bash
curl http://localhost:8080/api/profiles/user/user_123
```

---

## 📚 Additional Resources

- [Spring Data MongoDB Docs](https://spring.io/projects/spring-data-mongodb)
- [MongoDB Official Docs](https://docs.mongodb.com/)
- [MongoRepository API](https://docs.spring.io/spring-data/mongodb/docs/current/reference/html/)

---

**Version**: 1.0.0  
**Last Updated**: May 2, 2026  
**Status**: Ready to Use ✅
