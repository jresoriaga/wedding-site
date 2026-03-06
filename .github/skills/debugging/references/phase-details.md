# Phase Details with Code Examples

## Phase 1: Root Cause Investigation

### Read Error Messages Carefully
```
SQLSTATE[23000]: Integrity constraint violation
→ Check foreign key constraints, not a code bug

Class 'App\Models\Post' not found
→ Check namespace, run composer dump-autoload

Method Illuminate\Database\Eloquent\Collection::save does not exist
→ get() returns Collection, not Model. Use first() or update()
```

### Check Laravel Logs
```bash
tail -f storage/logs/laravel.log
grep "SQLSTATE" storage/logs/laravel.log
> storage/logs/laravel.log  # Clear if too large
```

### Enable Debug Mode (Local Only)
```env
APP_DEBUG=true
APP_ENV=local
```

### Use Laravel Telescope
```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
# Access at /telescope
```

### Check Recent Changes
```bash
git log --oneline -10
git diff HEAD~5
php artisan migrate:status
php artisan config:show
```

### Reproduce Consistently
```bash
php artisan tinker
>>> App\Models\Post::first();
APP_ENV=testing php artisan test
```

### Trace Data Flow
```php
DB::listen(function ($query) {
    Log::debug('Query executed', [
        'sql' => $query->sql,
        'bindings' => $query->bindings,
        'time' => $query->time,
    ]);
});

// Or in specific code
DB::enableQueryLog();
$posts = Post::with('user')->get();
dd(DB::getQueryLog());
```

## Phase 2: Pattern Analysis

### Find Working Examples
```bash
grep -r "belongsTo" app/Models/
grep -r "middleware" app/Http/
```

### Compare Against Conventions
```php
// What you have (wrong)
class Post extends Model {
    public function author() {
        return $this->hasOne(User::class, 'id', 'user_id');
    }
}

// Laravel convention (correct)
class Post extends Model {
    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }
}
```

## Phase 3: Hypothesis and Testing

### Form Single Hypothesis
```
Hypothesis: "Posts aren't saving because mass assignment
protection is blocking the 'user_id' field"
Expected: Adding 'user_id' to $fillable will fix it
```

### Test Minimally
```php
// Before (broken)
protected $fillable = ['title', 'content'];

// Test change (ONE variable)
protected $fillable = ['title', 'content', 'user_id'];
```

### Verify in Tinker
```bash
php artisan tinker
>>> $post = Post::create(['title' => 'Test', 'content' => 'Test', 'user_id' => 1]);
>>> $post->user_id; // Should be 1
```

## Phase 4: Implementation

### Create Failing Test Case
```php
test('user can create post', function () {
    $user = User::factory()->create();
    $response = $this->actingAs($user)
        ->post('/posts', ['title' => 'Test Post', 'content' => 'Test content']);
    $response->assertRedirect();
    expect(Post::where('title', 'Test Post')->exists())->toBeTrue();
    expect(Post::first()->user_id)->toBe($user->id);
});
```

### If 3+ Fixes Failed: Question Architecture
```
Pattern indicating architectural problem:
- Each fix reveals new shared state/coupling
- Fixes require "massive refactoring"
- Each fix creates new symptoms elsewhere

STOP and question fundamentals:
- Is this Laravel pattern correct?
- Should we use a different approach?
- Are we fighting the framework?
```
