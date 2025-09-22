import React from 'react';
import { Button } from './ui/button';
import { mockPaymentService } from '../utils/payments/mock-payment-service';
import { toast } from 'sonner';
import { Database, Zap } from 'lucide-react';

export function SampleDataButton() {
  const createSampleTransactions = async () => {
    try {
      // Clear existing data first
      mockPaymentService.clearTransactions();
      
      // Create sample buyers
      const buyers = [
        { id: 'buyer_1', name: 'Acme Corp', email: 'purchasing@acme.com' },
        { id: 'buyer_2', name: 'GreenTech Ltd', email: 'carbon@greentech.com' },
        { id: 'buyer_3', name: 'EcoSolutions Inc', email: 'offsets@ecosolutions.com' },
        { id: 'buyer_4', name: 'Sustainable Ventures', email: 'team@sustainableventures.com' },
      ];

      // Create sample project managers
      const projectManagers = [
        { id: 'pm_1', name: 'Rajesh Kumar' },
        { id: 'pm_2', name: 'Priya Sharma' },
        { id: 'pm_3', name: 'Amit Patel' },
      ];

      // Create sample projects
      const projects = [
        { id: 'proj_1', name: 'Sundarbans Mangrove Restoration' },
        { id: 'proj_2', name: 'Kerala Coastal Wetland Project' },
        { id: 'proj_3', name: 'Gujarat Salt Marsh Initiative' },
        { id: 'proj_4', name: 'Tamil Nadu Seagrass Conservation' },
      ];

      // Create sample credits
      const credits = [
        'credit_001', 'credit_002', 'credit_003', 'credit_004',
        'credit_005', 'credit_006', 'credit_007', 'credit_008'
      ];

      const paymentMethods = ['credit_card', 'bank_transfer', 'debit_card'] as const;

      // Generate sample transactions
      const promises = [];
      for (let i = 0; i < 15; i++) {
        const buyer = buyers[Math.floor(Math.random() * buyers.length)];
        const manager = projectManagers[Math.floor(Math.random() * projectManagers.length)];
        const project = projects[Math.floor(Math.random() * projects.length)];
        const credit = credits[Math.floor(Math.random() * credits.length)];
        const amount = Math.floor(Math.random() * 100) + 10; // 10-110 credits
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        const promise = mockPaymentService.processPayment(
          buyer,
          manager,
          project,
          { id: credit, amount },
          paymentMethod
        );
        
        promises.push(promise);
      }

      await Promise.all(promises);
      
      toast.success(`Created ${promises.length} sample payment transactions! Refresh the dashboards to see the data.`);
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast.error('Failed to create sample transactions');
    }
  };

  const clearSampleData = () => {
    mockPaymentService.clearTransactions();
    toast.success('Cleared all sample transaction data');
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
      <Button 
        onClick={createSampleTransactions}
        className="bg-blue-600 hover:bg-blue-700"
        size="sm"
      >
        <Database className="h-4 w-4 mr-2" />
        Create Sample Transactions
      </Button>
      <Button 
        onClick={clearSampleData}
        variant="outline"
        size="sm"
      >
        <Zap className="h-4 w-4 mr-2" />
        Clear Sample Data
      </Button>
    </div>
  );
}