// API Routes Configuration
// Defines all backend routes and handlers

import { Hono } from "npm:hono";
import { AuthService } from "./auth-service.tsx";
import { ProjectService } from "./project-service.tsx";
import { MRVService } from "./mrv-service.tsx";
import { MLService } from "./ml-service.tsx";
import { DatabaseRepository } from "./database-repository.tsx";

export function setupRoutes(app: Hono) {
  console.log("Initializing services...");
  
  let authService: AuthService;
  let projectService: ProjectService;
  let mrvService: MRVService;
  let mlService: MLService;
  
  try {
    authService = new AuthService();
    console.log("✅ AuthService initialized");
  } catch (error) {
    console.error("❌ Failed to initialize AuthService:", error);
    throw error;
  }
  
  try {
    projectService = new ProjectService();
    console.log("✅ ProjectService initialized");
  } catch (error) {
    console.error("❌ Failed to initialize ProjectService:", error);
    throw error;
  }
  
  try {
    mrvService = new MRVService();
    console.log("✅ MRVService initialized");
  } catch (error) {
    console.error("❌ Failed to initialize MRVService:", error);
    throw error;
  }
  
  try {
    mlService = new MLService();
    console.log("✅ MLService initialized");
  } catch (error) {
    console.error("❌ Failed to initialize MLService:", error);
    throw error;
  }
  
  console.log("All services initialized successfully");

  // Health check endpoint
  app.get("/make-server-a82c4acb/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post("/make-server-a82c4acb/signup", async (c) => {
    try {
      let email, password, name, role, nccrIdCard;
      
      const contentType = c.req.header('content-type');
      
      if (contentType?.includes('multipart/form-data')) {
        // Handle FormData (when NCCR ID card is uploaded)
        const formData = await c.req.formData();
        email = formData.get('email') as string;
        password = formData.get('password') as string;
        name = formData.get('name') as string;
        role = (formData.get('role') as string) || 'buyer';
        nccrIdCard = formData.get('nccrIdCard') as File;
      } else {
        // Handle JSON (regular signup)
        const data = await c.req.json();
        email = data.email;
        password = data.password;
        name = data.name;
        role = data.role || 'buyer';
        nccrIdCard = null;
      }
      
      const result = await authService.createUser(email, password, name, role, nccrIdCard);
      return c.json(result);
    } catch (error) {
      console.log(`Signup error: ${error}`);
      return c.json({ error: error.message }, 400);
    }
  });

  app.post("/make-server-a82c4acb/check-nccr-eligibility", async (c) => {
    try {
      const { email } = await c.req.json();
      const result = AuthService.checkNCCREligibility(email);
      return c.json(result);
    } catch (error) {
      console.log(`NCCR eligibility check error: ${error}`);
      return c.json({ error: 'Failed to check eligibility' }, 500);
    }
  });

  app.post("/make-server-a82c4acb/verify-nccr-id", async (c) => {
    try {
      const formData = await c.req.formData();
      const idCard = formData.get('idCard') as File;
      const email = formData.get('email') as string;
      
      if (!idCard || !email) {
        return c.json({ error: 'ID card file and email are required' }, 400);
      }
      
      const result = await authService.verifyNCCRId(idCard, email);
      return c.json(result);
    } catch (error) {
      console.log(`NCCR ID verification error: ${error}`);
      return c.json({ error: 'Failed to verify NCCR ID' }, 500);
    }
  });

  // Public routes
  app.get("/make-server-a82c4acb/public/stats", async (c) => {
    try {
      const stats = await DatabaseRepository.getPublicStats();
      return c.json(stats);
    } catch (error) {
      console.log(`Public stats error: ${error}`);
      return c.json({ error: 'Failed to fetch public stats' }, 500);
    }
  });

  // Project management routes
  app.post("/make-server-a82c4acb/projects", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'project_manager');

      const projectData = await c.req.json();
      projectService.validateProjectData(projectData);
      
      const result = await projectService.createProject(projectData, auth.user.id, auth.user);
      return c.json(result);
    } catch (error) {
      console.log(`Project registration error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.get("/make-server-a82c4acb/projects/manager", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'project_manager');

      const projects = await projectService.getManagerProjects(auth.user.id);
      return c.json({ projects });
    } catch (error) {
      console.log(`Manager projects error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.get("/make-server-a82c4acb/projects/manager-with-credits", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'project_manager');

      const projects = await projectService.getManagerProjectsWithCredits(auth.user.id);
      return c.json({ projects });
    } catch (error) {
      console.log(`Manager projects with credits error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.get("/make-server-a82c4acb/projects/all", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'nccr_verifier');

      const projects = await projectService.getAllProjects(authService);
      return c.json({ projects });
    } catch (error) {
      console.log(`All projects error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.delete("/make-server-a82c4acb/projects/:projectId", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'project_manager');

      const projectId = c.req.param('projectId');
      await projectService.deleteProject(projectId, auth.user.id);
      
      return c.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      console.log(`Project deletion error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  // MRV data routes
  app.post("/make-server-a82c4acb/mrv/upload", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'project_manager');

      const formData = await c.req.formData();
      const files = formData.getAll('files') as File[];
      const projectId = formData.get('projectId') as string;
      
      if (!projectId) {
        return c.json({ error: 'Project ID is required' }, 400);
      }

      const uploadedFiles = await mrvService.uploadFiles(projectId, files);
      
      return c.json({ 
        success: true, 
        files: uploadedFiles,
        message: `Successfully uploaded ${uploadedFiles.length} files`
      });
    } catch (error) {
      console.log(`File upload error: ${error}`);
      return c.json({ error: error.message }, 500);
    }
  });

  app.post("/make-server-a82c4acb/mrv", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'project_manager');

      const mrvData = await c.req.json();
      mrvService.validateMRVData(mrvData);
      
      const result = await mrvService.submitMRVData(mrvData, auth.user.id);
      return c.json(result);
    } catch (error) {
      console.log(`MRV submission error: ${error}`);
      return c.json({ error: error.message }, 500);
    }
  });

  app.get("/make-server-a82c4acb/mrv/pending", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'nccr_verifier');

      const pendingMrv = await mrvService.getPendingMRV();
      return c.json({ pendingMrv });
    } catch (error) {
      console.log(`Pending MRV error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.post("/make-server-a82c4acb/mrv/:mrvId/approve", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'nccr_verifier');

      const mrvId = c.req.param('mrvId');
      const { approved, notes } = await c.req.json();
      
      const updatedMrv = await mrvService.approveMRV(mrvId, auth.user.id, approved, notes);
      return c.json({ success: true, mrvData: updatedMrv });
    } catch (error) {
      console.log(`MRV approval error: ${error}`);
      return c.json({ error: error.message }, 500);
    }
  });

  // ML verification routes
  app.post("/make-server-a82c4acb/ml/verify-project", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'nccr_verifier');

      const { projectId, projectData } = await c.req.json();
      
      const verification = await mlService.verifyProject(projectId, projectData, auth.user.id);
      return c.json({ success: true, verification });
    } catch (error) {
      console.log(`ML verification error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.get("/make-server-a82c4acb/ml/verification/:projectId", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'nccr_verifier');

      const projectId = c.req.param('projectId');
      const verification = await mlService.getVerificationResult(projectId);

      if (!verification) {
        return c.json({ error: 'No ML verification found for this project' }, 404);
      }

      return c.json({ verification });
    } catch (error) {
      console.log(`Get ML verification error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  // Carbon credits routes
  app.get("/make-server-a82c4acb/credits/available", async (c) => {
    try {
      // Make available credits public for marketplace viewing  
      const availableCredits = await DatabaseRepository.getAvailableCredits();
      return c.json({ availableCredits });
    } catch (error) {
      console.log(`Available credits error: ${error}`);
      return c.json({ error: error.message }, 500);
    }
  });

  app.get("/make-server-a82c4acb/credits/balance", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'buyer');

      const balance = await DatabaseRepository.getUserCreditBalance(auth.user.id);
      return c.json({ balance });
    } catch (error) {
      console.log(`User balance error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.get("/make-server-a82c4acb/credits/retirements", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'buyer');

      const retirements = await DatabaseRepository.getUserRetirements(auth.user.id);
      return c.json({ retirements });
    } catch (error) {
      console.log(`User retirements error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  // New fiat purchase endpoint
  app.post("/make-server-a82c4acb/credits/purchase-fiat", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'buyer');

      const { creditId, amount, paymentMethod, walletAddress } = await c.req.json();
      
      if (!creditId || !amount || amount <= 0) {
        return c.json({ error: 'Invalid purchase data' }, 400);
      }

      // Simulate payment processing
      console.log(`Processing fiat payment: ${amount * 15} USD via ${paymentMethod}`);
      
      // Create ownership record in database
      const purchaseId = DatabaseRepository.generateId('purchase');
      const purchase = {
        id: purchaseId,
        creditId,
        buyerId: auth.user.id,
        amount,
        paymentMethod,
        walletAddress,
        purchasedAt: new Date().toISOString(),
        onChainTxHash: DatabaseRepository.generateTxHash()
      };

      await DatabaseRepository.createCreditPurchase(purchase);
      await DatabaseRepository.updateCreditAvailability(creditId, amount);
      
      // Here the backend would also send a transaction to blockchain for immutable record
      console.log(`Creating immutable ownership record on blockchain: ${purchase.onChainTxHash}`);

      return c.json({ 
        success: true, 
        purchaseId, 
        purchase, 
        message: 'Purchase completed successfully'
      });
    } catch (error) {
      console.log(`Credit purchase error: ${error}`);
      return c.json({ error: error.message }, 500);
    }
  });

  app.post("/make-server-a82c4acb/credits/retire", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'buyer');

      const { amount, reason, walletAddress } = await c.req.json();
      
      if (!amount || amount <= 0 || !reason?.trim()) {
        return c.json({ error: 'Invalid retirement data' }, 400);
      }

      // Check user has sufficient balance
      const userBalance = await DatabaseRepository.getUserCreditBalance(auth.user.id);
      if (userBalance < amount) {
        return c.json({ error: 'Insufficient credit balance' }, 400);
      }
      
      const retirementId = DatabaseRepository.generateId('retirement');
      const retirement = {
        id: retirementId,
        buyerId: auth.user.id,
        amount,
        reason,
        walletAddress,
        retiredAt: new Date().toISOString(),
        onChainTxHash: DatabaseRepository.generateTxHash()
      };

      await DatabaseRepository.createRetirement(retirement);
      await DatabaseRepository.updateUserCreditBalance(auth.user.id, -amount);
      await DatabaseRepository.incrementCreditsRetired(amount);

      // Here the backend would send a transaction to blockchain to burn the record
      console.log(`Creating permanent retirement record on blockchain: ${retirement.onChainTxHash}`);

      return c.json({ 
        success: true, 
        retirementId, 
        retirement,
        message: 'Credits retired successfully'
      });
    } catch (error) {
      console.log(`Credit retirement error: ${error}`);
      return c.json({ error: error.message }, 500);
    }
  });

  // Enhanced marketplace endpoints
  app.get("/make-server-a82c4acb/credits/marketplace", async (c) => {
    try {
      const availableCredits = await DatabaseRepository.getAvailableCredits();
      const marketStats = await DatabaseRepository.getMarketStats();
      
      // Add enhanced credit information
      const enhancedCredits = availableCredits.map(credit => ({
        ...credit,
        pricePerCredit: 15, // Default price, could be dynamic
        projectName: `Blue Carbon Project ${credit.projectId.slice(-8)}`,
        projectLocation: 'Indian Coastal Region',
        ecosystemType: 'Mangrove',
        vintage: credit.verifiedAt
      }));

      return c.json({ 
        credits: enhancedCredits,
        stats: marketStats || {
          totalVolume: 0,
          averagePrice: 15,
          totalCredits: availableCredits.reduce((sum, c) => sum + c.carbonCredits, 0),
          premiumCredits: availableCredits.filter(c => c.healthScore >= 0.8).length,
          priceChange: 2.3
        }
      });
    } catch (error) {
      console.log(`Marketplace data error: ${error}`);
      return c.json({ error: error.message }, 500);
    }
  });

  app.get("/make-server-a82c4acb/credits/watchlist", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'buyer');

      const watchlist = await DatabaseRepository.getUserWatchlist(auth.user.id);
      return c.json({ watchlist });
    } catch (error) {
      console.log(`Watchlist fetch error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.post("/make-server-a82c4acb/credits/watchlist", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'buyer');

      const { creditId } = await c.req.json();
      await DatabaseRepository.addToWatchlist(auth.user.id, creditId);
      return c.json({ success: true });
    } catch (error) {
      console.log(`Watchlist add error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.delete("/make-server-a82c4acb/credits/watchlist", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'buyer');

      const { creditId } = await c.req.json();
      await DatabaseRepository.removeFromWatchlist(auth.user.id, creditId);
      return c.json({ success: true });
    } catch (error) {
      console.log(`Watchlist remove error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.get("/make-server-a82c4acb/credits/price-history", async (c) => {
    try {
      // Generate mock price history data
      const priceHistory = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        priceHistory.push({
          date: date.toISOString().split('T')[0],
          price: 15 + (Math.random() - 0.5) * 3, // Price varies around $15
          volume: Math.floor(Math.random() * 1000) + 100
        });
      }
      
      return c.json({ priceHistory });
    } catch (error) {
      console.log(`Price history error: ${error}`);
      return c.json({ error: error.message }, 500);
    }
  });

  // Enhanced MRV analytics endpoints
  app.get("/make-server-a82c4acb/mrv/all", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'nccr_verifier');

      const allMrv = await DatabaseRepository.getAllMRVData();
      return c.json({ mrvData: allMrv });
    } catch (error) {
      console.log(`All MRV data error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.get("/make-server-a82c4acb/analytics/trends", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'nccr_verifier');

      const timeRange = c.req.query('timeRange') || '6m';
      
      // Generate mock trend data
      const trends = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      for (const month of months) {
        trends.push({
          month,
          carbon_estimate: Math.floor(Math.random() * 500) + 200,
          health_score: 0.7 + Math.random() * 0.3,
          submissions: Math.floor(Math.random() * 20) + 5,
          approvals: Math.floor(Math.random() * 15) + 3
        });
      }
      
      return c.json({ trends });
    } catch (error) {
      console.log(`Analytics trends error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  app.get("/make-server-a82c4acb/projects/:projectId/timeline", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'nccr_verifier');

      const projectId = c.req.param('projectId');
      
      // Generate mock timeline data
      const timeline = [
        {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'Project Registered',
          type: 'registration',
          status: 'completed'
        },
        {
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'MRV Data Submitted',
          type: 'mrv_submission',
          status: 'completed'
        },
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'Verification In Progress',
          type: 'verification',
          status: 'pending'
        }
      ];
      
      return c.json({ timeline });
    } catch (error) {
      console.log(`Project timeline error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });

  // NCCR specific endpoints
  app.get("/make-server-a82c4acb/nccr/market-stats", async (c) => {
    try {
      const auth = await authService.authenticateUser(c.req.raw);
      authService.requireRole(auth, 'nccr_verifier');

      const stats = await DatabaseRepository.getMarketStatsForNCCR();
      return c.json({ stats });
    } catch (error) {
      console.log(`NCCR market stats error: ${error}`);
      return c.json({ error: error.message }, error.message.includes('Access denied') ? 403 : 500);
    }
  });
}