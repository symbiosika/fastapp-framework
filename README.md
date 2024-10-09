# FastApp Webserver for real fast development

USE AS A SUBMODULE?!

- static und public pfad müssen einstellbar sein
- die pfade für plugin, collections, drizzle-schema müssen anpassbar sein

## A base docker image to render websites!

The base image represents the web server.
There are several subdirectories that are mapped externally.
Specific content can be placed in these directories.

Alternatively, another Docker image can be built based on this image, and the folders can be filled.

This makes the development of apps with authentication, etc., very fast.

## Advantages

- No Vendor LockIn
- Cloud/OnPrem/Docker
- Standard Technologies
- Direct access to custom business logic with direct access to DB (not like Directus, Pocketbase, Firebase etc.)
- Full control to enable custom access rules
- Simple!
- Vue3 Development kit for fast complex UIs

## Marketing

Later this will be used for the landing page.
DataModel->Forms (image)

## Requirements V0.1

### Webserver functions

- [ ] Provide webserver as submodule
- [x] Serve static public files (e.g. the Main page for an App)
- [x] Serve static hidden files behind the user login
- [x] Serve an API for the database (simple query logic)
- [x] Simple Task scheduler

### Database

- [x] Simple collections endpoint with custom tables
- [x] CSV Export for collections

### Mailing

- [x] Function to send Mails from Backend via SMTP

### Interaction

- [ ] Use Telegram to interact with the App
- [ ] Send push notifications (PWA)

### User handling

- [x] Simple Username/Password Registration and Login
- [x] Standard Static page for Login/Logout/Registration
- [ ] Auth0 Login (Cloud)
- [o] Users profile page
- [ ] Limited Time-Usage Tokens (to give users without accout access to may do some action)

### Payment Integration

- [ ] Optional payment functions (checked by middleware)
- [o] Simple Stripe Integration
- [o] Standard config for payment plans to the custom app
- [o] Standard Static page to subscribe to a payment plan
- [ ] Standard config for coupons for the custom app
- [o] Single Payment actions (one-time buy)

### AI functions

- [ ] Save embeddings to textes
- [ ] Simialarity search
- [ ] Chat interface
- [ ] Basic AI functions like: summary, embeddings, create image,... (with custom prompts given by config)
- [ ] Chat-2-Action Interface

### Vue3 Dev Kit

- [ ] Formbuilder
- [ ] Chat-Kit to build interactive Chats
- [ ] Some formatter and helper for Vue

### Use Cases (intern)

- [ ] Perlecto
- [ ] AI-PM
- [ ] ePub to Chatbot (PDF -> Fine-Tune -> ChatBot)
- [ ] FastOn Job
- [ ] CO2 Manager
- [ ] CSRD
- [ ] VALERI

## Requirements V0.5

- [ ] Docker container to run DB migrations
- [ ] Use WhatsApp to interact with the App
- [ ] Provide a running webserver as docker image
- [ ] CSV Import for collections
- [ ] Custom registration flow to prevent Registration of unallowed users
- [ ] Default layout wrapper (header + menu)
- [ ] Internal news page (like messdas)
- [ ] Connectors to make.com, PowerAutomate und n8n.com
- [ ] Internal Proxy to connect server-side-rendering frameworks inside
- [ ] 2FA Auth: https://www.npmjs.com/package/otpauth
- [ ] Magic Link Auth: https://www.npmjs.com/package/passport-magic-link
- [ ] Internal Proxy to connect server-side-rendering frameworks inside
- [ ] Internal Proxy to connect other webservices
- [ ] Anbindung von WhatsApp/Telegram
- [ ] Intelligent summaries like: https://the-decoder.de/open-source-tool-pdf2audio-verwandelt-pdfs-in-podcasts-und-zusammenfassungen/
- [ ] Support for "Grapshs" in Postgre: https://dylanpaulus.com/posts/postgres-is-a-graph-database/ or https://www.adesso.de/de/news/blog/graphrag-komplexe-datenbeziehungen-fuer-effizientere-llm-abfragen-nutzen.jsp
- [ ] Graphen ggf. nur als URI speichern. Also http://product1->"is parent of"->http://product2 (Ref.: Knowledge Graph, Prof. Dengler)
- [ ] Dark/Light mode for standard pages
- [ ] OAuth2 Mail Providers
- [ ] Python Sandbox mit Python Read-Only Lib Anbindung an die App um mit Daten zu spielen

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
