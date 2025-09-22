import { supabase } from '../supabase/client';

export interface PaymentTransaction {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  projectManagerId: string;
  projectManagerName: string;
  projectId: string;
  projectName: string;
  creditId: string;
  amount: number; // Number of credits purchased
  unitPrice: number; // Price per credit in USD
  totalAmount: number; // Total payment amount in USD
  paymentMethod: 'credit_card' | 'bank_transfer' | 'debit_card';
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  processedAt: string;
  fees: number; // Platform fees
  netAmount: number; // Amount transferred to project manager
}

export interface ProjectManagerEarnings {
  projectManagerId: string;
  totalEarnings: number;
  totalCredits: number;
  transactionCount: number;
  pendingPayments: number;
  lastPaymentDate?: string;
  projects: {
    [projectId: string]: {
      earnings: number;
      credits: number;
      transactions: number;
    };
  };
}

class MockPaymentService {
  private transactions: PaymentTransaction[] = [];
  private platformFeeRate = 0.05; // 5% platform fee

  // Simulate payment processing delay
  private async simulateProcessingDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  }

  // Generate mock transaction ID
  private generateTransactionId(): string {
    return 'txn_' + Math.random().toString(36).substring(2, 15);
  }

  // Mock credit card payment processing
  async processPayment(
    buyerInfo: { id: string; name: string; email: string },
    projectManagerInfo: { id: string; name: string },
    projectInfo: { id: string; name: string },
    creditInfo: { id: string; amount: number },
    paymentMethod: 'credit_card' | 'bank_transfer' | 'debit_card'
  ): Promise<PaymentTransaction> {
    
    // Simulate processing delay
    await this.simulateProcessingDelay();
    
    // Calculate amounts
    const unitPrice = 15; // $15 per tCO2e credit
    const totalAmount = creditInfo.amount * unitPrice;
    const fees = totalAmount * this.platformFeeRate;
    const netAmount = totalAmount - fees;
    
    // Create transaction record
    const transaction: PaymentTransaction = {
      id: Math.random().toString(36).substring(2, 15),
      buyerId: buyerInfo.id,
      buyerName: buyerInfo.name,
      buyerEmail: buyerInfo.email,
      projectManagerId: projectManagerInfo.id,
      projectManagerName: projectManagerInfo.name,
      projectId: projectInfo.id,
      projectName: projectInfo.name,
      creditId: creditInfo.id,
      amount: creditInfo.amount,
      unitPrice,
      totalAmount,
      paymentMethod,
      status: Math.random() > 0.1 ? 'completed' : 'failed', // 90% success rate
      transactionId: this.generateTransactionId(),
      processedAt: new Date().toISOString(),
      fees,
      netAmount
    };
    
    // Store transaction (in real app, this would be in database)
    this.transactions.push(transaction);
    
    // Store in localStorage for persistence during session
    localStorage.setItem('mockPaymentTransactions', JSON.stringify(this.transactions));
    
    return transaction;
  }

  // Get transactions for a specific buyer
  async getBuyerTransactions(buyerId: string): Promise<PaymentTransaction[]> {
    // Load from localStorage
    const stored = localStorage.getItem('mockPaymentTransactions');
    if (stored) {
      this.transactions = JSON.parse(stored);
    }
    
    return this.transactions.filter(t => t.buyerId === buyerId);
  }

  // Get earnings for a specific project manager
  async getProjectManagerEarnings(projectManagerId: string): Promise<ProjectManagerEarnings> {
    // Load from localStorage
    const stored = localStorage.getItem('mockPaymentTransactions');
    if (stored) {
      this.transactions = JSON.parse(stored);
    }
    
    const managerTransactions = this.transactions.filter(
      t => t.projectManagerId === projectManagerId && t.status === 'completed'
    );
    
    const earnings: ProjectManagerEarnings = {
      projectManagerId,
      totalEarnings: 0,
      totalCredits: 0,
      transactionCount: 0,
      pendingPayments: 0,
      projects: {}
    };
    
    managerTransactions.forEach(transaction => {
      earnings.totalEarnings += transaction.netAmount;
      earnings.totalCredits += transaction.amount;
      earnings.transactionCount += 1;
      
      if (!earnings.lastPaymentDate || transaction.processedAt > earnings.lastPaymentDate) {
        earnings.lastPaymentDate = transaction.processedAt;
      }
      
      // Group by project
      if (!earnings.projects[transaction.projectId]) {
        earnings.projects[transaction.projectId] = {
          earnings: 0,
          credits: 0,
          transactions: 0
        };
      }
      
      earnings.projects[transaction.projectId].earnings += transaction.netAmount;
      earnings.projects[transaction.projectId].credits += transaction.amount;
      earnings.projects[transaction.projectId].transactions += 1;
    });
    
    // Count pending payments
    const pendingTransactions = this.transactions.filter(
      t => t.projectManagerId === projectManagerId && t.status === 'pending'
    );
    earnings.pendingPayments = pendingTransactions.reduce((sum, t) => sum + t.netAmount, 0);
    
    return earnings;
  }

  // Get all transactions for a project manager (for detailed view)
  async getProjectManagerTransactions(projectManagerId: string): Promise<PaymentTransaction[]> {
    // Load from localStorage
    const stored = localStorage.getItem('mockPaymentTransactions');
    if (stored) {
      this.transactions = JSON.parse(stored);
    }
    
    return this.transactions
      .filter(t => t.projectManagerId === projectManagerId)
      .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());
  }

  // Mock method to get project manager info (would normally come from database)
  async getProjectManagerInfo(projectId: string): Promise<{ id: string; name: string } | null> {
    // This is mock data - in real implementation, this would query the database
    // for the project and get the associated project manager
    const mockProjectManagers = [
      { projectId: 'proj_1', id: 'pm_1', name: 'Rajesh Kumar' },
      { projectId: 'proj_2', id: 'pm_2', name: 'Priya Sharma' },
      { projectId: 'proj_3', id: 'pm_3', name: 'Amit Patel' },
    ];
    
    const manager = mockProjectManagers.find(pm => projectId.includes(pm.projectId));
    return manager ? { id: manager.id, name: manager.name } : null;
  }

  // Clear all transactions (for testing)
  clearTransactions(): void {
    this.transactions = [];
    localStorage.removeItem('mockPaymentTransactions');
  }
}

export const mockPaymentService = new MockPaymentService();