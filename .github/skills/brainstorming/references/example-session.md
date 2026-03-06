# Example Brainstorming Session

```
Claude: I see you want to add a comment system. Let me understand the requirements.

First question: Should comments be nested (replies to replies) or just one level deep?

User: Just one level - comments on posts.

Claude: For moderation, which approach:
A) All comments published immediately
B) Comments from new users require approval
C) All comments require approval

User: B - new users need approval.

Claude: For notifications when someone comments:
A) Real-time via Laravel Echo and WebSockets
B) Email only
C) In-app notifications (database)

User: In-app notifications.

Claude: Let me present the design...
[Design sections follow]
```

## Common Topics
- Authentication flow (SPA vs traditional)
- API design (REST vs GraphQL)
- Real-time features (Pusher vs Reverb)
- File upload strategy (local vs S3)
- Multi-tenancy approach
- Payment integration (Stripe, Cashier)
- Search implementation (Scout, Elasticsearch)
- Admin panel (Nova, Filament, custom)
