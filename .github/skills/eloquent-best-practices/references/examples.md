# Eloquent Code Examples

## Eager Loading
```php
// N+1 Problem
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->user->name; // N additional queries
}

// Eager Loading
$posts = Post::with('user')->get();
```

## Select Columns
```php
$users = User::select(['id', 'name', 'email'])->get();
$posts = Post::with(['user:id,name'])->select(['id', 'title', 'user_id'])->get();
```

## Query Scopes
```php
class Post extends Model
{
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                    ->whereNotNull('published_at');
    }

    public function scopePopular($query, $threshold = 100)
    {
        return $query->where('views', '>', $threshold);
    }
}
// Usage: Post::published()->popular()->get();
```

## Relationship Return Types
```php
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}

public function comments(): HasMany
{
    return $this->hasMany(Comment::class);
}
```

## withCount
```php
// Bad: Triggers additional queries
foreach ($posts as $post) { echo $post->comments()->count(); }

// Good: Load counts efficiently
$posts = Post::withCount('comments')->get();
foreach ($posts as $post) { echo $post->comments_count; }
```

## Mass Assignment
```php
protected $fillable = ['title', 'content', 'status'];
// Never: protected $guarded = [];
```

## Casts
```php
protected $casts = [
    'published_at' => 'datetime',
    'metadata' => 'array',
    'is_featured' => 'boolean',
];
```

## Chunking
```php
Post::chunk(200, function ($posts) {
    foreach ($posts as $post) { /* process */ }
});
Post::lazy()->each(function ($post) { /* process one at a time */ });
```

## Database-Level Operations
```php
// Slow: Loads into memory
$posts = Post::where('status', 'draft')->get();
foreach ($posts as $post) { $post->update(['status' => 'archived']); }

// Fast: Single query
Post::where('status', 'draft')->update(['status' => 'archived']);
Post::where('id', $id)->increment('views');
```

## Querying in Loops
```php
// Bad
foreach ($userIds as $id) { $user = User::find($id); }

// Good
$users = User::whereIn('id', $userIds)->get();
```

## Migration Indexes
```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->index();
    $table->string('slug')->unique();
    $table->string('status')->index();
    $table->timestamp('published_at')->nullable()->index();
    $table->index(['status', 'published_at']);
});
```

## Prevent Lazy Loading
```php
// In AppServiceProvider boot method
Model::preventLazyLoading(!app()->isProduction());
```
