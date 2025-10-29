import { CheckCircle2 } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
          </div>
          <CardTitle className="text-3xl text-emerald-600 mb-2">
            Thank You!
          </CardTitle>
          <CardDescription className="text-base">
            Your personality assessment has been completed successfully. 
            We have received your responses and will review them as part of your application.
          </CardDescription>
          <CardDescription className="text-sm mt-4">
            You can now close this window.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
