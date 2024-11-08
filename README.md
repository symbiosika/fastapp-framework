# FastApp Webserver for real fast development

Not "Low-Code" -> It´s a Backend for AI Coders.
Simplified webserver to get AI´s power to write Applications.

WIRTE TESTS!
WRITE DOCUMENTATION!

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
- Use AI without any knowledge of AI

## Marketing

Later this will be used for the landing page.
DataModel->Forms (image)

## Requirements V0.1

### Webserver functions

- [x] Provide webserver as library
- [x] Serve static public files (e.g. the Main page for an App)
- [x] Serve static hidden files behind the user login
- [x] Serve an API for the database (simple query logic)
- [x] Simple Task scheduler
- [x] Simple Job Management for long running tasks
- [x] Logging to disk
- [ ] Implement Webhooks

### Database

- [x] Simple collections endpoint with custom tables
- [x] File storage
- [x] Temporary data: Give each file a automativ remove date for temporary data
- [x] CSV Export for collections
- [ ] CSV Import for collections

### Communication

- [x] Function to send Mails from Backend via SMTP

### User handling

- [x] Simple Username/Password Registration and Login with Email verification
- [x] Standard Static page for Login/Logout/Registration
- [x] Magic Link Login
- [x] Simple User-Profile page
- [x] Custom registration flow to prevent Registration of unallowed users
- [ ] Auth0 connector (MS, Google etc, Login)
- [ ] Token Auth

### Payment Integration

- [x] Simple Stripe Integration
- [x] Single Payment actions (one-time buy)
- [x] Subscription Payment actions (monthly/yearly)
- [x] Standard config for payment plans to the custom app in DB
- [x] DevKit UI component to show subscription plans and active subscriptions
- [ ] Standard config for coupons

### AI functions

- [x] Save embeddings to textes
- [x] Simialarity search
- [x] Chat interface
- [x] Basic AI functions like: summary, embeddings, create image,... (with custom prompts given by config)
- [x] Prompt Templates with extended functions like iterations
- [ ] Chat-2-Action Interface

### AI Chat Templates

- [x] Flexible Chat templates for complex tasks
- [ ] Canvas/Image-Input that will be parsed to text before automatically

### Vue3 Dev Kit

- [x] Formbuilder
- [x] Chat-Kit to build interactive Chats
- [x] Some formatter and helper for Vue
- [x] Default layout wrapper (header + menu)

### Secret handling

- [ ] Manage secrets like API keys crypted in the database. Secrets can only be used in the backend.

## Requirements Next version

- [ ] Extend Collection with "relations" like it is defined from "Hypermedia" in actions and links
- [ ] Use WhatsApp to interact with the App

## Requirements a very later version (Only ideas)

- [ ] Limited Time-Usage Tokens for all URLs (to give users without accout access to may do some action) -> redirect to login must include the original page as "redirectTo==xxx"
- [ ] Use Telegram to interact with the App
- [ ] Give each prompt template a "toString()" method for the result with Placeholders. To give back a good predefined result.
- [ ] Give the "GenericForm" a toString() Template. Du give a LLM a better possibility to read out?
- [ ] Docker container to run DB migrations. Actually this is solved by GH Actions for each project
- [ ] Provide a running webserver as docker image
- [ ] Internal news page (like messdas)
- [ ] Internal Proxy to connect server-side-rendering frameworks inside
- [ ] Internal Proxy to connect other webservices
- [ ] Support for "Grapshs" in Postgre: https://dylanpaulus.com/posts/postgres-is-a-graph-database/ or https://www.adesso.de/de/news/blog/graphrag-komplexe-datenbeziehungen-fuer-effizientere-llm-abfragen-nutzen.jsp
- [ ] Graphen ggf. nur als URI speichern. Also http://product1->"is parent of"->http://product2 (Ref.: Knowledge Graph, Prof. Dengler)
- [ ] Dark/Light mode for standard pages
- [ ] OAuth2 Mail Providers
- [ ] 2FA Auth: https://www.npmjs.com/package/otpauth
- [ ] Python Sandbox mit Python Read-Only Lib Anbindung an die App um mit Daten zu spielen
- [ ] Connectors to make.com, PowerAutomate und n8n.com
- [ ] Send push notifications (PWA) https://www.npmjs.com/package/web-push
- [ ] Der SVG Editor zum Nutzen von Prompt Skizzen
- [ ] Ordner Namen als NPM Paket inpackage.json registrieren um Funktionen zu schreiben die quasi keine Abhängigkeiten haben?
