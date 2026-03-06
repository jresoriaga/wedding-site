# Laravel-Specific Considerations

## Architecture
- Monolith or microservices?
- Design patterns: repository, service layer, actions?
- How will this scale?

## Database
- What relationships are needed?
- What indexes for performance?
- Should we use polymorphic relationships?

## Performance
- Should this use queues?
- What caching strategy?
- Eager loading requirements?

## Testing
- What factories are needed?
- Feature tests vs unit tests?
- How to test jobs/events?

## Security
- Authorization via policies or gates?
- What validation rules?
- Rate limiting needs?
