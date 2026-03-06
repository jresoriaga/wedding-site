# Laravel Test Pattern Examples

## Feature Test
```php
test('authenticated user can create post', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/posts', [
            'title' => 'My First Post',
            'content' => 'Post content here',
        ])
        ->assertRedirect('/posts');

    expect(Post::where('title', 'My First Post')->exists())->toBeTrue();
    expect(Post::first()->user_id)->toBe($user->id);
});
```

## Database Test
```php
uses(RefreshDatabase::class);

test('creates post in database', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/posts', ['title' => 'Test', 'content' => 'Content']);

    $this->assertDatabaseHas('posts', ['title' => 'Test']);
});
```

## Authorization Test
```php
test('user cannot delete others posts', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    $this->actingAs($user)
        ->delete("/posts/{$post->id}")
        ->assertForbidden();
});
```

## API Test
```php
test('creates post via API', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/posts', ['title' => 'API Post', 'content' => 'Content'])
        ->assertCreated();
});
```
