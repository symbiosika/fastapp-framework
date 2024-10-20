# FastApp Webserver for real fast development

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

- [x] Provide webserver as submodule
- [x] Serve static public files (e.g. the Main page for an App)
- [x] Serve static hidden files behind the user login
- [x] Serve an API for the database (simple query logic)
- [x] Simple Task scheduler

### Database

- [x] Simple collections endpoint with custom tables
- [x] CSV Export for collections
- [x] Simple Job Management for long running tasks

### Mailing

- [x] Function to send Mails from Backend via SMTP

### User handling

- [x] Simple Username/Password Registration and Login
- [x] Standard Static page for Login/Logout/Registration
- [ ] Users profile page
- [ ] Limited Time-Usage Tokens (to give users without accout access to may do some action)
- [ ] Magic Link Login

### Payment Integration

- [x] Simple Stripe Integration
- [x] Single Payment actions (one-time buy)
- [x] Subscription Payment actions (monthly/yearly)
- [x] Standard config for payment plans to the custom app in DB
- [ ] Standard Static page to subscribe to a payment plan
- [ ] Standard config for coupons for the custom app

### AI functions

- [x] Save embeddings to textes
- [x] Simialarity search
- [x] Chat interface
- [x] Basic AI functions like: summary, embeddings, create image,... (with custom prompts given by config)
- [x] Prompt Templates with extended functions like iterations
- [ ] Chat-2-Action Interface

### Vue3 Dev Kit

- [x] Formbuilder
- [ ] Chat-Kit to build interactive Chats
- [x] Some formatter and helper for Vue

### Use Cases (intern)

- Perlecto
- AI-PM
- ePub to Chatbot (PDF -> Fine-Tune -> ChatBot)
- FastOn Job
- CO2 Manager
- CSRD
- VALERI

## Requirements V0.5

- [ ] Auth0 Login (Cloud)
- [ ] Use Telegram to interact with the App
- [ ] Send push notifications (PWA)
- [ ] Extend Collection with "relations" like it is defined from "Hypermedia" in actions and links
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
- [ ] Check if crypt should be improved. maybe it is necessary to add a "salt" to prevent having similar entries in the DB

