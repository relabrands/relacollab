import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Check, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

const goalOptions = [
  { id: "awareness", label: "Awareness", description: "Increase brand visibility" },
  { id: "conversion", label: "Conversion", description: "Drive sales or bookings" },
  { id: "content", label: "Content Production", description: "UGC for ads" },
];

const vibeOptions = [
  { id: "romantic", label: "Romantic", emoji: "💕" },
  { id: "party", label: "Party", emoji: "🎉" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
  { id: "healthy", label: "Healthy", emoji: "🥗" },
  { id: "premium", label: "Premium", emoji: "✨" },
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
];

const rewardOptions = [
  { id: "experience", label: "Free Experience", description: "Product/service only" },
  { id: "paid", label: "Paid Collaboration", description: "Cash payment" },
  { id: "hybrid", label: "Hybrid", description: "Experience + cash" },
];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goal: "",
    vibes: [] as string[],
    location: "",
    ageRange: "18-35",
    reward: "",
    budget: "",
    startDate: "",
    endDate: "",
    creatorCount: "1",
  });

  const handleVibeToggle = (vibeId: string) => {
    setFormData((prev) => ({
      ...prev,
      vibes: prev.vibes.includes(vibeId)
        ? prev.vibes.filter((v) => v !== vibeId)
        : [...prev.vibes, vibeId],
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to create a campaign.");
      return;
    }

    setIsSubmitting(true);
    try {
      const campaignData = {
        ...formData,
        brandId: user.uid,
        status: "active",
        createdAt: new Date().toISOString(),
        budget: parseFloat(formData.budget) || 0,
        creatorCount: parseInt(formData.creatorCount) || 1,
      };

      await addDoc(collection(db, "campaigns"), campaignData);
      toast.success("Campaign created successfully!");
      navigate("/brand/matches");
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 4;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="brand" />

      <main className="flex-1 ml-64 p-8">
        <div className="mb-6">
          <Link
            to="/brand"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <DashboardHeader
          title="Create Campaign"
          subtitle="Let's find your perfect creators"
        />

        {/* Progress Steps */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all ${step >= s
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-20 md:w-32 h-1 mx-2 rounded-full transition-all ${step > s ? "bg-primary" : "bg-muted"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-sm text-muted-foreground">
            <span>Basics</span>
            <span>Goals</span>
            <span>Audience</span>
            <span>Budget</span>
          </div>
        </div>

        {/* Form Steps */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Campaign Basics</h2>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Summer Wellness Launch"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell creators about your brand and what you're looking for..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="mt-2 min-h-[120px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Campaign Goals</h2>

                <div className="space-y-6">
                  <div>
                    <Label className="mb-4 block">What's your main goal?</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {goalOptions.map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, goal: goal.id }))
                          }
                          className={`p-4 rounded-xl border-2 text-left transition-all ${formData.goal === goal.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="font-medium mb-1">{goal.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {goal.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-4 block">Brand Vibe (select multiple)</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {vibeOptions.map((vibe) => (
                        <button
                          key={vibe.id}
                          onClick={() => handleVibeToggle(vibe.id)}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${formData.vibes.includes(vibe.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="text-2xl mb-1">{vibe.emoji}</div>
                          <div className="font-medium text-sm">{vibe.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Target Audience</h2>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Los Angeles, CA"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="mb-4 block">Age Range</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {["18-24", "25-34", "35-44", "45+"].map((age) => (
                        <button
                          key={age}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, ageRange: age }))
                          }
                          className={`p-3 rounded-xl border-2 text-center font-medium transition-all ${formData.ageRange === age
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          {age}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8"
              >
                <h2 className="text-xl font-semibold mb-6">Budget & Reward</h2>

                <div className="space-y-6">
                  <div>
                    <Label className="mb-4 block">Reward Type</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {rewardOptions.map((reward) => (
                        <button
                          key={reward.id}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, reward: reward.id }))
                          }
                          className={`p-4 rounded-xl border-2 text-left transition-all ${formData.reward === reward.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="font-medium mb-1">{reward.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {reward.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="budget">Campaign Budget</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="budget"
                        type="number"
                        placeholder="5,000"
                        value={formData.budget}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            budget: e.target.value,
                          }))
                        }
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="creatorCount">How many creators needed?</Label>
                    <Input
                      id="creatorCount"
                      type="number"
                      min="1"
                      placeholder="e.g. 5"
                      value={formData.creatorCount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          creatorCount: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {step < totalSteps ? (
              <Button variant="hero" onClick={() => setStep((s) => s + 1)}>
                Next Step
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Find Matches
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}