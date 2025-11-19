import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Copy, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { axiosPrivate } from "@/api/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Login = () => {
  const navigate = useNavigate();
  const { setAuth, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetInfo, setResetInfo] = useState<{
    resetUrl?: string;
    userEmail?: string;
    message?: string;
  }>({});

  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ CLEAR any existing auth data before login
      await logout();
      
      console.log("🔄 Attempting login for:", formData.usernameOrEmail);

      const response = await axiosPrivate.post("/auth/login", {
        usernameOrEmail: formData.usernameOrEmail,
        password: formData.password,
      }, {
        withCredentials: true,
      });

      console.log("✅ Login successful for user:", response.data.user.username);

      if (response.data?.accessToken && response.data?.user) {
        // ✅ Set new auth data
        setAuth(response.data.user, response.data.accessToken);
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${
            response.data.user.firstName || response.data.user.username
          }!`,
        });

        // ✅ Force clear any cached data and redirect
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500);
      }
    } catch (error: any) {
      console.error("❌ Login error:", error);
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot Password Handler - Shows reset link in dialog
  const handleForgotPassword = async () => {
    if (!formData.usernameOrEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email to reset password",
        variant: "destructive",
      });
      return;
    }

    try {
      setForgotPasswordLoading(true);
      const response = await axiosPrivate.post("/auth/forgot-password", {
        email: formData.usernameOrEmail,
      });

      // Show reset link in dialog for easy testing
      if (response.data.resetUrl) {
        setResetInfo({
          resetUrl: response.data.resetUrl,
          userEmail: response.data.userEmail,
          message: response.data.message
        });
        setResetDialogOpen(true);
        
        toast({
          title: "Reset link generated!",
          description: "Check the dialog for your password reset link",
        });
      } else {
        toast({
          title: "Reset email sent",
          description: response.data.message || "Check your email for reset instructions",
        });
      }
    } catch (error: any) {
      console.error("❌ Forgot password error:", error);
      toast({
        title: "Reset failed",
        description: error.response?.data?.message || "Could not send reset email",
        variant: "destructive",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // ✅ Copy reset link to clipboard
  const copyResetLink = async () => {
    if (resetInfo.resetUrl) {
      try {
        await navigator.clipboard.writeText(resetInfo.resetUrl);
        toast({
          title: "Copied!",
          description: "Reset link copied to clipboard",
        });
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = resetInfo.resetUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({
          title: "Copied!",
          description: "Reset link copied to clipboard",
        });
      }
    }
  };

  // ✅ Open reset link in new tab
  const openResetLink = () => {
    if (resetInfo.resetUrl) {
      window.open(resetInfo.resetUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-6xl mx-auto px-4 flex items-center justify-between gap-12">

        <div className="flex-1">
          <h1 className="text-6xl font-bold text-foreground mb-4">DevConnect</h1>
          <p className="text-xl text-muted-foreground">
            The Platform for Developers to Connect and Grow.
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Login</h2>
            <p className="text-muted-foreground mb-6">
              Welcome back! Login to start connecting!
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username or Email
                </label>
                <Input
                  type="text"
                  autoComplete="username"
                  value={formData.usernameOrEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usernameOrEmail: e.target.value,
                    })
                  }
                  className="w-full"
                  placeholder="Enter your username or email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        rememberMe: checked as boolean,
                      })
                    }
                  />
                  <label htmlFor="remember" className="text-sm text-foreground">
                    Keep me logged in for 15 days
                  </label>
                </div>
                
                {/* ✅ Forgot Password Button - Opens Dialog */}
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:underline font-medium"
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? "Sending..." : "Forgot password?"}
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Not a member yet?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Register here!
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* ✅ Reset Password Link Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password Reset Link</DialogTitle>
            <DialogDescription>
              {resetInfo.message || "Use this link to reset your password:"}
              {resetInfo.userEmail && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  For user: <strong>{resetInfo.userEmail}</strong>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input
                value={resetInfo.resetUrl || ''}
                readOnly
                className="text-xs font-mono"
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="px-3"
              onClick={copyResetLink}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              className="px-3"
              onClick={openResetLink}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
            >
              Close
            </Button>
            <Button onClick={openResetLink}>
              Open Reset Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;