import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

function validateEnvironmentVariables() {
  if (!process.env.REPLIT_DOMAINS) {
    throw new Error("Environment variable REPLIT_DOMAINS not provided");
  }
}

const getOidcConfig = memoize(
  async () => {
    validateEnvironmentVariables();
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  // Configurable session timeouts for security and cost optimization
  const sessionTtl = 4 * 60 * 60 * 1000; // 4 hours total session life
  const inactivityTimeout = 30 * 60 * 1000; // 30 minutes of inactivity before auto-logout
  
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
      secure: process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: inactivityTimeout, // Cookie expires after inactivity period
      // Vercel deployment configuration
      domain: process.env.VERCEL_URL ? undefined : undefined, // Let browser determine domain automatically
    },
    // Enhanced session handling for mobile devices
    name: "healthcare.session", // Explicit session name for better mobile handling
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

  // Local development authentication bypass
  if (process.env.NODE_ENV === 'development' && process.env.LOCAL_AUTH_BYPASS === 'true') {
    console.log('🔓 Local development mode: Authentication bypass enabled');
    
                 // Add a local development login route
     app.get('/api/local-login', async (req, res) => {
       try {
         // Create a mock user session for local development
         const mockUser = {
           id: 'local-dev-user',
           email: 'dev@localhost',
           firstName: 'Local',
           lastName: 'Developer',
           profileImageUrl: 'https://via.placeholder.com/150'
         };
         
                   // Check if this is the first user and auto-approve them as admin
          const allUsers = await storage.getAllUsers();
          const isFirstUser = allUsers.length === 0;
          console.log('🔍 Total users in database:', allUsers.length, 'Is first user:', isFirstUser);
          
          if (isFirstUser) {
            // Create the first user as an approved admin
            console.log('🔓 Creating first local user as admin...');
            const createdUser = await storage.upsertUser({
              ...mockUser,
              role: 'admin',
              isApproved: true,
              approvedBy: 'system',
              approvedAt: new Date(),
            });
            console.log('🔓 First local user created as admin:', createdUser);
          } else {
            // Check if user already exists and update if needed
            const existingUser = await storage.getUser(mockUser.id);
            console.log('🔍 Existing user found:', existingUser ? 'YES' : 'NO');
            if (!existingUser) {
              console.log('🔓 Creating new local user as admin...');
              const createdUser = await storage.upsertUser({
                ...mockUser,
                role: 'admin',
                isApproved: true,
                approvedBy: 'system',
                approvedAt: new Date(),
              });
              console.log('🔓 New local user created as admin:', createdUser);
            } else {
              console.log('🔍 User already exists, checking if needs update...');
              // Update existing user to ensure they're approved and admin
              if (!existingUser.isApproved || existingUser.role !== 'admin') {
                console.log('🔓 Updating existing user to approved admin...');
                const updatedUser = await storage.upsertUser({
                  ...existingUser,
                  role: 'admin',
                  isApproved: true,
                  approvedBy: 'system',
                  approvedAt: new Date(),
                });
                console.log('🔓 User updated to approved admin:', updatedUser);
              }
            }
          }
         
         req.session.user = mockUser;
         req.session.save((err) => {
           if (err) {
             console.error('Session save error:', err);
             return res.status(500).json({ error: 'Failed to create session' });
           }
           // Redirect to the dashboard after successful login
           res.redirect('/');
         });
       } catch (error) {
         console.error('Local login error:', error);
         res.status(500).json({ error: 'Failed to create local user' });
       }
     });

    // Add a local development logout route
    app.get('/api/local-logout', (req, res) => {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ error: 'Failed to destroy session' });
        }
        res.json({ message: 'Local logout successful' });
      });
    });

         // Note: Authentication checks are handled per-route in the routes.ts file
     // This allows the frontend to load properly while still protecting API endpoints

         // Add local development user endpoint - no authentication required
     app.get('/api/auth/user', async (req, res) => {
       if (req.session.user) {
         try {
           console.log('🔍 Fetching user from database for ID:', req.session.user.id);
           // Get the actual user from the database to check approval status
           const dbUser = await storage.getUser(req.session.user.id);
           console.log('🔍 Database user found:', dbUser ? 'YES' : 'NO');
           if (dbUser) {
             console.log('🔍 Returning database user with approval status:', dbUser.isApproved, 'role:', dbUser.role);
             res.json(dbUser);
           } else {
             console.log('🔍 No database user found, falling back to session user');
             // Fallback to session user if database user not found
             res.json(req.session.user);
           }
         } catch (error) {
           console.error('Error fetching user from database:', error);
           // Fallback to session user if database error
           res.json(req.session.user);
         }
       } else {
         res.status(401).json({ message: 'Not authenticated' });
       }
     });

    return; // Skip OAuth setup for local development
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      console.log(`User verification successful for: ${tokens.claims()?.email || 'unknown'}`);
      verified(null, user);
    } catch (error: any) {
      console.error('User verification failed:', {
        error: error.message,
        stack: error.stack,
        email: tokens.claims()?.email
      });
      verified(error, null);
    }
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
    const userAgent = req.headers['user-agent'] || 'unknown';
    const isIPhone = /iPhone/i.test(userAgent);
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    
    console.log(`Login attempt from hostname: ${req.hostname}, available domains: ${process.env.REPLIT_DOMAINS}`);
    console.log(`User-Agent: ${userAgent}, iPhone: ${isIPhone}, Mobile: ${isMobile}`);
    
    // Special logging for specific problem user
    if (userAgent.includes('gclemons22') || req.headers.referer?.includes('gclemons22')) {
      console.log(`*** GCLEMONS22 LOGIN ATTEMPT DETECTED ***`);
      console.log(`Full headers for gclemons22:`, req.headers);
      console.log(`Session state:`, {
        sessionID: req.sessionID,
        hasSession: !!req.session,
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'unknown'
      });
    }
    
    // Use the first available domain if hostname doesn't match (for development)
    const availableDomains = process.env.REPLIT_DOMAINS!.split(",");
    const targetDomain = availableDomains.includes(req.hostname) ? req.hostname : availableDomains[0];
    
    console.log(`Using domain for auth: ${targetDomain}`);
    
    // Enhanced error handling for authentication
    const authMiddleware = passport.authenticate(`replitauth:${targetDomain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    });
    
    // Wrap authentication with error handling
    try {
      authMiddleware(req, res, (error: any) => {
        if (error) {
          console.error(`Authentication error for ${isIPhone ? 'iPhone' : 'device'}:`, {
            error: error.message,
            userAgent,
            hostname: req.hostname,
            url: req.url,
            stack: error.stack
          });
          return res.status(500).json({ 
            message: "Authentication failed", 
            details: isIPhone ? "iPhone authentication issue detected" : "General authentication error",
            userAgent: isIPhone ? "iPhone" : "Other"
          });
        }
        next(error);
      });
    } catch (error: any) {
      console.error(`Login route error for ${isIPhone ? 'iPhone' : 'device'}:`, {
        error: error.message,
        userAgent,
        stack: error.stack
      });
      res.status(500).json({ 
        message: "Login initialization failed",
        details: isIPhone ? "iPhone-specific error detected" : "General login error"
      });
    }
  });

  app.get("/api/callback", (req, res, next) => {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const isIPhone = /iPhone/i.test(userAgent);
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    
    console.log(`Callback received from ${isIPhone ? 'iPhone' : 'device'}: ${req.url}`);
    console.log(`Callback User-Agent: ${userAgent}`);
    console.log(`Callback query params:`, req.query);
    
    // Special logging for gclemons22 callback
    if (req.query.code && (req.headers.referer?.includes('gclemons22') || req.url.includes('gclemons22'))) {
      console.log(`*** GCLEMONS22 CALLBACK DETECTED ***`);
      console.log(`Full callback URL: ${req.url}`);
      console.log(`Query params:`, req.query);
      console.log(`Headers:`, req.headers);
    }
    
    // Use the first available domain if hostname doesn't match (for development)
    const availableDomains = process.env.REPLIT_DOMAINS!.split(",");
    const targetDomain = availableDomains.includes(req.hostname) ? req.hostname : availableDomains[0];
    
    console.log(`Callback using domain: ${targetDomain}`);
    
    // Enhanced callback handling with better error logging
    const callbackMiddleware = passport.authenticate(`replitauth:${targetDomain}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    });
    
    try {
      callbackMiddleware(req, res, (error: any) => {
        if (error) {
          console.error(`Callback error for ${isIPhone ? 'iPhone' : 'device'}:`, {
            error: error.message,
            userAgent,
            hostname: req.hostname,
            url: req.url,
            query: req.query,
            headers: isIPhone ? {
              'accept': req.headers.accept,
              'accept-language': req.headers['accept-language'],
              'accept-encoding': req.headers['accept-encoding']
            } : {},
            stack: error.stack
          });
          
          // For mobile devices, try a manual redirect instead of middleware redirect
          if (isMobile) {
            console.log(`Attempting manual redirect for mobile device`);
            return res.redirect('/api/login');
          }
          
          return res.status(500).json({ 
            message: "Callback authentication failed",
            details: isIPhone ? "iPhone callback processing failed" : "General callback error"
          });
        }
        next(error);
      });
    } catch (error: any) {
      console.error(`Callback route error for ${isIPhone ? 'iPhone' : 'device'}:`, {
        error: error.message,
        userAgent,
        url: req.url,
        stack: error.stack
      });
      
      // Fallback redirect for mobile devices
      if (isMobile) {
        console.log(`Manual fallback redirect for mobile device`);
        return res.redirect('/');
      }
      
      res.status(500).json({ 
        message: "Callback processing failed",
        details: isIPhone ? "iPhone callback initialization error" : "General callback error"
      });
    }
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
  // Local development bypass for authentication
  if (process.env.NODE_ENV === 'development' && process.env.LOCAL_AUTH_BYPASS === 'true') {
    if (req.session.user) {
      return next();
    }
    return res.status(401).json({ message: "Local development: Please visit /api/local-login first" });
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Date.now();
  const tokenExpiry = user.expires_at * 1000; // Convert to milliseconds
  const lastActivity = user.last_activity || now;
  const inactivityLimit = 30 * 60 * 1000; // 30 minutes in milliseconds

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
    // Local development bypass for approval check
    if (process.env.NODE_ENV === 'development' && process.env.LOCAL_AUTH_BYPASS === 'true') {
      if (req.session.user) {
        return next();
      }
      return res.status(401).json({ message: "Local development: Please visit /api/local-login first" });
    }

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
    // Local development bypass for admin check
    if (process.env.NODE_ENV === 'development' && process.env.LOCAL_AUTH_BYPASS === 'true') {
      if (req.session.user) {
        return next();
      }
      return res.status(401).json({ message: "Local development: Please visit /api/local-login first" });
    }

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