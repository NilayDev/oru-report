This is a full-stack web application built using [Next.js](https://nextjs.org/) and [MongoDB](https://www.mongodb.com/). This guide will help you set up the project locally and get it running.
---
## Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or local MongoDB
---

# Install dependencies
npm install

# Run the development server
npm run dev


## Environment Setup
Create a `.env` file in the root of your project and add the following variable:
```env
MONGODB_URI="your-mongodb-connection-uri"

Import Database dump from db_dump folder