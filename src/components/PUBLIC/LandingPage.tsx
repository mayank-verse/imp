import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ArrowRight, Waves, TreePine, Shield, Users, Globe, TrendingUp, CheckCircle, Leaf, Star, Award } from 'lucide-react';
import Navbar from "../Navbar"

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <Navbar />
      <section className="relative w-full h-[90vh] overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-[90vh] object-cover rounded-b-[25%]"
          src="./src/components/PUBLIC/ocean.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute top-0 left-0 w-full h-full bg-black/40 rounded-b-[25%]" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Samudra Ledger
          </h1>
          <p className="text-lg md:text-xl max-w-2xl">
            India's First Transparent Blue Carbon Registry.
            Protecting coastal ecosystems while generating verified carbon credits through
            blockchain-powered transparency and AI-driven monitoring
            <div className="flex flex-col sm:flex-row gap-4 justify-center py-6">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="text-lg px-8 py-6 cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 cursor-pointer bg-yellow-50 text-black transition-all duration-300 ease-in-out hover:bg-yellow-100 hover:shadow-md hover:border-yellow-200"
              >
                View Public Dashboard
              </Button>
            </div>
          </p>
        </div>
      </section>

      {/* Overlapping Box */}
      <div className="relative z-20 -mt-[7rem] mb-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-background flex rounded-[50px] shadow-2xl py-10 px-6">
            <div className="px-[40px] py-[20px] border-r border-border mr-6">
              <Waves className="h-12 w-12 text-foreground mx-auto " />
            </div>
            <div>
              <h2 className="text-[1.3rem] font-semibold text-foreground pb-2 font-serif">A transparent platform for tracking, certifying, and conserving resources for a sustainable future. </h2>
              <p className='font-sans text-muted-foreground'>Our goal is to make resource use transparent, support conservation projects, and create opportunities where protecting nature also benefits the economy.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Blue Carbon Impact</h2>
            <p className="text-lg text-muted-foreground">Making a measurable difference for India's coastal ecosystems</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-2">10,000+</div>
              <div className="text-muted-foreground">Carbon Credits Issued</div>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TreePine className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">25</div>
              <div className="text-muted-foreground">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Waves className="h-8 w-8 text-teal-600" />
              </div>
              <div className="text-3xl font-bold text-teal-400 mb-2">50,000</div>
              <div className="text-muted-foreground">Hectares Protected</div>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-400 mb-2">500+</div>
              <div className="text-muted-foreground">Community Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">A transparent and verifiable blue carbon ecosystem</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-3xl overflow-hidden">
              <img src="https://images.pexels.com/photos/2847714/pexels-photo-2847714.jpeg" alt="Mangrove forest for project registration" className="w-full h-60 object-cover" />
              <CardHeader>
                <CardTitle>Project Registration</CardTitle>
                <CardDescription>
                  Coastal communities and project developers register blue carbon restoration projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Mangrove restoration</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Seagrass conservation</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Salt marsh protection</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl overflow-hidden">
              <img src="https://images.pexels.com/photos/106344/pexels-photo-106344.jpeg" alt="Satellite view of a coastline for AI verification" className="w-full h-60 object-cover" />
              <CardHeader>
                <CardTitle>AI-Powered Verification</CardTitle>
                <CardDescription>
                  Machine learning models analyze satellite data and community reports for accurate MRV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Satellite imagery analysis</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Community field reports</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />NCCR validation</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl overflow-hidden">
              <img src="https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg" alt="Abstract technology background for marketplace" className="w-full h-60 object-cover" />
              <CardHeader>
                <CardTitle>Secure Fiat Marketplace</CardTitle>
                <CardDescription>
                  Purchase credits with traditional payment methods while maintaining blockchain transparency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Fiat payment processing</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Immutable blockchain records</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Government compliant</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-16 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Join Our Ecosystem</h2>
            <p className="text-lg text-muted-foreground">Multiple pathways to participate in the blue carbon economy</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* CARD 1: Added image and overflow-hidden */}
            <Card className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl border-2 border-green-200 hover:border-green-300 transition-colors overflow-hidden">
              <img src="https://images.pexels.com/photos/27176057/pexels-photo-27176057.jpeg" alt="People planting mangroves" className="w-full h-60 object-cover" />
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  <CardTitle className="text-green-400">Project Manager</CardTitle>
                  <Badge className="bg-green-100 text-green-800">Open</Badge>
                </div>
                <CardDescription>
                  Register and manage blue carbon restoration projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Register coastal restoration projects</li>
                  <li>• Submit MRV data and reports</li>
                  <li>• Earn carbon credits for verified impact</li>
                  <li>• Work with local communities</li>
                </ul>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={onGetStarted}>
                  Become a Project Manager
                </Button>
              </CardContent>
            </Card>

            {/* CARD 2: Added image and overflow-hidden */}
            <Card className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl border-2 border-blue-200 hover:border-blue-300 transition-colors overflow-hidden">
              <img src="https://images.pexels.com/photos/6694575/pexels-photo-6694575.jpeg" alt="Buying Carbon Credits" className="w-full h-60 object-cover" />
              <CardHeader>
                <div className="flex items-center justify-between items-center mb-2">
                  <CardTitle className="text-blue-400">Buyer</CardTitle>
                  <Badge className="bg-blue-100 text-blue-800">Open</Badge>
                </div>
                <CardDescription>
                  Purchase and retire verified carbon credits easily
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Browse verified carbon credits</li>
                  <li>• Pay securely with fiat currency</li>
                  <li>• Retire credits for offset goals</li>
                  <li>• Get blockchain-verified certificates</li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={onGetStarted}>
                  Start Buying Credits
                </Button>
              </CardContent>
            </Card>

            {/* CARD 3: Added image and overflow-hidden */}
            <Card className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl border-2 border-orange-200 hover:border-orange-300 transition-colors overflow-hidden">
              <img src="https://images.pexels.com/photos/7333508/pexels-photo-7333508.jpeg" alt="Verifier Lookin the scores generated by ML Model" className="w-full h-60 object-cover" />
              <CardHeader>
                <div className="flex items-center justify-between items-center mb-2">
                  <CardTitle className="text-orange-400">NCCR Verifier</CardTitle>
                  <Badge className="bg-orange-100 text-orange-800">Restricted</Badge>
                </div>
                <CardDescription>
                  Verify MRV reports and approve credit issuance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Review ML-processed MRV data</li>
                  <li>• Validate carbon sequestration claims</li>
                  <li>• Approve credit minting</li>
                  <li>• Maintain registry integrity</li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  By Invitation Only
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Build India's Blue Carbon Future?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of coastal communities, project developers, and corporate buyers
              creating a transparent and sustainable blue carbon economy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={onGetStarted} className="text-lg px-8 py-6  transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 text-foreground border-border hover:bg-accent hover:text-accent-foreground  transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
                View Public Registry
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/20 text-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Waves className="h-6 w-6" />
                <span className="font-bold text-lg">Samudra Ledger</span>
              </div>
              <p className="text-muted-foreground text-sm">
                India's transparent blue carbon registry powered by blockchain technology and AI-driven verification.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Register Projects</li>
                <li>Submit MRV Data</li>
                <li>Buy Credits</li>
                <li>Retire Credits</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Technology</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Avalanche Blockchain</li>
                <li>IPFS Storage</li>
                <li>AI/ML Verification</li>
                <li>Smart Contracts</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Support</li>
                <li>Community</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground text-sm">
            <p>© 2025 Samudra Ledger. All rights reserved. Powered by Avalanche & Supabase.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

