"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Loader2, Save, Edit2, X, Check } from "lucide-react";
import { toast } from "sonner";

interface Plan {
    id: string;
    name: string;
    price: string;
    billing: string;
    description: string;
    includes: string[];
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Plan>>({});
    const [isAdding, setIsAdding] = useState(false);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, "advanced_plans"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const plansData: Plan[] = [];
            querySnapshot.forEach((doc) => {
                plansData.push({ id: doc.id, ...doc.data() } as Plan);
            });
            setPlans(plansData);
        } catch (error) {
            console.error("Error fetching plans:", error);
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleStartEdit = (plan: Plan) => {
        setEditingId(plan.id);
        setEditForm(plan);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
        setIsAdding(false);
    };

    const handleSave = async (id: string | "new") => {
        if (!editForm.name || !editForm.price || !editForm.description) {
            toast.error("Name, Price, and Description are required");
            return;
        }

        try {
            const includesArray = typeof editForm.includes === 'string'
                ? (editForm.includes as string).split(",").map((s) => s.trim()).filter((s) => s !== "")
                : editForm.includes;

            const planData = {
                ...editForm,
                includes: includesArray,
                updatedAt: serverTimestamp(),
            };

            if (id === "new") {
                await addDoc(collection(db, "advanced_plans"), {
                    ...planData,
                    createdAt: serverTimestamp(),
                });
                toast.success("Plan created successfully");
            } else {
                const planRef = doc(db, "advanced_plans", id);
                await updateDoc(planRef, planData);
                toast.success("Plan updated successfully");
            }

            handleCancelEdit();
            fetchPlans();
        } catch (error) {
            console.error("Error saving plan:", error);
            toast.error("Failed to save plan");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;
        try {
            await deleteDoc(doc(db, "advanced_plans", id));
            toast.success("Plan deleted successfully");
            fetchPlans();
        } catch (error) {
            console.error("Error deleting plan:", error);
            toast.error("Failed to delete plan");
        }
    };

    const renderPlanFields = (isNew: boolean = false) => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-xl bg-gray-50/50 border-gray-100 animate-in fade-in duration-300">
            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Plan Name</label>
                <Input
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="e.g. Tech Launch Bundle"
                    className="bg-white border-gray-100"
                />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Price</label>
                <Input
                    value={editForm.price || ""}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    placeholder="e.g. ₹1,245,000"
                    className="bg-white border-gray-100"
                />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Billing</label>
                <Input
                    value={editForm.billing || ""}
                    onChange={(e) => setEditForm({ ...editForm, billing: e.target.value })}
                    placeholder="e.g. /Year"
                    className="bg-white border-gray-100"
                />
            </div>
            <div className="space-y-1 col-span-full">
                <label className="text-[10px] font-bold uppercase text-gray-400">Description (Why to choose)</label>
                <Textarea
                    value={editForm.description || ""}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Describe the benefits..."
                    className="bg-white border-gray-100 min-h-[80px]"
                />
            </div>
            <div className="space-y-1 col-span-full">
                <label className="text-[10px] font-bold uppercase text-gray-400">Includes (Comma separated)</label>
                <Input
                    value={Array.isArray(editForm.includes) ? editForm.includes.join(", ") : editForm.includes || ""}
                    onChange={(e) => setEditForm({ ...editForm, includes: e.target.value as any })}
                    placeholder="2 Developers, 1 Designer, etc."
                    className="bg-white border-gray-100"
                />
            </div>
            <div className="col-span-full flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={() => handleSave(isNew ? "new" : editingId!)} className="bg-black hover:bg-black/80 text-white px-6 rounded-lg">
                    <Check className="w-4 h-4 mr-1" /> {isNew ? "Create Plan" : "Save Changes"}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">Plan Management</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage your advanced development bundles dynamically.</p>
                </div>
                {!isAdding && !editingId && (
                    <Button onClick={() => { setIsAdding(true); setEditForm({ billing: "/Year", price: "₹ " }); }} className="bg-black hover:bg-black/90 text-white font-bold rounded-xl shadow-lg shadow-black/10">
                        <Plus className="w-4 h-4 mr-2" /> Add New Plan
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {isAdding && renderPlanFields(true)}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : plans.length === 0 && !isAdding ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-3xl border-gray-100 bg-gray-50/50">
                        <p className="text-gray-400 font-medium">No plans found. Create your first plan above.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {plans.map((plan) => (
                            <div key={plan.id}>
                                {editingId === plan.id ? (
                                    renderPlanFields()
                                ) : (
                                    <Card className="overflow-hidden border-gray-100 hover:border-gray-200 transition-all hover:shadow-sm">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row md:items-center p-5 gap-6">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-black text-gray-900">{plan.name}</h3>
                                                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                            {plan.price.startsWith("₹") ? plan.price : `₹${plan.price}`}{plan.billing}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{plan.description}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {plan.includes.map((incl, i) => (
                                                            <span key={i} className="text-[9px] font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                                                {incl}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 md:border-l md:border-gray-100 md:pl-6">
                                                    <Button variant="ghost" size="icon" onClick={() => handleStartEdit(plan)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
