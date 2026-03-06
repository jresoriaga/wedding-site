# Laravel-Specific Debug Techniques

## Eloquent Debugging
```php
$posts = Post::where('status', 'published');
dd($posts->toSql(), $posts->getBindings());

$post = Post::first();
$post->relationLoaded('user'); // false
$post->load('user');
$post->relationLoaded('user'); // true

Model::preventLazyLoading(!app()->isProduction());
```

## Route Debugging
```bash
php artisan route:list
php artisan route:list --name=posts
php artisan tinker
>>> route('posts.show', 1);
```

## Queue Debugging
```bash
php artisan queue:failed
php artisan queue:retry <id>
php artisan queue:work --verbose
php artisan tinker
>>> DB::table('jobs')->first();
```

## Validation Debugging
```php
protected function failedValidation(Validator $validator)
{
    Log::debug('Validation failed', [
        'errors' => $validator->errors()->toArray(),
        'input' => $this->all(),
    ]);
    parent::failedValidation($validator);
}
```
