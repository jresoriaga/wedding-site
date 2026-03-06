# API Resource Code Examples

## Basic Resource
```php
class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
```

## Conditional Attributes
```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'author' => new UserResource($this->whenLoaded('user')),
        'content' => $this->when($request->user()?->can('view', $this->resource), $this->content),
        $this->mergeWhen($request->user()?->isAdmin(), [
            'internal_notes' => $this->internal_notes,
        ]),
    ];
}
```

## Nested Relationships
```php
'author' => new UserResource($this->whenLoaded('user')),
'comments' => CommentResource::collection($this->whenLoaded('comments')),
'category' => new CategoryResource($this->whenLoaded('category')),
```

## Resource Collection with Pagination
```php
class PostCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total' => $this->total(),
                'count' => $this->count(),
                'per_page' => $this->perPage(),
                'current_page' => $this->currentPage(),
                'total_pages' => $this->lastPage(),
            ],
            'links' => [
                'self' => $request->url(),
                'first' => $this->url(1),
                'last' => $this->url($this->lastPage()),
                'prev' => $this->previousPageUrl(),
                'next' => $this->nextPageUrl(),
            ],
        ];
    }
}
```

## Adding Links
```php
'links' => [
    'self' => route('posts.show', $this->id),
    'author' => route('users.show', $this->user_id),
    'comments' => route('posts.comments.index', $this->id),
],
```

## Pivot Data
```php
'assigned_at' => $this->whenPivotLoaded('role_user', function () {
    return $this->pivot->created_at;
}),
```

## Controller Usage
```php
class PostController extends Controller
{
    public function index()
    {
        $posts = Post::with(['user', 'category'])
            ->withCount('comments')
            ->paginate(15);
        return new PostCollection($posts);
    }

    public function show(Post $post)
    {
        $post->load(['user', 'comments.user', 'tags']);
        return new PostResource($post);
    }

    public function store(StorePostRequest $request)
    {
        $post = Post::create($request->validated());
        return (new PostResource($post))
            ->response()
            ->setStatusCode(201);
    }
}
```
