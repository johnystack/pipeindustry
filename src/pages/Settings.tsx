import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Shield,
  Bell,
  Globe,
  Smartphone,
  Key,
  Mail,
  AlertTriangle,
  Save,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import countryList from "country-list";
import moment from "moment-timezone";

const Settings = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const countries = useMemo(() => countryList.getData(), []);
  const timezones = useMemo(() => moment.tz.names(), []);

  // Profile Settings
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: user?.email || "",
    phone: "",
    country: "",
    timezone: "",
  });

  // Security Settings
  const [securityData, setSecurityData] = useState({
    newPassword: "",
    confirmPassword: "",
    twoFactor: true,
    loginNotifications: true,
  });

  // Notification Settings
  const [notificationData, setNotificationData] = useState({
    emailNotifications: true,
    investmentUpdates: true,
    profitAlerts: true,
    withdrawalConfirms: true,
    referralNotifications: true,
    marketingEmails: false,
    smsNotifications: true,
    pushNotifications: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, country, timezone")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows found
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Could not fetch your profile data.",
            variant: "destructive",
          });
        } else if (data) {
          setProfileData((prev) => ({ ...prev, ...data }));
        }
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleSaveProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        country: profileData.country,
        timezone: profileData.timezone,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!securityData.newPassword || !securityData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in the new password fields",
        variant: "destructive",
      });
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: securityData.newPassword,
    });

    if (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setSecurityData({
        ...securityData,
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Preferences Saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion Requested",
      description:
        "Your account deletion request has been submitted. You will receive an email confirmation.",
      variant: "destructive",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Manage your account preferences, security settings, and notification
          options.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="crypto-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <input
                    id="firstName"
                    defaultValue={profileData.first_name}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        first_name: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <input
                    id="lastName"
                    defaultValue={profileData.last_name}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        last_name: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <input
                  id="email"
                  type="email"
                  value={profileData.email}
                  readOnly
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <input
                  id="phone"
                  defaultValue={profileData.phone}
                  onChange={(e) =>
                    setProfileData({ ...profileData, phone: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={profileData.country}
                    onValueChange={(value) =>
                      setProfileData({ ...profileData, country: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profileData.timezone}
                    onValueChange={(value) =>
                      setProfileData({ ...profileData, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((timezone) => (
                        <SelectItem key={timezone} value={timezone}>
                          {timezone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                className="w-full crypto-button-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 max-w-2xl mx-auto">
            {/* Change Password */}
            <Card className="crypto-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password for better security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={securityData.newPassword}
                      onChange={(e) =>
                        setSecurityData({
                          ...securityData,
                          newPassword: e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={securityData.confirmPassword}
                      onChange={(e) =>
                        setSecurityData({
                          ...securityData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  className="w-full crypto-button-primary"
                >
                  Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="crypto-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable 2FA</Label>
                    <p className="text-sm text-muted-foreground">
                      Secure your account with Google Authenticator
                    </p>
                  </div>
                  <Switch
                    checked={securityData.twoFactor}
                    onCheckedChange={(checked) =>
                      setSecurityData({ ...securityData, twoFactor: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified of new login attempts
                    </p>
                  </div>
                  <Switch
                    checked={securityData.loginNotifications}
                    onCheckedChange={(checked) =>
                      setSecurityData({
                        ...securityData,
                        loginNotifications: checked,
                      })
                    }
                  />
                </div>

                {securityData.twoFactor && (
                  <Button variant="outline" className="w-full">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Configure Authenticator App
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="crypto-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive updates and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </h4>

                <div className="space-y-4 pl-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Investment Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Updates about your active investments
                      </p>
                    </div>
                    <Switch
                      checked={notificationData.investmentUpdates}
                      onCheckedChange={(checked) =>
                        setNotificationData({
                          ...notificationData,
                          investmentUpdates: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Profit Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Daily profit notifications
                      </p>
                    </div>
                    <Switch
                      checked={notificationData.profitAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationData({
                          ...notificationData,
                          profitAlerts: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Withdrawal Confirmations</Label>
                      <p className="text-sm text-muted-foreground">
                        Confirmation emails for withdrawals
                      </p>
                    </div>
                    <Switch
                      checked={notificationData.withdrawalConfirms}
                      onCheckedChange={(checked) =>
                        setNotificationData({
                          ...notificationData,
                          withdrawalConfirms: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Referral Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Updates about your referral earnings
                      </p>
                    </div>
                    <Switch
                      checked={notificationData.referralNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationData({
                          ...notificationData,
                          referralNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Promotional offers and news
                      </p>
                    </div>
                    <Switch
                      checked={notificationData.marketingEmails}
                      onCheckedChange={(checked) =>
                        setNotificationData({
                          ...notificationData,
                          marketingEmails: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile Notifications
                </h4>

                <div className="space-y-4 pl-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Important alerts via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notificationData.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationData({
                          ...notificationData,
                          smsNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Browser push notifications
                      </p>
                    </div>
                    <Switch
                      checked={notificationData.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationData({
                          ...notificationData,
                          pushNotifications: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveNotifications}
                className="w-full crypto-button-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Card className="crypto-card max-w-2xl mx-auto border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will affect your account permanently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">
                  Delete Account
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please
                  be certain. All your investments must be withdrawn before
                  account deletion.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete My Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove all your data from our
                        servers. Make sure you have withdrawn all your funds
                        before proceeding.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
