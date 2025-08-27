import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// For Vercel deployment, we need to handle the serverless function differently
export default async function handler(req: Request, res: Response) {
  try {
    // Set up the Express app with routes if not already done
    if (!app.locals.routesRegistered) {
      await registerRoutes(app);
      app.locals.routesRegistered = true;
    }

    // Handle the request
    app(req, res);
  } catch (error) {
    console.error("Vercel handler error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}