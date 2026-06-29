"use client";

import { Building2, Copy, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InternationalBankAccount } from "@/lib/types";

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium font-mono break-all">{value}</p>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Copy ${label}`}
        onClick={() => copyToClipboard(value)}
        className="h-6 w-6 p-0 shrink-0"
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  </div>
);

const InternationalBankDetailsModal = ({
  accounts,
}: {
  accounts: InternationalBankAccount[];
}) => {
  if (accounts.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 w-full"
        >
          <Globe className="h-4 w-4" />
          View International Bank Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            International Bank Account Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {accounts.map((account) => (
            <Card key={account.id} className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    {account.country}
                  </span>
                  {account.paymentMethod && (
                    <Badge variant="secondary">{account.paymentMethod}</Badge>
                  )}
                </CardTitle>
                <CardDescription>{account.bankName}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {account.accountHolderName && (
                    <Field
                      label="Account Holder"
                      value={account.accountHolderName}
                    />
                  )}
                  {account.accountType && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        Account Type
                      </Label>
                      <p className="text-sm font-medium">
                        {account.accountType}
                      </p>
                    </div>
                  )}
                  {account.currency && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        Currency
                      </Label>
                      <p className="text-sm font-medium">{account.currency}</p>
                    </div>
                  )}
                  {account.fields.map((field, index) => (
                    <Field
                      key={`${field.label}-${index}`}
                      label={field.label}
                      value={field.value}
                    />
                  ))}
                </div>

                {account.beneficiaryAddress && (
                  <div className="pt-2 border-t">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Beneficiary Address
                    </Label>
                    <p className="text-sm">{account.beneficiaryAddress}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InternationalBankDetailsModal;
