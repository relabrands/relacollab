import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, History } from "lucide-react";
import { db } from "@/lib/firebase";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/context/AuthContext";

export default function BrandPayments() {
    const { user } = useAuth();

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar type="brand" />
            <MobileNav type="brand" />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <DashboardHeader title="Payments" subtitle="Manage your billing and invoices" />

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Method</CardTitle>
                            <CardDescription>Your primary billing method</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Visa ending in 4242</p>
                                    <p className="text-xs text-muted-foreground">Expires 12/24</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm">Update</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Current Plan</CardTitle>
                            <CardDescription>You are currently on the <strong>Pro Plan</strong></CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">$99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                            </div>
                            <Button size="sm">Upgrade</Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><History className="w-5 h-5" /> Payment History</h3>
                    <Card>
                        <CardContent className="p-0">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Invoice</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        <tr className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">INV-001</td>
                                            <td className="p-4 align-middle"><Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge></td>
                                            <td className="p-4 align-middle">$99.00</td>
                                            <td className="p-4 align-middle">Feb 1, 2024</td>
                                        </tr>
                                        {/* Add more rows as needed */}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </main>
        </div>
    );
}
