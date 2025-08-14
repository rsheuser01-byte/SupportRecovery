import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  // Configurable session timeouts for security
  const sessionTtl = 8 * 60 * 60 * 1000; // 8 hours total session life
  const inactivityTimeout = 2 * 60 * 60 * 1000; // 2 hours of inactivity before auto-logout
  
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiry on each request (for inactivity tracking)
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: inactivityTimeout, // Cookie expires after inactivity period
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
  user.last_activity = Date.now(); // Track last activity for inactivity detection
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["given_name"],
    lastName: claims["family_name"],
    profileImageUrl: claims["picture"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    console.log(`Login attempt from hostname: ${req.hostname}, available domains: ${process.env.REPLIT_DOMAINS}`);
    
    // Use the first available domain if hostname doesn't match (for development)
    const availableDomains = process.env.REPLIT_DOMAINS!.split(",");
    const targetDomain = availableDomains.includes(req.hostname) ? req.hostname : availableDomains[0];
    
    console.log(`Using domain for auth: ${targetDomain}`);
    
    passport.authenticate(`replitauth:${targetDomain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    // Use the first available domain if hostname doesn't match (for development)
    const availableDomains = process.env.REPLIT_DOMAINS!.split(",");
    const targetDomain = availableDomains.includes(req.hostname) ? req.hostname : availableDomains[0];
    
    passport.authenticate(`replitauth:${targetDomain}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Date.now();
  const tokenExpiry = user.expires_at * 1000; // Convert to milliseconds
  const lastActivity = user.last_activity || now;
  const inactivityLimit = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

  // Check for inactivity timeout
  if (now - lastActivity > inactivityLimit) {
    console.log(`User session expired due to inactivity: ${user.claims?.email}`);
    req.logout(() => {});
    return res.status(401).json({ message: "Session expired due to inactivity", reason: "inactivity" });
  }

  // Update last activity timestamp
  user.last_activity = now;

  // Check token expiry
  if (now <= tokenExpiry) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Middleware to check if user is approved
export const isApproved: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req.user as any).claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user || !user.isApproved) {
      return res.status(403).json({ 
        message: "Account pending approval", 
        needsApproval: true 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to check user approval status" });
  }
};

// Middleware to check if user is admin
export const isAdmin: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req.user as any).claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to check admin status" });
  }
};