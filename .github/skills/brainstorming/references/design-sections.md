# Laravel-Specific Design Sections

## 1. Database Schema
```
We'll need three tables:
1. `posts` - title, slug, content, status, published_at
2. `tags` - name, slug
3. `post_tag` - pivot table for many-to-many

Foreign key to users, indexed on status and published_at.
Enum for status (draft, published, archived).

Does this schema make sense?
```

## 2. Models & Relationships
```
Post model with:
- belongsTo User, belongsToMany Tag
- Scopes: published(), draft(), recent()
- Casts: published_at as datetime, metadata as array
- Factory for testing

Tag model with:
- belongsToMany Post
- Slug auto-generation on save
```

## 3. API Design
```
GET    /api/posts           - List (paginated)
POST   /api/posts           - Create
GET    /api/posts/{post}    - Show
PUT    /api/posts/{post}    - Update
DELETE /api/posts/{post}    - Delete

Sanctum auth, rate limited 60 req/min.
API resources for output transformation.
```

## 4. Business Logic
```
When a post is published:
1. PostService validates readiness
2. Sets published_at timestamp
3. Dispatches NotifySubscribers job
4. Fires PostPublished event
5. Clears related caches

Service class for thin controllers, queues for emails.
```
