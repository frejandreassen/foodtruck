# CLAUDE.md - Next.js Food Truck Project Guidelines

## Commands
- `pnpm dev` - Start development server with turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Code Style
- **Types**: Use strict TypeScript typing (`strict: true` in tsconfig)
- **Imports**: Use absolute imports with `@/` alias (e.g., `@/components/ui/button`)
- **Components**: Use function components with explicit type definitions
- **Props**: Destructure props at the component level
- **CSS**: Use Tailwind with the `cn` utility for class merging
- **Error Handling**: Use try/catch for async operations
- **UI Components**: Keep in `/components/ui` directory
- **Page Components**: Keep in `/app` directory using Next.js App Router
- **Naming**: PascalCase for components, camelCase for functions/variables
- **React Patterns**: Prefer composition over inheritance
- **Exports**: Use named exports for components

## TypeScript
- Target ES2017
- Strict type checking
- Use type inference when possible, explicit types for function parameters

## Backend
Directus backend available at cms.businessfalkenberg.se

### Food Truck Booking System Schema
Core Collections

#### Food Trucks (foodtrucks)

id: Primary key (auto-increment integer)
name: Truck name
user: Foreign key to Directus user (owner)
bookings: One-to-many relationship to bookings


#### Spaces (spaces)

id: Primary key (auto-increment integer)
name: Space name
location: Geographic point data
bookings: One-to-many relationship to bookings


#### Bookings (foodtruck_bookings)

id: Primary key (auto-increment integer)
foodtruck: Foreign key to food truck
space: Foreign key to space
start: Booking start datetime
end: Booking end datetime



#### Relationships

A food truck can have multiple bookings
A space can have multiple bookings
Each booking connects one food truck to one space for a specific time period
Food trucks are associated with Directus users (owners)

This schema supports a system where food truck owners (users) can book specific spaces for their trucks for defined time periods. The system includes location data for the spaces, making it suitable for map-based applications.

## Backend authentication
Please use directus auth and inherit the directus tokens.
- Login page at /auth/login (should create backend call to directus login)
- No signup page
- Password request at /auth/password-request,  should trigger backend call // POST /auth/password/request
{
  "email": "user@email.com",
  "reset_url": process.env.APP_URL + "/auth/password-reset"
}

- Password reset at /auth/password-reset (you will get token as url parametar (this should trigger backend call // POST /auth/password/reset
{
  "token": "token",
  "password": "THE NEW PASSWORD"
})