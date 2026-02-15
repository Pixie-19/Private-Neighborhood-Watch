import { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Hash, 
  FileText,
  AlertTriangle,
  Loader2,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ModeToggle } from '@/components/mode-toggle';
import { useContractSubscription } from '@/modules/midnight/neighbour-sdk/hooks/use-contract-subscription';

/**
 * Generate a SHA-256 hash from a string, returning 32 bytes (Bytes<32>).
 */
async function hashReportId(input: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

const DEPLOYED_CONTRACT_ADDRESS = import.meta.env.VITE_NEIGHBOUR_CONTRACT_ADDRESS!;

export const IncidentReport = () => {
  const { deployedContractAPI, derivedState, providers, joinError, isJoining, isWalletConnected } = useContractSubscription();

  // Submit report state
  const [reportInput, setReportInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  // Verify report state
  const [verifyInput, setVerifyInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<boolean | undefined>(undefined);
  const [verifyStatus, setVerifyStatus] = useState<string | undefined>(undefined);
  const [verifyError, setVerifyError] = useState<string | undefined>(undefined);

  const handleSubmitReport = async () => {
    if (!deployedContractAPI || !reportInput.trim()) return;
    setIsSubmitting(true);
    setSubmitStatus('Hashing report content...');
    setSubmitError(undefined);
    try {
      const reportId = await hashReportId(reportInput.trim());
      setSubmitStatus('Submitting to blockchain (this may take a moment)...');
      await deployedContractAPI.submitReport(reportId);
      setSubmitStatus('Report submitted successfully!');
      setReportInput('');
    } catch (e: any) {
      setSubmitError(e?.message || 'Failed to submit report');
      setSubmitStatus(undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyReport = async () => {
    if (!deployedContractAPI || !verifyInput.trim()) return;
    setIsVerifying(true);
    setVerifyStatus('Hashing and verifying on-chain...');
    setVerifyError(undefined);
    setVerifyResult(undefined);
    try {
      const reportId = await hashReportId(verifyInput.trim());
      const exists = await deployedContractAPI.verifyReport(reportId);
      setVerifyResult(exists);
      setVerifyStatus(undefined);
    } catch (e: any) {
      setVerifyError(e?.message || 'Failed to verify report');
      setVerifyStatus(undefined);
    } finally {
      setIsVerifying(false);
    }
  };

  const isContractReady = !!deployedContractAPI;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              Anon Incident Report
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Secure, anonymous incident reporting powered by Zero-Knowledge Proofs
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
              isContractReady 
                ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' 
                : isJoining
                ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                : isWalletConnected
                ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                : 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isContractReady ? 'bg-green-500' 
                  : isJoining ? 'bg-blue-500 animate-pulse' 
                  : 'bg-yellow-500 animate-pulse'
                }`} />
                {isContractReady ? 'Contract Connected' : isJoining ? 'Joining Contract...' : isWalletConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
              </div>
            </div>
            <ModeToggle />
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* Stats Cards - Left Column (MD: 4 spans) */}
          <div className="md:col-span-4 space-y-6">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  TOTAL REPORTS
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tight text-primary">
                  {derivedState?.totalReports?.toString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Validated incidents on-chain
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  CONTRACT STATUS
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isContractReady ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Connected</span>
                    </div>
                    <div className="bg-muted p-2 rounded text-xs font-mono break-all border border-border">
                      {deployedContractAPI.deployedContractAddress}
                    </div>
                  </div>
                ) : joinError ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="w-5 h-5" />
                      <span className="font-semibold">Connection Failed</span>
                    </div>
                    <p className="text-xs text-red-500 dark:text-red-400">{joinError}</p>
                    <div className="bg-muted p-2 rounded text-xs font-mono break-all border border-border">
                      {DEPLOYED_CONTRACT_ADDRESS}
                    </div>
                  </div>
                ) : isWalletConnected ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-semibold">Joining deployed contract...</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Setting up providers and connecting to your contract on-chain.</p>
                    <div className="bg-muted p-2 rounded text-xs font-mono break-all border border-border">
                      {DEPLOYED_CONTRACT_ADDRESS}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold">Waiting for Wallet</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Connect your Lace wallet to interact with the contract.</p>
                    <div className="bg-muted p-2 rounded text-xs font-mono break-all border border-border">
                      {DEPLOYED_CONTRACT_ADDRESS}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Info / Hash Explanation */}
            <Card className="shadow-sm bg-primary/5 dark:bg-primary/10 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  HOW IT WORKS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your report text is hashed using <strong>SHA-256</strong> locally in your browser. 
                  Only this cryptographic hash is sent to the blockchain, ensuring the content remains private 
                  while proving the report was submitted.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Area - Right Column (MD: 8 spans) */}
          <div className="md:col-span-8 flex flex-col gap-6">
            {/* Submit Report Panel */}
            <Card className={`flex-1 shadow-md border-t-4 border-t-blue-500 transition-opacity ${!isContractReady ? 'opacity-75' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      Submit Incident
                    </CardTitle>
                    <CardDescription>
                      Create a new anonymous record on the ledger
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ShieldAlert className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isContractReady && !isWalletConnected && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Connect your Lace wallet first to submit reports.
                    </p>
                  </div>
                )}
                {!isContractReady && isWalletConnected && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                      Joining deployed contract&mdash;please wait...
                    </p>
                  </div>
                )}

                <textarea
                  className="w-full min-h-[120px] p-4 rounded-lg border border-input bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Describe the incident details here..."
                  value={reportInput}
                  onChange={(e) => setReportInput(e.target.value)}
                  disabled={!isContractReady || isSubmitting}
                />
                
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="text-xs text-muted-foreground flex-1">
                    {reportInput.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" /> 
                        {reportInput.length} characters &mdash; will be SHA-256 hashed
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleSubmitReport}
                    disabled={!isContractReady || !reportInput.trim() || isSubmitting}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Report
                        <ShieldAlert className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Submit Feedback */}
                {submitStatus && (
                  <div className={`mt-2 p-3 rounded-lg border ${
                    submitStatus.includes('successfully') 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}>
                    <div className="flex gap-2 items-center">
                      {submitStatus.includes('successfully') ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 animate-spin" />
                      )}
                      <p className={`text-sm font-medium ${
                        submitStatus.includes('successfully') 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-blue-700 dark:text-blue-300'
                      }`}>
                        {submitStatus}
                      </p>
                    </div>
                  </div>
                )}
                {submitError && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex gap-2">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        {submitError}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verify Report Panel */}
            <Card className={`flex-1 shadow-md border-t-4 border-t-purple-500 transition-opacity ${!isContractReady ? 'opacity-75' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      Verify Existence
                    </CardTitle>
                    <CardDescription>
                      Check if an incident report exists on-chain
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Search className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter incident text to verify..."
                    value={verifyInput}
                    onChange={(e) => setVerifyInput(e.target.value)}
                    disabled={!isContractReady || isVerifying}
                    onKeyDown={(e) => e.key === 'Enter' && !isVerifying && handleVerifyReport()}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleVerifyReport}
                    disabled={!isContractReady || !verifyInput.trim() || isVerifying}
                    variant="outline"
                    className="w-full sm:w-auto border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-300 gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Check Blockchain
                        <Search className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Verify Feedback */}
                {verifyStatus && (
                  <div className="p-3 bg-muted rounded-lg animate-pulse">
                    <p className="text-sm text-center text-muted-foreground">
                      {verifyStatus}
                    </p>
                  </div>
                )}
                
                {verifyResult !== undefined && (
                  <div className={`p-4 rounded-lg flex items-start gap-4 border animate-in zoom-in-95 duration-200 ${
                    verifyResult 
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                      : 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
                  }`}>
                    {verifyResult ? (
                      <>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full shrink-0">
                          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-green-800 dark:text-green-300">Verified Match</h4>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                            A report with this exact content hash exists on the ledger.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full shrink-0">
                          <XCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-orange-800 dark:text-orange-300">No Match Found</h4>
                          <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                            No report corresponding to this text was found on the ledger.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {verifyError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                      {verifyError}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* System Logs / Flow Messages */}
        {(providers?.flowMessage || derivedState?.turns.submitReport || derivedState?.turns.verifyReport) && (
          <Card className="shadow-sm border-t-2 border-t-muted-foreground/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                <Activity className="w-3 h-3" /> System Activity
              </div>
              <div className="space-y-2">
                {providers?.flowMessage && (
                  <div className="bg-muted/50 p-2 rounded text-sm text-foreground font-medium flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                    {providers.flowMessage}
                  </div>
                )}
                {derivedState?.turns.submitReport && (
                  <div className="text-xs text-muted-foreground">
                    Latest Submit Turn: <span className="font-mono">{derivedState.turns.submitReport}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
