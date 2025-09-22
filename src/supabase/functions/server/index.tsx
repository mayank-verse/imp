import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

const app = new Hono();

console.log("🚀 Samudra Ledger backend server starting...");

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Basic health check endpoint first
app.get("/make-server-a82c4acb/health", (c) => {
  console.log("Health check endpoint called");
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Samudra Ledger backend is running"
  });
});

// Setup all API routes
try {
  console.log("Setting up routes...");
  const { setupRoutes } = await import("./routes.tsx");
  setupRoutes(app);
  console.log("Routes setup complete");
} catch (error) {
  console.error("Error setting up routes:", error);
  
  // Fallback - add a basic error endpoint
  app.get("/make-server-a82c4acb/error", (c) => {
    return c.json({ 
      error: "Routes setup failed", 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  });
}

// Catch-all route for debugging
app.all("*", (c) => {
  console.log(`Unhandled request: ${c.req.method} ${c.req.url}`);
  return c.json({
    error: "Route not found",
    method: c.req.method,
    url: c.req.url,
    path: c.req.path,
    availableRoutes: [
      "GET /make-server-a82c4acb/health",
      "GET /make-server-a82c4acb/public/stats"
    ]
  }, 404);
});

console.log("Starting Deno server...");
Deno.serve(app.fetch);