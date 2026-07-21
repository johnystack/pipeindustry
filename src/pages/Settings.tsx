import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Shield,
  Key,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  UserCheck,
  Camera,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

const Settings = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Settings
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: user?.email || "",
    bank_name: "",
    account_number: "",
    account_name: "",
    avatar_url: "",
  });

  // Password State
  const [passwords, setPasswords] = useState({
    new: "",
    confirm: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("first_name, last_name, username, bank_name, account_number, account_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

          if (error) {
            console.error("Error fetching profile:", error);
          } else if (data) {
            setOriginalProfile(data);
            setProfileData({
              first_name: data.first_name || "",
              last_name: data.last_name || "",
              username: data.username || "",
              email: user.email || "",
              bank_name: data.bank_name || "",
              account_number: data.account_number || "",
              account_name: data.account_name || "",
              avatar_url: data.avatar_url || "",
            });
          }
        } catch (err) {
          console.error("Failed to fetch profile in Settings:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files?.[0] || !user) return;
      setUploading(true);

      const file = event.target.files[0];
      const filePath = `${user.id}/${Date.now()}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: "Avatar Updated", description: "Profile picture synchronized." });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      if (profileData.username && profileData.username !== originalProfile?.username) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", profileData.username)
          .single();

        if (existing) {
          toast({ title: "Username Taken", description: "Choose another unique alias.", variant: "destructive" });
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          username: profileData.username,
          bank_name: profileData.bank_name,
          account_number: profileData.account_number,
          account_name: profileData.account_name,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "Profile Synchronized", description: "Your core parameters have been updated." });
      setOriginalProfile({ ...profileData });
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.new || passwords.new !== passwords.confirm) {
      toast({ title: "Error", description: "Passwords must match and not be empty.", variant: "destructive" });
      return;
    }

    setChangingPass(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });

    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Credentials Updated", description: "Access keys have been rotated." });
      setPasswords({ new: "", confirm: "" });
    }
    setChangingPass(false);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="profile" className="container max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic">Settings</h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Security & Identity Parameters</p>
        </div>
        <TabsList className="bg-slate-900/50 border border-white/10 p-1 rounded-xl w-full md:w-auto">
          <TabsTrigger value="profile" className="flex-1 md:flex-none gap-2 px-6 rounded-lg font-black uppercase text-[10px] data-[state=active]:bg-primary italic transition-all">
            <User className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 md:flex-none gap-2 px-6 rounded-lg font-black uppercase text-[10px] data-[state=active]:bg-primary italic transition-all">
            <Shield className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="space-y-8">
        <TabsContent value="profile" className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-6">
            <Card className="bg-slate-900/30 border-white/10 shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-8 flex flex-col items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-2 border-primary/20 p-1 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                    <AvatarImage src={profileData.avatar_url} className="rounded-full object-cover" />
                    <AvatarFallback className="bg-slate-800 text-3xl font-black">{profileData.first_name?.[0]}{profileData.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute bottom-0 right-0 h-9 w-9 rounded-full shadow-lg border-2 border-slate-900 bg-primary text-white hover:bg-primary/90"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </div>
                <div className="text-center">
                  <h3 className="font-black text-xl italic uppercase">{profileData.first_name} {profileData.last_name}</h3>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 opacity-60">@{profileData.username || 'unidentified'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-slate-900/30 border-white/10 shadow-xl rounded-3xl">
              <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-3 italic">
                  <UserCheck className="h-5 w-5 text-primary" /> Identity Core
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">First Name</Label>
                    <Input 
                      value={profileData.first_name} 
                      onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                      className="bg-slate-950/50 border-white/10 h-11 px-4 font-bold rounded-xl focus:border-primary transition-all uppercase text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Last Name</Label>
                    <Input 
                      value={profileData.last_name} 
                      onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                      className="bg-slate-950/50 border-white/10 h-11 px-4 font-bold rounded-xl focus:border-primary transition-all uppercase text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Global Alias</Label>
                  <Input 
                    value={profileData.username} 
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    placeholder="Set unique alias"
                    className="bg-slate-950/50 border-white/10 h-11 px-4 font-bold rounded-xl focus:border-primary transition-all uppercase text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">System Email</Label>
                  <Input value={profileData.email} readOnly className="bg-white/5 border-white/5 h-11 px-4 font-bold rounded-xl opacity-40 cursor-not-allowed text-sm" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/30 border-white/10 shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5 bg-emerald-500/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-3 italic">
                  <Building2 className="h-5 w-5 text-emerald-500" /> Withdrawal Coordinates
                </CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Specify withdrawal settlement destination.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-emerald-500/70 tracking-widest px-1">Bank Name</Label>
                  <Input 
                    value={profileData.bank_name} 
                    onChange={(e) => setProfileData({ ...profileData, bank_name: e.target.value })}
                    placeholder="Institution"
                    className="bg-slate-950/50 border-white/10 h-11 px-4 font-bold rounded-xl focus:border-emerald-500 transition-all uppercase text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-emerald-500/70 tracking-widest px-1">Account Number</Label>
                  <Input 
                    value={profileData.account_number} 
                    onChange={(e) => setProfileData({ ...profileData, account_number: e.target.value })}
                    placeholder="10-Digits"
                    className="bg-slate-950/50 border-white/10 h-11 px-4 font-mono font-bold rounded-xl focus:border-emerald-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-emerald-500/70 tracking-widest px-1">Verified Name</Label>
                  <Input 
                    value={profileData.account_name} 
                    onChange={(e) => setProfileData({ ...profileData, account_name: e.target.value })}
                    placeholder="Full Legal Name"
                    className="bg-slate-950/50 border-white/10 h-11 px-4 font-bold rounded-xl focus:border-emerald-500 transition-all uppercase text-sm"
                  />
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="md:col-span-2 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10 mt-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Synchronize Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-slate-900/30 border-white/10 shadow-xl rounded-3xl">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-3 italic">
                <Key className="h-5 w-5 text-primary" /> Key Rotation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">New Key</Label>
                <div className="relative">
                  <Input 
                    type={showNewPassword ? "text" : "password"} 
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="bg-slate-950/50 border-white/10 h-11 px-4 font-bold rounded-xl focus:border-primary transition-all pr-12 text-sm"
                    placeholder="••••••••"
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9 text-white/20 hover:text-white" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Verify Key</Label>
                <div className="relative">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="bg-slate-950/50 border-white/10 h-11 px-4 font-bold rounded-xl focus:border-primary transition-all pr-12 text-sm"
                    placeholder="••••••••"
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9 text-white/20 hover:text-white" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handleChangePassword} 
                disabled={changingPass}
                className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
              >
                {changingPass ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Authorize Update"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default Settings;
