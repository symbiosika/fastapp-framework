# placeholder

# Nice to have:

custom flows that are defined as JS file for: /register


# Table definition

All standard tables will be prefixed with "base_*"


# Collections Endpoint

## Filter

## Filter Parameter Documentation

The filter parameter allows for complex querying of data using a custom syntax. It supports logical operations, comparisons, and grouping.

### Basic Syntax

`field operator value`

- `field`: The name of the field to filter on
- `operator`: The comparison operator
- `value`: The value to compare against

### Operators

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

### Logical Operators

- `&&`: AND
- `||`: OR

### Grouping

Use parentheses `()` to group expressions and control precedence.

### Examples

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
