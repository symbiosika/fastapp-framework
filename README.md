# FastApp Webserver for real fast development

## A base docker image to render websites!

The base image represents the web server.
There are several subdirectories that are mapped externally.
Specific content can be placed in these directories.

Alternatively, another Docker image can be built based on this image, and the folders can be filled.

This makes the development of apps with authentication, etc., very fast.

## Requirements V0.1

### Webserver functions

- [ ] Provide a running webserver as docker image
- [ ] Provide webserver as submodule?
- [ ] Serve static public files (e.g. the Main page for an App)
- [x] Serve static hidden files behind the user login
- [x] Serve an API for the database (simple query logic)

### User handling

- [x] Simple Username/Password Registration and Login
- [x] Standard Static page for Login/Logout/Registration
- [ ] Custom registration flow to prevent Registration of unallowed users
- [ ] Auth0 Login (Cloud)

### Payment Integration

- [ ] Optional payment functions (checked by middleware)
- [ ] Simple Stripe Integration
- [ ] Standard config for payment plans to the custom app
- [ ] Standard Static page to subscribe to a payment plan
- [ ] Standard config for coupons for the custom app
- [ ] Single Payment actions (one-time buy)

## Requirements V0.5

- [ ] Internal Proxy to connect server-side-rendering frameworks inside
- [ ] 2FA Auth: https://www.npmjs.com/package/otpauth
- [ ] Magic Link Auth: https://www.npmjs.com/package/passport-magic-link
- [ ] Internal Proxy to connect server-side-rendering frameworks inside
- [ ] Internal Proxy to connect other webservices

## Database

FastApp uses PostgreSQL with pgvector to handle all data and files.

### Table definition

All standard tables will be prefixed with "base\_\*".
All custom tables must use another prefix.

## Collections Endpoint

### Filter Parameter Documentation

The filter parameter allows for complex querying of data using a custom syntax. It supports logical operations, comparisons, and grouping.

#### Basic Syntax

`field operator value`

- `field`: The name of the field to filter on
- `operator`: The comparison operator
- `value`: The value to compare against

#### Operators

- `=`: Equal to
- `!=`: Not equal to
- `>`: Greater than
- `>=`: Greater than or equal to
- `<`: Less than
- `<=`: Less than or equal to
- `~`: Like (string pattern matching)
- `!~`: Not like
- `?=`: Is null
- `?!=`: Is not null

#### Logical Operators

- `&&`: AND
- `||`: OR

#### Grouping

Use parentheses `()` to group expressions and control precedence.

#### Examples

1. Simple comparison:

   ```
   name='John'
   ```

2. Multiple conditions:

   ```
   age>18 && (city='New York' || city='Los Angeles')
   ```

3. Date comparison:

   ```
   createdAt>'2023-01-01'
   ```

4. Null check:

   ```
   email?=
   ```

5. Pattern matching:

   ```
   title~'%important%'
   ```

6. Complex query:
   ```
   (status='active' || status='pending') && createdAt>'2023-01-01' && (category='A' || category='B')
   ```

Note: String values should be enclosed in single quotes. Date values should be in ISO 8601 format (YYYY-MM-DD).
