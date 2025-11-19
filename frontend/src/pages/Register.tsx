import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axios from "@/api/axios";

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ ADDED: Loading state
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [validation, setValidation] = useState({
    usernameAvailable: false,
    emailAvailable: false,
  });

  const checkUsername = async (username: string) => {
    if (username.length < 3) return;
    try {
      const response = await axios.get(`/api/users/check-username`, {
        params: { username },
      });
      setValidation((prev) => ({ ...prev, usernameAvailable: response.data.available }));
    } catch (error) {
      console.error("Error checking username:", error);
    }
  };

  const checkEmail = async (email: string) => {
    if (!email.includes("@")) return;
    try {
      const response = await axios.get(`/api/users/check-email`, {
        params: { email },
      });
      setValidation((prev) => ({ ...prev, emailAvailable: response.data.available }));
    } catch (error) {
      console.error("Error checking email:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("📡 Sending registration request to /auth/register");

      const response = await axios.post("/auth/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      console.log("✅ Registration response:", response.data);

      toast({
        title: "Registration successful",
        description: "Welcome to DevConnect! You can now login.",
      });

      // ✅ Clear form and navigate to login
      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      
      setValidation({
        usernameAvailable: false,
        emailAvailable: false,
      });

      navigate("/login");
    } catch (error: any) {
      console.error("❌ Registration failed:", error.response?.data || error);
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12">
      <div className="w-full max-w-6xl mx-auto px-4 flex items-center justify-between gap-12">
        {/* Left side - Branding */}
        <div className="flex-1">
          <h1 className="text-6xl font-bold text-foreground mb-4">DevConnect</h1>
          <p className="text-xl text-muted-foreground">
            The Platform for Developers to Connect and Grow.
          </p>
        </div>

        {/* Right side - Register Form */}
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Register</h2>
            <p className="text-muted-foreground mb-6">
              Create a new account and start connecting!
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
              <Input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
              <Input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  checkUsername(e.target.value);
                }}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  checkEmail(e.target.value);
                }}
                required
              />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already a member?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Login here!
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;