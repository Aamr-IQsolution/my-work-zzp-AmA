
import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

// Middlewares for parsing and CORS
app.use(cors());
app.use(express.json());

// A simple test route to check if the server is running
app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello from the backend!' });
});

// This is the entry point for Vercel
export default app;
