import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { supabase } from "../utils/supabase/client";
import {
  ShoppingCart,
  Award,
  TrendingUp,
  Leaf,
  ExternalLink,
  Calendar,
  MapPin,
  CreditCard,
  DollarSign,
  Filter,
  Search,
  Star,
  StarOff,
  Heart,
  ChevronDown,
  BarChart3,
  PieChart,
  Target,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: string;
  };
}

interface CarbonCredit {
  id: string;
  projectId: string;
  carbonCredits: number;
  healthScore: number;
  evidenceCid: string;
  verifiedAt: string;
  ownerId?: string;
  availableAmount?: number;
  pricePerCredit?: number;
  projectName?: string;
  projectLocation?: string;
  ecosystemType?: string;
  vintage?: string;
}

interface WatchlistItem {
  creditId: string;
  addedAt: string;
}

interface PriceHistory {
  date: string;
  price: number;
  volume: number;
}

interface MarketStats {
  totalVolume: number;
  averagePrice: number;
  totalCredits: number;
  premiumCredits: number;
  priceChange: number;
}

interface EnhancedMarketplaceProps {
  user: User;
}

export function EnhancedMarketplace({ user }: EnhancedMarketplaceProps) {
  const [availableCredits, setAvailableCredits] = useState<CarbonCredit[]>([]);
  const [filteredCredits, setFilteredCredits] = useState<CarbonCredit[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalVolume: 0,
    averagePrice: 0,
    totalCredits: 0,
    premiumCredits: 0,
    priceChange: 0,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [qualityFilter, setQualityFilter] = useState([0, 100]);
  const [sortBy, setSortBy] = useState("price-asc");
  const [showFilters, setShowFilters] = useState(false);

  // Dialog states
  const [selectedCredit, setSelectedCredit] = useState<CarbonCredit | null>(
    null
  );
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showBulkPurchaseDialog, setShowBulkPurchaseDialog] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    orderId: string;
    amount: number;
    creditId: string;
  } | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1); // Default to 1 for individual purchase

  useEffect(() => {
    fetchMarketData();
    fetchWatchlist();
    fetchPriceHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    availableCredits,
    searchQuery,
    selectedEcosystem,
    priceRange,
    qualityFilter,
    sortBy,
  ]);

  const fetchMarketData = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/marketplace`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch marketplace data");
      }

      const data = await response.json();
      setAvailableCredits(data.credits || []);
      setMarketStats(data.stats || marketStats);
    } catch (error) {
      console.error("Error fetching marketplace data:", error);
      toast.error("Failed to load marketplace data");
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/watchlist`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist || []);
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    }
  };

  const fetchPriceHistory = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/price-history`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPriceHistory(data.priceHistory || []);
      }
    } catch (error) {
      console.error("Error fetching price history:", error);
    }
  };

  const handleInitiatePayment = async (
    credit: CarbonCredit,
    quantity: number
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to make a purchase");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/payments/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`, // CRITICAL: Auth header
          },
          body: JSON.stringify({
            creditId: credit.id,
            quantity: quantity,
            // The backend logic (payment-service.ts) requires the quantity.
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Order creation API failed:", errorData);
        toast.error(
          `Order creation failed: ${errorData.error || "Server error"}`
        );
        return;
      }

      const data = await response.json();

      // The data returned from your backend should include orderId and amount (in paise)
      setPaymentDetails({
        orderId: data.orderId,
        amount: data.amount, // This is the total amount in paise
        creditId: credit.id,
      });

      setShowPaymentDialog(true); // Open the PaymentForm dialog
    } catch (error) {
      console.error("Network or unknown error during order creation:", error);
      toast.error("Failed to connect to payment server.");
    }
  };

  const applyFilters = () => {
    let filtered = [...availableCredits];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (credit) =>
          credit.projectName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          credit.projectLocation
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          credit.ecosystemType
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Ecosystem filter
    if (selectedEcosystem !== "all") {
      filtered = filtered.filter(
        (credit) => credit.ecosystemType === selectedEcosystem
      );
    }

    // Price range filter
    filtered = filtered.filter((credit) => {
      const price = credit.pricePerCredit || 15;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Quality filter
    filtered = filtered.filter((credit) => {
      const quality = credit.healthScore * 100;
      return quality >= qualityFilter[0] && quality <= qualityFilter[1];
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return (a.pricePerCredit || 15) - (b.pricePerCredit || 15);
        case "price-desc":
          return (b.pricePerCredit || 15) - (a.pricePerCredit || 15);
        case "quality-desc":
          return b.healthScore - a.healthScore;
        case "credits-desc":
          return b.carbonCredits - a.carbonCredits;
        case "vintage-desc":
          return (
            new Date(b.vintage || b.verifiedAt).getTime() -
            new Date(a.vintage || a.verifiedAt).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredCredits(filtered);
  };

  const toggleWatchlist = async (creditId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to manage watchlist");
        return;
      }

      const isWatched = watchlist.some((item) => item.creditId === creditId);
      const method = isWatched ? "DELETE" : "POST";

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/watchlist`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ creditId }),
        }
      );

      if (response.ok) {
        fetchWatchlist();
        toast.success(
          isWatched ? "Removed from watchlist" : "Added to watchlist"
        );
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
      toast.error("Failed to update watchlist");
    }
  };

  const isInWatchlist = (creditId: string) => {
    return watchlist.some((item) => item.creditId === creditId);
  };

  const getQualityBadge = (score: number) => {
    if (score >= 0.8)
      return {
        label: "Premium",
        color: "bg-green-100 text-green-800 border-green-200",
      };
    if (score >= 0.6)
      return {
        label: "Standard",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    return {
      label: "Basic",
      color: "bg-gray-100 text-gray-800 border-gray-200",
    };
  };

  const getEcosystems = () => {
    const ecosystems = new Set(
      availableCredits.map((credit) => credit.ecosystemType).filter(Boolean)
    );
    return Array.from(ecosystems);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {marketStats.totalCredits.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">tCO₂e available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${marketStats.averagePrice.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">per tCO₂e</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Premium Credits
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {marketStats.premiumCredits}
            </div>
            <p className="text-xs text-gray-600">high quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {marketStats.totalVolume.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">tCO₂e traded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Change</CardTitle>
            {marketStats.priceChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                marketStats.priceChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {marketStats.priceChange >= 0 ? "+" : ""}
              {marketStats.priceChange.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600">24h change</p>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>
            Carbon credit price trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Carbon Credit Marketplace</CardTitle>
              <CardDescription>
                {filteredCredits.length} of {availableCredits.length} credits
                available
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by project name, location, or ecosystem type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>Ecosystem Type</Label>
                  <Select
                    value={selectedEcosystem}
                    onValueChange={setSelectedEcosystem}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {getEcosystems().map((ecosystem) => (
                        <SelectItem key={ecosystem} value={ecosystem}>
                          {ecosystem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    Price Range (${priceRange[0]} - ${priceRange[1]})
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>
                    Quality Score ({qualityFilter[0]}% - {qualityFilter[1]}%)
                  </Label>
                  <Slider
                    value={qualityFilter}
                    onValueChange={setQualityFilter}
                    max={100}
                    min={0}
                    step={10}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price-asc">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="price-desc">
                        Price: High to Low
                      </SelectItem>
                      <SelectItem value="quality-desc">
                        Quality: High to Low
                      </SelectItem>
                      <SelectItem value="credits-desc">
                        Credits: Most Available
                      </SelectItem>
                      <SelectItem value="vintage-desc">
                        Vintage: Newest
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCredits.map((credit) => {
          const quality = getQualityBadge(credit.healthScore);
          const isWatched = isInWatchlist(credit.id);

          return (
            <Card
              key={credit.id}
              className="hover:shadow-lg transition-all duration-200 relative"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {credit.projectName ||
                        `Project ${credit.projectId.slice(-8)}`}
                    </CardTitle>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {credit.projectLocation || "Location TBD"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={quality.color}>{quality.label}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWatchlist(credit.id)}
                      className="p-1"
                    >
                      {isWatched ? (
                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                      ) : (
                        <Heart className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700">
                    {credit.carbonCredits.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">tCO₂e Available</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quality Score</span>
                    <span className="font-medium text-blue-600">
                      {(credit.healthScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={credit.healthScore * 100} className="h-2" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Price per Credit</span>
                    <span className="font-bold text-green-600">
                      ${credit.pricePerCredit || 15}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value</span>
                    <span className="font-medium">
                      $
                      {(
                        (credit.pricePerCredit || 15) * credit.carbonCredits
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ecosystem</span>
                    <span className="text-gray-600">
                      {credit.ecosystemType || "Coastal"}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedCredit(credit);
                      setShowDetailDialog(true);
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleInitiatePayment(credit, 1)} // Assuming a quantity of 1 for simplicity here
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCredits.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">
              No credits match your current filters
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Try adjusting your search criteria
            </p>
          </CardContent>
        </Card>
      )}

      {/* Credit Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Credit Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about this carbon credit
            </DialogDescription>
          </DialogHeader>

          {selectedCredit && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Project Information</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        <strong>ID:</strong> {selectedCredit.projectId}
                      </p>
                      <p>
                        <strong>Name:</strong>{" "}
                        {selectedCredit.projectName || "TBD"}
                      </p>
                      <p>
                        <strong>Location:</strong>{" "}
                        {selectedCredit.projectLocation || "TBD"}
                      </p>
                      <p>
                        <strong>Ecosystem:</strong>{" "}
                        {selectedCredit.ecosystemType || "Coastal"}
                      </p>
                      <p>
                        <strong>Vintage:</strong>{" "}
                        {new Date(
                          selectedCredit.vintage || selectedCredit.verifiedAt
                        ).getFullYear()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Credit Details</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        <strong>Available:</strong>{" "}
                        {selectedCredit.carbonCredits.toLocaleString()} tCO₂e
                      </p>
                      <p>
                        <strong>Price:</strong> $
                        {selectedCredit.pricePerCredit || 15} per tCO₂e
                      </p>
                      <p>
                        <strong>Total Value:</strong> $
                        {(
                          (selectedCredit.pricePerCredit || 15) *
                          selectedCredit.carbonCredits
                        ).toLocaleString()}
                      </p>
                      <p>
                        <strong>Quality Score:</strong>{" "}
                        {(selectedCredit.healthScore * 100).toFixed(1)}%
                      </p>
                      <p>
                        <strong>Verified:</strong>{" "}
                        {new Date(
                          selectedCredit.verifiedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium">Evidence & Verification</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    IPFS Hash: {selectedCredit.evidenceCid}
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on IPFS
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog with Payment Form */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
            <DialogDescription>
              Pay for your selected carbon credit.
            </DialogDescription>
          </DialogHeader>

          {paymentDetails && (
            // You must import the PaymentForm component here.
            // Assuming PaymentForm is imported as: import PaymentForm from '../BUYER/PaymentForm';
            <PaymentForm
              amount={paymentDetails.amount} // Amount in paise
              orderId={paymentDetails.orderId}
              onSuccess={(paymentId) => {
                toast.success(`Payment successful! ID: ${paymentId}`);
                // Implement logic to update the database (e.g., mark credit as purchased)
                setShowPaymentDialog(false);
                fetchMarketData(); // Refresh the market
              }}
              onCancel={() => setShowPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
